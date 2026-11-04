import ServiceableLocation from "../models/serviceableLocation.model.js";
import WarehouseSetting from "../models/warehouseSetting.model.js";
import { checkCourierServiceability, getActivePickupPincode } from "../services/shiprocket.service.js";

// Public: Check real-time courier serviceability via Shiprocket
export const checkServiceability = async (req, res) => {
	try {
		const rawPincode = (req.query.pincode || req.body.pincode || "").toString().trim();

		if (!rawPincode) {
			return res.status(400).json({
				serviceable: false,
				isInconclusive: false,
				classification: "INVALID_PARAMETERS",
				message: "PIN code is required.",
			});
		}

		if (!/^\d{6}$/.test(rawPincode)) {
			return res.status(400).json({
				serviceable: false,
				isInconclusive: false,
				classification: "INVALID_PARAMETERS",
				message: "Please enter a valid 6-digit PIN code.",
			});
		}

		// 1. Check if merchant has explicitly restricted this region for legal or commercial policy
		const explicitRestriction = await ServiceableLocation.findOne({ pincode: rawPincode, isActive: false });
		if (explicitRestriction) {
			const reason = explicitRestriction.serviceRestrictions || "Delivery to this region is restricted by merchant policy.";
			const payload = {
				serviceable: false,
				isBusinessRestricted: true,
				isInconclusive: false,
				classification: "UNSERVICEABLE",
				pincode: rawPincode,
				message: reason,
			};
			if (process.env.NODE_ENV === "development") {
				payload.diagnostics = {
					endpoint: "/api/serviceability/check",
					authSucceeded: true,
					destinationPincode: rawPincode,
					classification: "UNSERVICEABLE",
					reason: `Explicit merchant policy restriction: ${reason}`,
				};
			}
			return res.json(payload);
		}

		// 2. Query Shiprocket real-time courier serviceability (Authoritative Source of Truth)
		const shiprocketResult = await checkCourierServiceability({
			deliveryPincode: rawPincode,
			cod: req.query.cod || 0,
			weight: req.query.weight || 0.5,
			declaredValue: req.query.declaredValue || 500,
		});

		const classification =
			shiprocketResult.classification ||
			(shiprocketResult.serviceable
				? "SERVICEABLE"
				: shiprocketResult.isInconclusive
				? "VERIFICATION_FAILED"
				: "UNSERVICEABLE");

		const responsePayload = {
			serviceable: shiprocketResult.serviceable,
			isInconclusive: shiprocketResult.isInconclusive || false,
			classification,
			pincode: rawPincode,
			message: shiprocketResult.message,
		};

		if (process.env.NODE_ENV === "development") {
			responsePayload.diagnostics = {
				endpoint: "/api/serviceability/check",
				authSucceeded: shiprocketResult.authSucceeded ?? false,
				pickupPincode: shiprocketResult.pickupPincode,
				destinationPincode: rawPincode,
				shiprocketHttpStatus: shiprocketResult.httpStatus ?? null,
				classification,
				reason: shiprocketResult.diagnostic || shiprocketResult.error || shiprocketResult.message,
			};
		}

		// 3. Handle inconclusive provider response (timeouts, auth expiration, network outage)
		if (shiprocketResult.isInconclusive) {
			return res.status(200).json(responsePayload);
		}

		// 4. Handle confirmed courier serviceability
		if (shiprocketResult.serviceable) {
			// Check if optional merchant promotional rules apply (e.g. custom delivery fee threshold)
			const adminLocation = await ServiceableLocation.findOne({ pincode: rawPincode, isActive: true });
			const deliveryFee =
				adminLocation && adminLocation.deliveryFee !== undefined
					? adminLocation.deliveryFee
					: shiprocketResult.minDeliveryFee;
			const estimatedDeliveryDays =
				adminLocation?.estimatedDeliveryDays || shiprocketResult.estimatedDeliveryDays || "2-4 business days";
			const city = adminLocation?.city || shiprocketResult.city || "";
			const state = adminLocation?.state || shiprocketResult.state || "";

			responsePayload.provider = "shiprocket";
			responsePayload.isPrepaidAvailable = shiprocketResult.isPrepaidAvailable;
			responsePayload.isCodAvailable = shiprocketResult.isCodAvailable;
			responsePayload.couriers = shiprocketResult.couriers;
			responsePayload.courierCount = shiprocketResult.courierCount;
			responsePayload.location = {
				country: "India",
				state,
				district: adminLocation?.district || "",
				city,
				locality: adminLocation?.locality || "",
				deliveryFee,
				minOrderValue: adminLocation?.minOrderValue || 0,
				freeDeliveryThreshold: adminLocation?.freeDeliveryThreshold || 1999,
				estimatedDeliveryDays,
				courierName: shiprocketResult.couriers?.[0]?.courierName || "",
			};

			return res.json(responsePayload);
		}

		// 5. Provider explicitly confirms no eligible courier companies service this PIN code
		return res.json(responsePayload);
	} catch (error) {
		console.error("Error in checkServiceability controller:", error);
		const errPayload = {
			serviceable: false,
			isInconclusive: true,
			classification: "VERIFICATION_FAILED",
			message: "Unable to verify delivery availability. Please try again.",
		};
		if (process.env.NODE_ENV === "development") {
			errPayload.diagnostics = {
				endpoint: "/api/serviceability/check",
				authSucceeded: false,
				classification: "VERIFICATION_FAILED",
				reason: error.message,
			};
		}
		return res.status(500).json(errPayload);
	}
};

// Admin: Get paginated & filtered list of serviceable locations
export const getAdminLocations = async (req, res) => {
	try {
		const { search, state, district, city, pincode, isActive, page = 1, limit = 20 } = req.query;

		const filter = {};

		if (isActive !== undefined && isActive !== "all") {
			filter.isActive = isActive === "true";
		}

		if (pincode && pincode.trim()) {
			filter.pincode = new RegExp(pincode.trim(), "i");
		}

		if (state && state !== "all") {
			filter.state = new RegExp(`^${state.trim()}$`, "i");
		}

		if (district && district.trim()) {
			filter.district = new RegExp(district.trim(), "i");
		}

		if (city && city.trim()) {
			filter.city = new RegExp(city.trim(), "i");
		}

		if (search && search.trim()) {
			const s = search.trim();
			filter.$or = [
				{ pincode: new RegExp(s, "i") },
				{ city: new RegExp(s, "i") },
				{ district: new RegExp(s, "i") },
				{ state: new RegExp(s, "i") },
				{ locality: new RegExp(s, "i") },
			];
		}

		const skip = (Number(page) - 1) * Number(limit);
		const total = await ServiceableLocation.countDocuments(filter);
		const locations = await ServiceableLocation.find(filter)
			.sort({ state: 1, city: 1, pincode: 1 })
			.skip(skip)
			.limit(Number(limit));

		const distinctStates = await ServiceableLocation.distinct("state");

		res.json({
			locations,
			total,
			page: Number(page),
			pages: Math.ceil(total / Number(limit)) || 1,
			states: distinctStates.sort(),
		});
	} catch (error) {
		console.error("Error in getAdminLocations:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Create a single serviceable location
export const createLocation = async (req, res) => {
	try {
		const {
			country = "India",
			state,
			district,
			city,
			locality = "",
			pincode,
			isActive = true,
			deliveryFee = 0,
			minOrderValue = 0,
			freeDeliveryThreshold = 1999,
			estimatedDeliveryDays = "2-4 business days",
			serviceRestrictions = "",
		} = req.body;

		if (!state || !district || !city || !pincode) {
			return res.status(400).json({
				message: "State, district, city, and PIN code are required fields.",
			});
		}

		const cleanPincode = pincode.toString().trim();
		if (!/^\d{6}$/.test(cleanPincode)) {
			return res.status(400).json({
				message: "Invalid PIN code. Must be a 6-digit numeric string.",
			});
		}

		const existing = await ServiceableLocation.findOne({ pincode: cleanPincode });
		if (existing) {
			return res.status(400).json({
				message: `PIN code ${cleanPincode} is already registered (${existing.city}, ${existing.state}). You can update its status or delivery fee instead.`,
			});
		}

		const location = await ServiceableLocation.create({
			country,
			state: state.trim(),
			district: district.trim(),
			city: city.trim(),
			locality: locality.trim(),
			pincode: cleanPincode,
			isActive: Boolean(isActive),
			deliveryFee: Number(deliveryFee) || 0,
			minOrderValue: Number(minOrderValue) || 0,
			freeDeliveryThreshold: Number(freeDeliveryThreshold) || 0,
			estimatedDeliveryDays: (estimatedDeliveryDays || "").trim(),
			serviceRestrictions: (serviceRestrictions || "").trim(),
		});

		res.status(201).json(location);
	} catch (error) {
		console.error("Error in createLocation:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Update a serviceable location
export const updateLocation = async (req, res) => {
	try {
		const { id } = req.params;
		const location = await ServiceableLocation.findById(id);

		if (!location) {
			return res.status(404).json({ message: "Serviceable location not found." });
		}

		const {
			state,
			district,
			city,
			locality,
			pincode,
			isActive,
			deliveryFee,
			minOrderValue,
			freeDeliveryThreshold,
			estimatedDeliveryDays,
			serviceRestrictions,
		} = req.body;

		if (pincode && pincode.trim() !== location.pincode) {
			const cleanPincode = pincode.trim();
			if (!/^\d{6}$/.test(cleanPincode)) {
				return res.status(400).json({ message: "Invalid PIN code format." });
			}
			const existing = await ServiceableLocation.findOne({
				pincode: cleanPincode,
				_id: { $ne: id },
			});
			if (existing) {
				return res.status(400).json({
					message: `PIN code ${cleanPincode} already exists for another location.`,
				});
			}
			location.pincode = cleanPincode;
		}

		if (state !== undefined) location.state = state.trim();
		if (district !== undefined) location.district = district.trim();
		if (city !== undefined) location.city = city.trim();
		if (locality !== undefined) location.locality = locality.trim();
		if (isActive !== undefined) location.isActive = Boolean(isActive);
		if (deliveryFee !== undefined) location.deliveryFee = Math.max(0, Number(deliveryFee) || 0);
		if (minOrderValue !== undefined) location.minOrderValue = Math.max(0, Number(minOrderValue) || 0);
		if (freeDeliveryThreshold !== undefined)
			location.freeDeliveryThreshold = Math.max(0, Number(freeDeliveryThreshold) || 0);
		if (estimatedDeliveryDays !== undefined)
			location.estimatedDeliveryDays = estimatedDeliveryDays.trim();
		if (serviceRestrictions !== undefined)
			location.serviceRestrictions = serviceRestrictions.trim();

		await location.save();
		res.json(location);
	} catch (error) {
		console.error("Error in updateLocation:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Delete a serviceable location
export const deleteLocation = async (req, res) => {
	try {
		const { id } = req.params;
		const location = await ServiceableLocation.findByIdAndDelete(id);

		if (!location) {
			return res.status(404).json({ message: "Serviceable location not found." });
		}

		res.json({ message: `Location ${location.pincode} (${location.city}) removed successfully.` });
	} catch (error) {
		console.error("Error in deleteLocation:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Location summary statistics
export const getServiceabilityStats = async (req, res) => {
	try {
		const totalLocations = await ServiceableLocation.countDocuments();
		const activeLocations = await ServiceableLocation.countDocuments({ isActive: true });
		const inactiveLocations = totalLocations - activeLocations;
		const distinctStates = await ServiceableLocation.distinct("state");
		const distinctCities = await ServiceableLocation.distinct("city");

		res.json({
			totalLocations,
			activeLocations,
			inactiveLocations,
			statesCovered: distinctStates.length,
			citiesCovered: distinctCities.length,
		});
	} catch (error) {
		console.error("Error in getServiceabilityStats:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Export current locations to CSV
export const exportCsv = async (req, res) => {
	try {
		const locations = await ServiceableLocation.find().sort({ state: 1, city: 1, pincode: 1 });

		const headers = [
			"country",
			"state",
			"district",
			"city",
			"locality",
			"pincode",
			"isActive",
			"deliveryFee",
			"minOrderValue",
			"freeDeliveryThreshold",
			"estimatedDeliveryDays",
			"serviceRestrictions",
		];

		const escapeCsv = (val) => {
			if (val === null || val === undefined) return "";
			const str = String(val);
			if (str.includes(",") || str.includes('"') || str.includes("\n")) {
				return `"${str.replace(/"/g, '""')}"`;
			}
			return str;
		};

		const rows = locations.map((loc) =>
			[
				escapeCsv(loc.country),
				escapeCsv(loc.state),
				escapeCsv(loc.district),
				escapeCsv(loc.city),
				escapeCsv(loc.locality),
				escapeCsv(loc.pincode),
				loc.isActive ? "TRUE" : "FALSE",
				loc.deliveryFee ?? 0,
				loc.minOrderValue ?? 0,
				loc.freeDeliveryThreshold ?? 1999,
				escapeCsv(loc.estimatedDeliveryDays),
				escapeCsv(loc.serviceRestrictions),
			].join(",")
		);

		const csvContent = [headers.join(","), ...rows].join("\r\n");

		res.setHeader("Content-Type", "text/csv");
		res.setHeader("Content-Disposition", 'attachment; filename="serviceable_locations.csv"');
		res.status(200).send(csvContent);
	} catch (error) {
		console.error("Error in exportCsv:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Download CSV template for initial upload
export const getCsvTemplate = (req, res) => {
	const template = `country,state,district,city,locality,pincode,isActive,deliveryFee,minOrderValue,freeDeliveryThreshold,estimatedDeliveryDays,serviceRestrictions
India,Maharashtra,Mumbai Suburban,Mumbai,Andheri West,400053,TRUE,0,0,1999,1-2 business days,Standard express delivery
India,Karnataka,Bengaluru Urban,Bengaluru,Koramangala,560034,TRUE,0,0,1999,1-2 business days,Standard express delivery
India,Delhi,New Delhi,New Delhi,Connaught Place,110001,TRUE,0,0,1999,2-3 business days,Standard express delivery
India,Telangana,Hyderabad,Hyderabad,Banjara Hills,500034,TRUE,0,0,1999,2-3 business days,Standard express delivery
India,Tamil Nadu,Chennai,Chennai,T. Nagar,600017,TRUE,50,500,1999,2-4 business days,Standard express delivery`;

	res.setHeader("Content-Type", "text/csv");
	res.setHeader("Content-Disposition", 'attachment; filename="serviceable_locations_template.csv"');
	res.status(200).send(template);
};

// Admin: Import & Validate CSV (with preview or apply mode)
export const importCsv = async (req, res) => {
	try {
		let csvText = "";

		if (req.file && req.file.buffer) {
			csvText = req.file.buffer.toString("utf8");
		} else if (req.body.csvData) {
			csvText = req.body.csvData;
		} else {
			return res.status(400).json({
				message: "No CSV content provided. Upload a CSV file or provide csvData text.",
			});
		}

		const isPreview = req.body.preview === "true" || req.body.preview === true;
		const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

		if (lines.length < 2) {
			return res.status(400).json({ message: "CSV file must contain a header row and at least one data row." });
		}

		const headerLine = lines[0].toLowerCase();
		const headers = headerLine.split(",").map((h) => h.replace(/["\r]/g, "").trim());

		// Verify required columns
		const requiredCols = ["state", "district", "city", "pincode"];
		for (const reqCol of requiredCols) {
			if (!headers.includes(reqCol)) {
				return res.status(400).json({
					message: `Missing required column "${reqCol}" in CSV header. Expected columns: state, district, city, pincode, etc.`,
				});
			}
		}

		const colMap = {};
		headers.forEach((h, idx) => {
			colMap[h] = idx;
		});

		const errors = [];
		const validRecords = [];
		const seenPincodesInFile = new Set();

		for (let i = 1; i < lines.length; i++) {
			const line = lines[i];
			// Split by comma taking into account simple quoted fields
			const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
			const cleanVals = values.map((v) => v.replace(/^"|"$/g, "").trim());

			const state = cleanVals[colMap["state"]] || "";
			const district = cleanVals[colMap["district"]] || "";
			const city = cleanVals[colMap["city"]] || "";
			const locality = colMap["locality"] !== undefined ? cleanVals[colMap["locality"]] || "" : "";
			const pincode = (cleanVals[colMap["pincode"]] || "").replace(/[^0-9]/g, "");
			const country = colMap["country"] !== undefined ? cleanVals[colMap["country"]] || "India" : "India";
			const isActiveStr = colMap["isactive"] !== undefined ? (cleanVals[colMap["isactive"]] || "").toUpperCase() : "TRUE";
			const isActive = isActiveStr !== "FALSE" && isActiveStr !== "0";
			const deliveryFee = colMap["deliveryfee"] !== undefined ? Number(cleanVals[colMap["deliveryfee"]]) || 0 : 0;
			const minOrderValue = colMap["minordervalue"] !== undefined ? Number(cleanVals[colMap["minordervalue"]]) || 0 : 0;
			const freeDeliveryThreshold = colMap["freedeliverythreshold"] !== undefined ? Number(cleanVals[colMap["freedeliverythreshold"]]) || 1999 : 1999;
			const estimatedDeliveryDays = colMap["estimateddeliverydays"] !== undefined ? cleanVals[colMap["estimateddeliverydays"]] || "2-4 business days" : "2-4 business days";
			const serviceRestrictions = colMap["servicerestrictions"] !== undefined ? cleanVals[colMap["servicerestrictions"]] || "" : "";

			if (!state || !district || !city || !pincode) {
				errors.push({
					row: i + 1,
					pincode,
					reason: "Missing required fields (state, district, city, or PIN code).",
				});
				continue;
			}

			if (!/^\d{6}$/.test(pincode)) {
				errors.push({
					row: i + 1,
					pincode,
					reason: `Invalid PIN code format "${pincode}". Must be exactly 6 numeric digits.`,
				});
				continue;
			}

			if (seenPincodesInFile.has(pincode)) {
				errors.push({
					row: i + 1,
					pincode,
					reason: `Duplicate PIN code "${pincode}" found within the uploaded CSV.`,
				});
				continue;
			}
			seenPincodesInFile.add(pincode);

			validRecords.push({
				country,
				state,
				district,
				city,
				locality,
				pincode,
				isActive,
				deliveryFee,
				minOrderValue,
				freeDeliveryThreshold,
				estimatedDeliveryDays,
				serviceRestrictions,
			});
		}

		// If preview only, return validation analysis without modifying database
		if (isPreview) {
			return res.json({
				preview: true,
				totalRows: lines.length - 1,
				validRecordsCount: validRecords.length,
				errorsCount: errors.length,
				errors,
				sampleValidRecords: validRecords.slice(0, 10),
			});
		}

		// Apply upsert into MongoDB
		let insertedCount = 0;
		let updatedCount = 0;

		for (const rec of validRecords) {
			const result = await ServiceableLocation.findOneAndUpdate(
				{ pincode: rec.pincode },
				{ $set: rec },
				{ upsert: true, new: false }
			);

			if (result) {
				updatedCount++;
			} else {
				insertedCount++;
			}
		}

		res.json({
			preview: false,
			message: `Import processed successfully. ${insertedCount} new locations added, ${updatedCount} existing locations updated.`,
			totalProcessed: lines.length - 1,
			insertedCount,
			updatedCount,
			errorsCount: errors.length,
			errors,
		});
	} catch (error) {
		console.error("Error in importCsv:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Get current Warehouse / Pickup configuration
export const getWarehouseSettings = async (req, res) => {
	try {
		let setting = await WarehouseSetting.findOne({ isDefault: true });
		if (!setting) {
			setting = await WarehouseSetting.create({
				warehouseName: "Primary Fulfillment Hub",
				contactName: "LuxeStore Fulfillment Operations",
				phone: "+919876543210",
				address: "Central Logistics Park, Industrial Area Phase 2",
				city: "New Delhi",
				state: "Delhi",
				country: "India",
				pickupPincode: (process.env.SHIPROCKET_PICKUP_PINCODE || "110001").trim(),
				isDefault: true,
			});
		}
		res.json(setting);
	} catch (error) {
		console.error("Error in getWarehouseSettings:", error);
		res.status(500).json({ message: "Failed to retrieve warehouse settings", error: error.message });
	}
};

// Admin: Update Warehouse / Pickup configuration
export const updateWarehouseSettings = async (req, res) => {
	try {
		const { warehouseName, contactName, phone, address, city, state, country, pickupPincode } = req.body;

		if (!pickupPincode || !/^\d{6}$/.test(pickupPincode.toString().trim())) {
			return res.status(400).json({ message: "A valid 6-digit Indian pickup PIN code is required." });
		}

		let setting = await WarehouseSetting.findOne({ isDefault: true });
		if (!setting) {
			setting = new WarehouseSetting({ isDefault: true });
		}

		if (warehouseName) setting.warehouseName = warehouseName.trim();
		if (contactName) setting.contactName = contactName.trim();
		if (phone) setting.phone = phone.trim();
		if (address) setting.address = address.trim();
		if (city) setting.city = city.trim();
		if (state) setting.state = state.trim();
		if (country) setting.country = country.trim();
		setting.pickupPincode = pickupPincode.toString().trim();

		await setting.save();
		res.json({ message: "Warehouse and pickup PIN settings updated successfully.", setting });
	} catch (error) {
		console.error("Error in updateWarehouseSettings:", error);
		res.status(500).json({ message: "Failed to update warehouse settings", error: error.message });
	}
};

// Admin: Test live Shiprocket courier serviceability for any destination PIN code
export const testShiprocketServiceability = async (req, res) => {
	try {
		const { destinationPincode, pickupPincode, cod = 0, weight = 0.5, declaredValue = 500 } = req.body;

		if (!destinationPincode || !/^\d{6}$/.test(destinationPincode.toString().trim())) {
			return res.status(400).json({ message: "A valid 6-digit Indian destination PIN code is required." });
		}

		const result = await checkCourierServiceability({
			deliveryPincode: destinationPincode,
			pickupPincode: pickupPincode || (await getActivePickupPincode()),
			cod: cod === 1 || cod === true,
			weight: Number(weight) || 0.5,
			declaredValue: Number(declaredValue) || 500,
			skipCache: true, // live test always skips cache
		});

		res.json(result);
	} catch (error) {
		console.error("Error in testShiprocketServiceability:", error);
		res.status(500).json({ message: "Shiprocket serviceability test failed", error: error.message });
	}
};

