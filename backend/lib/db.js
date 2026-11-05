import mongoose from "mongoose";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";

const DEFAULT_CATEGORY_COLORS = {
	jeans: [
		{ name: "Raw Indigo", hex: "#1a2a4b" },
		{ name: "Light Wash", hex: "#7c9eb2" },
		{ name: "Obsidian Black", hex: "#111111" },
	],
	jackets: [
		{ name: "Midnight Black", hex: "#18181b" },
		{ name: "Chestnut Brown", hex: "#5c3a21" },
		{ name: "Military Olive", hex: "#4b5320" },
	],
	"t-shirts": [
		{ name: "Pure White", hex: "#f8f9fa" },
		{ name: "Pitch Black", hex: "#0f0f0f" },
		{ name: "Heather Grey", hex: "#6c757d" },
	],
	shoes: [
		{ name: "Triple White", hex: "#ffffff" },
		{ name: "Shadow Black", hex: "#1f1f1f" },
		{ name: "Desert Sand", hex: "#c2b280" },
	],
	bags: [
		{ name: "Cognac Tan", hex: "#8b5a2b" },
		{ name: "Espresso Brown", hex: "#362013" },
		{ name: "Jet Black", hex: "#111111" },
	],
	glasses: [
		{ name: "Polished Gold", hex: "#d4af37" },
		{ name: "Matte Black", hex: "#222222" },
		{ name: "Dark Tortoise", hex: "#5d3a1a" },
	],
	suits: [
		{ name: "Deep Navy", hex: "#0b1d3a" },
		{ name: "Charcoal Grey", hex: "#2f3542" },
		{ name: "Classic Tuxedo Black", hex: "#111111" },
	],
};

// Serverless Mongoose connection caching to prevent connection exhaustion
let cached = global.mongooseConnection;
if (!cached) {
	cached = global.mongooseConnection = { conn: null, promise: null };
}

export const connectDB = async () => {
	// 1. Return existing active connection immediately
	if (mongoose.connection.readyState === 1) {
		cached.conn = mongoose.connection;
		return cached.conn;
	}

	if (cached.conn && cached.conn.readyState === 1) {
		return cached.conn;
	}

	// 2. Connect if no connection promise is in-flight
	if (!cached.promise) {
		const opts = {
			serverSelectionTimeoutMS: 5000,
			maxPoolSize: 10,
		};

		cached.promise = (async () => {
			const mongoUri = process.env.MONGO_URI;
			try {
				if (mongoUri) {
					await mongoose.connect(mongoUri, opts);
					console.log(`[MONGODB] Connected to Atlas: ${mongoose.connection.host}`);
					return mongoose.connection;
				}
				throw new Error("MONGO_URI not specified in environment");
			} catch (atlasErr) {
				console.warn(`[MONGODB ATLAS NOTICE] Atlas connection unavailable: ${atlasErr.message}`);
				if (process.env.NODE_ENV !== "production") {
					console.log(`[MONGODB FALLBACK] Connecting to local MongoDB server on 127.0.0.1:27017...`);
					try {
						await mongoose.connect("mongodb://127.0.0.1:27017/ecommerce", {
							serverSelectionTimeoutMS: 2000,
							maxPoolSize: 10,
						});
						console.log(`[MONGODB] Connected to local instance: ${mongoose.connection.host}`);
						return mongoose.connection;
					} catch (localErr) {
						console.error("[MONGODB ERROR] Both Atlas and local MongoDB failed:", localErr.message);
						cached.promise = null;
						throw localErr;
					}
				}
				cached.promise = null;
				throw atlasErr;
			}
		})();
	}

	try {
		cached.conn = await cached.promise;
		return cached.conn;
	} catch (e) {
		cached.promise = null;
		throw e;
	}
};

// Cached idempotent database initialization for categories, store locations, and owner
let isDefaultsEnsured = false;
let defaultsPromise = null;

export const ensureDatabaseDefaults = async () => {
	if (isDefaultsEnsured) return;
	if (defaultsPromise) return defaultsPromise;

	defaultsPromise = (async () => {
		try {
			// Single-Owner Architecture Enforcement
		const User = (await import("../models/user.model.js")).default;
		const ownerEmail = (process.env.OWNER_EMAIL || "yeswanthagathamudi@gmail.com").trim().toLowerCase();

		// Demote any non-owner accounts with role 'admin'
		await User.updateMany(
			{ email: { $ne: ownerEmail }, role: "admin" },
			{ $set: { role: "customer" } }
		);

		// Synchronize the single owner account
		const existingOwner = await User.findOne({ email: ownerEmail });
		if (existingOwner) {
			if (existingOwner.role !== "admin" || !existingOwner.isEmailVerified || existingOwner.accountStatus !== "active") {
				existingOwner.role = "admin";
				existingOwner.isEmailVerified = true;
				existingOwner.accountStatus = "active";
				await existingOwner.save();
				console.log(`[AUTH] Single owner verified: ${ownerEmail}`);
			}
		} else if (process.env.OWNER_INITIAL_PASSWORD) {
			const newOwner = new User({
				name: process.env.OWNER_NAME || "Yeswanth Agathamudi",
				email: ownerEmail,
				password: process.env.OWNER_INITIAL_PASSWORD,
				role: "admin",
				isEmailVerified: true,
				accountStatus: "active",
			});
			await newOwner.save();
			console.log(`[AUTH] Seeded designated single owner: ${ownerEmail}`);
		} else {
			console.log(`[AUTH NOTICE] Owner account (${ownerEmail}) not found. Please run 'node backend/scripts/bootstrap_owner.js' to initialize owner credentials.`);
		}

		// Ensure categories exist
		const catCount = await Category.countDocuments();
		if (catCount === 0) {
			const initialCategories = [
				{ name: "jeans", slug: "jeans", description: "Premium raw selvedge & distressed denim", imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80" },
				{ name: "t-shirts", slug: "t-shirts", description: "Heavyweight organic combed cotton basics", imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80" },
				{ name: "shoes", slug: "shoes", description: "Italian calfskin sneakers and Chelsea boots", imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80" },
				{ name: "glasses", slug: "glasses", description: "Titanium aviators and acetate silhouettes", imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80" },
				{ name: "jackets", slug: "jackets", description: "Lambskin leather & shearling bombers", imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80" },
				{ name: "suits", slug: "suits", description: "Bespoke wool blazers and formal trousers", imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80" },
				{ name: "bags", slug: "bags", description: "Full-grain leather weekenders and duffels", imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80" },
			];
			await Category.insertMany(initialCategories);
			console.log("[INIT] Seeded default product categories");
		}

		// Ensure store locations exist
		const StoreLocation = (await import("../models/storeLocation.model.js")).default;
		const storeCount = await StoreLocation.countDocuments();
		if (storeCount === 0) {
			const initialStoreLocations = [
				{
					name: "LuxeStore Flagship Boutique - Connaught Place",
					code: "DEL-CP-01",
					address: "Block A, Inner Circle, Connaught Place",
					locality: "Connaught Place",
					city: "New Delhi",
					state: "Delhi",
					country: "India",
					pincode: "110001",
					latitude: 28.6328,
					longitude: 77.2197,
					phone: "+91 11 4151 8800",
					email: "delhi.cp@luxestore.com",
					openingHours: "10:30 AM - 9:00 PM (Mon - Sun)",
					isActive: true,
					isPickupPoint: true,
					pickupInstructions: "Visit Concierge Counter on Floor 1. Present Order ID and Photo ID.",
				},
				{
					name: "LuxeStore Luxury Maison - Palladium Mall",
					code: "MUM-PAL-02",
					address: "Ground Level, Palladium Mall, High Street Phoenix, Lower Parel",
					locality: "Lower Parel",
					city: "Mumbai",
					state: "Maharashtra",
					country: "India",
					pincode: "400013",
					latitude: 18.9953,
					longitude: 72.8242,
					phone: "+91 22 4004 5500",
					email: "mumbai.palladium@luxestore.com",
					openingHours: "11:00 AM - 9:30 PM (Mon - Sun)",
					isActive: true,
					isPickupPoint: true,
					pickupInstructions: "Express Pickup Desk at boutique entrance.",
				},
				{
					name: "LuxeStore Prestige Gallery - UB City",
					code: "BLR-UB-03",
					address: "Level 1, The Collection, UB City, 24 Vittal Mallya Road",
					locality: "Vittal Mallya Road",
					city: "Bengaluru",
					state: "Karnataka",
					country: "India",
					pincode: "560001",
					latitude: 12.9719,
					longitude: 77.5958,
					phone: "+91 80 2211 4400",
					email: "bengaluru.ub@luxestore.com",
					openingHours: "10:30 AM - 8:30 PM (Mon - Sun)",
					isActive: true,
					isPickupPoint: true,
					pickupInstructions: "Concierge Valet and dedicated Order Pickup Counter available.",
				},
			];
			await StoreLocation.insertMany(initialStoreLocations);
			console.log("[INIT] Seeded default flagship store locations");
		}

		// Ensure sample products exist if collection is empty
		const productCount = await Product.countDocuments();
		if (productCount === 0) {
			const initialProducts = [
				{
					name: "Vintage Straight-Leg Selvedge Denim",
					description: "Crafted from 14oz Japanese raw selvedge denim, these straight-leg jeans develop a personalized fade over time. Designed with classic 5-pocket styling and antique copper hardware.",
					price: 2499,
					originalPrice: 3299,
					image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80",
					category: "jeans",
					brand: "Levi's Heritage",
					stock: 45,
					isFeatured: true,
					rating: 4.8,
					numReviews: 34,
				},
				{
					name: "Heavyweight Boxy Organic Cotton Tee",
					description: "260 GSM organic combed cotton t-shirt with a structured drape and relaxed dropped shoulders. Preshrunk with ribbed collar that holds its form wash after wash.",
					price: 1199,
					originalPrice: 1699,
					image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
					category: "t-shirts",
					brand: "Essentials",
					stock: 80,
					isFeatured: true,
					rating: 4.9,
					numReviews: 52,
				},
				{
					name: "Air Motion Minimalist Leather Sneakers",
					description: "Italian calfskin leather upper paired with lightweight EVA cushioning and vulcanized rubber sole. Finished with hand-buffed edges and memory foam insoles.",
					price: 4999,
					originalPrice: 6499,
					image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
					category: "shoes",
					brand: "Common Projects Style",
					stock: 35,
					isFeatured: true,
					rating: 4.9,
					numReviews: 47,
				},
				{
					name: "Aviator Titanium Polarized Sunglasses",
					description: "Aerospace-grade titanium frames with 100% UV400 polarized mineral glass lenses. Anti-reflective inner coating eliminates glare for effortless visual clarity.",
					price: 3299,
					originalPrice: 4499,
					image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
					category: "glasses",
					brand: "Persol Heritage",
					stock: 40,
					isFeatured: true,
					rating: 4.8,
					numReviews: 29,
				},
				{
					name: "Heritage Lambskin Leather Biker Jacket",
					description: "Buttery-soft full-grain lambskin leather with asymmetric zip closure, notch lapels, and quilted satin lining. Heavy-duty YKK gunmetal zippers.",
					price: 8999,
					originalPrice: 12499,
					image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
					category: "jackets",
					brand: "AllSaints Style",
					stock: 20,
					isFeatured: true,
					rating: 4.9,
					numReviews: 38,
				},
				{
					name: "Italian Wool Slim-Fit Midnight Tuxedo",
					description: "Tailored from Super 130s pure virgin wool sourced from Biella, Italy. Satin shawl collar with jetted pockets and matching satin-stripe trousers.",
					price: 14999,
					originalPrice: 19999,
					image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
					category: "suits",
					brand: "Hugo Boss Luxury",
					stock: 15,
					isFeatured: true,
					rating: 5.0,
					numReviews: 19,
				},
				{
					name: "Full-Grain Leather Weekender Duffel Bag",
					description: "Handcrafted from vegetable-tanned full-grain cowhide leather that ages with a rich patina. Features dedicated shoe compartment and brass feet.",
					price: 5499,
					originalPrice: 7999,
					image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
					category: "bags",
					brand: "Filson Style",
					stock: 25,
					isFeatured: true,
					rating: 4.8,
					numReviews: 31,
				},
			];
			await Product.insertMany(initialProducts);
			const productsToUpdate = await Product.find({});
			console.log(`[INIT] Seeded initial luxury product catalog with ${productsToUpdate.length} items.`);

			let updatedCount = 0;
			for (let i = 0; i < productsToUpdate.length; i++) {
				const prod = productsToUpdate[i];
				let modified = false;

				// Normalize USD prices to realistic Indian Rupee prices (e.g. ₹1,499, ₹2,299)
				if (prod.price < 500) {
					prod.price = Math.round(prod.price * 25);
					if (prod.originalPrice) {
						prod.originalPrice = Math.round(prod.originalPrice * 25);
					}
					modified = true;
				}

				if (!prod.originalPrice) {
					prod.originalPrice = Math.round(prod.price * 1.35);
					modified = true;
				}

				// Ensure images array includes the primary image
				if (!prod.images || prod.images.length === 0) {
					prod.images = [prod.image];
					modified = true;
				}

				// Ensure colors are populated with category-matched swatches
				if (!prod.colors || prod.colors.length === 0) {
					const categoryColors = DEFAULT_CATEGORY_COLORS[prod.category?.toLowerCase()] || [
						{ name: "Standard Black", hex: "#111111" },
						{ name: "Classic Navy", hex: "#1a2a4b" },
					];
					prod.colors = categoryColors;
					modified = true;
				}

				// Populate variants if empty
				if (!prod.variants || prod.variants.length === 0) {
					const defaultSizes = prod.category === "shoes" ? ["UK 8", "UK 9", "UK 10"] : (prod.category === "jeans" ? ["30", "32", "34"] : ["S", "M", "L"]);
					const createdVariants = [];
					const colorsToUse = prod.colors && prod.colors.length > 0 ? prod.colors : [{ name: "Standard", hex: "#111111" }];

					colorsToUse.forEach((col, cIdx) => {
						defaultSizes.forEach((sz, sIdx) => {
							const variantPriceDelta = cIdx === 0 ? 0 : (cIdx * 100);
							const variantPrice = prod.price + variantPriceDelta;
							const variantOriginalPrice = Math.round(variantPrice * 1.3);
							const cleanName = prod.name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
							const cleanCol = col.name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
							const cleanSize = sz.replace(/[^a-zA-Z0-9]/g, "");
							
							createdVariants.push({
								color: { name: col.name, hex: col.hex },
								size: sz,
								sku: `${cleanName}-${cleanCol}-${cleanSize}`,
								price: variantPrice,
								originalPrice: variantOriginalPrice,
								stock: 10 + ((cIdx + sIdx) * 5),
								images: prod.images,
								isAvailable: true,
							});
						});
					});

					prod.variants = createdVariants;
					modified = true;
				}

				// Ensure slug, sku, shortDescription
				if (!prod.slug) {
					prod.slug = prod.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + Math.random().toString(36).substring(2, 6);
					modified = true;
				}
				if (!prod.sku) {
					prod.sku = `PROD-${prod.name.substring(0, 4).toUpperCase()}-${prod._id.toString().substring(18)}`;
					modified = true;
				}
				if (!prod.shortDescription) {
					prod.shortDescription = prod.description.substring(0, 120) + "...";
					modified = true;
				}
				if (!prod.highlights || prod.highlights.length === 0) {
					prod.highlights = [
						"Premium high-density weave fabric",
						"Ergonomic tailored fit for all-day comfort",
						"Reinforced stress-point stitching",
						"Certified eco-friendly low-impact dye process",
					];
					modified = true;
				}
				if (!prod.specifications || prod.specifications.length === 0) {
					prod.specifications = [
						{ key: "Material", value: "98% Combed Cotton, 2% Elastane" },
						{ key: "Care", value: "Machine wash cold, tumble dry low" },
						{ key: "Origin", value: "Ethically Crafted in India" },
						{ key: "Fit", value: "Regular / True to size" },
					];
					modified = true;
				}

				// Mark first 4 products as New Arrivals
				if (i < 5 && !prod.isNewArrival) {
					prod.isNewArrival = true;
					prod.newArrivalStartDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
					prod.newArrivalEndDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
					modified = true;
				}

				if (modified) {
					await prod.save();
					updatedCount++;
				}
			}

			// FEATURE 6: Recalculate genuine ratings & review counts from actual persisted Review documents
			const Review = (await import("../models/review.model.js")).default;
			for (const prod of productsToUpdate) {
				const genuineReviews = await Review.find({ product: prod._id });
				const genuineCount = genuineReviews.length;
				const genuineRating = genuineCount > 0
					? Number((genuineReviews.reduce((sum, r) => sum + r.rating, 0) / genuineCount).toFixed(1))
					: 0;
				if (prod.numReviews !== genuineCount || prod.rating !== genuineRating) {
					prod.numReviews = genuineCount;
					prod.rating = genuineRating;
					await prod.save();
				}
			}
			console.log(`Product catalog upgrade complete. Updated ${updatedCount} products with variants and synchronized genuine review aggregates.`);

			// Ensure existing user accounts have verified status and active status
			const User = (await import("../models/user.model.js")).default;
			await User.updateMany(
				{ $or: [{ isEmailVerified: { $exists: false } }, { isEmailVerified: null }, { accountStatus: { $exists: false } }] },
				{ $set: { isEmailVerified: true, accountStatus: "active" } }
			);
		}

		// Drop legacy unique index on userId if present
		try {
			await mongoose.connection.collection("coupons").dropIndex("userId_1");
			console.log("Dropped legacy coupons.userId_1 unique index");
		} catch (e) {
			// Index already dropped or does not exist
		}

		// Ensure default active promotional coupons exist
		const Coupon = (await import("../models/coupon.model.js")).default;
		const existingWelcomeCoupon = await Coupon.findOne({ code: "WELCOME10" });
		if (!existingWelcomeCoupon) {
			await Coupon.create({
				code: "WELCOME10",
				name: "Welcome Discount",
				description: "10% off your entire order for all new and returning patrons",
				discountType: "percentage",
				discountValue: 10,
				discountPercentage: 10,
				maxDiscountCap: 1500,
				minOrderAmount: 999,
				startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
				expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
				scope: "storewide",
				perUserLimit: 5,
				isActive: true,
			});
			console.log("Initialized default WELCOME10 coupon");
		}

		const existingFashionCoupon = await Coupon.findOne({ code: "FASHION15" });
		const apparelCategories = [
			"apparel",
			"clothing",
			"jackets",
			"jeans",
			"suits",
			"shirts",
			"t-shirts",
			"trousers",
			"overshirts",
			"joggers",
			"shorts",
		];
		if (!existingFashionCoupon) {
			await Coupon.create({
				code: "FASHION15",
				name: "Fashion Enthusiast",
				description: "15% off all apparel, shirts, jackets, jeans, and suits",
				discountType: "percentage",
				discountValue: 15,
				discountPercentage: 15,
				maxDiscountCap: 2000,
				minOrderAmount: 1499,
				startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
				expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
				scope: "category",
				eligibleCategories: apparelCategories,
				perUserLimit: 3,
				isActive: true,
			});
			console.log("Initialized default FASHION15 coupon");
		} else {
			existingFashionCoupon.eligibleCategories = apparelCategories;
			await existingFashionCoupon.save();
		}

		// Ensure default active sale campaign exists
		const Sale = (await import("../models/sale.model.js")).default;
		const existingSale = await Sale.findOne({ isActive: true });
		if (!existingSale) {
			await Sale.create({
				name: "Diwali & Festive Season Mega Sale",
				slug: "festive-season-mega-sale",
				description: "Celebrate luxury with up to 30% off our finest apparel, footwear, and curated accessories.",
				badgeText: "FESTIVE SALE",
				bannerImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80",
				startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
				endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Active for 14 days
				discountType: "percentage",
				discountValue: 20,
				scope: "storewide",
				isActive: true,
				isFeatured: true,
			});
			console.log("Initialized default Festive Season Mega Sale");
		}

		// Ensure default serviceable locations exist
		const ServiceableLocation = (await import("../models/serviceableLocation.model.js")).default;
		const locationCount = await ServiceableLocation.countDocuments();
		if (locationCount === 0) {
			const initialLocations = [
				{
					country: "India",
					state: "Maharashtra",
					district: "Mumbai Suburban",
					city: "Mumbai",
					locality: "Andheri West",
					pincode: "400053",
					isActive: true,
					deliveryFee: 0,
					minOrderValue: 0,
					freeDeliveryThreshold: 1999,
					estimatedDeliveryDays: "1-2 business days",
					serviceRestrictions: "Standard express delivery available",
				},
				{
					country: "India",
					state: "Karnataka",
					district: "Bengaluru Urban",
					city: "Bengaluru",
					locality: "Koramangala",
					pincode: "560034",
					isActive: true,
					deliveryFee: 0,
					minOrderValue: 0,
					freeDeliveryThreshold: 1999,
					estimatedDeliveryDays: "1-2 business days",
					serviceRestrictions: "Standard express delivery available",
				},
				{
					country: "India",
					state: "Delhi",
					district: "New Delhi",
					city: "New Delhi",
					locality: "Connaught Place",
					pincode: "110001",
					isActive: true,
					deliveryFee: 0,
					minOrderValue: 0,
					freeDeliveryThreshold: 1999,
					estimatedDeliveryDays: "2-3 business days",
					serviceRestrictions: "Standard express delivery available",
				},
				{
					country: "India",
					state: "Telangana",
					district: "Hyderabad",
					city: "Hyderabad",
					locality: "Banjara Hills",
					pincode: "500034",
					isActive: true,
					deliveryFee: 0,
					minOrderValue: 0,
					freeDeliveryThreshold: 1999,
					estimatedDeliveryDays: "2-3 business days",
					serviceRestrictions: "Standard express delivery available",
				},
				{
					country: "India",
					state: "Tamil Nadu",
					district: "Chennai",
					city: "Chennai",
					locality: "T. Nagar",
					pincode: "600017",
					isActive: true,
					deliveryFee: 49,
					minOrderValue: 499,
					freeDeliveryThreshold: 1999,
					estimatedDeliveryDays: "2-4 business days",
					serviceRestrictions: "Standard delivery available",
				},
				{
					country: "India",
					state: "West Bengal",
					district: "Kolkata",
					city: "Kolkata",
					locality: "Park Street",
					pincode: "700016",
					isActive: true,
					deliveryFee: 49,
					minOrderValue: 499,
					freeDeliveryThreshold: 1999,
					estimatedDeliveryDays: "3-4 business days",
					serviceRestrictions: "Standard delivery available",
				},
			];
			await ServiceableLocation.insertMany(initialLocations);
			console.log("Initialized default approved serviceable delivery locations");
		}

		isDefaultsEnsured = true;
	} catch (error) {
		console.warn("[INIT WARNING] Database defaults initialization encountered note:", error.message);
		defaultsPromise = null;
	}
	})();

	return defaultsPromise;
};
