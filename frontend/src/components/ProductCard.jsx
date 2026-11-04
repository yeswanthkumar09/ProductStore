import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Heart, Plus, Check, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import ProductQuickViewModal from "./ProductQuickViewModal";
import { extractProductColors } from "./ProductColorSelector";

const ProductCard = ({ product }) => {
	if (!product || typeof product !== "object") return null;

	const { user } = useUserStore();
	const { addToCart } = useCartStore();
	const { isInWishlist, toggleWishlist } = useWishlistStore();

	const [isHovered, setIsHovered] = useState(false);
	const [showQuickSizes, setShowQuickSizes] = useState(false);
	const [selectedQuickSize, setSelectedQuickSize] = useState("");
	const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
	const [selectedCardColor, setSelectedCardColor] = useState(null);

	const isWishlisted = isInWishlist(product._id);

	const productColors = useMemo(() => {
		return extractProductColors(product);
	}, [product]);

	const activeCardImage = selectedCardColor?.image || product.image;

	const discountPercent =
		product.originalPrice && product.originalPrice > product.price
			? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
			: 0;

	// Secondary image on hover if available
	const secondaryImage =
		Array.isArray(product.images) && product.images.length > 1
			? product.images[1]
			: null;

	const handleToggleWishlist = (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (!user) {
			toast.error("Please login to save to your wishlist", { id: "wishlist-login" });
			return;
		}
		toggleWishlist(product._id);
	};

	const handleQuickAddClick = (e) => {
		e.preventDefault();
		e.stopPropagation();

		if (product.stock === 0) {
			toast.error("Item is currently out of stock");
			return;
		}

		// If product has size variants, toggle quick size selector
		if (Array.isArray(product.variants) && product.variants.length > 0) {
			setShowQuickSizes((prev) => !prev);
		} else {
			addToCart(product);
			toast.success(`Added ${product.name} to bag`);
		}
	};

	const handleSelectSizeAndAdd = (e, variant) => {
		e.preventDefault();
		e.stopPropagation();
		if (variant.stock === 0 || variant.isAvailable === false) {
			toast.error(`Size ${variant.size} is out of stock`);
			return;
		}
		setSelectedQuickSize(variant.size);
		addToCart(product, {
			variantId: variant._id,
			selectedSize: variant.size,
			selectedColor: variant.color?.name || "",
		});
		toast.success(`Added ${variant.size} to bag`);
		setTimeout(() => {
			setShowQuickSizes(false);
			setSelectedQuickSize("");
		}, 400);
	};

	// Unique sizes from variants
	const availableVariants = Array.isArray(product.variants) ? product.variants : [];
	const uniqueSizes = Array.from(
		new Map(availableVariants.map((v) => [v.size, v])).values()
	);

	return (
		<>
			<div
				className='group relative flex flex-col bg-transparent text-neutral-900 dark:text-neutral-100 transition-all select-none'
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => {
					setIsHovered(false);
					setShowQuickSizes(false);
				}}
			>
				{/* Product Image Container (3:4 Editorial Aspect Ratio) */}
				<div className='relative w-full aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-900'>
					<Link to={`/product/${product._id}`} className='block w-full h-full'>
						{/* Primary Image */}
						<img
							src={activeCardImage}
							alt={product.name}
							loading='lazy'
							className={`w-full h-full object-cover object-center transition-opacity duration-500 ${
								isHovered && secondaryImage && !selectedCardColor ? "opacity-0" : "opacity-100"
							}`}
						/>

						{/* Secondary Image on Hover */}
						{secondaryImage && (
							<img
								src={secondaryImage}
								alt={`${product.name} alternate view`}
								loading='lazy'
								className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${
									isHovered ? "opacity-100" : "opacity-0"
								}`}
							/>
						)}
					</Link>

					{/* Discount & Dynamic Badges (Upper Left) */}
					<div className='absolute top-2.5 left-2.5 flex flex-col items-start gap-1 pointer-events-none z-10'>
						{discountPercent > 0 && (
							<span className='px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black'>
								{discountPercent}% OFF
							</span>
						)}
						{product.badge ? (
							<span className='px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-[#6e141a] text-white shadow-sm'>
								{product.badge}
							</span>
						) : product.stock <= 3 && product.stock > 0 ? (
							<span className='px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-amber-600 text-white shadow-sm'>
								Only {product.stock} Left
							</span>
						) : product.isNewArrival ? (
							<span className='px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black'>
								New Arrival
							</span>
						) : null}
					</div>

					{/* Floating Wishlist Heart (Upper Right) */}
					<button
						type='button'
						onClick={handleToggleWishlist}
						aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
						className='absolute top-2.5 right-2.5 p-1.5 rounded-full text-neutral-800 dark:text-neutral-200 hover:scale-110 active:scale-95 transition-transform focus:outline-none'
					>
						<Heart
							size={18}
							strokeWidth={1.8}
							className={
								isWishlisted
									? "fill-black text-black dark:fill-white dark:text-white"
									: "text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white"
							}
						/>
					</button>

					{/* Desktop Quick View Button on Image Hover */}
					{!showQuickSizes && (
						<button
							type='button'
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								setIsQuickViewOpen(true);
							}}
							aria-label={`Quick view ${product.name}`}
							className={`hidden sm:flex absolute inset-x-3 bottom-3 py-2.5 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md text-neutral-950 dark:text-white border border-neutral-200 dark:border-neutral-800 text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all items-center justify-center gap-1.5 shadow-md z-10 ${
								isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
							}`}
						>
							<Eye size={13} />
							<span>Quick View</span>
						</button>
					)}

					{/* Quick-Add Size Drawer Overlay (when '+' is clicked) */}
					{showQuickSizes && uniqueSizes.length > 0 && (
						<div className='absolute inset-x-0 bottom-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm p-3 border-t border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-bottom duration-200 z-20'>
							<p className='text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2'>
								Select Size
							</p>
							<div className='flex flex-wrap gap-1.5'>
								{uniqueSizes.map((v) => {
									const isOutOfStock = v.stock === 0;
									const isSelected = selectedQuickSize === v.size;
									return (
										<button
											key={v._id || v.size}
											type='button'
											disabled={isOutOfStock}
											onClick={(e) => handleSelectSizeAndAdd(e, v)}
											className={`h-7 min-w-[28px] px-2 text-[10px] font-bold uppercase border transition-all ${
												isSelected
													? "bg-black text-white border-black dark:bg-white dark:text-black"
													: isOutOfStock
													? "border-neutral-200 text-neutral-300 line-through cursor-not-allowed"
													: "border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:border-black dark:hover:border-white"
											}`}
										>
											{v.size}
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>

				{/* Product Info (Below Image) */}
				<div className='pt-2.5 pb-2 flex flex-col'>
					<div className='flex items-start justify-between gap-2'>
						{/* Title */}
						<Link
							to={`/product/${product._id}`}
							className='flex-1 text-xs sm:text-[13px] font-normal text-neutral-800 dark:text-neutral-200 hover:underline line-clamp-1 leading-snug'
						>
							{product.name}
						</Link>

						{/* Quick-Add '+' Button */}
						<button
							type='button'
							onClick={handleQuickAddClick}
							aria-label={`Quick add ${product.name}`}
							className='text-neutral-900 dark:text-neutral-100 hover:opacity-60 transition-opacity p-0.5 shrink-0'
						>
							<Plus size={16} strokeWidth={2} />
						</button>
					</div>

					{/* Price Row */}
					<div className='flex items-baseline gap-2 mt-1'>
						<span className='text-xs sm:text-sm font-bold text-neutral-950 dark:text-white'>
							₹{Number(product.price).toLocaleString("en-IN")}
						</span>
						{product.originalPrice && product.originalPrice > product.price && (
							<span className='text-[11px] text-neutral-400 line-through'>
								₹{Number(product.originalPrice).toLocaleString("en-IN")}
							</span>
						)}
					</div>

					{/* Color Thumbnails Selector (Miniature product image thumbnails) */}
					{productColors.length > 0 && (
						<div
							className='flex items-center gap-1.5 mt-2'
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							{productColors.slice(0, 4).map((c, idx) => {
								const isSelected =
									selectedCardColor?.name?.toLowerCase() === c.name?.toLowerCase() ||
									(!selectedCardColor && idx === 0);

								return (
									<button
										key={c.name || idx}
										type='button'
										title={c.name}
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											setSelectedCardColor(c);
										}}
										className={`w-4 h-5 border transition-all duration-150 overflow-hidden shrink-0 ${
											isSelected
												? "border-neutral-950 dark:border-white ring-1 ring-neutral-950 dark:ring-white scale-105"
												: "border-neutral-300 dark:border-neutral-800 opacity-60 hover:opacity-100"
										}`}
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
												style={{ backgroundColor: c.hex || "#262626" }}
											/>
										)}
									</button>
								);
							})}
							{productColors.length > 4 && (
								<span className='text-[9px] text-neutral-400 font-mono'>
									+{productColors.length - 4}
								</span>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Quick View Modal */}
			<ProductQuickViewModal
				isOpen={isQuickViewOpen}
				onClose={() => setIsQuickViewOpen(false)}
				product={product}
				initialColor={selectedCardColor}
			/>
		</>
	);
};

export default ProductCard;
