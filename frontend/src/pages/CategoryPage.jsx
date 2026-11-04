import { useEffect, useState, useCallback } from "react";
import { useProductStore } from "../stores/useProductStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, ShoppingBag, AlertCircle, RefreshCw } from "lucide-react";
import ProductCard from "../components/ProductCard";
import SkeletonLoader from "../components/SkeletonLoader";
import CustomSortDropdown from "../components/CustomSortDropdown";

const CategoryPage = () => {
	const { fetchProductsByCategory, products, loading, error, total } = useProductStore();
	const { categories, fetchCategories } = useCategoryStore();
	const { category } = useParams();
	const [searchParams, setSearchParams] = useSearchParams();

	const activeSubcategory = searchParams.get("subcategory") || "";
	const [sort, setSort] = useState("newest");

	// Safely clean and normalize category parameter string
	const categorySlug = typeof category === "string" ? category.toLowerCase().trim() : "";

	// Find the current category object from the store safely
	const currentCatDoc = Array.isArray(categories)
		? categories.find((c) => c && typeof c.slug === "string" && c.slug === categorySlug)
		: null;

	const subcategoriesList = Array.isArray(currentCatDoc?.subcategories)
		? currentCatDoc.subcategories.filter((s) => s && s.isActive && typeof s.slug === "string")
		: [];

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	const loadProducts = useCallback(() => {
		const params = { sort };
		if (activeSubcategory) params.subcategory = activeSubcategory;
		fetchProductsByCategory(categorySlug, params);
	}, [categorySlug, sort, activeSubcategory, fetchProductsByCategory]);

	useEffect(() => {
		loadProducts();
	}, [loadProducts]);

	const handleSelectSubcategory = (subSlug) => {
		const newParams = new URLSearchParams(searchParams);
		if (!subSlug || subSlug === "all") {
			newParams.delete("subcategory");
		} else {
			newParams.set("subcategory", subSlug);
		}
		setSearchParams(newParams);
	};

	// Guaranteed string properties for all category metadata
	const categoryTitle =
		(typeof currentCatDoc?.name === "string" && currentCatDoc.name.trim()) ||
		(categorySlug ? categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1) : "Collection");

	const parentCategoryText =
		typeof currentCatDoc?.parentCategory === "string" && currentCatDoc.parentCategory.trim()
			? currentCatDoc.parentCategory
			: "MEN'S FASHION";

	const totalItemsCount = typeof total === "number" ? total : Array.isArray(products) ? products.length : 0;

	const categoryDescription =
		typeof currentCatDoc?.description === "string" && currentCatDoc.description.trim()
			? currentCatDoc.description
			: `${totalItemsCount} available styles in ${categoryTitle}`;

	const normalizedProductsList = Array.isArray(products) ? products : [];

	return (
		<div className='min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12'>
				{/* Editorial Breadcrumbs */}
				<nav className='flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-6'>
					<Link to='/' className='hover:text-black dark:hover:text-white transition-colors'>
						Home
					</Link>
					<ChevronRight size={12} />
					<span>Categories</span>
					<ChevronRight size={12} />
					<Link
						to={`/category/${categorySlug}`}
						onClick={() => handleSelectSubcategory("all")}
						className={!activeSubcategory ? "text-neutral-900 dark:text-white" : "hover:text-black dark:hover:text-white"}
					>
						{categoryTitle}
					</Link>
					{activeSubcategory && (
						<>
							<ChevronRight size={12} />
							<span className='text-accent font-bold capitalize'>
								{(() => {
									const matched = subcategoriesList.find((s) => s.slug === activeSubcategory);
									return typeof matched?.name === "string" ? matched.name : activeSubcategory;
								})()}
							</span>
						</>
					)}
				</nav>

				{/* Category Header */}
				<div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800 mb-6'>
					<div>
						<div className='text-[10px] font-bold uppercase tracking-widest text-accent mb-1'>
							{parentCategoryText}
						</div>
						<h1 className='text-3xl sm:text-4xl md:text-5xl font-black font-heading uppercase tracking-tight text-neutral-950 dark:text-white'>
							{categoryTitle}
						</h1>
						<p className='text-xs text-neutral-500 mt-1 max-w-xl'>
							{categoryDescription}
						</p>
					</div>

					{/* Sorting Dropdown */}
					<div className='flex items-center gap-3'>
						<span className='text-xs text-neutral-500 font-mono hidden sm:inline'>
							{totalItemsCount} Items
						</span>
						<CustomSortDropdown value={sort} onChange={setSort} />
					</div>
				</div>

				{/* Dynamic Subcategories Navigation Bar */}
				{subcategoriesList.length > 0 && (
					<div className='flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar'>
						<button
							type='button'
							onClick={() => handleSelectSubcategory("all")}
							className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 border ${
								!activeSubcategory
									? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-md font-bold"
									: "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:text-black dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-600 font-medium"
							}`}
						>
							All {categoryTitle}
						</button>
						{subcategoriesList.map((sub) => {
							const isSelected = activeSubcategory === sub.slug;
							const subNameText = typeof sub.name === "string" ? sub.name : sub.slug;
							return (
								<button
									key={sub.slug || Math.random()}
									type='button'
									onClick={() => handleSelectSubcategory(sub.slug)}
									className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shrink-0 border ${
										isSelected
											? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-md font-bold"
											: "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:text-black dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-600 font-medium"
									}`}
								>
									{subNameText}
								</button>
							);
						})}
					</div>
				)}

				{/* Four Independent States: 1) Loading, 2) API Error, 3) Empty Results, 4) Products Grid */}
				{loading ? (
					<SkeletonLoader type='card' count={8} />
				) : error ? (
					/* Independent State 2: API Failure State */
					<div className='text-center py-20 px-6 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 rounded-3xl max-w-xl mx-auto'>
						<div className='w-12 h-12 mx-auto mb-4 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-500'>
							<AlertCircle size={22} />
						</div>
						<h2 className='text-xl sm:text-2xl font-bold uppercase tracking-tight text-neutral-950 dark:text-white mb-2 font-heading'>
							Unable to Load {categoryTitle}
						</h2>
						<p className='text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed'>
							{typeof error === "object" ? error?.message || "An error occurred while fetching products." : String(error)}
						</p>
						<div className='flex items-center justify-center gap-3'>
							<button
								type='button'
								onClick={loadProducts}
								className='inline-flex items-center gap-1.5 px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider hover:opacity-85 transition-opacity rounded-xl shadow-sm'
							>
								<RefreshCw size={13} />
								<span>Try Again</span>
							</button>
							<Link
								to='/'
								className='inline-block px-6 py-2.5 border border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white text-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider transition-colors rounded-xl'
							>
								Return to Home
							</Link>
						</div>
					</div>
				) : normalizedProductsList.length === 0 ? (
					/* Independent State 3: Empty Products Results */
					<div className='text-center py-24 border border-dashed border-neutral-200 dark:border-neutral-800 p-8 rounded-3xl'>
						<ShoppingBag size={40} className='mx-auto text-neutral-400 dark:text-neutral-600 mb-4' />
						<h2 className='text-xl font-bold uppercase tracking-tight text-neutral-900 dark:text-white mb-2 font-heading'>
							No products in {categoryTitle} {activeSubcategory ? `(${activeSubcategory})` : ""} yet
						</h2>
						<p className='text-neutral-500 text-xs max-w-sm mx-auto mb-6'>
							We are restocking this collection with new bespoke designs. Explore other departments or return home.
						</p>
						<Link
							to='/'
							className='inline-block px-7 py-3 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity rounded-xl'
						>
							Return to Home
						</Link>
					</div>
				) : (
					/* Independent State 4: Products Cards Grid */
					<motion.div
						className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5 md:gap-6'
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.35 }}
					>
						{normalizedProductsList.map((product) => (
							<ProductCard key={product?._id || Math.random()} product={product} />
						))}
					</motion.div>
				)}
			</div>
		</div>
	);
};

export default CategoryPage;
