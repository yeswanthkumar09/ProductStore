import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { useAddressStore } from "../stores/useAddressStore";
import { useUserStore } from "../stores/useUserStore";
import { Link, useNavigate } from "react-router-dom";
import { MoveRight, ShieldCheck, Tag, AlertTriangle, Truck, CheckCircle, Loader2, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useRazorpay } from "../hooks/useRazorpay";

const OrderSummary = () => {
	const navigate = useNavigate();
	const { user } = useUserStore();
	const { total, subtotal, coupon, isCouponApplied, cart } = useCartStore();
	const { selectedAddress, fetchAddresses } = useAddressStore();
	const { initiatePayment, isProcessing } = useRazorpay();

	const savings = subtotal - total;

	// Delivery charge calculation based on serviceable location rules
	const isAddressServiceable = Boolean(selectedAddress && (selectedAddress.isServiceable || selectedAddress.serviceable));
	const freeShippingThreshold =
		selectedAddress?.freeDeliveryThreshold !== undefined && selectedAddress.freeDeliveryThreshold !== null
			? selectedAddress.freeDeliveryThreshold
			: 1999;
	const isFreeDelivery =
		isAddressServiceable &&
		(selectedAddress.deliveryFee === 0 || subtotal >= freeShippingThreshold);

	const deliveryCharge = isAddressServiceable ? (isFreeDelivery ? 0 : selectedAddress.deliveryFee || 0) : 0;
	const finalTotal = Math.max(0, total + deliveryCharge);

	const handlePayment = async () => {
		if (cart.length === 0) {
			toast.error("Your cart is empty.");
			return;
		}

		if (!selectedAddress) {
			toast.error("Please add or select a delivery address before checkout.");
			return;
		}

		if (selectedAddress.isInconclusive && !isAddressServiceable) {
			toast.error("Unable to verify delivery availability. Please try again.");
			return;
		}

		if (!isAddressServiceable) {
			toast.error(
				selectedAddress.serviceabilityMessage ||
					`Delivery is currently unavailable for PIN ${selectedAddress.pincode}. Please select a serviceable delivery address.`
			);
			return;
		}

		await initiatePayment({
			cart,
			coupon,
			selectedAddress,
			onSuccess: (data) => {
				toast.success("Payment verified successfully! Generating your receipt...");
				navigate(`/purchase-success?order_id=${data.orderId}`);
			},
			onError: (err) => {
				toast.error(err.message || "Payment could not be completed.");
			},
			onDismiss: () => {
				toast("Checkout cancelled. Your cart and selected address have been saved.", {
					icon: "ℹ️",
				});
			},
		});
	};

	return (
		<motion.div
			className='space-y-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 select-none shadow-sm'
			initial={{ opacity: 0, y: 15 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<p className='text-lg font-black uppercase tracking-tight text-neutral-950 dark:text-white font-heading'>
				Order Summary
			</p>

			<div className='space-y-4'>
				<div className='space-y-2 text-xs'>
					<dl className='flex items-center justify-between gap-4'>
						<dt className='text-neutral-500 uppercase tracking-wider'>Subtotal</dt>
						<dd className='font-bold text-neutral-950 dark:text-white'>₹{Math.round(subtotal).toLocaleString("en-IN")}</dd>
					</dl>

					{coupon && isCouponApplied && (
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-neutral-500 flex items-center gap-1 uppercase tracking-wider'>
								<Tag size={12} /> Coupon ({coupon.code})
							</dt>
							<dd className='font-bold text-emerald-600'>
								-₹{Math.round(savings || (subtotal - total)).toLocaleString("en-IN")}
								<span className='text-[10px] text-emerald-500 font-normal ml-1'>
									({coupon.discountType === "fixed" ? `Flat ₹${coupon.discountValue}` : `${coupon.discountPercentage || coupon.discountValue}%`})
								</span>
							</dd>
						</dl>
					)}

					{savings > 0 && !(coupon && isCouponApplied) && (
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-neutral-500 uppercase tracking-wider'>Savings</dt>
							<dd className='font-bold text-emerald-600'>-₹{Math.round(savings).toLocaleString("en-IN")}</dd>
						</dl>
					)}

					<dl className='flex items-center justify-between gap-4'>
						<dt className='text-neutral-500 uppercase tracking-wider'>Estimated Delivery</dt>
						<dd className='font-bold text-neutral-950 dark:text-white'>
							{isAddressServiceable ? (
								deliveryCharge === 0 ? (
									<span className='text-emerald-600 font-bold'>FREE</span>
								) : (
									<span>₹{deliveryCharge.toLocaleString("en-IN")}</span>
								)
							) : (
								<span className='text-neutral-400'>Select address</span>
							)}
						</dd>
					</dl>

					{selectedAddress && isAddressServiceable && selectedAddress.estimatedDeliveryDays && (
						<dl className='flex items-center justify-between gap-4 text-[11px] text-neutral-400 pt-1'>
							<dt className='flex items-center gap-1'>
								<Truck size={12} /> Window
							</dt>
							<dd className='font-medium text-neutral-700 dark:text-neutral-300'>{selectedAddress.estimatedDeliveryDays}</dd>
						</dl>
					)}

					<dl className='flex items-center justify-between gap-4 border-t border-neutral-200 dark:border-neutral-800 pt-3'>
						<dt className='text-sm font-bold uppercase tracking-wider text-neutral-950 dark:text-white'>Total Payable</dt>
						<dd className='text-xl font-black text-neutral-950 dark:text-white'>₹{Math.round(finalTotal).toLocaleString("en-IN")}</dd>
					</dl>
				</div>

				{/* Delivery Status Warning/Notice */}
				{!selectedAddress ? (
					<div className='p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2'>
						<AlertTriangle size={15} className='shrink-0 text-amber-500' />
						<span>Select a delivery destination to confirm courier serviceability.</span>
					</div>
				) : selectedAddress.isInconclusive ? (
					<div className='p-3 border border-amber-200 bg-amber-50/50 text-xs text-amber-800 flex items-center justify-between gap-2'>
						<div className='flex items-center gap-2'>
							<AlertTriangle size={15} className='shrink-0 text-amber-600' />
							<span>Unable to verify delivery availability. Please retry.</span>
						</div>
						<button
							type='button'
							onClick={() => fetchAddresses()}
							className='px-2 py-0.5 border border-amber-300 font-bold text-[10px]'
						>
							Retry
						</button>
					</div>
				) : !selectedAddress.isServiceable ? (
					<div className='p-3 border border-rose-200 bg-rose-50/50 text-xs text-rose-700 flex items-center gap-2'>
						<AlertTriangle size={15} className='shrink-0' />
						<span>
							{selectedAddress.serviceabilityMessage || "Delivery unavailable for this PIN code."}
						</span>
					</div>
				) : (
					<div className='p-3 border border-emerald-200 bg-emerald-50/40 text-xs text-emerald-800 flex items-center justify-between gap-2'>
						<div className='flex items-center gap-2'>
							<CheckCircle size={15} className='shrink-0 text-emerald-600' />
							<span>
								Serviceable by Shiprocket ({selectedAddress.city}, PIN {selectedAddress.pincode})
							</span>
						</div>
					</div>
				)}

				{!user ? (
					<Link
						to='/login?redirect=/cart'
						className='flex w-full items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black py-3.5 text-xs font-bold uppercase tracking-widest hover:opacity-85 transition-opacity'
					>
						<Lock size={14} />
						<span>Log In to Checkout • ₹{Math.round(finalTotal).toLocaleString("en-IN")}</span>
					</Link>
				) : (
					<button
						disabled={!isAddressServiceable || isProcessing || cart.length === 0}
						className='flex w-full items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black py-3.5 text-xs font-bold uppercase tracking-widest hover:opacity-85 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed shadow-sm'
						onClick={handlePayment}
					>
						{isProcessing ? (
							<>
								<Loader2 size={16} className='animate-spin' />
								<span>Connecting to Razorpay...</span>
							</>
						) : (
							<>
								<ShieldCheck size={16} />
								<span>PAY WITH RAZORPAY • ₹{Math.round(finalTotal).toLocaleString("en-IN")}</span>
							</>
						)}
					</button>
				)}

				<div className='flex items-center justify-center gap-1.5 text-[10px] text-neutral-400 uppercase tracking-wider pt-1'>
					<Lock size={11} className='text-neutral-500' />
					<span>100% Encrypted • Official Razorpay Standard Checkout</span>
				</div>

				<div className='flex items-center justify-center gap-2 pt-1'>
					<Link
						to='/'
						className='inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-white underline uppercase tracking-wider hover:opacity-70'
					>
						Continue Shopping <MoveRight size={13} />
					</Link>
				</div>
			</div>
		</motion.div>
	);
};
export default OrderSummary;
