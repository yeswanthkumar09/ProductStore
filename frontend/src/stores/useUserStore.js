import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { useCartStore } from "./useCartStore";
import { useWishlistStore } from "./useWishlistStore";

export const useUserStore = create((set, get) => ({
	user: null,
	loading: false,
	checkingAuth: true,
	orders: [],
	loadingOrders: false,
	pendingVerificationEmail: null,

	signup: async ({ name, email, password, confirmPassword, phone }) => {
		set({ loading: true });

		if (password !== confirmPassword) {
			set({ loading: false });
			toast.error("Passwords do not match");
			return { success: false, error: "Passwords do not match" };
		}

		try {
			const res = await axios.post("/auth/signup", { name, email, password, phone });
			set({ loading: false, pendingVerificationEmail: res.data.email });
			toast.success(res.data.message || "Verification link dispatched to your email!");
			return { success: true, ...res.data };
		} catch (error) {
			set({ loading: false });
			const msg = error.response?.data?.message || "An error occurred during registration.";
			toast.error(msg);
			return { success: false, error: msg };
		}
	},

	verifyEmailToken: async (token) => {
		set({ loading: true });
		try {
			const res = await axios.post("/auth/verify-email", { token });
			set({ loading: false, pendingVerificationEmail: null });
			toast.success(res.data.message || "Account verified successfully! You can now sign in.");
			return { success: true, ...res.data };
		} catch (error) {
			set({ loading: false });
			const msg = error.response?.data?.message || "Invalid or expired verification link.";
			toast.error(msg);
			return {
				success: false,
				error: msg,
				expired: error.response?.data?.expired || false,
				email: error.response?.data?.email || null,
			};
		}
	},

	resendVerification: async (email) => {
		try {
			const res = await axios.post("/auth/resend-verification", { email });
			toast.success(res.data.message || "A fresh verification link has been sent to your email.");
			return { success: true, ...res.data };
		} catch (error) {
			const msg = error.response?.data?.message || "Failed to resend verification email.";
			toast.error(msg);
			return { success: false, error: msg };
		}
	},

	login: async (email, password) => {
		set({ loading: true });

		try {
			const res = await axios.post("/auth/login", { email, password });
			set({ user: res.data, loading: false, pendingVerificationEmail: null });
			toast.success("Welcome back!");
			try {
				useCartStore.getState().syncLocalCartToServer();
			} catch (e) {}
			return { success: true };
		} catch (error) {
			set({ loading: false });
			const data = error.response?.data;
			if (data?.requiresVerification) {
				set({ pendingVerificationEmail: data.email });
				toast.error(data.message);
				return { requiresVerification: true, email: data.email };
			}
			const msg = data?.message || "Invalid email or password.";
			toast.error(msg);
			return { success: false, error: msg };
		}
	},

	forgotPassword: async (email) => {
		set({ loading: true });
		try {
			const res = await axios.post("/auth/forgot-password", { email });
			set({ loading: false });
			toast.success(res.data.message || "Password recovery link has been dispatched to your email.");
			return { success: true };
		} catch (error) {
			set({ loading: false });
			const msg = error.response?.data?.message || "Failed to send recovery instructions.";
			toast.error(msg);
			return { success: false, error: msg };
		}
	},

	resetPassword: async ({ token, newPassword, confirmPassword }) => {
		set({ loading: true });
		try {
			const res = await axios.post("/auth/reset-password", { token, newPassword, confirmPassword });
			set({ loading: false });
			toast.success(res.data.message || "Password updated successfully! Please sign in.");
			return { success: true };
		} catch (error) {
			set({ loading: false });
			const msg = error.response?.data?.message || "Failed to reset password.";
			toast.error(msg);
			return { success: false, error: msg };
		}
	},

	logout: async () => {
		try {
			await axios.post("/auth/logout");
			set({ user: null });
			useWishlistStore.getState().clearWishlist();
			toast.success("Logged out successfully");
		} catch (error) {
			set({ user: null });
			useWishlistStore.getState().clearWishlist();
			toast.error(error.response?.data?.message || "An error occurred during logout");
		}
	},

	checkAuth: async () => {
		set({ checkingAuth: true });
		try {
			const response = await axios.get("/auth/profile");
			set({ user: response.data, checkingAuth: false });
		} catch (error) {
			set({ checkingAuth: false, user: null });
		}
	},

	updateProfile: async (profileData) => {
		set({ loading: true });
		try {
			const response = await axios.put("/users/profile", profileData);
			set({ user: response.data, loading: false });
			toast.success("Profile updated successfully!");
			return response.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to update profile");
			throw error;
		}
	},

	fetchOrders: async () => {
		set({ loadingOrders: true });
		try {
			const response = await axios.get("/users/orders");
			set({ orders: response.data, loadingOrders: false });
		} catch (error) {
			set({ loadingOrders: false });
			toast.error(error.response?.data?.message || "Failed to fetch orders");
		}
	},

	refreshToken: async () => {
		if (get().checkingAuth) return;

		set({ checkingAuth: true });
		try {
			const response = await axios.post("/auth/refresh-token");
			set({ checkingAuth: false });
			return response.data;
		} catch (error) {
			set({ user: null, checkingAuth: false });
			throw error;
		}
	},
}));

// Axios interceptor for automatic token refresh
let refreshPromise = null;

axios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		const url = originalRequest?.url || "";
		const isAuthRoute =
			url.includes("/auth/profile") ||
			url.includes("/auth/login") ||
			url.includes("/auth/refresh-token") ||
			url.includes("/auth/signup");

		if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
			const currentUser = useUserStore.getState().user;
			if (!currentUser) {
				return Promise.reject(error);
			}
			originalRequest._retry = true;

			try {
				if (refreshPromise) {
					await refreshPromise;
					return axios(originalRequest);
				}

				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;

				return axios(originalRequest);
			} catch (refreshError) {
				useUserStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
);
