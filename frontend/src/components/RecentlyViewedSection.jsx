import { useState, useEffect } from "react";
import { Clock, Trash2 } from "lucide-react";
import axios from "../lib/axios";
import ProductCard from "./ProductCard";
import { useUserStore } from "../stores/useUserStore";

const RecentlyViewedSection = ({ excludeProductId = null }) => {
	const { user } = useUserStore();
	const [recentProducts, setRecentProducts] = useState([]);
	const [loading, setLoading] = useState(true);

	const loadHistory = async () => {
		try {
			if (user) {
				const res = await axios.get("/recommendations/history");
				const rawItems = (res.data?.items || [])
					.map((i) => i.product)
					.filter(Boolean)
					.filter((p) => p._id !== excludeProductId);
				// Strictly deduplicate by product _id to prevent duplicate cards
				const seen = new Set();
				const uniqueItems = [];
				for (const item of rawItems) {
					const id = item._id ? item._id.toString() : "";
					if (id && !seen.has(id)) {
						seen.add(id);
						uniqueItems.push(item);
					}
				}
				setRecentProducts(uniqueItems.slice(0, 6));
			} else {
				const localIds = JSON.parse(
					localStorage.getItem("luxestore_recent_views") ||
					localStorage.getItem("recent_viewed_products") ||
					"[]"
				);
				const uniqueLocalIds = Array.from(new Set(localIds)).filter((id) => id !== excludeProductId).slice(0, 6);
				if (uniqueLocalIds.length > 0) {
					const res = await axios.get(`/products?limit=50`);
					const all = res.data?.products || [];
					const matched = uniqueLocalIds
						.map((fId) => all.find((p) => p._id === fId))
						.filter(Boolean);
					setRecentProducts(matched);
				} else {
					setRecentProducts([]);
				}
			}
		} catch (err) {
			console.error("Error loading recently viewed items:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadHistory();
	}, [user, excludeProductId]);

	const handleClearHistory = async () => {
		try {
			if (user) {
				await axios.delete("/recommendations/history");
			}
			localStorage.removeItem("recent_viewed_products");
			setRecentProducts([]);
		} catch (e) {
			console.error("Error clearing history:", e);
		}
	};

	if (loading || recentProducts.length === 0) return null;

	return (
		<section className='mt-16 pt-12 border-t border-neutral-100 dark:border-neutral-800'>
			<div className='flex items-center justify-between mb-8'>
				<div>
					<div className='flex items-center gap-2'>
						<Clock size={16} className='text-[#e05338]' />
						<span className='text-[10px] font-extrabold uppercase tracking-widest text-neutral-400'>
							Personalized Browsing History
						</span>
					</div>
					<h3 className='text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900 dark:text-white mt-0.5'>
						Recently Viewed
					</h3>
				</div>

				<button
					type='button'
					onClick={handleClearHistory}
					className='text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-rose-500 transition-colors flex items-center gap-1.5'
				>
					<Trash2 size={13} />
					<span>Clear History</span>
				</button>
			</div>

			<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6'>
				{recentProducts.map((product) => (
					<ProductCard key={product._id} product={product} />
				))}
			</div>
		</section>
	);
};

export default RecentlyViewedSection;

