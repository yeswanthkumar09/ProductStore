import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
	{
		adminId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		adminEmail: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		action: {
			type: String,
			required: true,
			uppercase: true,
			trim: true,
			index: true,
		},
		targetType: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		targetId: {
			type: String,
			default: null,
		},
		details: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
		ipAddress: {
			type: String,
			default: "",
		},
		userAgent: {
			type: String,
			default: "",
		},
	},
	{
		timestamps: true,
	}
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;

