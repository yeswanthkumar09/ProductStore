import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History, ShoppingBag, Trash2, ArrowLeft } from "lucide-react";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";
import ProductCard from "../components/ProductCard";
import SkeletonLoader from "../components/SkeletonLoader";
import toast from "react-hot-toast";

const GUEST_HISTORY_KEY = "luxestore_recent_views";

const RecentlyViewedPage = () => {
	const { user } = useUserStore();
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);

	const fetchRecentlyViewed = async () => {
		setLoading(true);
		try {
			if (user) {
				const res = await axios.get("/recommendations/history");
				const items = res.data?.items || [];
				// Extract populated product objects
				const prods = items
					.map((i) => i.product)
					.filter(Boolean);
				// Strictly deduplicate by _id
				const seen = new Set();
				const uniqueProds = [];
				for (const p of prods) {
					if (!seen.has(p._id)) {
						seen.add(p._id);
						uniqueProds.push(p);
					}
				}
				setProducts(uniqueProds);
			} else {
				// Guest history from localStorage
				const savedIds = JSON.parse(localStorage.getItem(GUEST_HISTORY_KEY) || "[]");
				if (savedIds.length > 0) {
					const res = await axios.get("/products");
					const all = res.data?.products || res.data || [];
					const matched = savedIds
						.map((id) => all.find((p) => p._id === id))
						.filter(Boolean);
					const seen = new Set();
					const uniqueProds = [];
					for (const p of matched) {
						if (!seen.has(p._id)) {
							seen.add(p._id);
							uniqueProds.push(p);
						}
					}
					setProducts(uniqueProds);
				} else {
					setProducts([]);
				}
			}
		} catch (error) {
			console.error("Error fetching recently viewed history:", error);
			setProducts([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRecentlyViewed();
	}, [user]);

	const handleRemoveItem = async (productId, e) => {
		e.preventDefault();
		e.stopPropagation();

		try {
			if (user) {
				await axios.delete(`/recommendations/history/${productId}`);
			}
			// Update local storage
			const saved = JSON.parse(localStorage.getItem(GUEST_HISTORY_KEY) || "[]");
			const updated = saved.filter((id) => id !== productId);
			localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(updated));

			setProducts((prev) => prev.filter((p) => p._id !== productId));
			toast.success("Item removed from history");
		} catch (err) {
			toast.error("Failed to remove item");
		}
	};

	const handleClearAll = async () => {
		if (!window.confirm("Are you sure you want to clear your entire browsing history?")) return;

		try {
			if (user) {
				await axios.delete("/recommendations/history");
			}
			localStorage.removeItem(GUEST_HISTORY_KEY);
			setProducts([]);
			toast.success("Browsing history cleared");
		} catch (err) {
			toast.error("Failed to clear browsing history");
		}
	};

	return (
		<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 min-h-[70vh]'>
			{/* Breadcrumb & Header */}
			<div className='mb-6'>
				<Link
					to='/'
					className='inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-950 dark:hover:text-white transition-colors'
				>
					<ArrowLeft size={13} /> Back to Catalog
				</Link>
			</div>

			<div className='flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-neutral-200 dark:border-neutral-800 gap-4'>
				<div>
					<h1 className='text-2xl sm:text-3xl font-black uppercase tracking-wider text-neutral-950 dark:text-white font-heading'>
						Recently Viewed
					</h1>
					<p className='text-xs uppercase tracking-widest text-neutral-500 mt-1'>
						{products.length} {products.length === 1 ? "Item" : "Items"} Viewed in this Session
					</p>
				</div>

				{products.length > 0 && (
					<button
						type='button'
						onClick={handleClearAll}
						className='inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors self-start sm:self-auto'
					>
						<Trash2 size={14} /> Clear All History
					</button>
				)}
			</div>

			{loading ? (
				<SkeletonLoader type='grid' />
			) : products.length === 0 ? (
				<div className='text-center py-20 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8'>
					<History size={44} className='mx-auto text-neutral-300 dark:text-neutral-700 mb-4' />
					<h2 className='text-xl font-black uppercase tracking-tight text-neutral-950 dark:text-white mb-2 font-heading'>
						No Browsing History Found
					</h2>
					<p className='text-neutral-500 text-xs uppercase tracking-wider max-w-md mx-auto mb-6'>
						You haven't viewed any garments recently. Explore our curated collections to view silhouettes and lookbooks.
					</p>
					<Link
						to='/'
						className='inline-flex items-center gap-2 px-8 py-3.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-widest transition-all'
					>
						<ShoppingBag size={16} /> Discover New In
					</Link>
				</div>
			) : (
				<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6'>
					{products.map((product) => (
						<div key={product._id} className='relative group'>
							<ProductCard product={product} />
							{/* Per-item remove button */}
							<button
								type='button'
								onClick={(e) => handleRemoveItem(product._id, e)}
								title='Remove from history'
								className='absolute top-2 right-10 p-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20'
							>
								<Trash2 size={14} />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default RecentlyViewedPage;

