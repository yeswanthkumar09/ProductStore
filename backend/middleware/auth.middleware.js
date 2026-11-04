import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
	try {
		const accessToken = req.cookies.accessToken;

		if (!accessToken) {
			return res.status(401).json({ message: "Unauthorized - No access token provided" });
		}

		try {
			const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
			const user = await User.findById(decoded.userId).select("-password");

			if (!user) {
				return res.status(401).json({ message: "User not found" });
			}

			req.user = user;

			next();
		} catch (error) {
			if (error.name === "TokenExpiredError") {
				return res.status(401).json({ message: "Unauthorized - Access token expired" });
			}
			throw error;
		}
	} catch (error) {
		console.log("Error in protectRoute middleware", error.message);
		return res.status(401).json({ message: "Unauthorized - Invalid access token" });
	}
};

export const adminRoute = (req, res, next) => {
	const designatedOwnerEmail = (process.env.OWNER_EMAIL || "yeswanthagathamudi@gmail.com").trim().toLowerCase();
	
	if (
		req.user &&
		req.user.role === "admin" &&
		(!process.env.ENFORCE_STRICT_OWNER || req.user.email?.toLowerCase() === designatedOwnerEmail)
	) {
		next();
	} else {
		console.warn(`[SECURITY ALERT] Unauthorized admin access attempt by: ${req.user?.email || "Anonymous"} (Role: ${req.user?.role || "none"}) on ${req.originalUrl}`);
		return res.status(403).json({ message: "Access denied - Administrator only" });
	}
};

export const optionalAuth = async (req, res, next) => {
	try {
		const accessToken = req.cookies.accessToken;
		if (accessToken) {
			const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
			const user = await User.findById(decoded.userId).select("-password");
			if (user) req.user = user;
		}
	} catch (error) {
		// Silently continue for guests
	}
	next();
};

