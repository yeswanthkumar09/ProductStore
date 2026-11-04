import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
	MapPin,
	CheckCircle,
	AlertTriangle,
	Home,
	Briefcase,
	Tag,
	Truck,
	ExternalLink,
	RefreshCw,
	PlusCircle,
} from "lucide-react";
import { useAddressStore } from "../stores/useAddressStore";

const CheckoutAddressPicker = () => {
	const {
		addresses,
		selectedAddress,
		fetchAddresses,
		selectAddress,
		serviceabilityChecking,
		loading,
	} = useAddressStore();

	useEffect(() => {
		fetchAddresses();
	}, [fetchAddresses]);

	const handleSelect = (addr) => {
		if (selectedAddress?._id === addr._id && !selectedAddress.isServiceable && !serviceabilityChecking) {
			// If already selected but user clicked again to re-verify
			selectAddress(addr);
			return;
		}
		selectAddress(addr);
	};

	return (
		<div className='bg-gray-900/60 border border-gray-800 rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-xl'>
			{/* Section Header */}
			<div className='flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-800 mb-5'>
				<div className='flex items-center gap-2.5'>
					<div className='p-2 rounded-xl bg-accent-light text-accent border border-accent/20'>
						<MapPin size={20} />
					</div>
					<div>
						<h3 className='text-base sm:text-lg font-bold text-white font-heading'>
							Select Delivery Destination
						</h3>
						<p className='text-xs text-gray-400'>
							Choose from your saved address book to verify live Shiprocket courier serviceability
						</p>
					</div>
				</div>

				<Link
					to='/addresses?redirect=/cart'
					className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-semibold dark:text-gray-200 transition-all shadow-sm border border-black dark:border-gray-700'
					title='Open your dedicated address book to add or edit addresses'
				>
					<PlusCircle size={14} className='text-white dark:text-accent' />
					<span>Manage Address Book</span>
					<ExternalLink size={12} className='text-neutral-400 dark:text-gray-400' />
				</Link>
			</div>

			{/* Loading State */}
			{loading && addresses.length === 0 ? (
				<div className='py-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2'>
					<RefreshCw size={14} className='animate-spin text-accent' />
					<span>Loading your address book...</span>
				</div>
			) : addresses.length === 0 ? (
				/* Empty State when no addresses exist */
				<div className='py-8 px-4 text-center bg-gray-950/40 border border-dashed border-gray-800 rounded-2xl'>
					<div className='w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-3 text-gray-500'>
						<MapPin size={24} />
					</div>
					<h4 className='text-sm font-bold text-white mb-1'>No Delivery Addresses Saved</h4>
					<p className='text-xs text-gray-400 max-w-md mx-auto mb-5 leading-relaxed'>
						You have not saved any delivery addresses yet. Please add your shipping address in the Address Book to verify courier coverage and complete your purchase.
					</p>
					<Link
						to='/addresses?redirect=/cart'
						className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold transition-all shadow-md'
					>
						<PlusCircle size={15} />
						<span>Go to Address Book & Add Address</span>
					</Link>
				</div>
			) : (
				/* Address Selection Cards */
				<div className='space-y-3.5'>
					{addresses.map((addr) => {
						const isSelected = selectedAddress?._id === addr._id;

						return (
							<div
								key={addr._id}
								onClick={() => handleSelect(addr)}
								role='button'
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handleSelect(addr);
									}
								}}
								className={`p-4 rounded-2xl border cursor-pointer transition-all ${
									isSelected
										? "bg-neutral-50/80 border-black dark:bg-gray-900/90 dark:border-accent shadow-lg shadow-black/5 dark:shadow-accent/10 ring-1 ring-black/20 dark:ring-accent/50"
										: "bg-white border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/50 dark:bg-gray-950/40 dark:border-gray-800/80 dark:hover:border-gray-700 dark:hover:bg-gray-900/40"
								}`}
							>
								<div className='flex items-start gap-3'>
									{/* Radio Selector */}
									<div className='pt-0.5 shrink-0'>
										<div
											className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
												isSelected
													? "border-black bg-black dark:border-accent dark:bg-accent"
													: "border-neutral-400 bg-white dark:border-gray-600 dark:bg-gray-900"
											}`}
										>
											{isSelected && <div className='w-1.5 h-1.5 rounded-full bg-white' />}
										</div>
									</div>

									{/* Address Information */}
									<div className='flex-1 min-w-0'>
										<div className='flex flex-wrap items-center gap-2 mb-1'>
											<span className='text-xs font-bold text-neutral-900 dark:text-white truncate'>
												{addr.fullName}
											</span>
											<span className='text-xs text-neutral-600 dark:text-gray-400 font-mono'>
												{addr.phone}
											</span>
											<span className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'>
												{addr.addressType === "Home" ? (
													<Home size={10} className='text-neutral-700 dark:text-accent' />
												) : addr.addressType === "Work" ? (
													<Briefcase size={10} className='text-amber-500 dark:text-amber-400' />
												) : (
													<Tag size={10} className='text-indigo-500 dark:text-indigo-400' />
												)}
												{addr.addressType}
											</span>
											{addr.isDefault && (
												<span className='text-[10px] font-semibold text-neutral-800 dark:text-accent bg-neutral-100 dark:bg-accent/10 border border-neutral-300 dark:border-accent/20 px-1.5 py-0.5 rounded'>
													Default
												</span>
											)}
										</div>

										<p className='text-xs text-neutral-700 dark:text-gray-300 leading-relaxed truncate'>
											{addr.houseFlat}, {addr.street}{addr.locality ? `, ${addr.locality}` : ""}
										</p>
										<p className='text-xs text-neutral-500 dark:text-gray-400 font-medium'>
											{addr.city}, {addr.state} - <span className='font-mono font-bold text-neutral-900 dark:text-white'>{addr.pincode}</span>
										</p>
									</div>
								</div>

								{/* LIVE SHIPROCKET COURIER VERIFICATION FOR THE SELECTED ADDRESS */}
								{isSelected && (
									<div className='mt-3 pt-3 border-t border-gray-800/80 animate-fade-in'>
										{serviceabilityChecking ? (
											<div className='flex items-center gap-2 p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold animate-pulse'>
												<RefreshCw size={13} className='animate-spin' />
												<span>Verifying live courier availability with Shiprocket for PIN {addr.pincode}...</span>
											</div>
										) : selectedAddress.isInconclusive ? (
											<div className='flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300'>
												<div className='flex items-center gap-2'>
													<AlertTriangle size={15} className='text-amber-400 shrink-0' />
													<span>Unable to verify delivery availability. Please try again.</span>
												</div>
												<button
													type='button'
													onClick={(e) => {
														e.stopPropagation();
														selectAddress(addr);
													}}
													className='px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold transition-colors'
												>
													Retry Verification
												</button>
											</div>
										) : selectedAddress.isServiceable ? (
											<div className='flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs'>
												<div className='flex items-center gap-1.5 text-emerald-400 font-bold'>
													<CheckCircle size={14} className='shrink-0' />
													<span>Serviceable by Shiprocket</span>
												</div>
												<div className='flex flex-wrap items-center gap-3 text-gray-300 text-[11px]'>
													{selectedAddress.courierName && (
														<span>
															Partner: <strong className='text-white'>{selectedAddress.courierName}</strong>
														</span>
													)}
													{selectedAddress.estimatedDeliveryDays && (
														<span className='inline-flex items-center gap-1 text-gray-300'>
															<Truck size={12} className='text-accent' />
															<span>Est. Delivery: <strong className='text-white'>{selectedAddress.estimatedDeliveryDays}</strong></span>
														</span>
													)}
												</div>
											</div>
										) : (
											<div className='flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300'>
												<div className='flex items-center gap-1.5'>
													<AlertTriangle size={14} className='text-rose-400 shrink-0' />
													<span>
														{selectedAddress.serviceabilityMessage ||
															`Delivery is currently unavailable for PIN ${addr.pincode}. Please select another address.`}
													</span>
												</div>
												<Link
													to='/addresses?redirect=/cart'
													onClick={(e) => e.stopPropagation()}
													className='underline hover:text-white text-[11px] font-semibold'
												>
													Select or Add Different Address
												</Link>
											</div>
										)}
									</div>
								)}
							</div>
						);
					})}

					{/* Manage / Add More in Address Book Footer Link */}
					<div className='pt-2 flex justify-end'>
						<Link
							to='/addresses?redirect=/cart'
							className='inline-flex items-center gap-1 text-xs text-gray-400 hover:text-accent font-semibold transition-colors'
						>
							<span>Need a different address? Manage your saved addresses in Address Book</span>
							<ExternalLink size={12} />
						</Link>
					</div>
				</div>
			)}
		</div>
	);
};

export default CheckoutAddressPicker;
