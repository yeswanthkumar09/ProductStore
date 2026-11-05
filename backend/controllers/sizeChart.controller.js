import SizeChart from "../models/sizeChart.model.js";

// Standard pre-seeded size templates covering high-fashion categories
const defaultSizeTemplates = [
	{
		category: "shirts",
		name: "Men's Luxury Shirts & Casual Button-Downs",
		fitDescription: "Contemporary tailored fit through chest and waist. We suggest taking your standard size for a structured look or sizing up for a relaxed drape.",
		columns: ["chest", "shoulder", "length", "sleeve"],
		rows: [
			{
				size: "S (38)",
				chestCm: 96,
				chestIn: 38,
				shoulderCm: 44,
				shoulderIn: 17.5,
				lengthCm: 72,
				lengthIn: 28.5,
				sleeveCm: 63,
				sleeveIn: 25,
				conversions: { in: "38", us: "38", uk: "38", eu: "48", intl: "S" },
			},
			{
				size: "M (40)",
				chestCm: 102,
				chestIn: 40,
				shoulderCm: 46,
				shoulderIn: 18,
				lengthCm: 74,
				lengthIn: 29,
				sleeveCm: 64,
				sleeveIn: 25.2,
				conversions: { in: "40", us: "40", uk: "40", eu: "50", intl: "M" },
			},
			{
				size: "L (42)",
				chestCm: 108,
				chestIn: 42.5,
				shoulderCm: 48,
				shoulderIn: 19,
				lengthCm: 76,
				lengthIn: 30,
				sleeveCm: 65,
				sleeveIn: 25.6,
				conversions: { in: "42", us: "42", uk: "42", eu: "52", intl: "L" },
			},
			{
				size: "XL (44)",
				chestCm: 114,
				chestIn: 45,
				shoulderCm: 50,
				shoulderIn: 19.7,
				lengthCm: 78,
				lengthIn: 30.7,
				sleeveCm: 66,
				sleeveIn: 26,
				conversions: { in: "44", us: "44", uk: "44", eu: "54", intl: "XL" },
			},
			{
				size: "XXL (46)",
				chestCm: 120,
				chestIn: 47.2,
				shoulderCm: 52,
				shoulderIn: 20.5,
				lengthCm: 80,
				lengthIn: 31.5,
				sleeveCm: 67,
				sleeveIn: 26.4,
				conversions: { in: "46", us: "46", uk: "46", eu: "56", intl: "XXL" },
			},
		],
		instructions: [
			{
				title: "Chest",
				instruction: "Measure around the fullest part of your chest, keeping the tape comfortably horizontal under your armpits.",
				tip: "Do not puff your chest out.",
			},
			{
				title: "Shoulder",
				instruction: "Measure from the tip of one shoulder bone straight across the upper back to the opposite shoulder tip.",
				tip: "Wear a well-fitting shirt for reference.",
			},
			{
				title: "Length",
				instruction: "Measure from the highest point of the shoulder seam straight down to the hem.",
				tip: "Keep your posture natural and upright.",
			},
			{
				title: "Sleeve",
				instruction: "Measure from the shoulder seam along the outer arm down to your wrist bone.",
				tip: "Bend elbow slightly for accurate arm movement ease.",
			},
		],
		isDefault: true,
	},
	{
		category: "t-shirts",
		name: "Men's Premium & Boxy T-Shirts",
		fitDescription: "Cut with a relaxed or boxy drop-shoulder aesthetic. Designed to sit comfortably with modern streetwear proportions.",
		columns: ["chest", "shoulder", "length"],
		rows: [
			{
				size: "S",
				chestCm: 100,
				chestIn: 39.4,
				shoulderCm: 47,
				shoulderIn: 18.5,
				lengthCm: 70,
				lengthIn: 27.6,
				conversions: { in: "38", us: "36-38", uk: "36-38", eu: "46-48", intl: "S" },
			},
			{
				size: "M",
				chestCm: 106,
				chestIn: 41.7,
				shoulderCm: 49,
				shoulderIn: 19.3,
				lengthCm: 72,
				lengthIn: 28.3,
				conversions: { in: "40", us: "40", uk: "40", eu: "50", intl: "M" },
			},
			{
				size: "L",
				chestCm: 112,
				chestIn: 44.1,
				shoulderCm: 51,
				shoulderIn: 20.1,
				lengthCm: 74,
				lengthIn: 29.1,
				conversions: { in: "42", us: "42", uk: "42", eu: "52", intl: "L" },
			},
			{
				size: "XL",
				chestCm: 118,
				chestIn: 46.5,
				shoulderCm: 53,
				shoulderIn: 20.9,
				lengthCm: 76,
				lengthIn: 29.9,
				conversions: { in: "44", us: "44", uk: "44", eu: "54", intl: "XL" },
			},
			{
				size: "XXL",
				chestCm: 124,
				chestIn: 48.8,
				shoulderCm: 55,
				shoulderIn: 21.6,
				lengthCm: 78,
				lengthIn: 30.7,
				conversions: { in: "46", us: "46", uk: "46", eu: "56", intl: "XXL" },
			},
		],
		instructions: [
			{
				title: "Chest",
				instruction: "Wrap the tape around the broadest point of your chest, ensuring it stays level around your back.",
			},
			{
				title: "Shoulder",
				instruction: "Measure straight across from one shoulder point to the other across the back.",
			},
			{
				title: "Length",
				instruction: "Measure vertically from the collar base to the lower bottom hem.",
			},
		],
		isDefault: true,
	},
	{
		category: "trousers",
		name: "Men's Tailored Trousers & Chinos",
		fitDescription: "Engineered with a clean mid-rise waist and tapered leg opening.",
		columns: ["waist", "hip", "inseam", "outseam"],
		rows: [
			{
				size: "30",
				waistCm: 78,
				waistIn: 30.7,
				hipCm: 98,
				hipIn: 38.6,
				inseamCm: 78,
				inseamIn: 30.7,
				outseamCm: 102,
				outseamIn: 40.2,
				conversions: { in: "30", us: "30", uk: "30", eu: "46", intl: "S" },
			},
			{
				size: "32",
				waistCm: 83,
				waistIn: 32.7,
				hipCm: 103,
				hipIn: 40.5,
				inseamCm: 79,
				inseamIn: 31.1,
				outseamCm: 104,
				outseamIn: 40.9,
				conversions: { in: "32", us: "32", uk: "32", eu: "48", intl: "M" },
			},
			{
				size: "34",
				waistCm: 88,
				waistIn: 34.6,
				hipCm: 108,
				hipIn: 42.5,
				inseamCm: 80,
				inseamIn: 31.5,
				outseamCm: 106,
				outseamIn: 41.7,
				conversions: { in: "34", us: "34", uk: "34", eu: "50", intl: "L" },
			},
			{
				size: "36",
				waistCm: 93,
				waistIn: 36.6,
				hipCm: 113,
				hipIn: 44.5,
				inseamCm: 81,
				inseamIn: 31.9,
				outseamCm: 108,
				outseamIn: 42.5,
				conversions: { in: "36", us: "36", uk: "36", eu: "52", intl: "XL" },
			},
			{
				size: "38",
				waistCm: 98,
				waistIn: 38.6,
				hipCm: 118,
				hipIn: 46.5,
				inseamCm: 82,
				inseamIn: 32.3,
				outseamCm: 110,
				outseamIn: 43.3,
				conversions: { in: "38", us: "38", uk: "38", eu: "54", intl: "XXL" },
			},
		],
		instructions: [
			{
				title: "Waist",
				instruction: "Measure around your natural waistline where your trousers normally sit.",
			},
			{
				title: "Hip",
				instruction: "Measure around the fullest part of your hips and buttocks.",
			},
			{
				title: "Inseam",
				instruction: "Measure from the crotch seam straight down the inside of the leg to the bottom hem.",
			},
			{
				title: "Outseam",
				instruction: "Measure from the top waistband down along the outer side seam to the bottom hem.",
			},
		],
		isDefault: true,
	},
	{
		category: "jeans",
		name: "Men's Denim & Jeans",
		fitDescription: "Authentic denim with stretch comfort. True to waist size with classic 5-pocket construction.",
		columns: ["waist", "hip", "inseam"],
		rows: [
			{
				size: "30",
				waistCm: 79,
				waistIn: 31.1,
				hipCm: 99,
				hipIn: 39,
				inseamCm: 80,
				inseamIn: 31.5,
				conversions: { in: "30", us: "30", uk: "30", eu: "46", intl: "S" },
			},
			{
				size: "32",
				waistCm: 84,
				waistIn: 33.1,
				hipCm: 104,
				hipIn: 40.9,
				inseamCm: 81,
				inseamIn: 31.9,
				conversions: { in: "32", us: "32", uk: "32", eu: "48", intl: "M" },
			},
			{
				size: "34",
				waistCm: 89,
				waistIn: 35,
				hipCm: 109,
				hipIn: 42.9,
				inseamCm: 82,
				inseamIn: 32.3,
				conversions: { in: "34", us: "34", uk: "34", eu: "50", intl: "L" },
			},
			{
				size: "36",
				waistCm: 94,
				waistIn: 37,
				hipCm: 114,
				hipIn: 44.9,
				inseamCm: 83,
				inseamIn: 32.7,
				conversions: { in: "36", us: "36", uk: "36", eu: "52", intl: "XL" },
			},
		],
		instructions: [
			{
				title: "Waist",
				instruction: "Measure around your waist where you prefer your jeans waistband to sit.",
			},
			{
				title: "Hip",
				instruction: "Wrap measuring tape around the fullest part of your seat.",
			},
			{
				title: "Inseam",
				instruction: "From inner leg crotch junction directly to the ankle hem.",
			},
		],
		isDefault: true,
	},
	{
		category: "jackets",
		name: "Men's Jackets, Coats & Blazers",
		fitDescription: "Tailored luxury outerwear with room for light knitwear or shirts underneath.",
		columns: ["chest", "shoulder", "sleeve", "length"],
		rows: [
			{
				size: "S (38)",
				chestCm: 104,
				chestIn: 40.9,
				shoulderCm: 45,
				shoulderIn: 17.7,
				sleeveCm: 64,
				sleeveIn: 25.2,
				lengthCm: 68,
				lengthIn: 26.8,
				conversions: { in: "38", us: "38", uk: "38", eu: "48", intl: "S" },
			},
			{
				size: "M (40)",
				chestCm: 110,
				chestIn: 43.3,
				shoulderCm: 47,
				shoulderIn: 18.5,
				sleeveCm: 65,
				sleeveIn: 25.6,
				lengthCm: 70,
				lengthIn: 27.6,
				conversions: { in: "40", us: "40", uk: "40", eu: "50", intl: "M" },
			},
			{
				size: "L (42)",
				chestCm: 116,
				chestIn: 45.7,
				shoulderCm: 49,
				shoulderIn: 19.3,
				sleeveCm: 66,
				sleeveIn: 26,
				lengthCm: 72,
				lengthIn: 28.3,
				conversions: { in: "42", us: "42", uk: "42", eu: "52", intl: "L" },
			},
			{
				size: "XL (44)",
				chestCm: 122,
				chestIn: 48,
				shoulderCm: 51,
				shoulderIn: 20.1,
				sleeveCm: 67,
				sleeveIn: 26.4,
				lengthCm: 74,
				lengthIn: 29.1,
				conversions: { in: "44", us: "44", uk: "44", eu: "54", intl: "XL" },
			},
		],
		instructions: [
			{
				title: "Chest",
				instruction: "Measure across fullest chest area wearing the base layer you plan to wear under the jacket.",
			},
			{
				title: "Shoulder",
				instruction: "Tip to tip across upper back shoulder joints.",
			},
			{
				title: "Sleeve",
				instruction: "Shoulder seam to cuff end at wrist.",
			},
			{
				title: "Length",
				instruction: "Collar back down to jacket jacket bottom hem.",
			},
		],
		isDefault: true,
	},
	{
		category: "shoes",
		name: "Men's Luxury Footwear & Sneakers",
		fitDescription: "Italian-lasted standard width. Order your typical athletic or dress shoe size.",
		columns: ["footLength"],
		rows: [
			{
				size: "UK 7",
				footLengthCm: 25.5,
				footLengthIn: 10,
				conversions: { in: "7", uk: "7", us: "8", eu: "41", intl: "41" },
			},
			{
				size: "UK 8",
				footLengthCm: 26.5,
				footLengthIn: 10.4,
				conversions: { in: "8", uk: "8", us: "9", eu: "42", intl: "42" },
			},
			{
				size: "UK 9",
				footLengthCm: 27.5,
				footLengthIn: 10.8,
				conversions: { in: "9", uk: "9", us: "10", eu: "43", intl: "43" },
			},
			{
				size: "UK 10",
				footLengthCm: 28.5,
				footLengthIn: 11.2,
				conversions: { in: "10", uk: "10", us: "11", eu: "44", intl: "44" },
			},
			{
				size: "UK 11",
				footLengthCm: 29.5,
				footLengthIn: 11.6,
				conversions: { in: "11", uk: "11", us: "12", eu: "45", intl: "45" },
			},
		],
		instructions: [
			{
				title: "Foot Length",
				instruction: "Stand on a flat piece of paper with your heel against the wall. Mark the tip of your longest toe, then measure distance from wall to the mark.",
				tip: "Measure both feet and choose the larger measurement.",
			},
		],
		isDefault: true,
	},
];

// Helper: Seed defaults if table is empty (cached in-memory for serverless performance)
let isSizeChartsEnsured = false;
export const ensureDefaultSizeCharts = async () => {
	if (isSizeChartsEnsured) return;
	try {
		const count = await SizeChart.countDocuments();
		if (count === 0) {
			await SizeChart.insertMany(defaultSizeTemplates);
			console.log("[SIZE CHARTS] Initialized 6 category size guides.");
		}
		isSizeChartsEnsured = true;
	} catch (e) {
		console.warn("[SIZE CHARTS SEED NOTE]", e.message);
	}
};

// 1. Get all size charts
export const getAllSizeCharts = async (req, res) => {
	try {
		await ensureDefaultSizeCharts();
		const charts = await SizeChart.find().sort({ category: 1 });
		res.json(charts);
	} catch (error) {
		console.error("Error in getAllSizeCharts:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// 2. Get size chart by category
export const getSizeChartByCategory = async (req, res) => {
	try {
		await ensureDefaultSizeCharts();
		const { category } = req.params;
		const cleanCat = (category || "").toLowerCase().trim();

		// Category aliases
		const aliasMap = {
			shirt: "shirts",
			overshirt: "shirts",
			"t-shirt": "t-shirts",
			tshirt: "t-shirts",
			trousers: "trousers",
			pant: "trousers",
			pants: "trousers",
			chinos: "trousers",
			jean: "jeans",
			denim: "jeans",
			jacket: "jackets",
			coat: "jackets",
			blazer: "jackets",
			outerwear: "jackets",
			shoe: "shoes",
			sneaker: "shoes",
			footwear: "shoes",
		};

		const mappedCategory = aliasMap[cleanCat] || cleanCat;

		let chart = await SizeChart.findOne({ category: mappedCategory });

		if (!chart) {
			// Fallback to shirts if topwear, or first default chart
			chart = (await SizeChart.findOne({ category: "shirts" })) || (await SizeChart.findOne());
		}

		res.json(chart);
	} catch (error) {
		console.error("Error in getSizeChartByCategory:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// 3. Admin create or update size chart
export const createOrUpdateSizeChart = async (req, res) => {
	try {
		const { category, name, fitDescription, columns, rows, instructions } = req.body;

		if (!category || !name) {
			return res.status(400).json({ message: "Category and name are required." });
		}

		const cleanCat = category.toLowerCase().trim();

		// Auto calculate cm vs in if missing
		const processedRows = (rows || []).map((row) => {
			const r = { ...row };
			if (r.chestCm && !r.chestIn) r.chestIn = Number((r.chestCm / 2.54).toFixed(1));
			if (r.chestIn && !r.chestCm) r.chestCm = Number((r.chestIn * 2.54).toFixed(1));
			if (r.waistCm && !r.waistIn) r.waistIn = Number((r.waistCm / 2.54).toFixed(1));
			if (r.waistIn && !r.waistCm) r.waistCm = Number((r.waistIn * 2.54).toFixed(1));
			if (r.lengthCm && !r.lengthIn) r.lengthIn = Number((r.lengthCm / 2.54).toFixed(1));
			if (r.lengthIn && !r.lengthCm) r.lengthCm = Number((r.lengthIn * 2.54).toFixed(1));
			if (r.shoulderCm && !r.shoulderIn) r.shoulderIn = Number((r.shoulderCm / 2.54).toFixed(1));
			if (r.shoulderIn && !r.shoulderCm) r.shoulderCm = Number((r.shoulderIn * 2.54).toFixed(1));
			if (r.sleeveCm && !r.sleeveIn) r.sleeveIn = Number((r.sleeveCm / 2.54).toFixed(1));
			if (r.sleeveIn && !r.sleeveCm) r.sleeveCm = Number((r.sleeveIn * 2.54).toFixed(1));
			return r;
		});

		const updatedChart = await SizeChart.findOneAndUpdate(
			{ category: cleanCat },
			{
				category: cleanCat,
				name: name.trim(),
				fitDescription: fitDescription || "",
				columns: columns || ["chest", "shoulder", "length"],
				rows: processedRows,
				instructions: instructions || [],
			},
			{ new: true, upsert: true }
		);

		res.json({ message: "Size chart saved successfully.", chart: updatedChart });
	} catch (error) {
		console.error("Error in createOrUpdateSizeChart:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

