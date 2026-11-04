import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";

const TAXONOMY = [
	{
		name: "Shirts",
		slug: "shirts",
		parentCategory: "MEN'S FASHION",
		displayOrder: 1,
		description: "Tailored formal, casual & linen luxury shirts crafted with fine natural fibers.",
		imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
		subcategories: [
			{ name: "Formal Shirts", slug: "formal-shirts", description: "Bespoke poplin & twill office wear" },
			{ name: "Casual Shirts", slug: "casual-shirts", description: "Relaxed cotton & chambray weekenders" },
			{ name: "Linen Shirts", slug: "linen-shirts", description: "Breathable European pure linen edits" },
			{ name: "Oversized Shirts", slug: "oversized-shirts", description: "Drop-shoulder contemporary silhouettes" },
		],
		attributes: [
			{
				key: "collarType",
				label: "Collar Type",
				type: "select",
				options: ["Classic Collar", "Mandarin Collar", "Button-Down", "Spread Collar", "Cuban Collar"],
				required: true,
			},
			{
				key: "sleeveType",
				label: "Sleeve Type",
				type: "select",
				options: ["Full Sleeve", "Half Sleeve", "Roll-Up Sleeve"],
				required: true,
			},
			{
				key: "fit",
				label: "Fit",
				type: "select",
				options: ["Slim Fit", "Regular Fit", "Relaxed Fit", "Oversized"],
				required: true,
			},
			{
				key: "fabric",
				label: "Fabric",
				type: "select",
				options: ["100% Giza Cotton", "Pure Linen", "Cotton Linen Blend", "Poplin", "Oxford Cotton", "Silk Blend"],
				required: true,
			},
			{
				key: "pattern",
				label: "Pattern",
				type: "select",
				options: ["Solid", "Striped", "Checkered", "Textured", "Printed"],
				required: false,
			},
			{
				key: "occasion",
				label: "Occasion",
				type: "select",
				options: ["Formal", "Casual", "Evening / Party", "Workwear", "Resort"],
				required: false,
			},
			{
				key: "closureType",
				label: "Closure Type",
				type: "select",
				options: ["Full Button Placket", "Concealed Placket", "Quarter Button"],
				required: false,
			},
		],
		sizeSystem: {
			systemType: "apparel_alpha",
			allowedSizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
			hasDimensions: false,
		},
	},
	{
		name: "T-Shirts",
		slug: "t-shirts",
		parentCategory: "MEN'S FASHION",
		displayOrder: 2,
		description: "Heavyweight organic combed cotton basics, oversized cuts & classic polos.",
		imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
		subcategories: [
			{ name: "Basic T-Shirts", slug: "basic-t-shirts", description: "Minimalist everyday crewnecks" },
			{ name: "Oversized T-Shirts", slug: "oversized-t-shirts", description: "Heavyweight boxy streetwear drape" },
			{ name: "Polo T-Shirts", slug: "polo-t-shirts", description: "Classic knit & pique collared polos" },
		],
		attributes: [
			{
				key: "neckType",
				label: "Neck Type",
				type: "select",
				options: ["Crew Neck", "V-Neck", "Henley", "Polo Collar", "Turtle Neck"],
				required: true,
			},
			{
				key: "sleeveType",
				label: "Sleeve Type",
				type: "select",
				options: ["Half Sleeve", "Full Sleeve", "Drop Shoulder", "Sleeveless"],
				required: true,
			},
			{
				key: "fit",
				label: "Fit",
				type: "select",
				options: ["Boxy Fit", "Regular Fit", "Slim Fit", "Oversized"],
				required: true,
			},
			{
				key: "fabric",
				label: "Fabric",
				type: "select",
				options: ["240 GSM Heavyweight Cotton", "180 GSM Combed Cotton", "Organic Bio-Washed Cotton", "Cotton Pique"],
				required: true,
			},
			{
				key: "pattern",
				label: "Pattern",
				type: "select",
				options: ["Solid", "Chest Minimal Graphic", "Typography", "Vintage Wash"],
				required: false,
			},
			{
				key: "occasion",
				label: "Occasion",
				type: "select",
				options: ["Casual", "Streetwear", "Lounge", "Smart Casual"],
				required: false,
			},
		],
		sizeSystem: {
			systemType: "apparel_alpha",
			allowedSizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
			hasDimensions: false,
		},
	},
	{
		name: "Jeans",
		slug: "jeans",
		parentCategory: "MEN'S FASHION",
		displayOrder: 3,
		description: "Premium raw selvedge, vintage washed & architectural denim silhouettes.",
		imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80",
		subcategories: [
			{ name: "Slim Fit", slug: "slim-fit", description: "Tailored narrow-leg clean denim" },
			{ name: "Straight Fit", slug: "straight-fit", description: "Timeless mid-rise authentic straight cut" },
			{ name: "Relaxed Fit", slug: "relaxed-fit", description: "Laidback roomy thigh and knee geometry" },
			{ name: "Baggy Fit", slug: "baggy-fit", description: "Contemporary 90s skater voluminous aesthetic" },
		],
		attributes: [
			{
				key: "waistType",
				label: "Waist Type",
				type: "select",
				options: ["Mid Rise", "Low Rise", "High Rise"],
				required: true,
			},
			{
				key: "fit",
				label: "Fit",
				type: "select",
				options: ["Straight Leg", "Slim Fit", "Tapered", "Relaxed Baggy", "Bootcut"],
				required: true,
			},
			{
				key: "rise",
				label: "Rise",
				type: "select",
				options: ["Mid Rise", "High Rise", "Low Rise"],
				required: false,
			},
			{
				key: "wash",
				label: "Wash",
				type: "select",
				options: ["Raw Indigo", "Light Vintage Wash", "Obsidian Black", "Medium Stone Wash", "Acid Wash"],
				required: true,
			},
			{
				key: "length",
				label: "Length",
				type: "measurement",
				unit: "in",
				options: ["30", "32", "34"],
				required: false,
			},
			{
				key: "stretchType",
				label: "Stretch Type",
				type: "select",
				options: ["100% Rigid Raw Cotton", "Comfort Stretch (2% Elastane)", "Power Stretch"],
				required: false,
			},
		],
		sizeSystem: {
			systemType: "waist_numeric",
			allowedSizes: ["28", "30", "32", "34", "36", "38", "40"],
			hasDimensions: false,
		},
	},
	{
		name: "Trousers",
		slug: "trousers",
		parentCategory: "MEN'S FASHION",
		displayOrder: 4,
		description: "Tailored wool blend, pleat-front trousers & utility cargo pants.",
		imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
		subcategories: [
			{ name: "Formal Trousers", slug: "formal-trousers", description: "Sharp tailored suiting trousers" },
			{ name: "Cargo Trousers", slug: "cargo-trousers", description: "Tactical pocket multi-compartment chinos" },
			{ name: "Chinos", slug: "chinos", description: "Classic stretch cotton smart-casuals" },
		],
		attributes: [
			{
				key: "fit",
				label: "Fit",
				type: "select",
				options: ["Slim Fit", "Straight Tailored", "Relaxed Wide Leg", "Pleated Classic"],
				required: true,
			},
			{
				key: "waistType",
				label: "Waist Type",
				type: "select",
				options: ["Mid Rise", "Extended Tab Waistband", "Elasticated Drawstring", "Side Adjusters"],
				required: true,
			},
			{
				key: "length",
				label: "Length",
				type: "measurement",
				unit: "in",
				options: ["Cropped Ankle", "Regular", "Full Break"],
				required: false,
			},
			{
				key: "pleats",
				label: "Pleats",
				type: "select",
				options: ["Flat Front", "Single Pleat", "Double Reverse Pleats"],
				required: false,
			},
			{
				key: "fabric",
				label: "Fabric",
				type: "select",
				options: ["Wool Blend", "Cotton Twill", "Linen Blend", "Technical Stretch"],
				required: true,
			},
			{
				key: "closure",
				label: "Closure",
				type: "select",
				options: ["Hook & Bar with Zip Fly", "Button Fly", "Drawstring Pull-On"],
				required: false,
			},
		],
		sizeSystem: {
			systemType: "waist_numeric",
			allowedSizes: ["28", "30", "32", "34", "36", "38", "40"],
			hasDimensions: false,
		},
	},
	{
		name: "Jackets",
		slug: "jackets",
		parentCategory: "MEN'S FASHION",
		displayOrder: 5,
		description: "Lambskin leather, shearling bombers & heritage outerwear.",
		imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
		subcategories: [
			{ name: "Leather Jackets", slug: "leather-jackets", description: "Supple lambskin & cowhide motorcyclists" },
			{ name: "Denim Jackets", slug: "denim-jackets", description: "Rugged selvedge trucker jackets" },
			{ name: "Bomber Jackets", slug: "bomber-jackets", description: "Flight nylon & varsity wool bombers" },
		],
		attributes: [
			{
				key: "jacketType",
				label: "Jacket Type",
				type: "select",
				options: ["Biker Jacket", "Cafe Racer", "Varsity Bomber", "Trucker Jacket", "Shearling Aviator"],
				required: true,
			},
			{
				key: "material",
				label: "Material",
				type: "select",
				options: ["Full-Grain Lambskin Leather", "Cowhide Leather", "Raw Heavyweight Denim", "Water-Repellent Nylon"],
				required: true,
			},
			{
				key: "lining",
				label: "Lining",
				type: "select",
				options: ["100% Cupro Silk Lining", "Quilted Thermal Lining", "Faux Shearling", "Unlined"],
				required: false,
			},
			{
				key: "fit",
				label: "Fit",
				type: "select",
				options: ["Slim Tailored", "Regular Fit", "Boxy Cropped", "Oversized"],
				required: true,
			},
			{
				key: "collar",
				label: "Collar",
				type: "select",
				options: ["Asymmetrical Notch Lapel", "Band Collar with Snap", "Ribbed Knit Collar", "Spread Sherpa Collar"],
				required: false,
			},
			{
				key: "closure",
				label: "Closure",
				type: "select",
				options: ["Heavy-Duty YKK Zip", "Double-Breasted Buttons", "Snap Buttons"],
				required: false,
			},
		],
		sizeSystem: {
			systemType: "apparel_alpha",
			allowedSizes: ["S", "M", "L", "XL", "XXL"],
			hasDimensions: false,
		},
	},
	{
		name: "Suits",
		slug: "suits",
		parentCategory: "MEN'S FASHION",
		displayOrder: 6,
		description: "Bespoke virgin wool blazers, tuxedos & two-piece formal suiting.",
		imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
		subcategories: [
			{ name: "Formal Suits", slug: "formal-suits", description: "Tailored two-piece executive suiting" },
			{ name: "Blazers", slug: "blazers", description: "Structured smart-casual sports coats" },
			{ name: "Tuxedos", slug: "tuxedos", description: "Black-tie satin shawl & peak lapel evening wear" },
		],
		attributes: [
			{
				key: "suitType",
				label: "Suit Type",
				type: "select",
				options: ["Two-Piece Suit", "Three-Piece Suit", "Tuxedo", "Separate Blazer"],
				required: true,
			},
			{
				key: "fit",
				label: "Fit",
				type: "select",
				options: ["Slim Fit", "Modern Tailored Fit", "Classic Fit"],
				required: true,
			},
			{
				key: "lapelStyle",
				label: "Lapel Style",
				type: "select",
				options: ["Peak Lapel", "Notch Lapel", "Satin Shawl Lapel"],
				required: true,
			},
			{
				key: "numberOfPieces",
				label: "Number of Pieces",
				type: "number",
				defaultValue: 2,
				required: false,
			},
			{
				key: "fabric",
				label: "Fabric",
				type: "select",
				options: ["Super 130s Virgin Wool", "Italian Wool Silk Blend", "Velvet", "Tropical Linen Wool"],
				required: true,
			},
			{
				key: "occasion",
				label: "Occasion",
				type: "select",
				options: ["Black Tie Gala", "Wedding / Festive", "Business Formal", "Cocktail Party"],
				required: false,
			},
		],
		sizeSystem: {
			systemType: "apparel_alpha",
			allowedSizes: ["36", "38", "40", "42", "44", "46"],
			hasDimensions: false,
		},
	},
	{
		name: "Shoes",
		slug: "shoes",
		parentCategory: "MEN'S FASHION",
		displayOrder: 7,
		description: "Handcrafted Italian calfskin sneakers, loafers & Chelsea boots.",
		imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
		subcategories: [
			{ name: "Sneakers", slug: "sneakers", description: "Minimalist Italian leather cupsole trainers" },
			{ name: "Formal Shoes", slug: "formal-shoes", description: "Goodyear-welted oxfords & derbies" },
			{ name: "Boots", slug: "boots", description: "Suede Chelsea boots & combat silhouettes" },
			{ name: "Loafers", slug: "loafers", description: "Penny loafers & horsebit Belgian slip-ons" },
		],
		attributes: [
			{
				key: "shoeType",
				label: "Shoe Type",
				type: "select",
				options: ["Low-Top Minimalist Sneaker", "Penny Loafer", "Chelsea Boot", "Oxford Wingtip", "Derby"],
				required: true,
			},
			{
				key: "upperMaterial",
				label: "Upper Material",
				type: "select",
				options: ["Full-Grain Italian Calfskin", "Suede Leather", "Nappa Leather", "Patent Leather"],
				required: true,
			},
			{
				key: "soleMaterial",
				label: "Sole Material",
				type: "select",
				options: ["Durable Margom Rubber Cupsole", "Hand-Finished Leather Sole with Vibram Half-Sole", "Lightweight EVA Midsole"],
				required: true,
			},
			{
				key: "closure",
				label: "Closure",
				type: "select",
				options: ["Waxed Cotton Laces", "Slip-On / Elastic Gusset", "Double Monk Strap"],
				required: false,
			},
			{
				key: "occasion",
				label: "Occasion",
				type: "select",
				options: ["Casual", "Smart Casual", "Formal", "Black Tie"],
				required: false,
			},
		],
		sizeSystem: {
			systemType: "footwear_numeric",
			allowedSizes: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"],
			hasDimensions: false,
		},
	},
	{
		name: "Bags",
		slug: "bags",
		parentCategory: "MEN'S FASHION",
		displayOrder: 8,
		description: "Full-grain vegetable-tanned leather weekenders, backpacks & laptop bags.",
		imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
		subcategories: [
			{ name: "Backpacks", slug: "backpacks", description: "Ergonomic leather & commuter packs" },
			{ name: "Duffel Bags", slug: "duffel-bags", description: "Generous capacity travel weekenders" },
			{ name: "Laptop Bags", slug: "laptop-bags", description: "Padded tech briefcases & slim messengers" },
		],
		attributes: [
			{
				key: "bagType",
				label: "Bag Type",
				type: "select",
				options: ["Weekender Duffel", "Commuter Backpack", "Slim Briefcase / Messenger", "Tote Bag"],
				required: true,
			},
			{
				key: "capacity",
				label: "Capacity",
				type: "measurement",
				unit: "L",
				options: ["15L", "25L", "40L", "55L"],
				required: false,
			},
			{
				key: "dimensions",
				label: "Dimensions",
				type: "text",
				defaultValue: "50 x 28 x 26 cm",
				required: false,
			},
			{
				key: "material",
				label: "Material",
				type: "select",
				options: ["Full-Grain Cowhide Leather", "Waterproof Waxed Canvas", "Ballistic Cordura Nylon"],
				required: true,
			},
			{
				key: "compartments",
				label: "Compartments",
				type: "number",
				defaultValue: 3,
				required: false,
			},
			{
				key: "laptopCompatibility",
				label: "Laptop Compatibility",
				type: "select",
				options: ["Up to 16-inch MacBook Pro", "Up to 14-inch Laptop", "Tablet Sleeve Only", "No Dedicated Sleeve"],
				required: false,
			},
		],
		sizeSystem: {
			systemType: "one_size",
			allowedSizes: ["One Size"],
			hasDimensions: true,
		},
	},
	{
		name: "Glasses",
		slug: "glasses",
		parentCategory: "MEN'S FASHION",
		displayOrder: 9,
		description: "Ultralight titanium aviators & handcrafted acetate sunglasses.",
		imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
		subcategories: [
			{ name: "Sunglasses", slug: "sunglasses", description: "100% UV400 polarized shades" },
			{ name: "Optical Frames", slug: "optical-frames", description: "Prescription-ready luxury eyewear" },
		],
		attributes: [
			{
				key: "frameShape",
				label: "Frame Shape",
				type: "select",
				options: ["Aviator Teardrop", "Wayfarer Square", "Round Pantos", "Hexagonal Geometric"],
				required: true,
			},
			{
				key: "frameMaterial",
				label: "Frame Material",
				type: "select",
				options: ["Japanese Aerospace Titanium", "Italian Mazzucchelli Acetate", "Monel Metal Alloy"],
				required: true,
			},
			{
				key: "lensType",
				label: "Lens Type",
				type: "select",
				options: ["Polarized Triacetate (TAC)", "CR-39 Optical Lens", "Photochromic Transition", "Non-Prescription Blue Light Block"],
				required: true,
			},
			{
				key: "lensColour",
				label: "Lens Colour",
				type: "select",
				options: ["Smoke Grey", "G-15 Green", "Gradient Brown", "Mirrored Silver", "Clear"],
				required: false,
			},
			{
				key: "frameDimensions",
				label: "Frame Dimensions",
				type: "text",
				defaultValue: "58-14-145 mm (Lens-Bridge-Temple)",
				required: false,
			},
		],
		sizeSystem: {
			systemType: "one_size",
			allowedSizes: ["Standard"],
			hasDimensions: true,
		},
	},
	{
		name: "Accessories",
		slug: "accessories",
		parentCategory: "MEN'S FASHION",
		displayOrder: 10,
		description: "Curated luxury Italian leather belts, timepieces, wallets & caps.",
		imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
		subcategories: [
			{ name: "Belts", slug: "belts", description: "Reversible & automatic buckle leather belts" },
			{ name: "Watches", slug: "watches", description: "Minimalist sapphire crystal chronographs" },
			{ name: "Wallets", slug: "wallets", description: "RFID-blocking slim bifold cardholders" },
			{ name: "Caps", slug: "caps", description: "Unstructured 6-panel cashmere blend caps" },
		],
		attributes: [
			{
				key: "accessoryType",
				label: "Accessory Type",
				type: "select",
				options: ["Leather Belt", "Minimalist Chronograph Watch", "Bifold Cardholder", "Embroidered Wool Cap"],
				required: true,
			},
			{
				key: "material",
				label: "Material",
				type: "select",
				options: ["Full-Grain Italian Leather", "316L Surgical Grade Stainless Steel", "Suede", "Organic Cotton Twill"],
				required: true,
			},
			{
				key: "dimensions",
				label: "Dimensions",
				type: "text",
				defaultValue: "",
				required: false,
			},
			{
				key: "style",
				label: "Style",
				type: "select",
				options: ["Minimalist Luxury", "Vintage Heritage", "Contemporary Streetwear", "Formal Black Tie"],
				required: false,
			},
		],
		sizeSystem: {
			systemType: "one_size",
			allowedSizes: ["One Size"],
			hasDimensions: false,
		},
	},
];

async function seedTaxonomy() {
	await mongoose.connect("mongodb://127.0.0.1:27017/ecommerce");
	console.log("Connected to MongoDB for taxonomy migration.");

	// 1. Upsert all categories and their complete taxonomy definition
	for (const catDef of TAXONOMY) {
		const existing = await Category.findOne({ slug: catDef.slug });
		if (existing) {
			console.log(`Enhancing existing category: ${catDef.name} (${catDef.slug})`);
			existing.name = catDef.name;
			existing.parentCategory = catDef.parentCategory;
			existing.displayOrder = catDef.displayOrder;
			existing.description = catDef.description;
			if (!existing.imageUrl) existing.imageUrl = catDef.imageUrl;
			existing.subcategories = catDef.subcategories;
			existing.attributes = catDef.attributes;
			existing.sizeSystem = catDef.sizeSystem;
			existing.isActive = true;
			existing.isArchived = false;
			await existing.save();
		} else {
			console.log(`Creating new category: ${catDef.name} (${catDef.slug})`);
			await Category.create(catDef);
		}
	}

	// 2. Map existing products to their corresponding Category _id and subcategories
	const products = await Product.find({});
	console.log(`\nMapping ${products.length} existing products to dynamic categories...`);

	for (const product of products) {
		const matchedCat = await Category.findOne({ slug: product.category });
		if (matchedCat) {
			product.categoryId = matchedCat._id;

			// Assign appropriate subcategory if empty
			if (!product.subcategory) {
				if (product.category === "jeans") product.subcategory = "straight-fit";
				else if (product.category === "t-shirts") product.subcategory = "oversized-t-shirts";
				else if (product.category === "shoes") product.subcategory = "sneakers";
				else if (product.category === "glasses") product.subcategory = "sunglasses";
				else if (product.category === "jackets") product.subcategory = "leather-jackets";
				else if (product.category === "suits") product.subcategory = "tuxedos";
				else if (product.category === "bags") product.subcategory = "duffel-bags";
				else if (matchedCat.subcategories.length > 0) {
					product.subcategory = matchedCat.subcategories[0].slug;
				}
			}

			// Seed basic categoryAttributes if empty
			if (!product.categoryAttributes || product.categoryAttributes.size === 0) {
				const attrs = {};
				matchedCat.attributes.forEach((attr) => {
					if (attr.defaultValue) attrs[attr.key] = attr.defaultValue;
					else if (attr.options?.length > 0) attrs[attr.key] = attr.options[0];
				});
				product.categoryAttributes = attrs;
			}

			await product.save();
			console.log(`  ✓ Linked product "${product.name}" to category "${matchedCat.name}" (Subcategory: ${product.subcategory})`);
		} else {
			console.log(`  ! Notice: No direct category match for product "${product.name}" with category="${product.category}"`);
		}
	}

	// 3. Update itemCount on each category
	const allCategories = await Category.find({});
	for (const cat of allCategories) {
		const count = await Product.countDocuments({
			$or: [{ category: cat.slug }, { categoryId: cat._id }],
		});
		cat.itemCount = count;
		await cat.save();
		console.log(`Category "${cat.name}": ${count} products.`);
	}

	console.log("\nTaxonomy migration completed successfully!");
	await mongoose.disconnect();
}

seedTaxonomy().catch((err) => {
	console.error("Migration error:", err);
	process.exit(1);
});

