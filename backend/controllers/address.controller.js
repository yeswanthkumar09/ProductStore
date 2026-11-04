import Address from "../models/address.model.js";
import ServiceableLocation from "../models/serviceableLocation.model.js";
import { checkCourierServiceability } from "../services/shiprocket.service.js";

const enrichAddressWithServiceability = async (addr) => {
	const addrObj = addr.toObject ? addr.toObject() : { ...addr };
	const cleanPin = (addrObj.pincode || "").toString().trim();

	// 1. Check if merchant explicitly restricted this PIN code
	const restricted = await ServiceableLocation.findOne({ pincode: cleanPin, isActive: false });
	if (restricted) {
		addrObj.isServiceable = false;
		addrObj.isBusinessRestricted = true;
		addrObj.isInconclusive = false;
		addrObj.deliveryFee = 0;
		addrObj.estimatedDeliveryDays = "Unavailable";
		addrObj.serviceabilityMessage = restricted.serviceRestrictions || "Delivery to this region is restricted by merchant policy.";
		return addrObj;
	}

	const adminOverride = await ServiceableLocation.findOne({ pincode: cleanPin, isActive: true });
	const isShiprocketUnconfigured = !process.env.SHIPROCKET_EMAIL || process.env.SHIPROCKET_EMAIL.includes("example.com");

	addrObj.freeDeliveryThreshold = adminOverride?.freeDeliveryThreshold !== undefined ? adminOverride.freeDeliveryThreshold : 1999;
	addrObj.minOrderValue = adminOverride?.minOrderValue || 0;

	// 2. Authoritative Shiprocket Courier Serviceability query
	const srResult = await checkCourierServiceability({ deliveryPincode: cleanPin });
	if (srResult.serviceable) {
		addrObj.isServiceable = true;
		addrObj.isInconclusive = false;
		addrObj.deliveryFee = adminOverride && adminOverride.deliveryFee !== undefined ? adminOverride.deliveryFee : srResult.minDeliveryFee;
		addrObj.estimatedDeliveryDays = adminOverride?.estimatedDeliveryDays || srResult.estimatedDeliveryDays || "2-4 business days";
		addrObj.courierName = srResult.couriers?.[0]?.courierName || "";
		addrObj.isCodAvailable = srResult.isCodAvailable;
		addrObj.serviceabilityMessage = "Delivery is available for this PIN code.";
	} else if (adminOverride) {
		addrObj.isServiceable = true;
		addrObj.isInconclusive = false;
		addrObj.deliveryFee = adminOverride.deliveryFee !== undefined ? adminOverride.deliveryFee : 40;
		addrObj.estimatedDeliveryDays = adminOverride.estimatedDeliveryDays || "3-5 business days";
		addrObj.courierName = "Standard Courier Delivery";
		addrObj.isCodAvailable = true;
		addrObj.serviceabilityMessage = "Delivery is available for this PIN code.";
	} else if (srResult.isInconclusive && isShiprocketUnconfigured) {
		// Logistics unconfigured / development mode fallback to standard merchant delivery
		addrObj.isServiceable = true;
		addrObj.isInconclusive = false;
		addrObj.deliveryFee = 50;
		addrObj.estimatedDeliveryDays = "3-5 business days";
		addrObj.courierName = "Standard Express Surface";
		addrObj.isCodAvailable = true;
		addrObj.serviceabilityMessage = "Standard delivery available.";
	} else if (srResult.isInconclusive) {
		addrObj.isServiceable = false;
		addrObj.isInconclusive = true;
		addrObj.deliveryFee = 0;
		addrObj.estimatedDeliveryDays = "Verification pending";
		addrObj.serviceabilityMessage = "Unable to verify delivery availability. Please try again.";
	} else {
		addrObj.isServiceable = false;
		addrObj.isInconclusive = false;
		addrObj.deliveryFee = 0;
		addrObj.estimatedDeliveryDays = "Unavailable";
		addrObj.serviceabilityMessage = "Delivery is currently unavailable for this PIN code.";
	}
	return addrObj;
};

// Customer: Get all saved delivery addresses
export const getUserAddresses = async (req, res) => {
	try {
		const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

		// Enhance each address with live Shiprocket serviceability info
		const enhanced = await Promise.all(addresses.map(enrichAddressWithServiceability));

		res.json(enhanced);
	} catch (error) {
		console.error("Error in getUserAddresses:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Customer: Save a new delivery address
export const createAddress = async (req, res) => {
	try {
		const {
			fullName,
			phone,
			houseFlat,
			street,
			landmark = "",
			locality = "",
			city,
			district = "",
			state,
			country = "India",
			pincode,
			addressType = "Home",
			deliveryInstructions = "",
			isDefault = false,
		} = req.body;

		if (!fullName || !phone || !houseFlat || !street || !city || !state || !pincode) {
			return res.status(400).json({
				message: "Please fill in all required address fields (Name, Phone, House/Flat, Street, City, State, PIN code).",
			});
		}

		const cleanPincode = pincode.toString().trim();
		if (!/^\d{6}$/.test(cleanPincode)) {
			return res.status(400).json({
				message: "Please provide a valid 6-digit Indian PIN code.",
			});
		}

		const existingCount = await Address.countDocuments({ user: req.user._id });
		const shouldBeDefault = existingCount === 0 || Boolean(isDefault);

		if (shouldBeDefault) {
			await Address.updateMany({ user: req.user._id }, { isDefault: false });
		}

		const address = await Address.create({
			user: req.user._id,
			fullName: fullName.trim(),
			phone: phone.trim(),
			houseFlat: houseFlat.trim(),
			street: street.trim(),
			landmark: landmark.trim(),
			locality: locality.trim(),
			city: city.trim(),
			district: district.trim(),
			state: state.trim(),
			country: country.trim(),
			pincode: cleanPincode,
			addressType,
			deliveryInstructions: deliveryInstructions.trim(),
			latitude: req.body.latitude ? Number(req.body.latitude) : null,
			longitude: req.body.longitude ? Number(req.body.longitude) : null,
			isDefault: shouldBeDefault,
		});

		// Check serviceability via Shiprocket
		const enriched = await enrichAddressWithServiceability(address);

		res.status(201).json(enriched);
	} catch (error) {
		console.error("Error in createAddress:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Customer: Update saved address
export const updateAddress = async (req, res) => {
	try {
		const { id } = req.params;
		const address = await Address.findById(id);

		if (!address) {
			return res.status(404).json({ message: "Address not found." });
		}

		// Authenticated ownership check
		if (address.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
			return res.status(403).json({ message: "Not authorized to update this address." });
		}

		const {
			fullName,
			phone,
			houseFlat,
			street,
			landmark,
			locality,
			city,
			district,
			state,
			country,
			pincode,
			addressType,
			deliveryInstructions,
			isDefault,
		} = req.body;

		if (pincode) {
			const cleanPincode = pincode.toString().trim();
			if (!/^\d{6}$/.test(cleanPincode)) {
				return res.status(400).json({ message: "Invalid 6-digit PIN code." });
			}
			address.pincode = cleanPincode;
		}

		if (fullName !== undefined) address.fullName = fullName.trim();
		if (phone !== undefined) address.phone = phone.trim();
		if (houseFlat !== undefined) address.houseFlat = houseFlat.trim();
		if (street !== undefined) address.street = street.trim();
		if (landmark !== undefined) address.landmark = landmark.trim();
		if (locality !== undefined) address.locality = locality.trim();
		if (city !== undefined) address.city = city.trim();
		if (district !== undefined) address.district = district.trim();
		if (state !== undefined) address.state = state.trim();
		if (country !== undefined) address.country = country.trim();
		if (addressType !== undefined) address.addressType = addressType;
		if (deliveryInstructions !== undefined) address.deliveryInstructions = deliveryInstructions.trim();
		if (req.body.latitude !== undefined) address.latitude = req.body.latitude ? Number(req.body.latitude) : null;
		if (req.body.longitude !== undefined) address.longitude = req.body.longitude ? Number(req.body.longitude) : null;

		if (isDefault) {
			await Address.updateMany({ user: address.user }, { isDefault: false });
			address.isDefault = true;
		}

		await address.save();

		const enriched = await enrichAddressWithServiceability(address);

		res.json(enriched);
	} catch (error) {
		console.error("Error in updateAddress:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Customer: Delete an address
export const deleteAddress = async (req, res) => {
	try {
		const { id } = req.params;
		const address = await Address.findById(id);

		if (!address) {
			return res.status(404).json({ message: "Address not found." });
		}

		if (address.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
			return res.status(403).json({ message: "Not authorized to delete this address." });
		}

		const wasDefault = address.isDefault;
		const userId = address.user;

		await address.deleteOne();

		// If deleted address was default, promote the next available address
		if (wasDefault) {
			const nextAddress = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
			if (nextAddress) {
				nextAddress.isDefault = true;
				await nextAddress.save();
			}
		}

		res.json({ message: "Address deleted successfully." });
	} catch (error) {
		console.error("Error in deleteAddress:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Customer: Set an address as default
export const setDefaultAddress = async (req, res) => {
	try {
		const { id } = req.params;
		const address = await Address.findById(id);

		if (!address) {
			return res.status(404).json({ message: "Address not found." });
		}

		if (address.user.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Not authorized." });
		}

		await Address.updateMany({ user: req.user._id }, { isDefault: false });
		address.isDefault = true;
		await address.save();

		res.json(address);
	} catch (error) {
		console.error("Error in setDefaultAddress:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
