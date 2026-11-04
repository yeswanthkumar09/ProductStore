import mongoose from "mongoose";

const versionSnapshotSchema = new mongoose.Schema(
	{
		version: { type: Number, required: true },
		data: { type: mongoose.Schema.Types.Mixed, required: true },
		updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		updatedAt: { type: Date, default: Date.now },
		status: { type: String, default: "published" },
		comment: { type: String, default: "" },
	},
	{ _id: false }
);

const cmsContentSchema = new mongoose.Schema(
	{
		sectionKey: {
			type: String,
			required: [true, "Section key is required"],
			unique: true,
			trim: true,
			lowercase: true,
			index: true,
		},
		category: {
			type: String,
			enum: ["homepage", "navigation", "promotions", "policies", "general"],
			default: "general",
		},
		title: {
			type: String,
			required: [true, "Section title is required"],
			trim: true,
		},
		subtitle: {
			type: String,
			default: "",
			trim: true,
		},
		status: {
			type: String,
			enum: ["draft", "published", "scheduled", "archived"],
			default: "published",
			index: true,
		},
		data: {
			type: mongoose.Schema.Types.Mixed,
			required: true,
			default: {},
		},
		draftData: {
			type: mongoose.Schema.Types.Mixed,
			default: null,
		},
		scheduledPublishDate: {
			type: Date,
			default: null,
		},
		scheduledExpiryDate: {
			type: Date,
			default: null,
		},
		displayOrder: {
			type: Number,
			default: 1,
		},
		version: {
			type: Number,
			default: 1,
		},
		versionHistory: [versionSnapshotSchema],
		lastUpdatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

cmsContentSchema.index({ status: 1, sectionKey: 1 });
cmsContentSchema.index({ scheduledPublishDate: 1, scheduledExpiryDate: 1 });

const CmsContent = mongoose.model("CmsContent", cmsContentSchema);

export default CmsContent;

