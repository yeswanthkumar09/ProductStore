import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
	Heart,
	Star,
	ArrowLeft,
	Truck,
	ShieldCheck,
	RotateCcw,
	Plus,
	Minus,
	Share2,
	Check,
	ChevronDown,
	ChevronUp,
	Sparkles,
	MapPin,
	X,
	Copy,
	CheckCircle2,
	ShieldAlert,
	Bell,
} from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import ProductCard from "../components/ProductCard";
import SkeletonLoader from "../components/SkeletonLoader";
import ProductShareModal from "../components/ProductShareModal";
import NotifyMeModal from "../components/NotifyMeModal";
import SizeGuideModal from "../components/SizeGuideModal";
import ProductColorSelector, { extractProductColors } from "../components/ProductColorSelector";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const ProductDetailPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user } = useUserStore();
	const {
		currentProduct,
		fetchProductById,
		fetchReviews,
		reviews,
		addReview,
		updateReview,
		deleteReview,
		loading,
		products: relatedCategoryProducts,
		fetchProductsByCategory,
	} = useProductStore();
	const { addToCart } = useCartStore();
	const { isInWishlist, toggleWishlist } = useWishlistStore();

	const [quantity, setQuantity] = useState(1);
	const [activeImage, setActiveImage] = useState("");
	const [selectedColor, setSelectedColor] = useState(null);
	const [selectedSize, setSelectedSize] = useState("");
	const [similarProducts, setSimilarProducts] = useState([]);

	// Pincode & Delivery Serviceability State
	const [pincode, setPincode] = useState("");
	const [pincodeChecking, setPincodeChecking] = useState(false);
	const [pincodeResult, setPincodeResult] = useState(null);
	const [pincodeError, setPincodeError] = useState("");

	// Size Guide, Share & Notify Modals
	const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
	const [sizeUnit, setSizeUnit] = useState("in"); // "in" | "cm"
	const [shareModalOpen, setShareModalOpen] = useState(false);
	const [notifyModalOpen, setNotifyModalOpen] = useState(false);

	// Verified Review Modal & Eligibility State
	const [isReviewOpen, setIsReviewOpen] = useState(false);
	const [reviewRating, setReviewRating] = useState(5);
	const [reviewTitle, setReviewTitle] = useState("");
	const [reviewComment, setReviewComment] = useState("");
	const [reviewImages, setReviewImages] = useState([]);
	const [reviewImageUrl, setReviewImageUrl] = useState("");
	const [submittingReview, setSubmittingReview] = useState(false);
	const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
	const [existingReviewId, setExistingReviewId] = useState(null);
	const [ineligibleModalOpen, setIneligibleModalOpen] = useState(false);
	const [ineligibleReason, setIneligibleReason] = useState("");

	// Accordion Expanded State
	const [accordionState, setAccordionState] = useState({
		delivery: true,
		description: false,
		reviews: false,
		returns: false,
	});

	const toggleAccordion = (key) => {
		setAccordionState((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	// Load product & reviews & track browsing
	useEffect(() => {
		if (id) {
			fetchProductById(id);
			fetchReviews(id);
			window.scrollTo(0, 0);

			// Track browsing history remotely & locally
			axios.post("/recommendations/track", { productId: id }).catch(() => {});
			try {
				const currentHistory = JSON.parse(localStorage.getItem("recent_viewed_products") || "[]");
				const updated = [id, ...currentHistory.filter((pid) => pid !== id)].slice(0, 10);
				localStorage.setItem("recent_viewed_products", JSON.stringify(updated));
			} catch (e) {}

			// Fetch similar products
			axios
				.get(`/products/${id}/similar`)
				.then((res) => setSimilarProducts(res.data || []))
				.catch(() => {});
		}
	}, [id, fetchProductById, fetchReviews]);

	// Extract unique colors from variants or fallback to product.colors
	const availableColors = useMemo(() => {
		return extractProductColors(currentProduct);
	}, [currentProduct]);

	// Auto-select initial color
	useEffect(() => {
		if (currentProduct && availableColors.length > 0) {
			setSelectedColor(availableColors[0]);
		}
	}, [currentProduct, availableColors]);

	// Handle color selection: update active image and harmonize available sizes
	const handleColorChange = (newColor) => {
		setSelectedColor(newColor);
		if (newColor.image) {
			setActiveImage(newColor.image);
		}

		if (Array.isArray(currentProduct?.variants) && currentProduct.variants.length > 0) {
			const matchingVariants = currentProduct.variants.filter(
				(v) => v.color?.name?.toLowerCase() === newColor.name?.toLowerCase()
			);
			const sizesInNewColor = Array.from(
				new Set(matchingVariants.map((v) => v.size).filter(Boolean))
			);
			// Preserve selected size if available in new color, otherwise switch to first available
			if (selectedSize && !sizesInNewColor.includes(selectedSize)) {
				const inStock = matchingVariants.find((v) => v.stock > 0) || matchingVariants[0];
				setSelectedSize(inStock?.size || sizesInNewColor[0] || "");
			}
		}
	};

	// Extract available sizes for selected color
	const availableSizes = useMemo(() => {
		if (!currentProduct) return [];
		if (Array.isArray(currentProduct.variants) && currentProduct.variants.length > 0) {
			if (!selectedColor) {
				return Array.from(new Set(currentProduct.variants.map((v) => v.size).filter(Boolean)));
			}
			const matchingVariants = currentProduct.variants.filter(
				(v) => v.color?.name?.toLowerCase() === selectedColor.name?.toLowerCase()
			);
			const sizes = Array.from(new Set(matchingVariants.map((v) => v.size).filter(Boolean)));
			return sizes.length > 0 ? sizes : ["S", "M", "L", "XL", "XXL"];
		}
		// Standard apparel sizes fallback if variants not defined
		return ["XS", "S", "M", "L", "XL", "XXL"];
	}, [currentProduct, selectedColor]);

	// Determine active variant based on selectedColor and selectedSize
	const activeVariant = useMemo(() => {
		if (!currentProduct || !Array.isArray(currentProduct.variants) || currentProduct.variants.length === 0) {
			return null;
		}
		if (selectedColor && selectedSize) {
			const match = currentProduct.variants.find(
				(v) =>
					v.color?.name?.toLowerCase() === selectedColor.name?.toLowerCase() &&
					v.size === selectedSize
			);
			if (match) return match;
		}
		if (selectedColor) {
			const match = currentProduct.variants.find(
				(v) => v.color?.name?.toLowerCase() === selectedColor.name?.toLowerCase()
			);
			if (match) return match;
		}
		return currentProduct.variants[0];
	}, [currentProduct, selectedColor, selectedSize]);

	// Synchronize active image
	useEffect(() => {
		if (activeVariant?.images && activeVariant.images.length > 0) {
			setActiveImage(activeVariant.images[0]);
		} else if (currentProduct) {
			setActiveImage(currentProduct.image || currentProduct.images?.[0] || "");
		}
	}, [activeVariant, currentProduct]);

	useEffect(() => {
		if (currentProduct?.category) {
			fetchProductsByCategory(currentProduct.category, { limit: 6 });
		}
	}, [currentProduct?.category, fetchProductsByCategory]);

	// Pincode delivery serviceability check
	const handleCheckPincode = async (e) => {
		e?.preventDefault();
		const trimmed = pincode.trim();
		if (!trimmed) {
			setPincodeError("Please enter your 6-digit PIN code.");
			return;
		}
		if (!/^\d{6}$/.test(trimmed)) {
			setPincodeError("Enter a valid 6-digit Indian PIN code.");
			return;
		}

		setPincodeError("");
		setPincodeChecking(true);
		setPincodeResult(null);

		try {
			const res = await axios.get(`/serviceability/check?pincode=${trimmed}`);
			setPincodeResult(res.data);
		} catch (err) {
			setPincodeError(
				err.response?.data?.message || "Delivery check temporarily unavailable. Please try again."
			);
		} finally {
			setPincodeChecking(false);
		}
	};

	const handleAddToCart = () => {
		if (!selectedSize && availableSizes.length > 0) {
			toast.error("Please select a size first");
			return;
		}
		const stock = activeVariant ? activeVariant.stock : currentProduct.stock;
		if (stock === 0) {
			toast.error("This variant is currently out of stock");
			return;
		}

		addToCart(currentProduct, {
			variantId: activeVariant?._id,
			selectedColor: selectedColor?.name,
			selectedSize: selectedSize || undefined,
			quantity,
		});
		toast.success(`Added ${currentProduct.name} to your shopping bag`, {
			icon: "🛍️",
		});
	};

	const handleShare = () => {
		setShareModalOpen(true);
	};

	const handleOpenReviewModal = async () => {
		if (!user) {
			toast.error("Please sign in to write a review");
			return;
		}
		try {
			setIsCheckingEligibility(true);
			const res = await axios.get(`/products/${currentProduct._id}/reviews/eligibility`);
			if (res.data.eligible) {
				if (res.data.alreadyReviewed && res.data.existingReview) {
					setReviewRating(res.data.existingReview.rating || 5);
					setReviewTitle(res.data.existingReview.title || "");
					setReviewComment(res.data.existingReview.comment || "");
					setReviewImages(res.data.existingReview.images || []);
					setExistingReviewId(res.data.existingReview._id);
				} else {
					setExistingReviewId(null);
					setReviewRating(5);
					setReviewTitle("");
					setReviewComment("");
					setReviewImages([]);
				}
				setIsReviewOpen(true);
			} else {
				setIneligibleReason(
					res.data.message ||
						"Only patrons who have purchased this garment from our store can submit a verified review."
				);
				setIneligibleModalOpen(true);
			}
		} catch (err) {
			toast.error(err.response?.data?.message || "Could not verify purchase eligibility");
		} finally {
			setIsCheckingEligibility(false);
		}
	};

	const handleAddReviewSubmit = async (e) => {
		e.preventDefault();
		if (!user) {
			toast.error("Please sign in to write a review");
			return;
		}
		if (!reviewComment.trim()) {
			toast.error("Please share your feedback in the comment box");
			return;
		}
		try {
			setSubmittingReview(true);
			if (existingReviewId) {
				await updateReview(existingReviewId, {
					rating: reviewRating,
					title: reviewTitle.trim(),
					comment: reviewComment.trim(),
					images: reviewImages,
					productId: currentProduct._id,
				});
			} else {
				await addReview({
					productId: currentProduct._id,
					rating: reviewRating,
					title: reviewTitle.trim(),
					comment: reviewComment.trim(),
					images: reviewImages,
				});
			}
			setReviewTitle("");
			setReviewComment("");
			setReviewImages([]);
			setIsReviewOpen(false);
			setExistingReviewId(null);
		} catch (err) {
			// handled in store
		} finally {
			setSubmittingReview(false);
		}
	};

	if (loading) {
		return (
			<div className='max-w-7xl mx-auto px-4 py-12'>
				<SkeletonLoader type='detail' />
			</div>
		);
	}

	if (!currentProduct) {
		return (
			<div className='min-h-[60vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center'>
				<div className='max-w-md w-full p-8 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 text-center select-none'>
					<p className='text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-2'>
						Catalogue Update
					</p>
					<h2 className='text-2xl font-black uppercase tracking-tight text-neutral-950 dark:text-white font-heading mb-3'>
						Piece Not Available
					</h2>
					<p className='text-xs text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed'>
						This garment may have been archived, discontinued, or moved to our seasonal vault.
					</p>
					<div className='flex flex-col sm:flex-row items-center justify-center gap-3'>
						<Link
							to='/search'
							className='w-full sm:w-auto px-6 py-3 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-widest hover:opacity-85 transition-opacity'
						>
							Explore Catalog
						</Link>
						<Link
							to='/'
							className='w-full sm:w-auto px-6 py-3 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'
						>
							Return Home
						</Link>
					</div>
				</div>
			</div>
		);
	}

	const displayPrice = activeVariant ? activeVariant.price : currentProduct.price;
	const displayOriginalPrice = activeVariant ? activeVariant.originalPrice : currentProduct.originalPrice;
	const displayStock = activeVariant ? activeVariant.stock : currentProduct.stock;
	const isWishlisted = isInWishlist(currentProduct._id);
	const discountPercent =
		displayOriginalPrice && displayOriginalPrice > displayPrice
			? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
			: 0;

	// Build gallery array with high-resolution fashion shots
	const rawGallery = [
		activeImage,
		...(activeVariant?.images || []),
		currentProduct.image,
		...(currentProduct.images || []),
	].filter(Boolean);
	const galleryImages = Array.from(new Set(rawGallery));

	// Combined products for "YOU MAY ALSO LIKE" (Screenshots 5 reference)
	const combinedRelated = [
		...similarProducts,
		...relatedCategoryProducts.filter((p) => p._id !== currentProduct._id),
	]
		.filter((p, idx, arr) => arr.findIndex((x) => x._id === p._id) === idx && p._id !== currentProduct._id)
		.slice(0, 5);

	const hasReviews = reviews && reviews.length > 0;
	const reviewCount = hasReviews ? reviews.length : (currentProduct.numReviews || 0);
	const ratingCount = reviewCount;
	const averageRating = hasReviews
		? Number((reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1))
		: (currentProduct.rating ? Number(currentProduct.rating).toFixed(1) : 0);

	return (
		<div className='min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
				{/* Editorial Breadcrumbs */}
				<div className='flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-6'>
					<div className='flex items-center gap-2 overflow-x-auto whitespace-nowrap py-1'>
						<Link to='/' className='hover:text-black dark:hover:text-white transition-colors'>
							Home
						</Link>
						<span>/</span>
						<Link
							to={`/category/${typeof currentProduct.category === "string" ? currentProduct.category : currentProduct.category?.slug || ""}`}
							className='hover:text-black dark:hover:text-white transition-colors'
						>
							{typeof currentProduct.category === "string" ? currentProduct.category : currentProduct.category?.name || "Collection"}
						</Link>
						<span>/</span>
						<span className='text-neutral-900 dark:text-white truncate max-w-[200px] sm:max-w-xs'>
							{currentProduct.name}
						</span>
					</div>

					<button
						onClick={handleShare}
						aria-label='Share Product'
						className='inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white transition-colors'
					>
						<Share2 size={13} />
						<span className='hidden sm:inline'>Share</span>
					</button>
				</div>

				{/* Main Product Layout (Left: Stacked Vertical Gallery, Right: Sticky Purchase Controls) */}
				<div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start'>
					{/* LEFT COLUMN: Stacked High-Fashion Imagery (Screenshot 1, 3, 4) */}
					<div className='lg:col-span-7 flex flex-col gap-4'>
						{/* Active/Primary Image on Mobile */}
						<div className='block sm:hidden relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-900 overflow-hidden'>
							<img
								src={activeImage || currentProduct.image}
								alt={currentProduct.name}
								className='w-full h-full object-cover object-top'
							/>
							<button
								type='button'
								onClick={() => {
									if (!user) {
										toast.error("Please log in to save to your wishlist");
										return;
									}
									toggleWishlist(currentProduct._id);
								}}
								className='absolute top-3 right-3 p-2.5 rounded-full bg-white/90 dark:bg-neutral-900/90 text-neutral-900 dark:text-white shadow-sm'
							>
								<Heart
									size={18}
									className={isWishlisted ? "fill-rose-500 text-rose-500" : "text-neutral-900 dark:text-white"}
								/>
							</button>
						</div>

						{/* Desktop: Stacked Vertical High-Resolution Editorial Gallery */}
						<div className='hidden sm:flex flex-col gap-4'>
							{galleryImages.map((imgUrl, idx) => (
								<div
									key={idx}
									className='relative aspect-[3/4] w-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden group select-none'
								>
									<img
										src={imgUrl}
										alt={`${currentProduct.name} - View ${idx + 1}`}
										className='w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]'
										loading={idx === 0 ? "eager" : "lazy"}
									/>
									{idx === 0 && (
										<button
											type='button'
											onClick={() => {
												if (!user) {
													toast.error("Please log in to save to your wishlist");
													return;
												}
												toggleWishlist(currentProduct._id);
											}}
											className='absolute top-4 right-4 p-3 rounded-full bg-white/90 dark:bg-neutral-900/90 text-neutral-900 dark:text-white shadow-md hover:scale-105 active:scale-95 transition-all'
										>
											<Heart
												size={20}
												className={isWishlisted ? "fill-rose-500 text-rose-500" : "text-neutral-900 dark:text-white"}
											/>
										</button>
									)}
								</div>
							))}
						</div>
					</div>

					{/* RIGHT COLUMN: Sticky Info & Purchase Controls (Screenshots 1 & 3) */}
					<div className='lg:col-span-5 lg:sticky lg:top-24 space-y-5'>
						{/* Title */}
						<div>
							<h1 className='text-xl sm:text-2xl font-bold uppercase tracking-tight text-neutral-950 dark:text-white font-heading leading-tight'>
								{currentProduct.name}
							</h1>
						</div>

						{/* Price Display */}
						<div className='space-y-1'>
							<div className='flex items-baseline gap-3'>
								<span className='text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white'>
									₹{displayPrice?.toLocaleString("en-IN")}
								</span>
								{displayOriginalPrice && displayOriginalPrice > displayPrice && (
									<>
										<span className='text-sm text-neutral-400 line-through'>
											₹{displayOriginalPrice?.toLocaleString("en-IN")}
										</span>
										<span className='text-xs font-bold text-rose-600 dark:text-rose-400'>
											({discountPercent}% OFF)
										</span>
									</>
								)}
							</div>
							<p className='text-[11px] text-neutral-400 font-medium'>
								*MRP Inclusive of all taxes
							</p>
						</div>

						{/* Ratings & Reviews Pill */}
						<div className='flex items-center gap-2'>
							{reviewCount > 0 ? (
								<div className='inline-flex items-center gap-1.5 px-2.5 py-1 border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs font-bold'>
									<span>{averageRating}</span>
									<Star size={12} className='fill-neutral-950 text-neutral-950 dark:fill-white dark:text-white' />
									<span className='text-neutral-300 dark:text-neutral-600'>|</span>
									<span className='text-neutral-600 dark:text-neutral-400 font-normal'>
										{reviewCount} {reviewCount === 1 ? "Rating & Review" : "Ratings & Reviews"}
									</span>
								</div>
							) : (
								<button
									type='button'
									onClick={handleOpenReviewModal}
									className='inline-flex items-center gap-1.5 px-2.5 py-1 border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors'
								>
									<Star size={12} className='text-neutral-400' />
									<span>Be the first to review</span>
								</button>
							)}
						</div>

						{/* Promotional Voucher Card (Screenshot 3 Reference) */}
						<div className='p-3 sm:p-3.5 bg-[#fdf2ee] dark:bg-[#2b1814] border border-[#f5d0c5] dark:border-[#522920] flex items-center justify-between gap-3'>
							<div className='flex items-center gap-2.5 min-w-0'>
								<span className='px-2 py-0.5 bg-[#e05338] text-white text-[10px] font-black uppercase tracking-wider shrink-0'>
									WELCOME10
								</span>
								<p className='text-xs text-neutral-800 dark:text-neutral-200 truncate'>
									Enjoy 10% off on your order with code <strong>WELCOME10</strong>
								</p>
							</div>
							<button
								type='button'
								onClick={() => {
									navigator.clipboard.writeText("WELCOME10");
									toast.success("Coupon code WELCOME10 copied!");
								}}
								className='text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white shrink-0 p-1'
								title='Copy code'
							>
								<Copy size={14} />
							</button>
						</div>

						{/* Color Variant Row (Screenshot Reference 1) */}
						{availableColors.length > 0 && (
							<div className='pt-2'>
								<ProductColorSelector
									colors={availableColors}
									selectedColor={selectedColor}
									onSelectColor={handleColorChange}
									labelPrefix='Selected Color'
									size='md'
								/>
							</div>
						)}

						{/* Size Selection & Size Guide Link (Screenshot 3 Reference) */}
						{availableSizes.length > 0 && (
							<div className='space-y-2.5 pt-2'>
								<div className='flex items-center justify-between'>
									<span className='text-xs font-bold uppercase tracking-wider text-neutral-500'>
										Select Size
									</span>
									<button
										type='button'
										onClick={() => setIsSizeGuideOpen(true)}
										className='text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white underline underline-offset-4 hover:opacity-70 transition-opacity'
									>
										Size Guide
									</button>
								</div>

								<div className='flex flex-wrap items-center gap-2'>
									{availableSizes.map((size, idx) => {
										const isSelected = selectedSize === size;
										const variantForSize = currentProduct.variants?.find(
											(v) =>
												(!selectedColor || v.color?.name?.toLowerCase() === selectedColor.name?.toLowerCase()) &&
												v.size === size
										);
										const isOutOfStock = variantForSize && variantForSize.stock === 0;

										return (
											<button
												key={idx}
												type='button'
												disabled={isOutOfStock}
												onClick={() => setSelectedSize(size)}
												className={`min-w-[50px] h-11 px-3 border text-xs font-bold uppercase transition-all flex items-center justify-center ${
													isSelected
														? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950 shadow-sm"
														: isOutOfStock
														? "border-neutral-200 text-neutral-300 dark:border-neutral-800 dark:text-neutral-700 line-through cursor-not-allowed bg-neutral-50 dark:bg-neutral-900"
														: "border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white hover:border-neutral-950 dark:hover:border-white"
												}`}
											>
												{size}
											</button>
										);
									})}
								</div>
							</div>
						)}

						{/* Delivery Announcement Bar (Screenshot 3 Reference) */}
						<div className='p-3 bg-neutral-100 dark:bg-neutral-900 text-center text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200'>
							FREE 1-2 day delivery on 5k+ pincodes
						</div>

						{/* Primary Purchase or Restock Notification CTA Button */}
						<div className='space-y-3 pt-1'>
							{displayStock === 0 ? (
								<div className='space-y-2.5'>
									<button
										type='button'
										onClick={() => setNotifyModalOpen(true)}
										className='w-full py-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg'
									>
										<Bell size={16} />
										<span>NOTIFY ME WHEN AVAILABLE</span>
									</button>
									<p className='text-[11px] text-center text-neutral-500 dark:text-neutral-400'>
										This selection is currently out of stock. We'll send you an instant alert when it arrives.
									</p>
								</div>
							) : (
								<button
									type='button'
									onClick={handleAddToCart}
									className='w-full py-4 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-black uppercase tracking-[0.2em] hover:opacity-85 transition-opacity shadow-sm'
								>
									ADD +
								</button>
							)}
						</div>

						{/* Expandable Accordions: Delivery, Description & Fit, Reviews, Returns (Screenshots 1 & 3) */}
						<div className='border-t border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800 pt-1'>
							{/* 1. DELIVERY ACCORDION */}
							<div className='py-4'>
								<button
									type='button'
									onClick={() => toggleAccordion("delivery")}
									className='w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-neutral-950 dark:text-white'
								>
									<span>DELIVERY</span>
									{accordionState.delivery ? <Minus size={15} /> : <Plus size={15} />}
								</button>

								{accordionState.delivery && (
									<div className='mt-3 space-y-3 text-xs'>
										<form onSubmit={handleCheckPincode} className='flex items-center gap-2'>
											<div className='relative flex-1'>
												<input
													type='text'
													maxLength={6}
													value={pincode}
													onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
													placeholder='Enter Pincode'
													className='w-full px-3.5 py-2.5 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-950'
												/>
											</div>
											<button
												type='submit'
												disabled={pincodeChecking || !pincode.trim()}
												className='px-5 py-2.5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold uppercase tracking-wider hover:opacity-85 disabled:opacity-50'
											>
												{pincodeChecking ? "CHECKING..." : "CHECK"}
											</button>
										</form>

										{/* Helper message if no size selected yet (matches Screenshot 1) */}
										{!selectedSize && (
											<div className='p-2.5 bg-[#fdf2ee] dark:bg-[#331c17] text-[#e05338] text-[11px] font-semibold'>
												Please select your size to check delivery date
											</div>
										)}

										{/* Live Shiprocket Serviceability Result */}
										{pincodeResult && (
											<div
												className={`p-3 border text-xs ${
													pincodeResult.serviceable
														? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
														: "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
												}`}
											>
												<div className='flex items-center gap-1.5 font-bold uppercase tracking-wider mb-1'>
													<Truck size={14} />
													<span>
														{pincodeResult.serviceable
															? `Delivering to PIN ${pincode}`
															: "Area Unserviceable"}
													</span>
												</div>
												<p className='text-[11px] leading-relaxed'>
													{pincodeResult.serviceable
														? `Delivery by ${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
																weekday: "short",
																month: "short",
																day: "numeric",
														  })} • Express Courier Service`
														: pincodeResult.message || "Currently unavailable for this pin code."}
												</p>
											</div>
										)}

										{pincodeError && (
											<p className='text-rose-600 text-xs font-medium'>{pincodeError}</p>
										)}
									</div>
								)}
							</div>

							{/* 2. DESCRIPTION & FIT ACCORDION */}
							<div className='py-4'>
								<button
									type='button'
									onClick={() => toggleAccordion("description")}
									className='w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-neutral-950 dark:text-white'
								>
									<span>DESCRIPTION & FIT</span>
									{accordionState.description ? <Minus size={15} /> : <Plus size={15} />}
								</button>

								{accordionState.description && (
									<div className='mt-3 space-y-3 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed'>
										<p>{currentProduct.description}</p>
										<div className='pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5 text-[11px] font-medium'>
											<p>
												<strong className='text-neutral-900 dark:text-white'>Fabric:</strong> 100% Cotton Virgin Oxford Weave
											</p>
											<p>
												<strong className='text-neutral-900 dark:text-white'>Fit:</strong> Tailored Regular Fit
											</p>
											<p>
												<strong className='text-neutral-900 dark:text-white'>Wash Care:</strong> Machine wash cold with like colours. Tumble dry low.
											</p>
											<p>
												<strong className='text-neutral-900 dark:text-white'>Model Height:</strong> 6&apos;1&quot; wearing size L
											</p>
										</div>
									</div>
								)}
							</div>

							{/* 3. REVIEWS ACCORDION */}
							<div className='py-4'>
								<button
									type='button'
									onClick={() => toggleAccordion("reviews")}
									className='w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-neutral-950 dark:text-white'
								>
									<span>REVIEWS ({reviews.length || currentProduct.numReviews || 0})</span>
									{accordionState.reviews ? <Minus size={15} /> : <Plus size={15} />}
								</button>

								{accordionState.reviews && (
									<div className='mt-3 space-y-3 text-xs'>
										<div className='flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800'>
											<div className='flex items-center gap-1.5'>
												<span className='text-base font-black text-neutral-950 dark:text-white'>
													{averageRating}
												</span>
												<div className='flex items-center text-neutral-900 dark:text-white'>
													{[1, 2, 3, 4, 5].map((s) => (
														<Star
															key={s}
															size={12}
															className={s <= Math.round(averageRating) ? "fill-neutral-950 dark:fill-white" : "text-neutral-300 dark:text-neutral-700"}
														/>
													))}
												</div>
											</div>
											<button
												type='button'
												disabled={isCheckingEligibility}
												onClick={handleOpenReviewModal}
												className='text-xs font-bold uppercase tracking-wider text-neutral-950 dark:text-white underline hover:opacity-75 disabled:opacity-50'
											>
												{isCheckingEligibility ? "Verifying..." : "Write Review"}
											</button>
										</div>

										{/* Reviews List */}
										{reviews && reviews.length > 0 ? (
											<div className='space-y-3 max-h-60 overflow-y-auto pr-1'>
												{reviews.map((rev) => (
													<div key={rev._id} className='p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1.5'>
														<div className='flex items-center justify-between'>
															<div className='flex items-center gap-1.5'>
																<span className='font-bold text-neutral-900 dark:text-white text-[11px]'>
																	{rev.name || "Verified Patron"}
																</span>
																<span className='inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded'>
																	<CheckCircle2 size={10} />
																	<span>Verified Buyer</span>
																</span>
															</div>
															<span className='text-[10px] text-neutral-400'>
																{new Date(rev.createdAt).toLocaleDateString("en-IN")}
															</span>
														</div>
														<div className='flex items-center'>
															{[1, 2, 3, 4, 5].map((s) => (
																<Star
																	key={s}
																	size={10}
																	className={s <= rev.rating ? "fill-neutral-950 dark:fill-white text-neutral-950 dark:text-white" : "text-neutral-300 dark:text-neutral-700"}
																/>
															))}
														</div>
														{rev.title && (
															<h4 className='font-bold text-xs text-neutral-900 dark:text-white'>
																{rev.title}
															</h4>
														)}
														<p className='text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed'>
															{rev.comment}
														</p>
														{Array.isArray(rev.images) && rev.images.length > 0 && (
															<div className='flex items-center gap-1.5 pt-1 flex-wrap'>
																{rev.images.map((img, i) => (
																	<a key={i} href={img} target='_blank' rel='noopener noreferrer'>
																		<img
																			src={img}
																			alt='Customer photo'
																			className='w-12 h-12 object-cover border border-neutral-200 dark:border-neutral-700 hover:opacity-80 transition-opacity'
																		/>
																	</a>
																))}
															</div>
														)}
													</div>
												))}
											</div>
										) : (
											<p className='text-neutral-400 text-xs italic'>
												No reviews submitted yet. Be the first to share your thoughts!
											</p>
										)}
									</div>
								)}
							</div>

							{/* 4. RETURNS ACCORDION */}
							<div className='py-4'>
								<button
									type='button'
									onClick={() => toggleAccordion("returns")}
									className='w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-neutral-950 dark:text-white'
								>
									<span>RETURNS & EXCHANGES</span>
									{accordionState.returns ? <Minus size={15} /> : <Plus size={15} />}
								</button>

								{accordionState.returns && (
									<div className='mt-3 space-y-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed'>
										<p>
											We offer a complimentary <strong>7-day return and exchange policy</strong> on all apparel pieces.
										</p>
										<p>
											Our courier partner will arrange doorstep pickup at zero charge. Garments must be unwashed, unworn, and retain all original designer tags.
										</p>
										<p className='text-[11px] text-neutral-500 pt-1'>
											Refunds are processed back to your original payment method within 24-48 hours of inspection.
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* BOTTOM SECTION: "YOU MAY ALSO LIKE" (Screenshot 5 Reference) */}
				{combinedRelated && combinedRelated.length > 0 && (
					<section className='mt-24 pt-12 border-t border-neutral-200 dark:border-neutral-800'>
						<div className='mb-8'>
							<h3 className='text-xl sm:text-2xl font-light font-heading uppercase tracking-tight text-neutral-900 dark:text-white leading-none'>
								YOU MAY <span className='font-black'>ALSO LIKE</span>
							</h3>
						</div>

						{/* 5-Column Responsive Product Grid */}
						<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6'>
							{combinedRelated.map((product) => (
								<ProductCard key={product._id} product={product} />
							))}
						</div>
					</section>
				)}
			</div>

			{/* INTELLIGENT SIZE GUIDE MODAL */}
			<SizeGuideModal
				isOpen={isSizeGuideOpen}
				onClose={() => setIsSizeGuideOpen(false)}
				category={currentProduct?.category || "shirts"}
				productName={currentProduct?.name}
			/>

			{/* WRITE / UPDATE REVIEW MODAL */}
			{isReviewOpen && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in'>
					<div className='bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 max-w-md w-full p-6 shadow-2xl relative'>
						<div className='flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800'>
							<div>
								<span className='text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400'>
									Verified Buyer Review
								</span>
								<h3 className='text-sm font-black uppercase tracking-wider text-neutral-950 dark:text-white mt-0.5 truncate max-w-xs'>
									{existingReviewId ? "Update Review:" : "Review"} {currentProduct.name}
								</h3>
							</div>
							<button
								type='button'
								onClick={() => setIsReviewOpen(false)}
								className='p-1 text-neutral-400 hover:text-black dark:hover:text-white'
							>
								<X size={18} />
							</button>
						</div>

						<form onSubmit={handleAddReviewSubmit} className='mt-4 space-y-4'>
							<div>
								<label className='block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5'>
									Rating
								</label>
								<div className='flex items-center gap-2'>
									{[1, 2, 3, 4, 5].map((s) => (
										<button
											key={s}
											type='button'
											onClick={() => setReviewRating(s)}
											className='p-1 hover:scale-110 transition-transform'
										>
											<Star
												size={22}
												className={
													s <= reviewRating
														? "fill-neutral-950 dark:fill-white text-neutral-950 dark:text-white"
														: "text-neutral-300 dark:text-neutral-700"
												}
											/>
										</button>
									))}
									<span className='ml-2 text-xs font-bold text-neutral-700 dark:text-neutral-300'>
										{reviewRating} of 5 Stars
									</span>
								</div>
							</div>

							<div>
								<label className='block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5'>
									Headline / Title (Optional)
								</label>
								<input
									type='text'
									value={reviewTitle}
									onChange={(e) => setReviewTitle(e.target.value)}
									placeholder='e.g., Exquisite fit, incredible quality'
									className='w-full p-2.5 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white bg-white dark:bg-neutral-950 focus:outline-none focus:border-neutral-950'
								/>
							</div>

							<div>
								<label className='block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5'>
									Your Feedback
								</label>
								<textarea
									rows={3}
									required
									value={reviewComment}
									onChange={(e) => setReviewComment(e.target.value)}
									placeholder='How did the fit, fabric, and silhouette suit your style?'
									className='w-full p-3 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white bg-white dark:bg-neutral-950 focus:outline-none focus:border-neutral-950'
								/>
							</div>

							<div>
								<label className='block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5'>
									Product Photos (Optional)
								</label>
								<div className='flex gap-2'>
									<input
										type='url'
										value={reviewImageUrl}
										onChange={(e) => setReviewImageUrl(e.target.value)}
										placeholder='Paste photo image URL (https://...)'
										className='flex-1 p-2 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white bg-white dark:bg-neutral-950 focus:outline-none'
									/>
									<button
										type='button'
										onClick={() => {
											if (reviewImageUrl.trim()) {
												setReviewImages([...reviewImages, reviewImageUrl.trim()]);
												setReviewImageUrl("");
											}
										}}
										className='px-3 py-2 bg-neutral-200 dark:bg-neutral-800 text-xs font-bold uppercase'
									>
										Add
									</button>
								</div>
								{reviewImages.length > 0 && (
									<div className='flex gap-2 mt-2 flex-wrap'>
										{reviewImages.map((img, idx) => (
											<div key={idx} className='relative group'>
												<img src={img} alt='' className='w-12 h-12 object-cover border border-neutral-300' />
												<button
													type='button'
													onClick={() => setReviewImages(reviewImages.filter((_, i) => i !== idx))}
													className='absolute -top-1 -right-1 bg-black text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center'
												>
													×
												</button>
											</div>
										))}
									</div>
								)}
							</div>

							<div className='flex items-center justify-end gap-3 pt-2'>
								<button
									type='button'
									onClick={() => setIsReviewOpen(false)}
									className='px-4 py-2.5 text-xs font-bold uppercase text-neutral-500 hover:text-black dark:hover:text-white'
								>
									Cancel
								</button>
								<button
									type='submit'
									disabled={submittingReview}
									className='px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider hover:opacity-85 disabled:opacity-50'
								>
									{submittingReview
										? "Submitting..."
										: existingReviewId
										? "Update Review"
										: "Submit Review"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* INELIGIBLE TO REVIEW NOTICE MODAL */}
			{ineligibleModalOpen && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in'>
					<div className='bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 max-w-md w-full p-6 shadow-2xl relative text-center'>
						<div className='w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4 text-neutral-700 dark:text-neutral-300'>
							<ShieldAlert size={24} />
						</div>
						<h3 className='text-sm font-black uppercase tracking-wider text-neutral-950 dark:text-white mb-2'>
							Verified Purchase Required
						</h3>
						<p className='text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6'>
							{ineligibleReason}
						</p>
						<button
							type='button'
							onClick={() => setIneligibleModalOpen(false)}
							className='w-full py-3 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-widest hover:opacity-85 transition-opacity'
						>
							Understood
						</button>
					</div>
				</div>
			)}

			{/* LUXURY PRODUCT SHARE MODAL */}
			<ProductShareModal
				isOpen={shareModalOpen}
				onClose={() => setShareModalOpen(false)}
				product={currentProduct}
			/>

			{/* OUT-OF-STOCK NOTIFY ME MODAL */}
			<NotifyMeModal
				isOpen={notifyModalOpen}
				onClose={() => setNotifyModalOpen(false)}
				product={currentProduct}
				selectedSize={selectedSize}
				selectedColor={selectedColor}
				selectedVariantId={activeVariant?._id}
			/>
		</div>
	);
};

export default ProductDetailPage;
