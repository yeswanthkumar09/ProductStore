import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

const GUEST_CART_KEY = "luxestore_guest_cart";

const getSavedGuestCart = () => {
	try {
		return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
	} catch (e) {
		return [];
	}
};

export const useCartStore = create((set, get) => ({
	cart: getSavedGuestCart(),
	coupon: null,
	availableCoupons: [],
	isLoadingCoupons: false,
	isApplyingCoupon: false,
	total: 0,
	subtotal: 0,
	discountAmount: 0,
	isCouponApplied: false,

	fetchAvailableCoupons: async () => {
		set({ isLoadingCoupons: true });
		try {
			const response = await axios.get("/coupons/available");
			set({ availableCoupons: response.data || [], isLoadingCoupons: false });
		} catch (error) {
			console.error("Error fetching available coupons:", error);
			set({ availableCoupons: [], isLoadingCoupons: false });
		}
	},

	getMyCoupon: async () => {
		try {
			const response = await axios.get("/coupons");
			set({ coupon: response.data });
		} catch (error) {
			console.error("Error fetching coupon:", error);
		}
	},

	applyCoupon: async (code) => {
		if (get().isApplyingCoupon) return;
		set({ isApplyingCoupon: true });
		try {
			const { cart } = get();
			const response = await axios.post("/coupons/validate", {
				code: (code || "").trim().toUpperCase(),
				cartItems: cart.map((i) => ({
					_id: i.productId || i.product?._id || i.product || i._id,
					productId: i.productId || i.product?._id || i.product || i._id,
					variantId: i.variantId || undefined,
					price: i.price,
					quantity: i.quantity,
					category: i.category,
				})),
			});
			set({ coupon: response.data, isCouponApplied: true, isApplyingCoupon: false });
			get().calculateTotals();
			toast.success(response.data.message || "Coupon applied successfully!", { id: "coupon-status" });
			return { success: true, data: response.data };
		} catch (error) {
			set({ isApplyingCoupon: false });
			const errMsg = error.response?.data?.message || "Failed to apply coupon. Please try again.";
			toast.error(errMsg, { id: "coupon-status" });
			return { success: false, error: errMsg };
		}
	},

	removeCoupon: () => {
		set({ coupon: null, isCouponApplied: false, discountAmount: 0 });
		get().calculateTotals();
		toast.success("Coupon removed", { id: "coupon-status" });
	},

	getCartItems: async () => {
		try {
			const res = await axios.get("/cart");
			const serverCart = res.data || [];
			set({ cart: serverCart });
			get().calculateTotals();
		} catch (error) {
			const localCart = getSavedGuestCart();
			set({ cart: localCart });
			get().calculateTotals();
		}
	},

	syncLocalCartToServer: async () => {
		try {
			const guestCart = getSavedGuestCart();
			if (guestCart.length > 0) {
				for (const item of guestCart) {
					await axios
						.post("/cart", {
							productId: item.productId || item._id || item.product,
							variantId: item.variantId || undefined,
							selectedColor: item.selectedColor || undefined,
							selectedSize: item.selectedSize || undefined,
							quantity: Math.min(Math.max(1, Number(item.quantity) || 1), 10),
						})
						.catch(() => {});
				}
				localStorage.removeItem(GUEST_CART_KEY);
			}
			const res = await axios.get("/cart");
			set({ cart: res.data || [] });
			get().calculateTotals();
		} catch (e) {
			console.error("Error syncing cart to server:", e);
		}
	},

	clearCart: async () => {
		set({ cart: [], coupon: null, total: 0, subtotal: 0, discountAmount: 0 });
		localStorage.removeItem(GUEST_CART_KEY);
		try {
			await axios.delete("/cart");
		} catch (e) {}
	},

	addToCart: async (product, options = {}) => {
		const rawQty = Math.max(1, Math.min(10, parseInt(options.quantity, 10) || 1));
		const payload = {
			productId: product._id,
			variantId: options.variantId || product.variantId || undefined,
			selectedColor: options.selectedColor || product.selectedColor || undefined,
			selectedSize: options.selectedSize || product.selectedSize || undefined,
			quantity: rawQty,
		};

		try {
			const res = await axios.post("/cart", payload);
			const updated = res.data || [];
			set({ cart: updated });
			get().calculateTotals();
			toast.success("Added to shopping bag!");
		} catch (error) {
			// Maintain cart in localStorage for unauthenticated guest sessions
			const { cart } = get();
			const existingIndex = cart.findIndex(
				(item) =>
					(item._id === product._id || item.product === product._id) &&
					(item.variantId || "") === (payload.variantId || "")
			);

			const maxStock = product.stock ? Math.min(product.stock, 10) : 10;
			let updatedCart;
			if (existingIndex > -1) {
				const currentQty = Number(cart[existingIndex].quantity) || 1;
				const newQty = Math.min(currentQty + rawQty, maxStock);
				if (currentQty >= maxStock) {
					toast.error(`Maximum allowed quantity (${maxStock}) already in bag.`);
					return;
				}
				updatedCart = [...cart];
				updatedCart[existingIndex] = {
					...updatedCart[existingIndex],
					quantity: newQty,
				};
			} else {
				const newItem = {
					...product,
					_id: product._id,
					productId: product._id,
					cartItemId: `local-${product._id}-${payload.variantId || "base"}-${Date.now()}`,
					variantId: payload.variantId || null,
					selectedColor: payload.selectedColor || product.selectedColor || null,
					selectedSize: payload.selectedSize || product.selectedSize || null,
					quantity: Math.min(rawQty, maxStock),
					price: product.price,
					originalPrice: product.originalPrice,
					image: product.image,
					name: product.name,
					stock: product.stock,
				};
				updatedCart = [...cart, newItem];
			}

			set({ cart: updatedCart });
			localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedCart));
			get().calculateTotals();
			toast.success("Added to shopping bag!");
		}
	},

	removeFromCart: async (cartItemId, productId, variantId) => {
		try {
			const res = await axios.delete(`/cart`, {
				data: { cartItemId, productId, variantId },
			});
			const updated = res.data || [];
			set({ cart: updated });
			get().calculateTotals();
			toast.success("Item removed from bag");
		} catch (error) {
			const { cart } = get();
			const updatedCart = cart.filter(
				(item) =>
					(item.cartItemId || item._id) !== cartItemId &&
					!(item._id === productId && (!variantId || item.variantId === variantId))
			);
			set({ cart: updatedCart });
			localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedCart));
			get().calculateTotals();
			toast.success("Item removed from bag");
		}
	},

	updateQuantity: async (cartItemId, quantity, variantId) => {
		const targetQty = parseInt(quantity, 10);
		if (isNaN(targetQty) || targetQty <= 0) {
			return get().removeFromCart(cartItemId, null, variantId);
		}
		const clampedQty = Math.max(1, Math.min(10, targetQty));

		try {
			const res = await axios.put(`/cart/${cartItemId}`, { quantity: clampedQty, variantId });
			const updated = res.data || [];
			set({ cart: updated });
			get().calculateTotals();
		} catch (error) {
			const { cart } = get();
			const updatedCart = cart.map((item) => {
				if ((item.cartItemId || item._id) === cartItemId) {
					return { ...item, quantity: clampedQty };
				}
				return item;
			});
			set({ cart: updatedCart });
			localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedCart));
			get().calculateTotals();
		}
	},

	calculateTotals: () => {
		const { cart, coupon, isCouponApplied } = get();
		const subtotal = cart.reduce(
			(sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
			0
		);
		let discount = 0;

		if (coupon && isCouponApplied) {
			if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
				discount = 0;
			} else if (coupon.discountType === "fixed") {
				discount = Math.min(subtotal, Number(coupon.discountValue || coupon.discountAmount) || 0);
			} else {
				const percent = Number(coupon.discountPercentage || coupon.discountValue) || 0;
				let calculated = (subtotal * percent) / 100;
				if (coupon.maxDiscountCap && calculated > coupon.maxDiscountCap) {
					calculated = coupon.maxDiscountCap;
				}
				discount = Math.round(calculated);
			}
		}

		const total = Math.max(0, subtotal - discount);
		set({ subtotal, total, discountAmount: discount });
	},
}));
