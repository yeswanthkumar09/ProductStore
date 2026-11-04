import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import axios from "../lib/axios";

const RecommendationsSection = () => {
	const [recommendations, setRecommendations] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchRecommendations = async () => {
			try {
				const res = await axios.get("/recommendations");
				setRecommendations(res.data || []);
			} catch (err) {
				console.error("Error fetching recommendations:", err);
			} finally {
				setLoading(false);
			}
		};
		fetchRecommendations();
	}, []);

	if (loading) {
		return (
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				<div className='h-6 w-48 bg-neutral-200 dark:bg-neutral-800 animate-pulse mb-6' />
				<div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className='aspect-[3/4] bg-neutral-100 dark:bg-neutral-900 animate-pulse' />
					))}
				</div>
			</div>
		);
	}

	if (!recommendations || recommendations.length === 0) return null;

	return (
		<section className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14'>
			{/* Section Header */}
			<div className='flex items-end justify-between mb-8 pb-3 border-b border-neutral-200 dark:border-neutral-800 gap-4'>
				<div>
					<p className='text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-1'>
						Tailored Selections
					</p>
					<h2 className='text-xl sm:text-2xl md:text-3xl font-black font-heading uppercase tracking-tight text-neutral-950 dark:text-white'>
						RECOMMENDED FOR YOU
					</h2>
				</div>
				<Link
					to='/search'
					className='text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-white underline underline-offset-4 hover:opacity-70 transition-opacity'
				>
					VIEW ALL
				</Link>
			</div>

			{/* Products Grid */}
			<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5 md:gap-6'>
				{recommendations.slice(0, 5).map((product) => (
					<ProductCard key={product._id} product={product} />
				))}
			</div>
		</section>
	);
};

export default RecommendationsSection;
