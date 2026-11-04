import mongoose from "mongoose";

const offerPillSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		price: { type: String, required: true },
		link: { type: String, default: "/search" },
	},
	{ _id: false }
);

const campaignSlideSchema = new mongoose.Schema(
	{
		badge: {
			type: String,
			default: "",
			trim: true,
		},
		leftHeadline: {
			type: String,
			default: "",
			trim: true,
		},
		leftSubheadline: {
			type: String,
			default: "",
			trim: true,
		},
		rightHeadline: {
			type: String,
			default: "",
			trim: true,
		},
		rightSubheadline: {
			type: String,
			default: "",
			trim: true,
		},
		ctaText: {
			type: String,
			default: "",
			trim: true,
		},
		ctaLink: {
			type: String,
			default: "",
			trim: true,
		},
		image: {
			type: String,
			required: [true, "Campaign banner image is required"],
		},
		imagePublicId: {
			type: String,
			default: "",
		},
		mobileImage: {
			type: String,
			default: "",
		},
		mobileImagePublicId: {
			type: String,
			default: "",
		},
		bgColor: {
			type: String,
			default: "bg-neutral-950",
		},
		textColor: {
			type: String,
			default: "text-white",
		},
		offerPills: [offerPillSchema],
		displayOrder: {
			type: Number,
			default: 0,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		startDate: {
			type: Date,
			default: null,
		},
		endDate: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true }
);

campaignSlideSchema.index({ isActive: 1, displayOrder: 1 });

const CampaignSlide = mongoose.model("CampaignSlide", campaignSlideSchema);

export default CampaignSlide;

