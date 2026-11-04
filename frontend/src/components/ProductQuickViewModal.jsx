import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Heart, ShoppingBag, ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useUserStore } from "../stores/useUserStore";
import ProductColorSelector, { extractProductColors } from "./ProductColorSelector";
import toast from "react-hot-toast";

const ProductQuickViewModal = ({ isOpen, onClose, product, initialColor = null }) => {
	const { addToCart } = useCartStore();
	const { isInWishlist, toggleWishlist } = useWishlistStore();
	const { user } = useUserStore();

	const [selectedImage, setSelectedImage] = useState("");
	const [selectedColor, setSelectedColor] = useState(null);
	const [selectedSize, setSelectedSize] = useState("");
	const [quantity, setQuantity] = useState(1);
	const [adding, setAdding] = useState(false);

	const availableColors = useMemo(() => {
		return extractProductColors(product);
	}, [product]);

	// Initialize color, image, and size when modal opens or product changes
	useEffect(() => {
		if (product && isOpen) {
			const colors = extractProductColors(product);
			let chosenColor = null;

			if (initialColor) {
				chosenColor = colors.find(
					(c) => c.name?.toLowerCase() === initialColor.name?.toLowerCase()
				) || initialColor;
			} else if (colors.length > 0) {
				chosenColor = colors[0];
			}

			setSelectedColor(chosenColor);
			setSelectedImage(chosenColor?.image || product.image || "");
			setQuantity(1);

			// Determine initial size for this color
			const vars = Array.isArray(product.variants) ? product.variants : [];
			if (vars.length > 0) {
				const matchingVars = chosenColor
					? vars.filter((v) => v.color?.name?.toLowerCase() === chosenColor.name?.toLowerCase())
					: vars;
				const effectiveVars = matchingVars.length > 0 ? matchingVars : vars;
				const inStock = effectiveVars.find((v) => v.stock > 0) || effectiveVars[0];
				setSelectedSize(inStock?.size || "");
			} else if (Array.isArray(product.sizes) && product.sizes.length > 0) {
				setSelectedSize(product.sizes[0]);
			} else {
				setSelectedSize("");
			}
		}
	}, [product, isOpen, initialColor]);

	// Lock body scroll & listen to Escape key
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape") onClose();
		};
		if (isOpen) {
			document.body.style.overflow = "hidden";
			window.addEventListener("keydown", handleKeyDown);
		}
		return () => {
			document.body.style.overflow = "unset";
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onClose]);

	// Handle color change: update active gallery image & available sizes while preserving size if valid
	const handleColorChange = (newColor) => {
		setSelectedColor(newColor);
		if (newColor.image) {
			setSelectedImage(newColor.image);
		} else if (product.image) {
			setSelectedImage(product.image);
		}

		if (Array.isArray(product.variants) && product.variants.length > 0) {
			const matchingVariants = product.variants.filter(
				(v) => v.color?.name?.toLowerCase() === newColor.name?.toLowerCase()
			);
			const availableSizesInNewColor = Array.from(
				new Set(matchingVariants.map((v) => v.size).filter(Boolean))
			);
			// Preserve selected size if available in new color, otherwise pick first available size
			if (selectedSize && !availableSizesInNewColor.includes(selectedSize)) {
				const inStock = matchingVariants.find((v) => v.stock > 0) || matchingVariants[0];
				setSelectedSize(inStock?.size || availableSizesInNewColor[0] || "");
			}
		}
	};

	// Available sizes for currently selected color
	const availableSizes = useMemo(() => {
		if (!product) return [];
		if (Array.isArray(product.variants) && product.variants.length > 0) {
			if (selectedColor) {
				const matchingVariants = product.variants.filter(
					(v) => v.color?.name?.toLowerCase() === selectedColor.name?.toLowerCase()
				);
				if (matchingVariants.length > 0) {
					return Array.from(new Set(matchingVariants.map((v) => v.size).filter(Boolean)));
				}
			}
			return Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean)));
		}
		return Array.isArray(product.sizes) ? product.sizes : [];
	}, [product, selectedColor]);

	// Active variant based on selectedColor and selectedSize
	const activeVariant = useMemo(() => {
		const vars = Array.isArray(product?.variants) ? product.variants : [];
		if (!vars.length) return null;
		if (selectedColor && selectedSize) {
			const exact = vars.find(
				(v) =>
					v.color?.name?.toLowerCase() === selectedColor.name?.toLowerCase() &&
					v.size === selectedSize
			);
			if (exact) return exact;
		}
		if (selectedColor) {
			const colMatch = vars.find(
				(v) => v.color?.name?.toLowerCase() === selectedColor.name?.toLowerCase()
			);
			if (colMatch) return colMatch;
		}
		if (selectedSize) {
			const sizeMatch = vars.find((v) => v.size === selectedSize);
			if (sizeMatch) return sizeMatch;
		}
		return vars[0];
	}, [product, selectedColor, selectedSize]);

	const displayPrice = activeVariant ? activeVariant.price : (product?.price || 0);
	const displayOriginalPrice = activeVariant ? activeVariant.originalPrice : (product?.originalPrice || 0);
	const currentStock = activeVariant ? activeVariant.stock : (product?.stock ?? 10);
	const isOutOfStock = currentStock <= 0;

	const discountPercent =
		displayOriginalPrice && displayOriginalPrice > displayPrice
			? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
			: 0;

	// Gallery thumbnails for preview column (combining variant images, color image, and product image)
	const uniqueImages = useMemo(() => {
		if (!product) return [];
		const list = [
			selectedColor?.image,
			...(activeVariant?.images || []),
			product.image,
			...(Array.isArray(product.images) ? product.images : []),
		].filter(Boolean);
		return Array.from(new Set(list));
	}, [selectedColor, activeVariant, product]);

	if (!isOpen || !product) return null;

	const isWishlisted = isInWishlist(product._id);

	const handleAddToCart = () => {
		if (availableSizes.length > 0 && !selectedSize) {
			toast.error("Please select a size first");
			return;
		}

		if (isOutOfStock) {
			toast.error("This selection is currently out of stock");
			return;
		}

		setAdding(true);
		addToCart(
			product,
			{
				variantId: activeVariant?._id,
				selectedSize,
				selectedColor: selectedColor?.name || "",
			},
			quantity
		);

		toast.success(`Added ${quantity}x ${product.name} to shopping bag`, {
			icon: "🛍️",
		});

		setTimeout(() => {
			setAdding(false);
			onClose();
		}, 400);
	};

	const handleWishlistClick = (e) => {
		e.preventDefault();
		if (!user) {
			toast.error("Please sign in to save to your wishlist");
			return;
		}
		toggleWishlist(product._id);
	};

	if (typeof document === "undefined") return null;

	return createPortal(
		<div
			className='fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200'
			onClick={onClose}
		>
			<div
				role='dialog'
				aria-modal='true'
				aria-label={`Quick View: ${product.name}`}
				className='relative w-full max-w-3xl max-h-[90vh] max-h-[90dvh] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-y-auto flex flex-col md:flex-row'
				onClick={(e) => e.stopPropagation()}
			>
				{/* Close Button */}
				<button
					type='button'
					onClick={onClose}
					className='absolute top-3 right-3 z-20 p-1.5 rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm text-neutral-500 hover:text-black dark:hover:text-white transition-colors'
					aria-label='Close Quick View'
				>
					<X size={18} />
				</button>

				{/* Left: Image Preview Column */}
				<div className='w-full md:w-1/2 p-4 sm:p-6 flex flex-col bg-neutral-50 dark:bg-neutral-950/60 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800'>
					<div className='relative w-full aspect-[3/4] overflow-hidden bg-neutral-200 dark:bg-neutral-800 mb-3'>
						<img
							src={selectedImage || selectedColor?.image || product.image}
							alt={product.name}
							className='w-full h-full object-cover object-top transition-opacity duration-300'
						/>
						{discountPercent > 0 && (
							<span className='absolute top-2 left-2 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black shadow-sm'>
								{discountPercent}% OFF
							</span>
						)}
					</div>

					{/* Thumbnail strip */}
					{uniqueImages.length > 1 && (
						<div className='flex gap-2 overflow-x-auto pb-1'>
							{uniqueImages.slice(0, 5).map((img, idx) => (
								<button
									key={idx}
									type='button'
									onClick={() => setSelectedImage(img)}
									className={`w-12 h-14 border flex-shrink-0 overflow-hidden transition-all ${
										selectedImage === img
											? "border-black dark:border-white ring-1 ring-black dark:ring-white scale-[1.02]"
											: "border-neutral-200 dark:border-neutral-700 opacity-70 hover:opacity-100"
									}`}
								>
									<img src={img} alt='' className='w-full h-full object-cover object-top' />
								</button>
							))}
						</div>
					)}
				</div>

				{/* Right: Product Details & Controls */}
				<div className='w-full md:w-1/2 p-6 flex flex-col justify-between'>
					<div>
						{/* Category & Wishlist */}
						<div className='flex items-center justify-between mb-1'>
							<span className='text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400'>
								{typeof product.category === "string" ? product.category : product.category?.name || "Couture"}
							</span>
							<button
								type='button'
								onClick={handleWishlistClick}
								className='p-1 text-neutral-500 hover:text-black dark:hover:text-white transition-colors'
								aria-label='Wishlist'
							>
								<Heart
									size={18}
									className={
										isWishlisted
											? "fill-rose-500 text-rose-500"
											: "text-neutral-500 hover:text-black dark:hover:text-white"
									}
								/>
							</button>
						</div>

						{/* Product Title */}
						<h3 className='text-lg sm:text-xl font-bold text-neutral-950 dark:text-white leading-snug'>
							{product.name}
						</h3>

						{/* Price row */}
						<div className='flex items-baseline gap-3 mt-2 pb-4 border-b border-neutral-100 dark:border-neutral-800'>
							<span className='text-lg font-black text-neutral-950 dark:text-white'>
								₹{Number(displayPrice).toLocaleString("en-IN")}
							</span>
							{displayOriginalPrice && displayOriginalPrice > displayPrice && (
								<span className='text-xs text-neutral-400 line-through'>
									₹{Number(displayOriginalPrice).toLocaleString("en-IN")}
								</span>
							)}
							{product.rating > 0 && (
								<div className='flex items-center gap-1 ml-auto text-xs font-bold text-neutral-700 dark:text-neutral-300'>
									<Star size={12} className='fill-neutral-900 dark:fill-white text-neutral-900 dark:text-white' />
									<span>{product.rating.toFixed(1)}</span>
								</div>
							)}
						</div>

						{/* Color Selection: Reusable Product-Image Thumbnails */}
						{availableColors.length > 0 && (
							<div className='mt-4'>
								<ProductColorSelector
									colors={availableColors}
									selectedColor={selectedColor}
									onSelectColor={handleColorChange}
									labelPrefix='Color'
									size='md'
								/>
							</div>
						)}

						{/* Size Selection */}
						{availableSizes.length > 0 && (
							<div className='mt-4'>
								<div className='flex items-center justify-between mb-2'>
									<span className='text-[10px] font-bold uppercase tracking-wider text-neutral-500'>
										Select Size
									</span>
									{currentStock > 0 && currentStock <= 5 && (
										<span className='text-[10px] font-bold text-amber-600 dark:text-amber-400'>
											Only {currentStock} left
										</span>
									)}
								</div>
								<div className='flex flex-wrap gap-2'>
									{availableSizes.map((s) => {
										const matchingVariant = (Array.isArray(product.variants) ? product.variants : []).find(
											(v) =>
												v.size === s &&
												(!selectedColor || v.color?.name?.toLowerCase() === selectedColor.name?.toLowerCase())
										);
										const sizeOutOfStock = matchingVariant ? matchingVariant.stock <= 0 : false;
										const isSelected = selectedSize === s;

										return (
											<button
												key={s}
												type='button'
												disabled={sizeOutOfStock}
												onClick={() => setSelectedSize(s)}
												className={`h-8 min-w-[34px] px-2.5 text-xs font-bold uppercase border transition-all ${
													isSelected
														? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
														: sizeOutOfStock
														? "border-neutral-200 text-neutral-300 dark:border-neutral-800 dark:text-neutral-600 line-through cursor-not-allowed"
														: "border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 hover:border-black dark:hover:border-white"
												}`}
											>
												{s}
											</button>
										);
									})}
								</div>
							</div>
						)}

						{/* Quantity counter */}
						<div className='mt-4 flex items-center gap-3'>
							<span className='text-[10px] font-bold uppercase tracking-wider text-neutral-500'>
								Quantity
							</span>
							<div className='flex items-center border border-neutral-300 dark:border-neutral-700'>
								<button
									type='button'
									disabled={quantity <= 1}
									onClick={() => setQuantity((q) => Math.max(1, q - 1))}
									className='w-8 h-8 flex items-center justify-center text-sm font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30'
								>
									-
								</button>
								<span className='w-8 text-center text-xs font-bold'>{quantity}</span>
								<button
									type='button'
									disabled={quantity >= currentStock}
									onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
									className='w-8 h-8 flex items-center justify-center text-sm font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30'
								>
									+
								</button>
							</div>
						</div>
					</div>

					{/* Actions Footer */}
					<div className='mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3'>
						<button
							type='button'
							disabled={isOutOfStock || adding}
							onClick={handleAddToCart}
							className='w-full py-3.5 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-widest hover:opacity-85 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 shadow-sm'
						>
							<ShoppingBag size={14} />
							<span>
								{adding
									? "Adding to Bag..."
									: isOutOfStock
									? "Sold Out"
									: `Add to Bag • ₹${(Number(displayPrice) * quantity).toLocaleString("en-IN")}`}
							</span>
						</button>

						<div className='text-center'>
							<Link
								to={`/product/${product._id}`}
								onClick={onClose}
								className='inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors'
							>
								<span>View Full Editorial Details</span>
								<ArrowRight size={13} />
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>,
		document.body
	);
};

export default ProductQuickViewModal;
