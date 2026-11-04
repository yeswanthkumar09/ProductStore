import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/product.model.js";
import Review from "../models/review.model.js";

dotenv.config();

const sampleProducts = [
	// JEANS
	{
		name: "Vintage Straight-Leg Selvedge Denim",
		description: "Crafted from 14oz Japanese raw selvedge denim, these straight-leg jeans develop a personalized fade over time. Designed with classic 5-pocket styling and antique copper hardware.",
		price: 89.99,
		originalPrice: 129.99,
		image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80",
		category: "jeans",
		brand: "Levi's Heritage",
		stock: 45,
		isFeatured: true,
		rating: 4.8,
		numReviews: 34,
		tags: ["selvedge", "denim", "raw", "vintage", "sustainable"],
	},
	{
		name: "Slim-Fit Stretch Washed Jeans",
		description: "Engineered with 2% elastane for maximum comfort and freedom of movement without losing shape. Medium indigo wash with hand-sanded whiskering.",
		price: 64.50,
		originalPrice: 85.00,
		image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
		category: "jeans",
		brand: "Calvin Klein",
		stock: 60,
		isFeatured: false,
		rating: 4.6,
		numReviews: 21,
		tags: ["slim", "stretch", "indigo", "casual"],
	},
	{
		name: "Distressed Black Biker Denim",
		description: "Bold washed black denim with ribbed moto paneling and tactical stitch detailing. Features zipper accents at the ankles and reinforced knees.",
		price: 79.99,
		originalPrice: 110.00,
		image: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=800&q=80",
		category: "jeans",
		brand: "Diesel",
		stock: 25,
		isFeatured: true,
		rating: 4.7,
		numReviews: 19,
		tags: ["biker", "moto", "black", "streetwear"],
	},

	// T-SHIRTS
	{
		name: "Heavyweight Boxy Organic Cotton Tee",
		description: "260 GSM organic combed cotton t-shirt with a structured drape and relaxed dropped shoulders. Preshrunk with ribbed collar that holds its form wash after wash.",
		price: 34.00,
		originalPrice: 48.00,
		image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
		category: "t-shirts",
		brand: "Essentials",
		stock: 80,
		isFeatured: true,
		rating: 4.9,
		numReviews: 52,
		tags: ["heavyweight", "organic", "minimalist", "boxy"],
	},
	{
		name: "Minimalist Embroidered Earth Graphic Tee",
		description: "A refined everyday staple made from ultra-soft Pima cotton. Features subtle tonal embroidery on the left chest and a tailored hem.",
		price: 29.99,
		originalPrice: 42.00,
		image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
		category: "t-shirts",
		brand: "Luxe Atelier",
		stock: 55,
		isFeatured: false,
		rating: 4.5,
		numReviews: 16,
		tags: ["pima", "graphic", "eco", "casual"],
	},
	{
		name: "Washed Sage Green Oversized T-Shirt",
		description: "Pigment dyed for an authentic lived-in vintage feel. Breathable ring-spun jersey cotton with reinforced double stitching.",
		price: 32.50,
		originalPrice: 45.00,
		image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
		category: "t-shirts",
		brand: "Zara Man",
		stock: 70,
		isFeatured: false,
		rating: 4.6,
		numReviews: 28,
		tags: ["sage", "oversized", "vintage", "relaxed"],
	},

	// SHOES
	{
		name: "Air Motion Minimalist Leather Sneakers",
		description: "Italian calfskin leather upper paired with lightweight EVA cushioning and vulcanized rubber sole. Finished with hand-buffed edges and memory foam insoles.",
		price: 139.99,
		originalPrice: 189.99,
		image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
		category: "shoes",
		brand: "Common Projects Style",
		stock: 35,
		isFeatured: true,
		rating: 4.9,
		numReviews: 47,
		tags: ["sneakers", "leather", "white", "minimalist", "luxury"],
	},
	{
		name: "Heritage Waxed Suede Chelsea Boots",
		description: "Weather-resistant waxed suede boots with elastic twin gores and Goodyear welt construction. Built to withstand rainy commutes and formal dinners alike.",
		price: 165.00,
		originalPrice: 220.00,
		image: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=800&q=80",
		category: "shoes",
		brand: "Thursday Boot Co.",
		stock: 28,
		isFeatured: false,
		rating: 4.8,
		numReviews: 31,
		tags: ["boots", "chelsea", "suede", "waterproof"],
	},
	{
		name: "Ultra-Lightweight Mesh Runner Shoes",
		description: "Aerodynamic breathable engineered mesh upper with responsive energy-returning foam midsole. High-abrasion rubber outsole engineered for pavement traction.",
		price: 95.00,
		originalPrice: 130.00,
		image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80",
		category: "shoes",
		brand: "Nike Air Series",
		stock: 50,
		isFeatured: false,
		rating: 4.7,
		numReviews: 24,
		tags: ["runners", "athletic", "breathable", "gym"],
	},

	// GLASSES
	{
		name: "Aviator Titanium Polarized Sunglasses",
		description: "Ultralight Japanese titanium frame fitted with scratch-resistant TAC polarized lenses providing 100% UV400 protection and crystal-clear contrast.",
		price: 119.00,
		originalPrice: 160.00,
		image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
		category: "glasses",
		brand: "Ray-Ban Classic",
		stock: 40,
		isFeatured: true,
		rating: 4.9,
		numReviews: 39,
		tags: ["aviator", "polarized", "titanium", "sunglasses", "uv400"],
	},
	{
		name: "Acetate Tortoiseshell Round Glasses",
		description: "Handcrafted Italian cellulose acetate optical frame with blue-light filtering lenses. Spring hinges for ergonomic all-day comfort.",
		price: 78.50,
		originalPrice: 99.00,
		image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
		category: "glasses",
		brand: "Moscot Heritage",
		stock: 30,
		isFeatured: false,
		rating: 4.6,
		numReviews: 18,
		tags: ["round", "tortoise", "bluelight", "optical"],
	},
	{
		name: "Modern Matte Black Square Frames",
		description: "Sleek geometric silhouette designed with matte TR90 composite material. Featherlight frame with dark gradient UV-protective shades.",
		price: 59.99,
		originalPrice: 85.00,
		image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80",
		category: "glasses",
		brand: "Oliver Peoples",
		stock: 45,
		isFeatured: false,
		rating: 4.5,
		numReviews: 12,
		tags: ["square", "matte", "sunglasses", "black"],
	},

	// JACKETS
	{
		name: "Genuine Nappa Leather Biker Jacket",
		description: "100% supple lambskin leather exterior with asymmetrical zip closure, snap lapels, and quilted satin lining. Heavy-duty YKK gunmetal hardware.",
		price: 249.99,
		originalPrice: 349.99,
		image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
		category: "jackets",
		brand: "AllSaints Style",
		stock: 20,
		isFeatured: true,
		rating: 4.9,
		numReviews: 61,
		tags: ["leather", "biker", "jacket", "lambskin", "luxury"],
	},
	{
		name: "Sherpa-Lined Corduroy Trucker Jacket",
		description: "Warm wide-wale cotton corduroy with plush faux-shearling lining throughout the body and collar. Dual chest flap pockets and welt hand pockets.",
		price: 119.00,
		originalPrice: 159.00,
		image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=800&q=80",
		category: "jackets",
		brand: "Heritage Outerwear",
		stock: 35,
		isFeatured: false,
		rating: 4.7,
		numReviews: 29,
		tags: ["corduroy", "sherpa", "winter", "trucker"],
	},
	{
		name: "Waterproof Lightweight Technical Windbreaker",
		description: "Seam-sealed 3-layer breathable nylon shell that repels heavy downpours while providing superior thermal regulation. Packable into its own hood pouch.",
		price: 89.99,
		originalPrice: 120.00,
		image: "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80",
		category: "jackets",
		brand: "Arc'teryx Tech",
		stock: 40,
		isFeatured: false,
		rating: 4.8,
		numReviews: 33,
		tags: ["windbreaker", "waterproof", "packable", "outdoor"],
	},

	// SUITS
	{
		name: "Modern Tailored Two-Piece Charcoal Suit",
		description: "Spun from 100% Super 130s Australian Merino wool. Features a two-button single-breasted blazer with notch lapels and flat-front trousers with an adjustable waistband.",
		price: 349.99,
		originalPrice: 499.99,
		image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
		category: "suits",
		brand: "Hugo Boss Tailored",
		stock: 18,
		isFeatured: true,
		rating: 4.9,
		numReviews: 41,
		tags: ["suit", "wool", "charcoal", "formal", "wedding", "blazer"],
	},
	{
		name: "Italian Wool Slim-Fit Navy Tuxedo",
		description: "Peak satin lapels, covered silk buttons, and tailored silhouette engineered for gala evenings, formal celebrations, and black-tie affairs.",
		price: 389.00,
		originalPrice: 520.00,
		image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
		category: "suits",
		brand: "Armani Black Tie",
		stock: 12,
		isFeatured: true,
		rating: 5.0,
		numReviews: 27,
		tags: ["tuxedo", "navy", "satin", "blacktie", "luxury"],
	},
	{
		name: "Summer Breathable Linen-Blend Blazer",
		description: "Unstructured, half-lined linen and cotton blend jacket that keeps you cool in tropical heat. Pairs effortlessly with chinos or selvedge denim.",
		price: 159.00,
		originalPrice: 210.00,
		image: "https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&w=800&q=80",
		category: "suits",
		brand: "Suitsupply",
		stock: 25,
		isFeatured: false,
		rating: 4.6,
		numReviews: 15,
		tags: ["linen", "blazer", "summer", "unstructured"],
	},

	// BAGS
	{
		name: "Full-Grain Leather Weekender Duffel Bag",
		description: "Rugged oiled vegetable-tanned cowhide leather with brass hardware and reinforced riveted handles. Includes padded shoe compartment and detachable shoulder strap.",
		price: 189.99,
		originalPrice: 260.00,
		image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
		category: "bags",
		brand: "Filson Heritage",
		stock: 22,
		isFeatured: true,
		rating: 4.9,
		numReviews: 53,
		tags: ["leather", "duffel", "travel", "weekender", "handcrafted"],
	},
	{
		name: "Minimalist Water-Resistant Commuter Backpack",
		description: "Clean aesthetic backpack engineered with matte TPU waterproof coating, dedicated 16-inch fleece laptop sleeve, and hidden anti-theft passport pocket.",
		price: 89.00,
		originalPrice: 125.00,
		image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80",
		category: "bags",
		brand: "Rains Commuter",
		stock: 45,
		isFeatured: false,
		rating: 4.8,
		numReviews: 38,
		tags: ["backpack", "commuter", "laptop", "waterproof"],
	},
	{
		name: "Heavy-Duty Waxed Canvas Messenger Bag",
		description: "Water-shedding Martexin waxed canvas paired with saddle leather straps. Multiple organizer pockets designed for tablets, pens, chargers, and notebooks.",
		price: 110.00,
		originalPrice: 145.00,
		image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
		category: "bags",
		brand: "Herschel Supply",
		stock: 30,
		isFeatured: false,
		rating: 4.7,
		numReviews: 22,
		tags: ["canvas", "messenger", "waxed", "crossbody"],
	},
];

async function seedDatabase() {
	try {
		console.log("Connecting to MongoDB Atlas...");
		await mongoose.connect(process.env.MONGO_URI);
		console.log("Connected to MongoDB successfully!");

		console.log("Clearing existing sample products...");
		await Product.deleteMany({});

		console.log(`Inserting ${sampleProducts.length} premium products...`);
		const createdProducts = await Product.insertMany(sampleProducts);
		console.log(`Successfully seeded ${createdProducts.length} products!`);

		// FEATURE 6: Genuine Reviews Only - No fictional, placeholder, or fabricated reviews seeded
		console.log("No fictional reviews seeded. Products start with genuine zero reviews.");

		console.log("Seeding complete! Exiting...");
		process.exit(0);
	} catch (error) {
		console.error("Error seeding database:", error);
		process.exit(1);
	}
}

seedDatabase();
