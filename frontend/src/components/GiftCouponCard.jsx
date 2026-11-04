import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useCartStore } from "../stores/useCartStore";
import { Tag, CheckCircle2, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const GiftCouponCard = () => {
	const [userInputCode, setUserInputCode] = useState("");
	const {
		coupon,
		isCouponApplied,
		isApplyingCoupon,
		applyCoupon,
		getMyCoupon,
		removeCoupon,
		availableCoupons,
		fetchAvailableCoupons,
	} = useCartStore();

	useEffect(() => {
		getMyCoupon();
		fetchAvailableCoupons();
	}, [getMyCoupon, fetchAvailableCoupons]);

	const handleApplyCoupon = async (codeToApply) => {
		if (isApplyingCoupon) return;
		const target = (codeToApply || userInputCode || "").trim().toUpperCase();
		if (!target) {
			toast.error("Please enter a voucher or coupon code.", { id: "coupon-input-required" });
			return;
		}
		await applyCoupon(target);
	};

	const handleRemoveCoupon = async () => {
		await removeCoupon();
		setUserInputCode("");
	};

	return (
		<motion.div
			className='space-y-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-5 shadow-xl backdrop-blur-md'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
		>
			<div>
				<label htmlFor='voucher' className='mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300'>
					<Tag size={14} className='text-amber-600 dark:text-amber-400' /> Have a Voucher or Coupon Code?
				</label>
				<div className='flex gap-2'>
					<input
						type='text'
						id='voucher'
						disabled={isApplyingCoupon}
						className='flex-1 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-3.5 py-2.5 text-sm font-mono uppercase text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white disabled:opacity-50'
						placeholder='e.g. WELCOME10'
						value={userInputCode}
						onChange={(e) => setUserInputCode(e.target.value.toUpperCase())}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleApplyCoupon();
							}
						}}
					/>
					<button
						type='button'
						disabled={isApplyingCoupon}
						className='px-5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-neutral-950 font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 transition-all shadow-md inline-flex items-center justify-center gap-1.5 min-w-[85px]'
						onClick={() => handleApplyCoupon()}
					>
						{isApplyingCoupon ? (
							<>
								<Loader2 size={13} className='animate-spin' />
								<span>...</span>
							</>
						) : (
							"Apply"
						)}
					</button>
				</div>
			</div>

			{/* Available recommended coupons quick apply */}
			{!isCouponApplied && availableCoupons && availableCoupons.length > 0 && (
				<div className='pt-2 border-t border-neutral-200 dark:border-gray-800/80'>
					<span className='text-[11px] text-neutral-600 dark:text-gray-400 block mb-2 font-medium'>Available Store Coupons:</span>
					<div className='flex flex-wrap gap-2'>
						{availableCoupons.map((c) => {
							const discountLabel =
								c.discountType === "fixed"
									? `₹${c.discountValue || 0} OFF`
									: `${c.discountPercentage || c.discountValue || 0}% OFF`;
							const scopeLabel =
								c.scope === "category" && c.eligibleCategories?.length > 0
									? c.eligibleCategories.join(", ")
									: c.scope === "product"
									? "Select Items"
									: "";
							return (
								<button
									key={c._id || c.code}
									type='button'
									onClick={() => {
										setUserInputCode(c.code);
										handleApplyCoupon(c.code);
									}}
									className='inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 hover:border-black text-xs font-mono text-neutral-900 dark:bg-gray-800/80 dark:border-gray-700 dark:text-gray-200 dark:hover:border-accent transition-colors'
									title={c.minOrderAmount ? `Min order: ₹${c.minOrderAmount}` : ""}
								>
									<span className='font-bold text-black dark:text-accent'>{c.code}</span>
									<span className='text-[10px] text-neutral-600 dark:text-gray-400'>
										({discountLabel}{scopeLabel ? ` • ${scopeLabel}` : ""})
									</span>
								</button>
							);
						})}
					</div>
				</div>
			)}

			{/* Applied Coupon Info Card */}
			{isCouponApplied && coupon && (
				<div className='p-3.5 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<CheckCircle2 size={16} className='text-accent' />
						<div>
							<span className='font-mono font-black text-white text-xs'>
								{coupon.code}
							</span>
							<span className='text-[11px] text-accent block font-medium'>
								{coupon.discountType === "fixed"
									? `₹${coupon.discountValue} discount applied`
									: `${coupon.discountPercentage || coupon.discountValue}% discount applied`}
							</span>
						</div>
					</div>

					<button
						type='button'
						onClick={handleRemoveCoupon}
						className='p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-rose-400 transition-colors'
						title='Remove Coupon'
					>
						<X size={16} />
					</button>
				</div>
			)}
		</motion.div>
	);
};
export default GiftCouponCard;
