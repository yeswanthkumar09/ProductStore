import { useState, useEffect } from "react";
import {
	User,
	Mail,
	Phone,
	MapPin,
	Package,
	RotateCcw,
	Gift,
	Star,
	Heart,
	ChevronRight,
	LogOut,
	Save,
	X,
	Lock,
	Bell,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useAddressStore } from "../stores/useAddressStore";
import SavedAddressManager from "../components/SavedAddressManager";
import CustomerRestockAlerts from "../components/CustomerRestockAlerts";

const ProfilePage = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { user, updateProfile, logout, loading } = useUserStore();
	const { addresses, fetchAddresses } = useAddressStore();

	const [activeSection, setActiveSection] = useState(
		location.hash === "#addresses" ? "addresses" : null
	);

	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
	});

	const [showGiftingModal, setShowGiftingModal] = useState(false);

	useEffect(() => {
		fetchAddresses();
	}, [fetchAddresses]);

	useEffect(() => {
		if (location.hash === "#addresses") {
			setActiveSection("addresses");
		}
	}, [location.hash]);

	useEffect(() => {
		if (user) {
			setFormData({
				name: user.name || "",
				email: user.email || "",
				phone: user.phone || "",
			});
		}
	}, [user]);

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmitProfile = async (e) => {
		e.preventDefault();
		await updateProfile({
			name: formData.name,
			phone: formData.phone,
		});
		setActiveSection(null);
	};

	// Calculate membership tier spend progress (simulated against ₹5,000 threshold)
	const currentSpend = 1499; // sample tier progress
	const targetSpend = 5000;
	const progressPercent = Math.min(100, Math.round((currentSpend / targetSpend) * 100));

	return (
		<div className='max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 select-none'>
			{/* ======================================================== */}
			{/* TOP MEMBERSHIP TIER BANNER (Matching Screenshot 5)        */}
			{/* ======================================================== */}
			<div className='mb-10 border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-sm'>
				{/* Left: User Welcome & Portrait */}
				<div className='relative p-6 sm:p-8 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950'>
					<div className='z-10'>
						<p className='text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400'>
							Welcome
						</p>
						<h1 className='text-2xl sm:text-3xl font-black font-heading uppercase tracking-tight text-neutral-950 dark:text-white mt-1'>
							{user?.name || "PATRON"}
						</h1>
						<div className='mt-3 inline-block'>
							<span className='px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black'>
								TIER 1 MEMBER
							</span>
						</div>
					</div>

					{/* Model Avatar Portrait */}
					<div className='w-24 h-28 sm:w-28 sm:h-32 rounded-none overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-800'>
						<img
							src='https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
							alt='Member Avatar'
							className='w-full h-full object-cover object-top'
						/>
					</div>
				</div>

				{/* Right: Membership Tier Progress Bar */}
				<div className='p-6 sm:p-8 bg-neutral-900 text-white flex flex-col justify-between'>
					<div className='flex items-start justify-between'>
						<div>
							<p className='text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400'>
								SPEND MORE TO UNLOCK MEMBERSHIP
							</p>
							<button
								type='button'
								onClick={() => setShowGiftingModal(true)}
								className='text-xs font-bold uppercase tracking-wider text-white underline mt-1 hover:opacity-80'
							>
								VIEW PRIVILEGES
							</button>
						</div>
						<span className='font-heading text-xs font-black tracking-widest text-neutral-400'>
							LUXESTORE+
						</span>
					</div>

					<div className='mt-6'>
						{/* Progress Track */}
						<div className='relative w-full h-1 bg-neutral-800 rounded-full flex items-center'>
							<div
								className='h-full bg-white transition-all duration-700'
								style={{ width: `${progressPercent}%` }}
							/>
							{/* Milestone Gift Box at end */}
							<div className='absolute right-0 -top-2 w-5 h-5 rounded-full bg-neutral-800 border border-neutral-600 flex items-center justify-center text-white'>
								<Gift size={11} />
							</div>
						</div>
						<p className='text-[10px] text-neutral-400 tracking-wider mt-2.5'>
							Spend ₹{targetSpend.toLocaleString("en-IN")} to unlock Tier 2 complimentary bespoke tailoring.
						</p>
					</div>
				</div>
			</div>

			{/* ======================================================== */}
			{/* GROUPED LIST ROWS WITH CHEVRONS (Matching Screenshot 5)   */}
			{/* ======================================================== */}
			<div className='space-y-8'>
				{/* GROUP 1: ACCOUNT */}
				<div>
					<p className='text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-3 px-2'>
						ACCOUNT
					</p>
					<div className='border-t border-b border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950'>
						{/* Personal Information */}
						<div>
							<button
								type='button'
								onClick={() =>
									setActiveSection((prev) => (prev === "profile" ? null : "profile"))
								}
								className='w-full py-4 px-3 sm:px-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-left group'
							>
								<div className='flex items-center gap-3'>
									<User size={18} className='text-neutral-500 group-hover:text-black dark:group-hover:text-white' />
									<span className='text-xs sm:text-sm font-semibold tracking-wider uppercase text-neutral-900 dark:text-neutral-100'>
										PERSONAL INFORMATION
									</span>
								</div>
								<ChevronRight
									size={16}
									className={`text-neutral-400 transition-transform ${
										activeSection === "profile" ? "rotate-90" : ""
									}`}
								/>
							</button>

							{/* Inline Edit Form */}
							{activeSection === "profile" && (
								<div className='p-5 sm:p-6 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-200 dark:border-neutral-800 animate-in fade-in'>
									<form onSubmit={handleSubmitProfile} className='space-y-4 max-w-lg'>
										<div>
											<label className='block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5'>
												Full Name
											</label>
											<input
												type='text'
												name='name'
												value={formData.name}
												onChange={handleChange}
												required
												className='w-full px-3.5 py-2 text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:border-black'
											/>
										</div>

										<div>
											<label className='block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5'>
												Email Address (Verified)
											</label>
											<input
												type='email'
												value={formData.email}
												disabled
												className='w-full px-3.5 py-2 text-xs border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-500 cursor-not-allowed'
											/>
										</div>

										<div>
											<label className='block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5'>
												Mobile Number
											</label>
											<input
												type='tel'
												name='phone'
												value={formData.phone}
												onChange={handleChange}
												placeholder='+91 98765 43210'
												className='w-full px-3.5 py-2 text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:border-black font-mono'
											/>
										</div>

										<div className='pt-2 flex items-center gap-3'>
											<button
												type='submit'
												disabled={loading}
												className='px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider hover:opacity-85 transition-opacity'
											>
												{loading ? "Saving..." : "Save Changes"}
											</button>
											<button
												type='button'
												onClick={() => setActiveSection(null)}
												className='px-4 py-2.5 text-xs font-semibold text-neutral-500 hover:text-black dark:hover:text-white'
											>
												Cancel
											</button>
										</div>
									</form>
								</div>
							)}
						</div>

						{/* Saved Addresses */}
						<div>
							<button
								type='button'
								onClick={() =>
									setActiveSection((prev) => (prev === "addresses" ? null : "addresses"))
								}
								className='w-full py-4 px-3 sm:px-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-left group'
							>
								<div className='flex items-center gap-3'>
									<MapPin size={18} className='text-neutral-500 group-hover:text-black dark:group-hover:text-white' />
									<span className='text-xs sm:text-sm font-semibold tracking-wider uppercase text-neutral-900 dark:text-neutral-100'>
										SAVED ADDRESSES
									</span>
									{addresses.length > 0 && (
										<span className='text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.2'>
											{addresses.length}
										</span>
									)}
								</div>
								<ChevronRight
									size={16}
									className={`text-neutral-400 transition-transform ${
										activeSection === "addresses" ? "rotate-90" : ""
									}`}
								/>
							</button>

							{/* Inline Saved Address Manager */}
							{activeSection === "addresses" && (
								<div className='p-4 sm:p-6 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-200 dark:border-neutral-800 animate-in fade-in'>
									<SavedAddressManager />
								</div>
							)}
						</div>
					</div>
				</div>

				{/* GROUP 2: SHOPPING */}
				<div>
					<p className='text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-3 px-2'>
						SHOPPING
					</p>
					<div className='border-t border-b border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950'>
						{/* Orders */}
						<Link
							to='/orders'
							className='py-4 px-3 sm:px-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group'
						>
							<div className='flex items-center gap-3'>
								<Package size={18} className='text-neutral-500 group-hover:text-black dark:group-hover:text-white' />
								<span className='text-xs sm:text-sm font-semibold tracking-wider uppercase text-neutral-900 dark:text-neutral-100'>
									ORDERS
								</span>
							</div>
							<ChevronRight size={16} className='text-neutral-400' />
						</Link>

						{/* Refunds */}
						<Link
							to='/orders'
							className='py-4 px-3 sm:px-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group'
						>
							<div className='flex items-center gap-3'>
								<RotateCcw size={18} className='text-neutral-500 group-hover:text-black dark:group-hover:text-white' />
								<span className='text-xs sm:text-sm font-semibold tracking-wider uppercase text-neutral-900 dark:text-neutral-100'>
									REFUNDS & EXCHANGES
								</span>
							</div>
							<ChevronRight size={16} className='text-neutral-400' />
						</Link>

						{/* Gifting */}
						<button
							type='button'
							onClick={() => setShowGiftingModal(true)}
							className='w-full py-4 px-3 sm:px-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-left group'
						>
							<div className='flex items-center gap-3'>
								<Gift size={18} className='text-neutral-500 group-hover:text-black dark:group-hover:text-white' />
								<span className='text-xs sm:text-sm font-semibold tracking-wider uppercase text-neutral-900 dark:text-neutral-100'>
									GIFTING & REWARDS
								</span>
							</div>
							<ChevronRight size={16} className='text-neutral-400' />
						</button>

						{/* Restock & Availability Alerts */}
						<div>
							<button
								type='button'
								onClick={() =>
									setActiveSection((prev) => (prev === "restock" ? null : "restock"))
								}
								className='w-full py-4 px-3 sm:px-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-left group'
							>
								<div className='flex items-center gap-3'>
									<Bell size={18} className='text-amber-500 group-hover:text-black dark:group-hover:text-white' />
									<span className='text-xs sm:text-sm font-semibold tracking-wider uppercase text-neutral-900 dark:text-neutral-100'>
										RESTOCK & AVAILABILITY ALERTS
									</span>
								</div>
								<ChevronRight
									size={16}
									className={`text-neutral-400 transition-transform ${
										activeSection === "restock" ? "rotate-90" : ""
									}`}
								/>
							</button>

							{/* Inline Restock Alerts List */}
							{activeSection === "restock" && (
								<div className='border-t border-neutral-200 dark:border-neutral-800 animate-in fade-in'>
									<CustomerRestockAlerts />
								</div>
							)}
						</div>

						{/* Rate & Review */}
						<Link
							to='/orders'
							className='py-4 px-3 sm:px-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group'
						>
							<div className='flex items-center gap-3'>
								<Star size={18} className='text-neutral-500 group-hover:text-black dark:group-hover:text-white' />
								<span className='text-xs sm:text-sm font-semibold tracking-wider uppercase text-neutral-900 dark:text-neutral-100'>
									RATE & REVIEW
								</span>
							</div>
							<ChevronRight size={16} className='text-neutral-400' />
						</Link>
					</div>
				</div>

				{/* GROUP 3: COMMUNITY & PREFERENCES */}
				<div>
					<p className='text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-3 px-2'>
						COMMUNITY
					</p>
					<div className='border-t border-b border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950'>
						<Link
							to='/wishlist'
							className='py-4 px-3 sm:px-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group'
						>
							<div className='flex items-center gap-3'>
								<Heart size={18} className='text-neutral-500 group-hover:text-black dark:group-hover:text-white' />
								<span className='text-xs sm:text-sm font-semibold tracking-wider uppercase text-neutral-900 dark:text-neutral-100'>
									SAVED WISHLIST
								</span>
							</div>
							<ChevronRight size={16} className='text-neutral-400' />
						</Link>

						{/* Log Out */}
						<button
							type='button'
							onClick={() => {
								logout();
								navigate("/");
							}}
							className='w-full py-4 px-3 sm:px-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-left group'
						>
							<div className='flex items-center gap-3'>
								<LogOut size={18} className='text-rose-500' />
								<span className='text-xs sm:text-sm font-bold tracking-wider uppercase text-rose-600 dark:text-rose-400'>
									LOG OUT
								</span>
							</div>
							<ChevronRight size={16} className='text-neutral-400' />
						</button>
					</div>
				</div>
			</div>

			{/* Gifting & Vouchers Modal */}
			{showGiftingModal && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
					<div className='fixed inset-0 bg-black/50 backdrop-blur-sm' onClick={() => setShowGiftingModal(false)} />
					<div className='relative w-full max-w-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-6 z-10 shadow-2xl'>
						<div className='flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-4'>
							<h3 className='text-sm font-bold uppercase tracking-wider text-neutral-950 dark:text-white'>
								Available Privileges & Coupons
							</h3>
							<button onClick={() => setShowGiftingModal(false)}>
								<X size={18} />
							</button>
						</div>
						<div className='space-y-3 text-xs'>
							<div className='p-3 border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900'>
								<span className='font-mono font-bold text-black dark:text-white text-sm'>
									WELCOME10
								</span>
								<p className='text-neutral-600 dark:text-neutral-400 mt-1'>
									10% off your entire order for all registered members.
								</p>
							</div>
							<div className='p-3 border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900'>
								<span className='font-mono font-bold text-black dark:text-white text-sm'>
									FASHION15
								</span>
								<p className='text-neutral-600 dark:text-neutral-400 mt-1'>
									15% off tailored blazers, jackets, and raw denim.
								</p>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ProfilePage;
