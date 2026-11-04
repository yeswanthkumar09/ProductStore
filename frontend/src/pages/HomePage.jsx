import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Zap, Truck, RotateCcw } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import { useCmsStore } from "../stores/useCmsStore";
import EditorialHeroCarousel from "../components/EditorialHeroCarousel";
import EditorialCategoryShowcase from "../components/EditorialCategoryShowcase";
import EditorialPhotoshootTrio from "../components/EditorialPhotoshootTrio";
import TrendingSection from "../components/TrendingSection";
import axios from "../lib/axios";

const HomePage = () => {
	const { fetchFeaturedProducts, featuredProducts, products, searchProducts, loading } = useProductStore();
	const { categories, fetchCategories } = useCategoryStore();
	const { publishedSections, fetchPublishedSections } = useCmsStore();
	const [activeSales, setActiveSales] = useState([]);

	useEffect(() => {
		fetchFeaturedProducts();
		fetchCategories();
		fetchPublishedSections();
		searchProducts({ limit: 30 });

		// Fetch active sale campaigns from backend
		axios
			.get("/sales/active")
			.then((res) => setActiveSales(res.data || []))
			.catch(() => { });
	}, [fetchFeaturedProducts, fetchCategories, fetchPublishedSections, searchProducts]);

	const allStoreProducts =
		Array.isArray(products) && products.length > 0
			? products
			: Array.isArray(featuredProducts)
				? featuredProducts
				: [];

	const sectionsArray = Array.isArray(publishedSections?.homepage_sections?.data?.sections)
		? publishedSections.homepage_sections.data.sections
		: [];

	const isEnabled = (id, fallback = true) => {
		if (!sectionsArray.length) return fallback;
		const found = sectionsArray.find((s) => s && s.id === id);
		return found ? found.enabled !== false : fallback;
	};

	return (
		<div className='relative min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors'>
			{/* SECTION A: EDITORIAL HERO CAROUSEL */}
			{isEnabled("hero_carousel") && <EditorialHeroCarousel activeSales={activeSales} />}

			{/* SECTION B: SHOP BY CATEGORY */}
			{isEnabled("categories_rail") && <EditorialCategoryShowcase categories={categories} />}

			{/* SECTION C: TRENDING / BESTSELLERS */}
			{isEnabled("bestsellers_grid") && <TrendingSection products={allStoreProducts} loading={loading} />}

			{/* SECTION D: EDITORIAL PHOTOSHOOT TRIO */}
			{isEnabled("new_arrivals_grid") && <EditorialPhotoshootTrio />}

			{/* PROMOTIONAL BRAND STATEMENT & VOUCHER BANNER */}
			<section className='w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'>
				<div className='border border-neutral-200 dark:border-neutral-800 p-8 sm:p-14 bg-neutral-50 dark:bg-neutral-900/60 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left'>
					<div className='max-w-xl'>
						<p className='text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500 mb-2'>
							Welcome Privilege
						</p>
						<h3 className='text-2xl sm:text-3xl font-black font-heading uppercase tracking-tight text-neutral-950 dark:text-white'>
							Get 10% Off Your First Order
						</h3>
						<p className='text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed'>
							Use code <strong className='font-mono font-bold text-black dark:text-white bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5'>WELCOME10</strong> at checkout to unlock savings on our curated tailoring, raw denim, and footwear collections.
						</p>
					</div>
					<div className='shrink-0'>
						<Link
							to='/search'
							className='inline-flex items-center gap-2 px-8 py-4 bg-black text-white dark:bg-white dark:text-black hover:opacity-85 text-xs font-bold uppercase tracking-widest transition-all'
						>
							<span>Explore Catalog</span>
							<ArrowRight size={14} />
						</Link>
					</div>
				</div>
			</section>

			{/* BRAND PILLARS / VALUE PROPOSITIONS */}
			{isEnabled("brand_pillars") && (
				<section className='w-full border-t border-neutral-200 dark:border-neutral-800 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'>
					<div className='grid grid-cols-2 md:grid-cols-4 gap-6 text-center select-none'>
						<div className='flex flex-col items-center gap-2'>
							<Zap size={20} className='text-neutral-800 dark:text-neutral-200' />
							<h4 className='text-xs font-bold uppercase tracking-wider text-neutral-950 dark:text-white'>
								Same-Day Dispatch
							</h4>
							<p className='text-[11px] text-neutral-500'>
								Fast courier fulfillment across India
							</p>
						</div>
						<div className='flex flex-col items-center gap-2'>
							<ShieldCheck size={20} className='text-neutral-800 dark:text-neutral-200' />
							<h4 className='text-xs font-bold uppercase tracking-wider text-neutral-950 dark:text-white'>
								100% Certified Authentic
							</h4>
							<p className='text-[11px] text-neutral-500'>
								Pure virgin wools, raw selvedge & calfskin
							</p>
						</div>
						<div className='flex flex-col items-center gap-2'>
							<Truck size={20} className='text-neutral-800 dark:text-neutral-200' />
							<h4 className='text-xs font-bold uppercase tracking-wider text-neutral-950 dark:text-white'>
								Complimentary Delivery
							</h4>
							<p className='text-[11px] text-neutral-500'>
								On all prepaid orders over ₹1,999
							</p>
						</div>
						<div className='flex flex-col items-center gap-2'>
							<RotateCcw size={20} className='text-neutral-800 dark:text-neutral-200' />
							<h4 className='text-xs font-bold uppercase tracking-wider text-neutral-950 dark:text-white'>
								7-Day Exchanges
							</h4>
							<p className='text-[11px] text-neutral-500'>
								Effortless doorstep size swaps
							</p>
						</div>
					</div>
				</section>
			)}
		</div>
	);
};

export default HomePage;
