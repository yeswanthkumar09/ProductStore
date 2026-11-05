import axios from "axios";

// Resolves API base URL: Supports separate Vercel project deployment via VITE_API_URL
// Falls back to local/monorepo relative '/api'
const rawApiUrl = (typeof import.meta !== "undefined" && import.meta?.env)
	? import.meta.env.VITE_API_URL
	: (typeof process !== "undefined" && process?.env ? process.env.VITE_API_URL : null);
const baseURL = rawApiUrl ? `${rawApiUrl.replace(/\/+$/, "")}/api` : "/api";

const axiosInstance = axios.create({
	baseURL,
	withCredentials: true, // send cookies to the server
});

// Interceptor to guarantee a normalized string error message on all rejected responses
axiosInstance.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error && error.response) {
			const data = error.response.data;
			let stringMsg = "An unexpected error occurred.";
			if (typeof data === "string") {
				stringMsg = data;
			} else if (data && typeof data === "object") {
				if (typeof data.message === "string") {
					stringMsg = data.message;
				} else if (typeof data.error === "string") {
					stringMsg = data.error;
				} else if (data.error && typeof data.error.message === "string") {
					stringMsg = data.error.message;
				} else if (typeof data.message === "object" && typeof data.message?.message === "string") {
					stringMsg = data.message.message;
				}
			} else if (typeof error.message === "string") {
				stringMsg = error.message;
			}
			error.normalizedMessage = stringMsg;
		} else if (error && typeof error.message === "string") {
			error.normalizedMessage = error.message;
		}
		return Promise.reject(error);
	}
);

export default axiosInstance;
