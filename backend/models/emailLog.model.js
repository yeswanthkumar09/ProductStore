import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema(
	{
		recipient: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		subject: {
			type: String,
			required: true,
			trim: true,
		},
		template: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		status: {
			type: String,
			enum: ["queued", "sent", "delivered", "failed", "bounced", "provider_not_configured"],
			default: "queued",
			index: true,
		},
		messageId: {
			type: String,
			default: null,
		},
		error: {
			type: String,
			default: null,
		},
		metadata: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
	},
	{ timestamps: true }
);

emailLogSchema.index({ recipient: 1, createdAt: -1 });

const EmailLog = mongoose.model("EmailLog", emailLogSchema);

export default EmailLog;
