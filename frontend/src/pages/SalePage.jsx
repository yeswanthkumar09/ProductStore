import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Flame, Clock, Sparkles, SlidersHorizontal, ArrowLeft } from "lucide-react";
import axios from "../lib/axios";
import ProductCard from "../components/ProductCard";
import SkeletonLoader from "../components/SkeletonLoader";

const SalePage = () => {
	const { id } = useParams();
	const [sale, setSale] = useState(null);
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [sortBy, setSortBy] = useState("discount");

	const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

	useEffect(() => {
		const fetchSaleData = async () => {
			try {
				setLoading(true);
				if (id) {
					const res = await axios.get(`/sales/${id}`);
					setSale(res.data.sale);
					setProducts(res.data.products || []);
				} else {
					// Fetch first active sale
					const activeRes = await axios.get("/sales/active");
					if (activeRes.data?.length > 0) {
						const primarySale = activeRes.data[0];
						const detailsRes = await axios.get(`/sales/${primarySale._id}`);
						setSale(detailsRes.data.sale);
						setProducts(detailsRes.data.products || []);
					}
				}
			} catch (err) {
				console.error("Error fetching sale page:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchSaleData();
	}, [id]);

	// Live Countdown Timer
	useEffect(() => {
		if (!sale?.endDate) return;

		const calculateTime = () => {
			const difference = new Date(sale.endDate) - new Date();
			if (difference <= 0) {
				setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
				return;
			}
			const days = Math.floor(difference / (1000 * 60 * 60 * 24));
			const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
			const minutes = Math.floor((difference / 1000 / 60) % 60);
			const seconds = Math.floor((difference / 1000) % 60);
			setTimeLeft({ days, hours, minutes, seconds });
		};

		calculateTime();
		const interval = setInterval(calculateTime, 1000);
		return () => clearInterval(interval);
	}, [sale]);

	if (loading) {
		return (
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				<SkeletonLoader type='grid' />
			</div>
		);
	}

	if (!sale) {
		return (
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center'>
				<Flame size={48} className='mx-auto text-amber-500 mb-4 animate-bounce' />
				<h2 className='text-3xl font-extrabold text-white'>No Active Sale at the Moment</h2>
				<p className='text-gray-400 mt-2 text-sm'>
					Check back soon or explore our latest new arrivals and popular collections.
				</p>
				<Link
					to='/'
					className='inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold text-sm shadow-md'
				>
					<ArrowLeft size={16} /> Return to Store
				</Link>
			</div>
		);
	}

	// Filter and sort products
	const categories = ["all", ...new Set(products.map((p) => p.category).filter(Boolean))];

	let filteredProducts = products.filter((p) =>
		selectedCategory === "all" ? true : p.category === selectedCategory
	);

	if (sortBy === "price-low") {
		filteredProducts.sort((a, b) => a.price - b.price);
	} else if (sortBy === "price-high") {
		filteredProducts.sort((a, b) => b.price - a.price);
	} else if (sortBy === "rating") {
		filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
	}

	return (
		<div className='min-h-screen py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
			{/* Breadcrumb */}
			<div className='mb-6'>
				<Link
					to='/'
					className='inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-950 dark:hover:text-white transition-colors'
				>
					<ArrowLeft size={13} /> Back to Catalog
				</Link>
			</div>

			{/* Hero Campaign Header */}
			<div className='relative border border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-white p-8 sm:p-14 mb-12 shadow-sm'>
				<div className='max-w-2xl'>
					<div className='inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest mb-4'>
						<span>{sale.badgeText || "EDITORIAL EVENT"}</span>
					</div>
					<h1 className='text-3xl sm:text-5xl md:text-6xl font-black text-white font-heading tracking-tight uppercase leading-none'>
						{sale.name}
					</h1>
					<p className='text-xs sm:text-sm text-neutral-300 uppercase tracking-widest mt-3 leading-relaxed'>
						{sale.description || "Limited seasonal reductions across top outerwear, knitwear, and essential tailoring."}
					</p>

					{/* Live Countdown in Header */}
					<div className='mt-8 pt-6 border-t border-neutral-800 flex items-center gap-4 flex-wrap'>
						<div className='flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400'>
							<Clock size={14} /> Offer Concludes In:
						</div>
						<div className='flex items-center gap-2'>
							<div className='px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-center min-w-[50px]'>
								<span className='block text-base font-black text-white font-mono'>
									{String(timeLeft.days).padStart(2, "0")}
								</span>
								<span className='text-[8px] uppercase font-bold text-neutral-400'>Days</span>
							</div>
							<span className='font-bold text-neutral-600'>:</span>
							<div className='px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-center min-w-[50px]'>
								<span className='block text-base font-black text-white font-mono'>
									{String(timeLeft.hours).padStart(2, "0")}
								</span>
								<span className='text-[8px] uppercase font-bold text-neutral-400'>Hours</span>
							</div>
							<span className='font-bold text-neutral-600'>:</span>
							<div className='px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-center min-w-[50px]'>
								<span className='block text-base font-black text-white font-mono'>
									{String(timeLeft.minutes).padStart(2, "0")}
								</span>
								<span className='text-[8px] uppercase font-bold text-neutral-400'>Mins</span>
							</div>
							<span className='font-bold text-neutral-600'>:</span>
							<div className='px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-center min-w-[50px]'>
								<span className='block text-base font-black text-white font-mono'>
									{String(timeLeft.seconds).padStart(2, "0")}
								</span>
								<span className='text-[8px] uppercase font-bold text-neutral-400'>Secs</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Filter & Sorting Controls */}
			<div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-neutral-200 dark:border-neutral-800'>
				{/* Category Tabs */}
				<div className='flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-1'>
					{categories.map((cat) => (
						<button
							key={cat}
							onClick={() => setSelectedCategory(cat)}
							className={`text-xs font-black uppercase tracking-widest whitespace-nowrap pb-1 border-b-2 transition-all ${
								selectedCategory === cat
									? "text-neutral-950 dark:text-white border-neutral-950 dark:border-white"
									: "text-neutral-400 border-transparent hover:text-neutral-700 dark:hover:text-neutral-200"
							}`}
						>
							{cat}
						</button>
					))}
				</div>

				{/* Sort Dropdown */}
				<div className='flex items-center gap-2'>
					<SlidersHorizontal size={13} className='text-neutral-400' />
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
						className='bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 text-xs font-semibold px-3 py-2 focus:outline-none'
					>
						<option value='discount'>Curated Event Deals</option>
						<option value='price-low'>Price: Low to High</option>
						<option value='price-high'>Price: High to Low</option>
						<option value='rating'>Highest Customer Rating</option>
					</select>
				</div>
			</div>

			{/* Products Showcase */}
			{filteredProducts.length === 0 ? (
				<div className='p-16 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'>
					<p className='text-xs uppercase tracking-widest'>No garments found matching this selection.</p>
				</div>
			) : (
				<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6'>
					{filteredProducts.map((product) => (
						<ProductCard key={product._id} product={product} />
					))}
				</div>
			)}
		</div>
	);
};

export default SalePage;
