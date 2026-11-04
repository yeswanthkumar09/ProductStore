import mongoose from "mongoose";

const browsingHistorySchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true,
		},
		items: [
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
					required: true,
				},
				category: {
					type: String,
					default: "",
				},
				brand: {
					type: String,
					default: "",
				},
				viewedAt: {
					type: Date,
					default: Date.now,
				},
				viewCount: {
					type: Number,
					default: 1,
				},
			},
		],
	},
	{ timestamps: true }
);

const BrowsingHistory = mongoose.model("BrowsingHistory", browsingHistorySchema);

export default BrowsingHistory;
