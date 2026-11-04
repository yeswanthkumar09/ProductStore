import { useState, useEffect, useRef, useMemo } from "react";
import {
	Search,
	ShoppingBag,
	Heart,
	User as UserIcon,
	Menu,
	X,
	ArrowRight,
	MapPin,
	Lock,
	LogOut,
	Sparkles,
	Clock,
	Trash2,
	HelpCircle,
	History,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import BrandLogo from "./BrandLogo";
import AnnouncementBar from "./AnnouncementBar";
import ThemeSelector from "./ThemeSelector";
import axios from "../lib/axios";

// 3-Column Category Navigation Architecture matching reference screenshot media_1793458333940_b68ddcb7.png
const megaMenuColumns = [
	{
		title: "Column 1",
		items: [
			{ name: "ALL", path: "/category/all" },
			{ name: "OUTERWEAR", path: "/category/jackets" },
			{ name: "T-SHIRTS | POLO", path: "/category/t-shirts" },
			{ name: "INNERWEAR", path: "/category/innerwear", badge: "NEW" },
			{ name: "JOGGERS", path: "/category/trousers" },
			{ name: "LUGGAGE", path: "/category/bags" },
			{ name: "BAGS", path: "/category/bags" },
			{ name: "LINEN EDIT", path: "/search?q=linen" },
			{ name: "SNITCH LUXE", path: "/category/luxury", badge: "PREMIUM" },
		],
	},
	{
		title: "Column 2",
		items: [
			{ name: "SHOP ALL", path: "/search" },
			{ name: "FESTIVE EDIT", path: "/search?q=festive" },
			{ name: "JEANS", path: "/category/jeans" },
			{ name: "FOOTWEAR", path: "/category/shoes" },
			{ name: "SHORTS", path: "/category/shorts" },
			{ name: "PERFUMES", path: "/category/perfumes", badge: "FLAT 50% OFF" },
			{ name: "BELTS", path: "/category/accessories" },
			{ name: "BASICS | CORE LAB", path: "/search?q=basics" },
			{ name: "CELEB COLLABS", path: "/search?q=collab" },
		],
	},
	{
		title: "Column 3",
		items: [
			{ name: "BESTSELLERS", path: "/search?sort=popular" },
			{ name: "SHIRTS", path: "/category/shirts" },
			{ name: "TROUSERS", path: "/category/trousers" },
			{ name: "CARGO PANTS", path: "/category/cargo" },
			{ name: "OVERSHIRTS", path: "/category/overshirt" },
			{ name: "ACCESSORIES", path: "/category/accessories" },
			{ name: "SUNGLASSES", path: "/category/glasses", badge: "AT ₹999" },
			{ name: "SNITCH PLUS", path: "/search?size=3XL", badge: "3XL - 6XL" },
			{ name: "PRICE DROP", path: "/sales", isPriceDrop: true },
		],
	},
];

const Navbar = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { user, logout } = useUserStore();
	const isAdmin = user?.role === "admin";
	const { cart } = useCartStore();
	const { wishlist } = useWishlistStore();
	const { categories: dynamicCategories, fetchCategories } = useCategoryStore();

	const [drawerOpen, setDrawerOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [suggestions, setSuggestions] = useState([]);
	const [popularSearches, setPopularSearches] = useState([]);
	const [recentSearches, setRecentSearches] = useState([]);
	const [searching, setSearching] = useState(false);

	const searchInputRef = useRef(null);

	const totalCartCount = (cart || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
	const totalWishlistCount = (wishlist || []).length;

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	// Build dynamic 3-column mega menu from active categories
	const activeMegaMenuColumns = useMemo(() => {
		const activeCats = (dynamicCategories || []).filter((c) => !c.isArchived && c.isActive);
		if (activeCats.length === 0) return megaMenuColumns;

		const third = Math.ceil(activeCats.length / 3);
		const col1 = [
			{ name: "ALL", path: "/category/all" },
			{ name: "SHOP ALL", path: "/search" },
			...activeCats.slice(0, third).map((c) => ({
				name: (typeof c.name === "string" ? c.name : c.slug || "").toUpperCase(),
				path: `/category/${c.slug}`,
			})),
			{ name: "LINEN EDIT", path: "/search?q=linen" },
		];

		const col2 = [
			{ name: "BESTSELLERS", path: "/search?sort=popular" },
			...activeCats.slice(third, 2 * third).map((c) => ({
				name: (typeof c.name === "string" ? c.name : c.slug || "").toUpperCase(),
				path: `/category/${c.slug}`,
			})),
			{ name: "FESTIVE EDIT", path: "/search?q=festive" },
			{ name: "BASICS | CORE LAB", path: "/search?q=basics" },
		];

		const col3 = [
			{ name: "NEW ARRIVALS", path: "/search?sort=newest" },
			...activeCats.slice(2 * third).map((c) => ({
				name: (typeof c.name === "string" ? c.name : c.slug || "").toUpperCase(),
				path: `/category/${c.slug}`,
			})),
			{ name: "PRICE DROP", path: "/sales", isPriceDrop: true },
		];

		return [
			{ title: "Column 1", items: col1 },
			{ title: "Column 2", items: col2 },
			{ title: "Column 3", items: col3 },
		];
	}, [dynamicCategories]);

	// Load recent searches from localStorage
	useEffect(() => {
		try {
			const saved = JSON.parse(localStorage.getItem("recent_searches") || "[]");
			if (Array.isArray(saved)) setRecentSearches(saved);
		} catch (e) {}
	}, []);

	// Fetch popular searches from backend
	useEffect(() => {
		axios
			.get("/products/popular-searches")
			.then((res) => {
				if (Array.isArray(res.data)) setPopularSearches(res.data);
			})
			.catch(() => {});
	}, []);

	// Auto-close drawer & search on route change
	useEffect(() => {
		setDrawerOpen(false);
		setSearchOpen(false);
		setSearchQuery("");
	}, [location.pathname]);

	// Lock body scroll when drawer or search overlay is open
	useEffect(() => {
		if (drawerOpen || searchOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [drawerOpen, searchOpen]);

	// Auto focus search input when search opens
	useEffect(() => {
		if (searchOpen && searchInputRef.current) {
			setTimeout(() => {
				searchInputRef.current?.focus();
			}, 100);
		}
	}, [searchOpen]);

	// Debounced search suggestions
	useEffect(() => {
		if (!searchQuery.trim() || searchQuery.trim().length < 2) {
			setSuggestions([]);
			return;
		}

		const timer = setTimeout(async () => {
			setSearching(true);
			try {
				const res = await axios.get(
					`/products/search?q=${encodeURIComponent(searchQuery.trim())}&limit=6`
				);
				setSuggestions(res.data.products || []);
			} catch (err) {
				console.error("Suggestions error:", err);
			} finally {
				setSearching(false);
			}
		}, 200);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Close on Escape key
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				setDrawerOpen(false);
				setSearchOpen(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Save search to history
	const recordSearch = (term) => {
		if (!term || !term.trim()) return;
		const clean = term.trim();
		const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(
			0,
			6
		);
		setRecentSearches(updated);
		try {
			localStorage.setItem("recent_searches", JSON.stringify(updated));
		} catch (e) {}
	};

	const removeRecentSearch = (e, term) => {
		e.stopPropagation();
		const updated = recentSearches.filter((s) => s !== term);
		setRecentSearches(updated);
		try {
			localStorage.setItem("recent_searches", JSON.stringify(updated));
		} catch (e) {}
	};

	const clearAllRecentSearches = () => {
		setRecentSearches([]);
		try {
			localStorage.removeItem("recent_searches");
		} catch (e) {}
	};

	const handleSearchSubmit = (e) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			recordSearch(searchQuery.trim());
			navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
			setSearchOpen(false);
			setSearchQuery("");
		}
	};

	const handleSelectSuggestion = (productId, productName) => {
		if (productName) recordSearch(productName);
		setSearchOpen(false);
		setSearchQuery("");
		navigate(`/product/${productId}`);
	};

	return (
		<>
			{/* Top Announcement Bar */}
			<AnnouncementBar />

			{/* Main Global Header */}
			<header className='sticky top-0 z-40 w-full bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between'>
					{/* LEFT: Hamburger Menu Button */}
					<div className='flex items-center gap-3 w-1/3 justify-start'>
						<button
							type='button'
							onClick={() => setDrawerOpen(true)}
							className='p-1.5 -ml-1.5 text-neutral-900 dark:text-neutral-100 hover:opacity-70 transition-opacity focus:outline-none'
							aria-label='Open Navigation Menu'
						>
							<Menu size={22} strokeWidth={1.8} />
						</button>
					</div>

					{/* CENTER: Independently Centered Brand Logo */}
					<div className='flex items-center justify-center w-1/3 text-center'>
						<BrandLogo size='md' variant='editorial' linkTo='/' />
					</div>

					{/* RIGHT: Search, Wishlist, Bag, Concierge Help, Account Icons */}
					<div className='flex items-center justify-end gap-3 sm:gap-4 w-1/3'>
						{/* Search Button */}
						<button
							type='button'
							onClick={() => setSearchOpen(true)}
							className='p-1 text-neutral-900 dark:text-neutral-100 hover:opacity-70 transition-opacity focus:outline-none'
							aria-label='Search Catalog'
							title='Search'
						>
							<Search size={20} strokeWidth={1.8} />
						</button>

						{/* Concierge Help Center */}
						<Link
							to='/help'
							className='p-1 text-neutral-900 dark:text-neutral-100 hover:opacity-70 transition-opacity focus:outline-none'
							aria-label='Customer Support & FAQs'
							title='Help & Support'
						>
							<HelpCircle size={20} strokeWidth={1.8} />
						</Link>

						{/* Shopping Bag with Real Count Badge */}
						<Link
							to='/cart'
							className='relative p-1 text-neutral-900 dark:text-neutral-100 hover:opacity-70 transition-opacity focus:outline-none'
							aria-label='View Shopping Bag'
							title='Shopping Bag'
						>
							<ShoppingBag size={20} strokeWidth={1.8} />
							{totalCartCount > 0 && (
								<span className='absolute -top-1 -right-1 bg-black dark:bg-white text-white dark:text-black rounded-full h-4 min-w-[16px] px-1 text-[9px] font-bold flex items-center justify-center shadow-sm select-none pointer-events-none'>
									{totalCartCount}
								</span>
							)}
						</Link>

						{/* Wishlist with Real Count Badge */}
						<Link
							to='/wishlist'
							className='relative p-1 text-neutral-900 dark:text-neutral-100 hover:opacity-70 transition-opacity focus:outline-none'
							aria-label='View Wishlist'
							title='Wishlist'
						>
							<Heart size={20} strokeWidth={1.8} />
							{user && totalWishlistCount > 0 && (
								<span className='absolute -top-1 -right-1 bg-black dark:bg-white text-white dark:text-black rounded-full h-4 min-w-[16px] px-1 text-[9px] font-bold flex items-center justify-center shadow-sm select-none pointer-events-none'>
									{totalWishlistCount}
								</span>
							)}
						</Link>

						{/* Theme & Display Selector (Manual Dark/Light and Accents) */}
						<ThemeSelector />

						{/* Account Icon */}
						<Link
							to={user ? "/profile" : "/login"}
							className='p-1 text-neutral-900 dark:text-neutral-100 hover:opacity-70 transition-opacity focus:outline-none'
							aria-label={user ? "View Account" : "Log In"}
							title={user ? user.name : "Account"}
						>
							<UserIcon size={20} strokeWidth={1.8} />
						</Link>
					</div>
				</div>
			</header>

			{/* ======================================================== */}
			{/* 3-COLUMN EDITORIAL MEGA MENU DRAWER                      */}
			{/* Matching Screenshot media_1793458333940_b68ddcb7.png      */}
			{/* ======================================================== */}
			{drawerOpen && (
				<div className='fixed inset-0 z-50 flex'>
					{/* Backdrop */}
					<div
						className='fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in'
						onClick={() => setDrawerOpen(false)}
					/>

					{/* Mega Menu Container */}
					<div className='relative w-full max-w-4xl bg-white dark:bg-[#0c0c0e] text-neutral-900 dark:text-neutral-100 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300 overflow-y-auto'>
						{/* Mega Menu Header */}
						<div className='p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between'>
							<BrandLogo size='md' variant='editorial' linkTo='/' />
							<button
								type='button'
								onClick={() => setDrawerOpen(false)}
								className='p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-950 dark:hover:text-white transition-colors'
								aria-label='Close Navigation Menu'
							>
								<X size={22} />
							</button>
						</div>

						{/* User Status Bar */}
						<div className='px-8 py-3.5 bg-neutral-50 dark:bg-neutral-900/40 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs'>
							{user ? (
								<div className='flex items-center gap-3'>
									<span className='text-[10px] font-bold uppercase tracking-widest text-neutral-400'>
										Signed In:
									</span>
									<span className='font-bold text-neutral-900 dark:text-white capitalize'>
										{user.name}
									</span>
								</div>
							) : (
								<div className='flex items-center gap-2'>
									<span className='text-neutral-500'>Welcome to LuxeStore.</span>
									<Link to='/login' className='font-bold underline text-neutral-900 dark:text-white'>
										Sign In for Member Perks
									</Link>
								</div>
							)}
							{user && (
								<Link
									to='/profile'
									className='font-bold uppercase tracking-wider text-[11px] text-[#e05338] hover:underline'
								>
									My Account &rarr;
								</Link>
							)}
						</div>

						{/* 3-COLUMN EDITORIAL CATEGORY GRID */}
						<div className='p-8 sm:p-10 flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 border-b border-neutral-100 dark:border-neutral-800'>
							{activeMegaMenuColumns.map((col, cIdx) => (
								<div key={cIdx} className='space-y-4'>
									{col.items.map((item, iIdx) => (
										<div key={iIdx} className='flex items-center gap-2.5'>
											<Link
												to={item.path}
												onClick={() => setDrawerOpen(false)}
												className={`text-sm sm:text-base tracking-wider uppercase transition-colors group flex items-center gap-2 ${
													item.isPriceDrop
														? "text-[#e05338] font-bold"
														: "font-semibold text-neutral-900 dark:text-neutral-100 hover:text-[#e05338] dark:hover:text-[#e05338]"
												}`}
											>
												<span className='group-hover:translate-x-0.5 transition-transform'>
													{item.name}
												</span>
											</Link>

											{/* Burgundy Badge Pill matching reference image */}
											{item.badge && (
												<span className='bg-[#6e141a] text-white text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded shadow-sm select-none'>
													{item.badge}
												</span>
											)}
										</div>
									))}
								</div>
							))}
						</div>

						{/* Secondary Links & Concierge Service */}
						<div className='p-8 bg-neutral-50/70 dark:bg-neutral-900/20 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'>
							<Link
								to='/recently-viewed'
								onClick={() => setDrawerOpen(false)}
								className='hover:text-black dark:hover:text-white flex items-center gap-2'
							>
								<History size={14} className='text-[#e05338]' />
								<span>Recently Viewed</span>
							</Link>
							<Link
								to='/help'
								onClick={() => setDrawerOpen(false)}
								className='hover:text-black dark:hover:text-white flex items-center gap-2'
							>
								<HelpCircle size={14} className='text-[#e05338]' />
								<span>Concierge &amp; Support Hub</span>
							</Link>
							<Link
								to='/orders'
								onClick={() => setDrawerOpen(false)}
								className='hover:text-black dark:hover:text-white flex items-center gap-2'
							>
								<Sparkles size={14} className='text-[#e05338]' />
								<span>Track My Orders</span>
							</Link>
							<Link
								to='/policy/shipping'
								onClick={() => setDrawerOpen(false)}
								className='hover:text-black dark:hover:text-white flex items-center gap-2'
							>
								<MapPin size={14} className='text-[#e05338]' />
								<span>Express Delivery Policy</span>
							</Link>
						</div>

						{/* Drawer Footer Actions */}
						<div className='p-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500'>
							{user ? (
								<button
									type='button'
									onClick={() => {
										logout();
										setDrawerOpen(false);
									}}
									className='flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-rose-600 font-semibold transition-colors'
								>
									<LogOut size={14} /> Sign Out
								</button>
							) : (
								<Link
									to='/signup'
									onClick={() => setDrawerOpen(false)}
									className='font-bold text-neutral-900 dark:text-white underline'
								>
									Create a New Account
								</Link>
							)}

							{isAdmin && (
								<Link
									to='/secret-dashboard'
									onClick={() => setDrawerOpen(false)}
									className='flex items-center gap-1 text-emerald-600 font-bold uppercase tracking-wider'
								>
									<Lock size={12} /> Admin Studio
								</Link>
							)}

							<span className='font-mono text-[11px]'>&copy; 2026 LUXESTORE</span>
						</div>
					</div>
				</div>
			)}

			{/* ======================================================== */}
			{/* ADVANCED FULL-WIDTH SEARCH OVERLAY (Requirement 11)      */}
			{/* ======================================================== */}
			{searchOpen && (
				<div className='fixed inset-0 z-50 flex flex-col'>
					{/* Backdrop */}
					<div
						className='fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity'
						onClick={() => setSearchOpen(false)}
					/>

					{/* Search Panel */}
					<div className='relative w-full bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white shadow-2xl z-10 border-b border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-top-4 duration-200'>
						<div className='max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8'>
							<div className='flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-4'>
								<Search size={22} className='text-neutral-400 shrink-0' />
								<form onSubmit={handleSearchSubmit} className='flex-1'>
									<input
										ref={searchInputRef}
										type='text'
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder='Search shirts, denim, sneakers, jackets, blazers...'
										className='w-full text-lg sm:text-xl md:text-2xl font-normal placeholder-neutral-400 bg-transparent border-none focus:outline-none focus:ring-0 text-neutral-950 dark:text-white'
									/>
								</form>
								{searchQuery && (
									<button
										type='button'
										onClick={() => {
											setSearchQuery("");
											setSuggestions([]);
										}}
										className='text-xs uppercase font-bold text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-2 py-1'
									>
										Clear
									</button>
								)}
								<button
									type='button'
									onClick={() => setSearchOpen(false)}
									className='p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
								>
									<X size={22} />
								</button>
							</div>

							{/* SEARCH RESULTS & ANALYTICS SECTION */}
							<div className='pt-5'>
								{searching ? (
									<p className='text-xs text-neutral-400 py-4'>Searching catalog...</p>
								) : suggestions.length > 0 ? (
									<div>
										<p className='text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3'>
											Matching Garments ({suggestions.length})
										</p>
										<div className='divide-y divide-neutral-100 dark:divide-neutral-900 max-h-80 overflow-y-auto'>
											{suggestions.map((item) => (
												<button
													key={item._id}
													type='button'
													onClick={() => handleSelectSuggestion(item._id, item.name)}
													className='w-full py-3 flex items-center gap-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 px-2 rounded-md transition-colors text-left group'
												>
													<img
														src={item.image}
														alt={item.name}
														className='w-12 h-14 object-cover rounded bg-neutral-100 dark:bg-neutral-900 shrink-0'
													/>
													<div className='flex-1 min-w-0'>
														<h5 className='text-sm font-semibold text-neutral-900 dark:text-white group-hover:underline truncate'>
															{item.name}
														</h5>
														<div className='flex items-center gap-2 mt-0.5 text-xs text-neutral-500'>
															<span className='font-bold text-neutral-950 dark:text-white'>
																₹{Number(item.price).toLocaleString("en-IN")}
															</span>
															<span className='capitalize'>• {typeof item.category === "string" ? item.category : item.category?.name || ""}</span>
															{item.stock <= 3 && item.stock > 0 && (
																<span className='text-rose-500 font-bold text-[10px]'>
																	• Only {item.stock} left
																</span>
															)}
														</div>
													</div>
													<ArrowRight size={14} className='text-neutral-400 group-hover:translate-x-1 transition-transform' />
												</button>
											))}
										</div>
										<button
											type='button'
											onClick={handleSearchSubmit}
											className='w-full mt-4 py-2.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider text-center'
										>
											View all results for &quot;{searchQuery}&quot;
										</button>
									</div>
								) : (
									<div className='space-y-6'>
										{/* RECENT SEARCHES WITH INDIVIDUAL DELETE & CLEAR ALL */}
										{recentSearches.length > 0 && (
											<div>
												<div className='flex items-center justify-between mb-2.5'>
													<p className='text-[10px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5'>
														<Clock size={12} />
														<span>Recent Searches</span>
													</p>
													<button
														type='button'
														onClick={clearAllRecentSearches}
														className='text-[10px] text-neutral-400 hover:text-rose-500 flex items-center gap-1 uppercase font-bold tracking-wider'
													>
														<Trash2 size={10} /> Clear All
													</button>
												</div>
												<div className='flex flex-wrap gap-2'>
													{recentSearches.map((term, sIdx) => (
														<span
															key={sIdx}
															onClick={() => {
																setSearchQuery(term);
																navigate(`/search?q=${encodeURIComponent(term)}`);
																setSearchOpen(false);
															}}
															className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer transition-colors'
														>
															<span>{term}</span>
															<button
																type='button'
																onClick={(e) => removeRecentSearch(e, term)}
																className='hover:text-black dark:hover:text-white p-0.5'
																title='Remove'
															>
																<X size={12} />
															</button>
														</span>
													))}
												</div>
											</div>
										)}

										{/* REAL POPULAR SEARCHES */}
										<div>
											<p className='text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2.5 flex items-center gap-1.5'>
												<Sparkles size={12} className='text-[#e05338]' />
												<span>Trending &amp; Popular Searches</span>
											</p>
											<div className='flex flex-wrap gap-2'>
												{(popularSearches.length > 0
													? popularSearches
													: [
															"Overshirt",
															"Heavyweight Boxy Tee",
															"Linen Shirts",
															"Cargo Trousers",
															"Selvedge Denim",
															"White Italian Sneaker",
													  ]
												).map((term, tIdx) => (
													<button
														key={tIdx}
														type='button'
														onClick={() => {
															setSearchQuery(term);
															navigate(`/search?q=${encodeURIComponent(term)}`);
															setSearchOpen(false);
														}}
														className='px-3.5 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs text-neutral-800 dark:text-neutral-200 font-medium transition-colors'
													>
														{term}
													</button>
												))}
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default Navbar;
