import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
	{
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: [true, "Product reference is required"],
			index: true,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: [true, "User reference is required"],
			index: true,
		},
		name: {
			type: String,
			required: [true, "Reviewer name is required"],
			trim: true,
		},
		rating: {
			type: Number,
			required: [true, "Rating is required"],
			min: [1, "Rating must be at least 1"],
			max: [5, "Rating cannot exceed 5"],
		},
		comment: {
			type: String,
			required: [true, "Review comment is required"],
			trim: true,
			minlength: [5, "Comment must be at least 5 characters long"],
			maxlength: [1000, "Comment cannot exceed 1000 characters"],
		},
		title: {
			type: String,
			trim: true,
			default: "",
			maxlength: [150, "Review title cannot exceed 150 characters"],
		},
		images: [
			{
				type: String,
			},
		],
		isVerifiedPurchase: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

// Prevent duplicate reviews from the same user on the same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
