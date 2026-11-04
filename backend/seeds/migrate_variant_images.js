import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Product from "../models/product.model.js";

const COLOR_IMAGE_MAP = {
	"Vintage Straight-Leg Selvedge Denim": {
		"Raw Indigo": "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80",
		"Light Wash": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
		"Obsidian Black": "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=800&q=80",
	},
	"Heavyweight Boxy Organic Cotton Tee": {
		"Pure White": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
		"Pitch Black": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
		"Heather Grey": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
	},
	"Air Motion Minimalist Leather Sneakers": {
		"Triple White": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
		"Shadow Black": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80",
		"Desert Sand": "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=80",
	},
	"Aviator Titanium Polarized Sunglasses": {
		"Polished Gold": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
		"Matte Black": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
		"Dark Tortoise": "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=800&q=80",
	},
	"Heritage Lambskin Leather Biker Jacket": {
		"Midnight Black": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
		"Chestnut Brown": "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=800&q=80",
		"Military Olive": "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80",
	},
	"Italian Wool Slim-Fit Midnight Tuxedo": {
		"Deep Navy": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
		"Charcoal Grey": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
		"Classic Tuxedo Black": "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80",
	},
	"Full-Grain Leather Weekender Duffel Bag": {
		"Cognac Tan": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
		"Espresso Brown": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
		"Jet Black": "https://images.unsplash.com/photo-1577733966973-d680bffd2e80?auto=format&fit=crop&w=800&q=80",
	},
};

async function migrate() {
	await mongoose.connect("mongodb://127.0.0.1:27017/ecommerce");
	console.log("Connected to MongoDB for variant image migration.");

	const products = await Product.find({});
	for (const product of products) {
		const mapping = COLOR_IMAGE_MAP[product.name];
		if (!mapping) {
			console.log(`Skipping ${product.name} (no map)`);
			continue;
		}

		console.log(`Migrating color-specific imagery for: ${product.name}`);

		// 1. Update colors array with image
		if (Array.isArray(product.colors)) {
			product.colors = product.colors.map((c) => {
				const img = mapping[c.name] || c.image || "";
				return {
					name: c.name,
					hex: c.hex,
					image: img,
				};
			});
		}

		// 2. Update variants with specific image
		if (Array.isArray(product.variants)) {
			product.variants.forEach((v) => {
				const colorName = v.color?.name;
				const specificImg = mapping[colorName];
				if (specificImg) {
					v.images = [specificImg];
					if (v.color) {
						v.color.image = specificImg;
					}
				}
			});
		}

		// 3. Ensure primary image matches the first color variant
		const firstColorImg = product.colors?.[0]?.image;
		if (firstColorImg) {
			product.image = firstColorImg;
			if (!product.images || product.images.length === 0) {
				product.images = Object.values(mapping);
			} else {
				product.images = Array.from(new Set([firstColorImg, ...Object.values(mapping)]));
			}
		}

		await product.save();
		console.log(`  ✓ Updated ${product.name} successfully.`);
	}

	console.log("Variant image migration completed!");
	await mongoose.disconnect();
}

migrate().catch((err) => {
	console.error("Migration failed:", err);
	process.exit(1);
});

