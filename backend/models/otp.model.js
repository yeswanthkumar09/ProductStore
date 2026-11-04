import mongoose from "mongoose";
import crypto from "crypto";

const otpSchema = new mongoose.Schema(
	{
		identifier: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		type: {
			type: String,
			enum: [
				"email_verification",
				"phone_verification",
				"email_login",
				"phone_login",
				"password_reset_email",
				"password_reset_phone",
			],
			required: true,
			index: true,
		},
		otpHash: {
			type: String,
			required: true,
		},
		salt: {
			type: String,
			required: true,
		},
		expiresAt: {
			type: Date,
			required: true,
			index: true,
		},
		attempts: {
			type: Number,
			default: 0,
		},
		maxAttempts: {
			type: Number,
			default: 5,
		},
		resendAvailableAt: {
			type: Date,
			default: () => new Date(Date.now() + 60 * 1000), // 60s cooldown
		},
		resendCount: {
			type: Number,
			default: 0,
		},
		isUsed: {
			type: Boolean,
			default: false,
			index: true,
		},
	},
	{ timestamps: true }
);

// TTL index to automatically purge expired OTP documents after 1 hour
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });
otpSchema.index({ identifier: 1, type: 1, isUsed: 1 });

// Static helper to generate and securely hash an OTP
otpSchema.statics.generateAndHash = function (plainOtp) {
	const salt = crypto.randomBytes(16).toString("hex");
	const otpHash = crypto
		.pbkdf2Sync(plainOtp.toString(), salt, 1000, 64, "sha512")
		.toString("hex");
	return { otpHash, salt };
};

// Method to safely verify entered plain OTP
otpSchema.methods.verifyOtp = function (candidateOtp) {
	if (this.isUsed || this.expiresAt < new Date()) {
		return false;
	}
	const candidateHash = crypto
		.pbkdf2Sync(candidateOtp.toString(), this.salt, 1000, 64, "sha512")
		.toString("hex");
	return crypto.timingSafeEqual(Buffer.from(this.otpHash), Buffer.from(candidateHash));
};

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
