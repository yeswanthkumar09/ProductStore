import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useCampaignSlideStore } from "../stores/useCampaignSlideStore";

const staticSlides = [
	{
		id: "bestsellers-30",
		badge: "LIMITED EDITION",
		leftHeadline: "LAST FEW",
		leftSubheadline: "BESTSELLERS LEFT",
		rightHeadline: "UP TO 30% OFF",
		rightSubheadline: "CURATED FOR DISCERNING TASTEMAKERS",
		ctaText: "SHOP BESTSELLERS",
		ctaLink: "/sales",
		image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1920&q=85",
		mobileImage: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=85",
		bgColor: "bg-neutral-950",
		textColor: "text-white",
	},
	{
		id: "never-before-prices",
		badge: "SEASON PRIVILEGE",
		leftHeadline: "NEVER BEFORE",
		leftSubheadline: "PRICES",
		rightHeadline: "STARTING ₹999",
		rightSubheadline: "LIMITED RUN OF OUR SIGNATURE CUTS",
		ctaText: "EXPLORE OFFERS",
		ctaLink: "/search",
		image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1920&q=85",
		mobileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=85",
		bgColor: "bg-neutral-950",
		textColor: "text-white",
		offerPills: [
			{ title: "3 TOP WEAR", price: "₹2,699", link: "/category/t-shirts" },
			{ title: "2 BOTTOM WEAR", price: "₹2,899", link: "/category/jeans" },
			{ title: "SUNGLASSES", price: "₹999", link: "/category/glasses" },
			{ title: "PERFUMES", price: "50% OFF", link: "/category/perfumes" },
		],
	},
	{
		id: "autumn-winter-2026",
		badge: "NEW ARRIVALS",
		leftHeadline: "AUTUMN / WINTER",
		leftSubheadline: "EDITION 2026",
		rightHeadline: "NEW ARRIVALS",
		rightSubheadline: "TEXTURED LINENS, CASHMERE & RAW SELVEDGE",
		ctaText: "VIEW COLLECTION",
		ctaLink: "/category/jackets",
		image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1920&q=85",
		mobileImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=85",
		bgColor: "bg-neutral-950",
		textColor: "text-white",
	},
];

const AUTOPLAY_INTERVAL = 5000; // Exactly 5 seconds
const TRANSITION_DURATION = 700; // 700ms smooth transition

const EditorialHeroCarousel = ({ activeSales = [] }) => {
	const { slides: dynamicSlides, fetchActiveSlides } = useCampaignSlideStore();
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

	const timerRef = useRef(null);
	const touchStartRef = useRef({ x: 0, y: 0 });
	const isSwipingRef = useRef(false);

	useEffect(() => {
		fetchActiveSlides();
	}, [fetchActiveSlides]);

	// Detect reduced motion preference
	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		setPrefersReducedMotion(mediaQuery.matches);
		const handler = (e) => setPrefersReducedMotion(e.matches);
		if (mediaQuery.addEventListener) {
			mediaQuery.addEventListener("change", handler);
			return () => mediaQuery.removeEventListener("change", handler);
		} else if (mediaQuery.addListener) {
			mediaQuery.addListener(handler);
			return () => mediaQuery.removeListener(handler);
		}
	}, []);

	// Dynamic slides assembly from backend or fallback to initial slides
	const activePool = dynamicSlides && dynamicSlides.length > 0 ? dynamicSlides : staticSlides;

	const slides = activePool.map((slide, idx) => {
		if (idx === 0 && activeSales.length > 0) {
			const primarySale = activeSales[0];
			return {
				...slide,
				rightHeadline: `UP TO ${primarySale.discountValue}% OFF`,
				rightSubheadline: primarySale.description || slide.rightSubheadline,
				leftSubheadline: primarySale.name?.toUpperCase() || slide.leftSubheadline,
				badge: primarySale.badgeText || slide.badge,
				image: primarySale.bannerImage || slide.image,
			};
		}
		return slide;
	});

	const slidesCount = slides.length;

	const nextSlide = useCallback(() => {
		if (slidesCount <= 1) return;
		setCurrentIndex((prev) => (prev + 1) % slidesCount);
	}, [slidesCount]);

	const prevSlide = useCallback(() => {
		if (slidesCount <= 1) return;
		setCurrentIndex((prev) => (prev - 1 + slidesCount) % slidesCount);
	}, [slidesCount]);

	const goToSlide = useCallback((idx) => {
		setCurrentIndex(idx);
	}, []);

	// Handle empty state gracefully
	if (slidesCount === 0) {
		return null;
	}

	// Robust timer with strict singleton ref cleanup
	useEffect(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}

		if (!isPaused && slidesCount > 1) {
			timerRef.current = setInterval(() => {
				nextSlide();
			}, AUTOPLAY_INTERVAL);
		}

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [isPaused, slidesCount, nextSlide]);

	// Keyboard arrow navigation
	const handleKeyDown = (e) => {
		if (e.key === "ArrowLeft") {
			e.preventDefault();
			prevSlide();
		} else if (e.key === "ArrowRight") {
			e.preventDefault();
			nextSlide();
		}
	};

	// Touch swipe handlers
	const handleTouchStart = (e) => {
		setIsPaused(true);
		const touch = e.touches[0];
		touchStartRef.current = { x: touch.clientX, y: touch.clientY };
		isSwipingRef.current = true;
	};

	const handleTouchMove = (e) => {
		if (!isSwipingRef.current) return;
		const touch = e.touches[0];
		const diffX = touchStartRef.current.x - touch.clientX;
		const diffY = touchStartRef.current.y - touch.clientY;

		// If horizontal swipe is dominant, prevent vertical scroll jank
		if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
			if (e.cancelable) e.preventDefault();
		}
	};

	const handleTouchEnd = (e) => {
		if (!isSwipingRef.current) return;
		isSwipingRef.current = false;
		const touch = e.changedTouches[0];
		const diffX = touchStartRef.current.x - touch.clientX;
		const diffY = touchStartRef.current.y - touch.clientY;

		// Minimum threshold for deliberate horizontal swipe (40px)
		if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
			if (diffX > 0) {
				nextSlide();
			} else {
				prevSlide();
			}
		}

		// Resume after brief delay
		setTimeout(() => setIsPaused(false), 800);
	};

	return (
		<section
			className='relative w-full overflow-hidden select-none bg-neutral-950 border-b border-neutral-800 focus:outline-none'
			onMouseEnter={() => setIsPaused(true)}
			onMouseLeave={() => setIsPaused(false)}
			onFocus={() => setIsPaused(true)}
			onBlur={() => setIsPaused(false)}
			onKeyDown={handleKeyDown}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			tabIndex={0}
			role='region'
			aria-roledescription='carousel'
			aria-label='Fashion Campaigns'
		>
			{/* Fixed multi-breakpoint height container preventing layout shifts */}
			<div className='relative h-[490px] sm:h-[560px] md:h-[630px] lg:h-[700px] w-full overflow-hidden'>
				{slides.map((slide, idx) => {
					const isActive = idx === currentIndex;
					const hasBadge = Boolean(slide.badge && slide.badge.trim());
					const hasLeftHeadline = Boolean(slide.leftHeadline && slide.leftHeadline.trim());
					const hasLeftSubheadline = Boolean(slide.leftSubheadline && slide.leftSubheadline.trim());
					const hasLeft = hasLeftHeadline || hasLeftSubheadline;

					const hasRightHeadline = Boolean(slide.rightHeadline && slide.rightHeadline.trim());
					const hasRightSubheadline = Boolean(slide.rightSubheadline && slide.rightSubheadline.trim());
					const hasRight = hasRightHeadline || hasRightSubheadline;

					const hasCta = Boolean(slide.ctaText && slide.ctaText.trim() && slide.ctaLink && slide.ctaLink.trim());
					const hasOfferPills = Boolean(slide.offerPills && slide.offerPills.length > 0);
					const hasAnyText = hasBadge || hasLeft || hasRight || hasCta || hasOfferPills;

					return (
						<div
							key={slide._id || slide.id || idx}
							className={`absolute inset-0 w-full h-full ${slide.bgColor || "bg-[#f5f5f7]"} ${
								isActive ? "z-10 pointer-events-auto" : "z-0 pointer-events-none"
							}`}
							style={{
								opacity: isActive ? 1 : 0,
								transition: prefersReducedMotion
									? "none"
									: `opacity ${TRANSITION_DURATION}ms cubic-bezier(0.25, 1, 0.5, 1), transform ${TRANSITION_DURATION}ms cubic-bezier(0.25, 1, 0.5, 1)`,
								transform: isActive
									? "scale(1) translateX(0)"
									: "scale(1.02) translateX(0)",
							}}
							aria-hidden={!isActive}
							role='tabpanel'
							aria-roledescription='slide'
							aria-label={`${idx + 1} of ${slidesCount}${hasLeft ? `: ${slide.leftHeadline} ${slide.leftSubheadline}`.trim() : ""}`}
						>
							{/* Large Campaign Image with high-priority preload on first slide */}
							<picture className='absolute inset-0 w-full h-full'>
								<source media='(max-width: 640px)' srcSet={slide.mobileImage || slide.image} />
								<img
									src={slide.image}
									alt={hasLeft ? `${slide.leftHeadline || ""} ${slide.leftSubheadline || ""}`.trim() : (slide.badge || "LUXESTORE Campaign")}
									className='w-full h-full object-cover object-top md:object-center'
									loading={idx === 0 ? "eager" : "lazy"}
									decoding='async'
									onError={(e) => {
										e.currentTarget.src = "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1920&q=85";
									}}
								/>
							</picture>

							{/* Optional whole-slide link if image-only banner has ctaLink but no ctaText */}
							{!hasCta && slide.ctaLink && slide.ctaLink.trim() && (
								<Link
									to={slide.ctaLink.trim()}
									className='absolute inset-0 z-10 w-full h-full'
									aria-label='Explore Campaign'
								/>
							)}

							{/* Scrim Overlay: Gradient contrast only when text exists, subtle bottom gradient for image-only */}
							{hasAnyText ? (
								<div className='absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/80 pointer-events-none' />
							) : (
								<div className='absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none' />
							)}

							{/* Editorial Headline and Content Grid (rendered only when content exists) */}
							{hasAnyText && (
								<div className='relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 h-full flex flex-col justify-between py-10 md:py-16 pointer-events-none'>
									{/* Top Tagline / Campaign Pill */}
									<div className='flex items-center gap-2 min-h-[24px]'>
										{hasBadge && (
											<span className='px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.25em] bg-white text-black shadow-sm pointer-events-auto'>
												{slide.badge.trim()}
											</span>
										)}
									</div>

									{/* Center Editorial Typography */}
									{(hasLeft || hasRight || hasCta) && (
										<div
											className={`grid grid-cols-1 ${
												hasLeft && (hasRight || hasCta)
													? "md:grid-cols-2 gap-6"
													: "max-w-2xl"
											} items-center my-auto pointer-events-auto`}
										>
											{/* Left Column Headline */}
											{hasLeft && (
												<div className='max-w-xl'>
													<h2 className='text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light font-heading uppercase tracking-tight text-white leading-[1.05]'>
														{hasLeftHeadline && <span>{slide.leftHeadline.trim()}</span>}
														{hasLeftSubheadline && (
															<span className='block font-black tracking-tight mt-1'>
																{slide.leftSubheadline.trim()}
															</span>
														)}
													</h2>
												</div>
											)}

											{/* Right Column Promotional Text & CTA */}
											{(hasRight || hasCta) && (
												<div
													className={`flex flex-col justify-center ${
														hasLeft
															? "md:text-right md:items-end"
															: "text-left items-start"
													}`}
												>
													{hasRightHeadline && (
														<p className='text-2xl sm:text-4xl md:text-5xl font-black font-heading uppercase tracking-tight text-white'>
															{slide.rightHeadline.trim()}
														</p>
													)}
													{hasRightSubheadline && (
														<p className='text-xs sm:text-sm font-semibold tracking-widest uppercase text-neutral-300 mt-2 max-w-sm'>
															{slide.rightSubheadline.trim()}
														</p>
													)}
													{hasCta && (
														<div className='mt-6'>
															<Link
																to={slide.ctaLink.trim()}
																className='inline-flex items-center gap-2.5 px-8 py-4 bg-white text-black hover:bg-neutral-200 active:bg-neutral-300 text-xs font-bold tracking-widest uppercase transition-all shadow-lg pointer-events-auto'
															>
																<span>{slide.ctaText.trim()}</span>
																<ArrowRight size={14} />
															</Link>
														</div>
													)}
												</div>
											)}
										</div>
									)}

									{/* Bottom Floating Offer Cards */}
									{hasOfferPills ? (
										<div className='grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 pt-4 border-t border-neutral-300/80 dark:border-neutral-700/80 pointer-events-auto'>
											{slide.offerPills.map((pill, pIdx) => (
												<Link
													key={pIdx}
													to={pill.link}
													className='bg-white/95 dark:bg-neutral-900/90 backdrop-blur-md p-3 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between hover:-translate-y-0.5 transition-transform shadow-sm'
												>
													<div>
														<p className='text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'>
															{pill.title}
														</p>
														<p className='text-sm sm:text-base font-black text-neutral-950 dark:text-white'>
															{pill.price}
														</p>
													</div>
													<ArrowRight size={14} className='text-neutral-400' />
												</Link>
											))}
										</div>
									) : (
										(hasLeft || hasRight || hasCta) && (
											<div className='flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-neutral-500'>
												<span>Handmade In India</span>
												<span>Signature Fit</span>
												<span>Guaranteed Authenticity</span>
											</div>
										)
									)}
								</div>
							)}
						</div>
					);
				})}

				{/* Previous & Next Control Arrows */}
				<button
					type='button'
					onClick={(e) => {
						e.stopPropagation();
						prevSlide();
					}}
					aria-label='Previous Campaign Slide'
					className='absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-neutral-900/80 backdrop-blur-sm text-white border border-neutral-700/80 flex items-center justify-center hover:bg-neutral-900 transition-all shadow-md hover:scale-105 active:scale-95'
				>
					<ChevronLeft size={22} />
				</button>
				<button
					type='button'
					onClick={(e) => {
						e.stopPropagation();
						nextSlide();
					}}
					aria-label='Next Campaign Slide'
					className='absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-neutral-900/80 backdrop-blur-sm text-white border border-neutral-700/80 flex items-center justify-center hover:bg-neutral-900 transition-all shadow-md hover:scale-105 active:scale-95'
				>
					<ChevronRight size={22} />
				</button>

				{/* Clickable Slide Indicators */}
				<div className='absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2'>
					{slides.map((_, sIdx) => {
						const isSelected = sIdx === currentIndex;
						return (
							<button
								key={sIdx}
								type='button'
								onClick={(e) => {
									e.stopPropagation();
									goToSlide(sIdx);
								}}
								aria-label={`Go to slide ${sIdx + 1}`}
								className={`h-1.5 transition-all rounded-full ${
									isSelected
										? "w-8 bg-white"
										: "w-2 bg-neutral-500 hover:bg-neutral-300"
								}`}
							/>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default EditorialHeroCarousel;
