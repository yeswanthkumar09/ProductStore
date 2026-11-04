import mongoose from "mongoose";

const searchQuerySchema = new mongoose.Schema(
	{
		query: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		searchCount: {
			type: Number,
			default: 1,
			min: 1,
		},
		resultsCount: {
			type: Number,
			default: 0,
		},
		lastSearchedAt: {
			type: Date,
			default: Date.now,
			index: true,
		},
	},
	{ timestamps: true }
);

searchQuerySchema.index({ searchCount: -1, lastSearchedAt: -1 });

const SearchQuery = mongoose.model("SearchQuery", searchQuerySchema);

export default SearchQuery;

