import axios from "axios";

const axiosInstance = axios.create({
	baseURL: "/api",
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
