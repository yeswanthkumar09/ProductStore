import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useWishlistStore = create((set, get) => ({
	wishlist: [],
	loading: false,

	fetchWishlist: async () => {
		set({ loading: true });
		try {
			const res = await axios.get("/users/wishlist");
			set({ wishlist: res.data, loading: false });
		} catch {
			set({ loading: false });
		}
	},

	toggleWishlist: async (productId) => {
		try {
			const res = await axios.post("/users/wishlist/toggle", { productId });
			set({ wishlist: res.data.wishlist });
			if (res.data.added) {
				toast.success("Added to wishlist ❤️");
			} else {
				toast("Removed from wishlist", { icon: "💔" });
			}
		} catch {
			toast.error("Failed to update wishlist");
		}
	},

	isInWishlist: (productId) => {
		const { wishlist } = get();
		if (!Array.isArray(wishlist)) return false;
		return wishlist.some((id) =>
			typeof id === "object" ? id?._id === productId : id === productId
		);
	},

	clearWishlist: () => set({ wishlist: [], loading: false }),
}));
