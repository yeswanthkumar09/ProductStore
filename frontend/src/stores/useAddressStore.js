import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useAddressStore = create((set, get) => ({
	addresses: [],
	selectedAddress: null,
	loading: false,
	serviceabilityChecking: false,
	serviceabilityResult: null,

	fetchAddresses: async () => {
		set({ loading: true });
		try {
			const res = await axios.get("/addresses");
			const addresses = res.data;
			const initialSelected =
				get().selectedAddress ||
				addresses.find((a) => a.isDefault && a.isServiceable) ||
				addresses.find((a) => a.isServiceable) ||
				addresses.find((a) => a.isDefault) ||
				addresses[0] ||
				null;
			set({
				addresses,
				loading: false,
				selectedAddress: initialSelected,
			});
			if (initialSelected && initialSelected.pincode) {
				get().selectAddress(initialSelected);
			}
		} catch (error) {
			set({ loading: false });
			console.error("Failed to load addresses:", error);
		}
	},

	selectAddress: async (address) => {
		if (!address) {
			set({ selectedAddress: null, serviceabilityResult: null });
			return;
		}

		set({ selectedAddress: address, serviceabilityChecking: true });

		const pincode = address.pincode ? address.pincode.toString().trim() : "";
		if (!pincode || !/^\d{6}$/.test(pincode)) {
			set({
				serviceabilityChecking: false,
				selectedAddress: {
					...address,
					isServiceable: false,
					serviceabilityMessage: "Invalid PIN code format.",
				},
			});
			return;
		}

		try {
			const res = await get().checkPincode(pincode);
			set((state) => {
				if (state.selectedAddress?._id !== address._id) return {};
				return {
					selectedAddress: {
						...state.selectedAddress,
						isServiceable: Boolean(res.serviceable),
						isInconclusive: Boolean(res.isInconclusive),
						serviceabilityMessage: res.message,
						courierName: res.couriers?.[0]?.courierName || state.selectedAddress.courierName || "",
						estimatedDeliveryDays:
							res.estimatedDeliveryDays ||
							res.couriers?.[0]?.etd ||
							state.selectedAddress.estimatedDeliveryDays ||
							"2-4 business days",
						deliveryFee: res.deliveryFee !== undefined ? res.deliveryFee : (state.selectedAddress.deliveryFee || 0),
					},
					serviceabilityChecking: false,
				};
			});
		} catch (err) {
			set({ serviceabilityChecking: false });
		}
	},

	clearServiceabilityResult: () => {
		set({ serviceabilityResult: null });
	},

	checkPincode: async (pincodeInput, options = {}) => {
		const rawPincode = typeof pincodeInput === "object" ? pincodeInput.pincode : pincodeInput;
		const pincode = rawPincode ? rawPincode.toString().trim() : "";

		if (!pincode || !/^\d{6}$/.test(pincode)) {
			const res = {
				serviceable: false,
				isInconclusive: false,
				message: "Please enter a valid 6-digit PIN code.",
			};
			set({ serviceabilityResult: res });
			return res;
		}

		set({ serviceabilityChecking: true });
		try {
			const cod = options.cod !== undefined ? options.cod : 0;
			const weight = options.weight || 0.5;
			const res = await axios.get(
				`/serviceability/check?pincode=${pincode}&cod=${cod}&weight=${weight}`
			);
			const data = res.data || {};
			const classification =
				data.classification ||
				(data.serviceable
					? "SERVICEABLE"
					: data.isInconclusive
					? "VERIFICATION_FAILED"
					: "UNSERVICEABLE");

			const normalizedMessage =
				classification === "SERVICEABLE"
					? "Delivery is available for this PIN code."
					: classification === "UNSERVICEABLE"
					? data.message || "Delivery is currently unavailable for this PIN code."
					: "Unable to verify delivery availability. Please try again.";

			const result = {
				...data,
				classification,
				message: normalizedMessage,
			};

			set({ serviceabilityResult: result, serviceabilityChecking: false });
			return result;
		} catch (error) {
			const isInc = error.response?.data?.isInconclusive ?? true;
			const classification = isInc ? "VERIFICATION_FAILED" : "UNSERVICEABLE";
			const result = {
				serviceable: false,
				isInconclusive: isInc,
				classification,
				message:
					classification === "UNSERVICEABLE"
						? error.response?.data?.message || "Delivery is currently unavailable for this PIN code."
						: "Unable to verify delivery availability. Please try again.",
			};
			set({ serviceabilityResult: result, serviceabilityChecking: false });
			return result;
		}
	},

	createAddress: async (addressData) => {
		set({ loading: true });
		try {
			const res = await axios.post("/addresses", addressData);
			const newAddr = res.data;
			set((state) => ({
				addresses: [newAddr, ...state.addresses.map((a) => (newAddr.isDefault ? { ...a, isDefault: false } : a))],
				selectedAddress: newAddr.isServiceable ? newAddr : state.selectedAddress,
				loading: false,
			}));
			toast.success("Delivery address saved successfully!");
			return newAddr;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to save address.");
			throw error;
		}
	},

	updateAddress: async (id, addressData) => {
		set({ loading: true });
		try {
			const res = await axios.put(`/addresses/${id}`, addressData);
			const updated = res.data;
			set((state) => ({
				addresses: state.addresses.map((a) => (a._id === id ? updated : updated.isDefault ? { ...a, isDefault: false } : a)),
				selectedAddress: state.selectedAddress?._id === id ? updated : state.selectedAddress,
				loading: false,
			}));
			toast.success("Address updated successfully!");
			return updated;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to update address.");
			throw error;
		}
	},

	deleteAddress: async (id) => {
		try {
			await axios.delete(`/addresses/${id}`);
			set((state) => {
				const remaining = state.addresses.filter((a) => a._id !== id);
				return {
					addresses: remaining,
					selectedAddress: state.selectedAddress?._id === id ? remaining[0] || null : state.selectedAddress,
				};
			});
			toast.success("Address removed.");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to delete address.");
		}
	},

	setDefaultAddress: async (id) => {
		try {
			await axios.patch(`/addresses/${id}/default`);
			set((state) => ({
				addresses: state.addresses.map((a) => ({ ...a, isDefault: a._id === id })),
				selectedAddress: state.addresses.find((a) => a._id === id) || state.selectedAddress,
			}));
			toast.success("Default delivery address updated.");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to set default address.");
		}
	},
}));
