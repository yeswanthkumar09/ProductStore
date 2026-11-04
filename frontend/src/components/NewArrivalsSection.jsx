import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ShoppingCart, ArrowRight, Eye, Star } from "lucide-react";
import axios from "../lib/axios";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import { extractProductColors } from "./ProductColorSelector";
import toast from "react-hot-toast";

const NewArrivalsSection = () => {
	const [newArrivals, setNewArrivals] = useState([]);
	const [loading, setLoading] = useState(true);
	const { addToCart } = useCartStore();
	const { user } = useUserStore();
	const navigate = useNavigate();

	useEffect(() => {
		const fetchNewArrivals = async () => {
			try {
				const res = await axios.get("/products/new-arrivals");
				setNewArrivals(res.data || []);
			} catch (err) {
				console.error("Error fetching new arrivals:", err);
			} finally {
				setLoading(false);
			}
		};
		fetchNewArrivals();
	}, []);

	if (loading) {
		return (
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				<div className='h-8 w-48 bg-gray-800 rounded-lg animate-pulse mb-8' />
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className='bg-gray-900/60 rounded-3xl h-80 animate-pulse border border-gray-800' />
					))}
				</div>
			</div>
		);
	}

	if (!newArrivals || newArrivals.length === 0) return null;

	const handleAddToCart = (product, e) => {
		e.preventDefault();
		e.stopPropagation();
		if (product.stock === 0) {
			toast.error("Product is currently out of stock");
			return;
		}

		// If product has variants, pick the first available variant
		const variant = product.variants?.[0];
		addToCart(product, {
			variantId: variant?._id,
			selectedColor: variant?.color?.name,
			selectedSize: variant?.size,
			quantity: 1,
		});
	};

	return (
		<section className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
			{/* Section Header */}
			<div className='flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4'>
				<div>
					<div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2'>
						<Sparkles size={13} className='text-emerald-400' />
						<span>Just Dropped</span>
					</div>
					<h2 className='text-3xl sm:text-4xl font-black text-white font-heading tracking-tight'>
						New Arrivals
					</h2>
					<p className='text-gray-400 text-sm mt-1'>
						The latest drops fresh off our design studios and artisanal workshops
					</p>
				</div>
				<Link
					to='/search'
					className='inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline uppercase tracking-wider'
				>
					View All Products <ArrowRight size={14} />
				</Link>
			</div>

			{/* Products Grid */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
				{newArrivals.slice(0, 8).map((product) => {
					const hasDiscount = product.originalPrice && product.originalPrice > product.price;
					const discountPercent = hasDiscount
						? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
						: 0;

					// Available color swatches
					const colors = extractProductColors(product);

					return (
						<div
							key={product._id}
							className='group relative bg-gray-900/60 rounded-3xl border border-gray-800 hover:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col'
						>
							{/* Image Container */}
							<div className='relative aspect-square w-full overflow-hidden bg-gray-950 flex items-center justify-center p-4'>
								<img
									src={product.image || product.images?.[0] || "/placeholder.png"}
									alt={product.name}
									className='w-full h-full object-contain group-hover:scale-105 transition-transform duration-500'
								/>

								{/* Badge: NEW ARRIVAL */}
								<span className='absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-md'>
									NEW
								</span>

								{/* Discount badge if present */}
								{discountPercent > 0 && (
									<span className='absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-md'>
										-{discountPercent}%
									</span>
								)}

								{/* Hover Action Overlay */}
								<div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]'>
									<Link
										to={`/product/${product._id}`}
										className='p-3 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors shadow-lg'
										title='View Details'
									>
										<Eye size={18} />
									</Link>
									<button
										onClick={(e) => handleAddToCart(product, e)}
										disabled={product.stock === 0}
										className='p-3 rounded-full bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50'
										title='Quick Add'
									>
										<ShoppingCart size={18} />
									</button>
								</div>
							</div>

							{/* Details */}
							<div className='p-5 flex-1 flex flex-col justify-between'>
								<div>
									{/* Category & Brand */}
									<div className='flex items-center justify-between text-xs text-gray-400 mb-1'>
										<span className='uppercase font-bold tracking-wider text-accent'>
											{product.category}
										</span>
										{product.brand && <span className='font-medium'>{product.brand}</span>}
									</div>

									{/* Product Name */}
									<Link
										to={`/product/${product._id}`}
										className='font-bold text-white text-base hover:text-accent transition-colors line-clamp-1 block'
									>
										{product.name}
									</Link>

									{/* Rating */}
									<div className='flex items-center gap-1.5 mt-2'>
										<Star size={13} className='fill-yellow-400 text-yellow-400' />
										<span className='text-xs font-semibold text-white'>
											{product.rating ? product.rating.toFixed(1) : "5.0"}
										</span>
										<span className='text-[11px] text-gray-500'>
											({product.numReviews || 12})
										</span>
									</div>
								</div>

								{/* Footer: Colors & Price */}
								<div className='mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between'>
									{/* Color Swatches - Miniature Rectangular Thumbnails */}
									<div className='flex items-center gap-1.5'>
										{colors.slice(0, 4).map((c, idx) => (
											<span
												key={c.name || idx}
												className='w-3.5 h-4.5 rounded-[2px] border border-gray-700 overflow-hidden shadow-sm shrink-0 inline-block bg-neutral-900'
												title={c.name}
											>
												{c.image ? (
													<img
														src={c.image}
														alt={c.name}
														className='w-full h-full object-cover object-top'
														loading='lazy'
													/>
												) : (
													<span
														className='block w-full h-full'
														style={{ backgroundColor: c.hex || "#3b82f6" }}
													/>
												)}
											</span>
										))}
										{colors.length > 4 && (
											<span className='text-[10px] text-gray-500 font-mono'>+{colors.length - 4}</span>
										)}
									</div>

									{/* Price in INR */}
									<div className='text-right'>
										<div className='text-base font-black text-white'>
											₹{product.price?.toLocaleString("en-IN")}
										</div>
										{hasDiscount && (
											<div className='text-[11px] text-gray-500 line-through'>
												₹{product.originalPrice?.toLocaleString("en-IN")}
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
};

export default NewArrivalsSection;
