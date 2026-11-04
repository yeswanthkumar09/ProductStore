import AuditLog from "../models/auditLog.model.js";

/**
 * Record an administrative action in the immutable audit log.
 * @param {Object} params
 * @param {Object} params.req - Express request object (contains req.user, req.ip, headers)
 * @param {string} params.action - Action identifier (e.g. 'ORDER_STATUS_UPDATED', 'PRODUCT_CREATED')
 * @param {string} params.targetType - Target entity type (e.g. 'Order', 'Product', 'Coupon')
 * @param {string} [params.targetId] - Target entity identifier
 * @param {Object} [params.details] - Relevant change metadata
 */
export const logAdminAction = async ({ req, action, targetType, targetId = null, details = {} }) => {
	try {
		if (!req?.user) return;

		const ipAddress = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
		const userAgent = req.headers["user-agent"] || "";

		await AuditLog.create({
			adminId: req.user._id,
			adminEmail: req.user.email,
			action: action.toUpperCase(),
			targetType,
			targetId: targetId ? targetId.toString() : null,
			details,
			ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress.split(",")[0].trim(),
			userAgent,
		});
	} catch (err) {
		console.warn("[AUDIT LOG WARNING] Failed to persist audit record:", err.message);
	}
};

