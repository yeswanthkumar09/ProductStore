import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import ProductCard from "../components/ProductCard";
import SkeletonLoader from "../components/SkeletonLoader";
import CustomSortDropdown from "../components/CustomSortDropdown";

const SearchPage = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const initialQuery = searchParams.get("q") || "";
	const [searchInput, setSearchInput] = useState(initialQuery);
	const [category, setCategory] = useState(searchParams.get("category") || "all");
	const [sort, setSort] = useState(searchParams.get("sort") || "newest");
	const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
	const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
	const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

	const { products, searchProducts, loading, total, pages } = useProductStore();
	const { categories: storeCategories, fetchCategories } = useCategoryStore();

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	const categories = [
		"all",
		...(storeCategories && storeCategories.length > 0
			? storeCategories.filter((c) => !c.isArchived).map((c) => c.slug)
			: ["shirts", "t-shirts", "trousers", "jeans", "jackets", "suits", "shoes", "glasses", "bags"]),
	];

	// Keep input in sync with search params from navbar
	useEffect(() => {
		setSearchInput(searchParams.get("q") || "");
		setCategory(searchParams.get("category") || "all");
		setSort(searchParams.get("sort") || "newest");
		setPage(Number(searchParams.get("page")) || 1);
	}, [searchParams]);

	const runSearch = useCallback(() => {
		const currentQ = searchParams.get("q") || "";
		const currentCat = searchParams.get("category") || "all";
		const currentSort = searchParams.get("sort") || "newest";
		const currentPage = Number(searchParams.get("page")) || 1;

		const params = { page: currentPage };
		if (currentQ) params.q = currentQ;
		if (currentCat && currentCat !== "all") params.category = currentCat;
		if (currentSort) params.sort = currentSort;
		if (minPrice) params.minPrice = minPrice;
		if (maxPrice) params.maxPrice = maxPrice;

		searchProducts(params);
	}, [searchParams, minPrice, maxPrice, searchProducts]);

	useEffect(() => {
		runSearch();
	}, [runSearch]);

	const handleFormSubmit = (e) => {
		e.preventDefault();
		const newParams = new URLSearchParams(searchParams);
		if (searchInput.trim()) {
			newParams.set("q", searchInput.trim());
		} else {
			newParams.delete("q");
		}
		newParams.set("page", "1");
		setSearchParams(newParams);
	};

	const clearSearch = () => {
		setSearchInput("");
		const newParams = new URLSearchParams(searchParams);
		newParams.delete("q");
		newParams.set("page", "1");
		setSearchParams(newParams);
	};

	const updateFilter = (key, value) => {
		const newParams = new URLSearchParams(searchParams);
		if (value && value !== "all") {
			newParams.set(key, value);
		} else {
			newParams.delete(key);
		}
		newParams.set("page", "1");
		setSearchParams(newParams);
	};

	const handlePageChange = (newPage) => {
		const newParams = new URLSearchParams(searchParams);
		newParams.set("page", newPage.toString());
		setSearchParams(newParams);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<div className='min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12'>
				{/* Top Search Bar */}
				<div className='mb-8 max-w-2xl mx-auto'>
					<form onSubmit={handleFormSubmit} className='relative flex items-center border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900'>
						<Search className='ml-3.5 text-neutral-400' size={18} />
						<input
							type='text'
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder='Search catalog (e.g. linen, raw denim, overshirt, boots)...'
							className='w-full bg-transparent text-neutral-950 dark:text-white placeholder-neutral-400 px-3.5 py-3 text-sm focus:outline-none'
						/>
						{searchInput && (
							<button
								type='button'
								onClick={clearSearch}
								className='text-neutral-400 hover:text-black dark:hover:text-white px-2'
							>
								<X size={16} />
							</button>
						)}
						<button
							type='submit'
							className='px-6 py-3 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity shrink-0'
						>
							Search
						</button>
					</form>
				</div>

				{/* Category Filter Tabs Bar */}
				<div className='flex items-center gap-6 sm:gap-8 overflow-x-auto pb-3 mb-6 border-b border-neutral-200 dark:border-neutral-800 scrollbar-none select-none'>
					{categories.map((cat) => {
						const isActive = category === cat;
						return (
							<button
								key={cat}
								type='button'
								onClick={() => {
									setCategory(cat);
									updateFilter("category", cat);
								}}
								className={`relative py-1 text-xs font-bold tracking-widest uppercase transition-colors whitespace-nowrap ${
									isActive
										? "text-black dark:text-white"
										: "text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
								}`}
							>
								{cat}
								{isActive && (
									<span className='absolute bottom-0 left-0 right-0 h-[2px] bg-black dark:bg-white -mb-[13px]' />
								)}
							</button>
						);
					})}
				</div>

				{/* Summary Row: Count & Sorting */}
				<div className='flex items-center justify-between gap-4 pb-6 mb-6 select-none'>
					<p className='text-xs font-bold uppercase tracking-wider text-neutral-500'>
						{total > 0 ? (
							<>
								Found <strong className='text-black dark:text-white'>{total}</strong> items
								{searchParams.get("q") && <span> for &quot;{searchParams.get("q")}&quot;</span>}
							</>
						) : loading ? (
							"Searching catalog..."
						) : (
							"No items found"
						)}
					</p>

					<CustomSortDropdown
						value={sort}
						onChange={(val) => {
							setSort(val);
							updateFilter("sort", val);
						}}
					/>
				</div>

				{/* Products Grid */}
				{loading ? (
					<SkeletonLoader type='card' count={8} />
				) : products.length === 0 ? (
					<div className='text-center py-24 border border-dashed border-neutral-200 dark:border-neutral-800 p-8'>
						<SlidersHorizontal size={40} className='mx-auto text-neutral-300 mb-4' />
						<h3 className='text-lg font-bold uppercase tracking-tight text-neutral-900 dark:text-white mb-2 font-heading'>
							No styles match your query
						</h3>
						<p className='text-xs text-neutral-500 max-w-sm mx-auto mb-6'>
							Try adjusting your search terms or exploring all available categories.
						</p>
						<button
							onClick={clearSearch}
							className='px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity'
						>
							Reset Filters
						</button>
					</div>
				) : (
					<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5 md:gap-6'>
						{products.map((product) => (
							<ProductCard key={product._id} product={product} />
						))}
					</div>
				)}

				{/* Minimal Pagination */}
				{pages > 1 && (
					<div className='mt-14 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-bold uppercase tracking-wider select-none'>
						<button
							disabled={page <= 1}
							onClick={() => handlePageChange(page - 1)}
							className='inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-300 dark:border-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed hover:border-black dark:hover:border-white transition-colors'
						>
							<ChevronLeft size={14} /> Previous
						</button>
						<span className='text-neutral-500'>
							Page {page} of {pages}
						</span>
						<button
							disabled={page >= pages}
							onClick={() => handlePageChange(page + 1)}
							className='inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-300 dark:border-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed hover:border-black dark:hover:border-white transition-colors'
						>
							Next <ChevronRight size={14} />
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default SearchPage;
