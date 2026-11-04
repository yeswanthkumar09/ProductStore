import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Name is required"],
			trim: true,
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [6, "Password must be at least 6 characters long"],
		},
		phone: { type: String, default: "", trim: true },
		normalizedPhone: {
			type: String,
			default: null,
			sparse: true,
			index: true,
		},
		isEmailVerified: {
			type: Boolean,
			default: false,
			index: true,
		},
		accountStatus: {
			type: String,
			enum: ["active", "pending_verification", "suspended"],
			default: "pending_verification",
			index: true,
		},
		authMethod: {
			type: String,
			enum: ["email", "google", "both"],
			default: "email",
		},
		googleId: {
			type: String,
			default: null,
			sparse: true,
			index: true,
		},
		avatar: {
			type: String,
			default: "",
		},
		verificationTokenHash: {
			type: String,
			default: null,
			index: true,
		},
		verificationTokenExpiresAt: {
			type: Date,
			default: null,
		},
		resetPasswordTokenHash: {
			type: String,
			default: null,
			index: true,
		},
		resetPasswordExpiresAt: {
			type: Date,
			default: null,
		},
		lastVerificationEmailSentAt: {
			type: Date,
			default: null,
		},
		lastPasswordResetEmailSentAt: {
			type: Date,
			default: null,
		},
		lastLoginAt: {
			type: Date,
			default: null,
		},
		address: {
			street: { type: String, default: "" },
			city: { type: String, default: "" },
			state: { type: String, default: "" },
			zipCode: { type: String, default: "" },
			country: { type: String, default: "" },
		},
		cartItems: [
			{
				quantity: {
					type: Number,
					default: 1,
				},
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
				},
				variantId: { type: String, default: "" },
				selectedColor: { type: String, default: "" },
				selectedSize: { type: String, default: "" },
				sku: { type: String, default: "" },
			},
		],
		wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
		role: {
			type: String,
			enum: ["customer", "admin"],
			default: "customer",
			index: true,
		},
	},
	{
		timestamps: true,
	}
);

// Pre-save hook to hash password before saving to database
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

userSchema.methods.comparePassword = async function (password) {
	return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
