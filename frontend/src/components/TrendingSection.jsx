import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";

const TRENDING_TABS = [
	{ label: "ALL", category: "all" },
	{ label: "SHIRTS", category: "shirts" },
	{ label: "JACKETS", category: "jackets" },
	{ label: "JEANS", category: "jeans" },
	{ label: "SWEATERS", category: "sweaters" },
	{ label: "T-SHIRTS", category: "t-shirts" },
	{ label: "TROUSERS", category: "trousers" },
	{ label: "SUNGLASSES", category: "glasses" },
	{ label: "SHOES", category: "shoes" },
];

const TrendingSection = ({ products = [], loading = false }) => {
	const [activeTab, setActiveTab] = useState("all");

	// Filter products based on active category tab
	const filteredProducts = useMemo(() => {
		if (!Array.isArray(products) || products.length === 0) return [];
		if (activeTab === "all") return products.slice(0, 10);

		const matches = products.filter((p) => {
			const cat = (p.category || "").toLowerCase();
			const tabCat = activeTab.toLowerCase();
			return cat === tabCat || cat.includes(tabCat) || tabCat.includes(cat);
		});

		// Fallback to all if category has no specific match
		return matches.length > 0 ? matches.slice(0, 10) : products.slice(0, 5);
	}, [products, activeTab]);

	return (
		<section className='w-full py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'>
			{/* Section Title Matching Screenshot 4 */}
			<div className='mb-6'>
				<h2 className='text-2xl sm:text-3xl md:text-4xl font-black font-heading uppercase tracking-tight text-neutral-950 dark:text-white'>
					TRENDING
				</h2>
			</div>

			{/* Category Filter Tabs Bar */}
			<div className='flex items-center gap-6 sm:gap-8 overflow-x-auto pb-3 mb-8 border-b border-neutral-200 dark:border-neutral-800 scrollbar-none select-none'>
				{TRENDING_TABS.map((tab) => {
					const isActive = activeTab === tab.category;
					return (
						<button
							key={tab.category}
							type='button'
							onClick={() => setActiveTab(tab.category)}
							className={`relative py-1 text-xs sm:text-sm font-bold tracking-widest uppercase transition-colors whitespace-nowrap ${
								isActive
									? "text-black dark:text-white"
									: "text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
							}`}
						>
							{tab.label}
							{isActive && (
								<span className='absolute bottom-0 left-0 right-0 h-[2px] bg-black dark:bg-white -mb-[13px]' />
							)}
						</button>
					);
				})}
			</div>

			{/* Responsive Product Grid (Matching Screenshot 4) */}
			{loading && filteredProducts.length === 0 ? (
				<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6'>
					{[1, 2, 3, 4, 5].map((n) => (
						<div key={n} className='aspect-[3/4] bg-neutral-100 dark:bg-neutral-900 animate-pulse' />
					))}
				</div>
			) : filteredProducts.length === 0 ? (
				<div className='py-16 text-center text-neutral-400 text-sm'>
					No items currently available in this department.
				</div>
			) : (
				<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5 md:gap-6'>
					{filteredProducts.map((product) => (
						<ProductCard key={product._id} product={product} />
					))}
				</div>
			)}

			{/* Underline Shop All Action Link */}
			<div className='mt-10 text-center'>
				<Link
					to='/search'
					className='inline-block text-xs font-bold uppercase tracking-widest text-neutral-950 dark:text-white underline underline-offset-4 hover:opacity-70 transition-opacity'
				>
					VIEW ALL TRENDING STYLES
				</Link>
			</div>
		</section>
	);
};

export default TrendingSection;

