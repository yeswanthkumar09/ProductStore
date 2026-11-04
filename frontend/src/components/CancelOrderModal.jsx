import { useState } from "react";
import { AlertTriangle, X, CheckCircle, Loader2 } from "lucide-react";

const CANCELLATION_REASONS = [
	"Ordered by mistake",
	"Found a better price elsewhere",
	"Need to change shipping address",
	"Delivery estimate is too slow",
	"Incorrect size, color, or variant selected",
	"Payment debited multiple times",
	"Other reason",
];

const CancelOrderModal = ({ isOpen, onClose, onConfirm, order, isLoading }) => {
	const [reason, setReason] = useState(CANCELLATION_REASONS[0]);
	const [comment, setComment] = useState("");

	if (!isOpen || !order) return null;

	const isPaid = order.paymentStatus === "paid";
	const isOnline = order.paymentMethod === "razorpay";

	const handleConfirm = () => {
		onConfirm({ reason, comment });
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in'>
			<div className='bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative overflow-hidden'>
				{/* Top ambient glow */}
				<div className='absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none' />

				{/* Header */}
				<div className='flex items-center justify-between pb-4 border-b border-gray-800 mb-5'>
					<div className='flex items-center gap-2.5'>
						<div className='p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400'>
							<AlertTriangle size={20} />
						</div>
						<div>
							<h3 className='text-base font-bold text-white font-heading'>Cancel Order</h3>
							<p className='text-xs text-gray-400'>
								Order #{order._id?.slice(-8).toUpperCase()}
							</p>
						</div>
					</div>

					<button
						type='button'
						onClick={onClose}
						disabled={isLoading}
						className='p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors'
					>
						<X size={16} />
					</button>
				</div>

				{/* Notice */}
				<div className='bg-gray-950/70 border border-gray-800 rounded-2xl p-4 mb-5 space-y-2 text-xs'>
					<div className='flex justify-between items-center text-gray-300'>
						<span>Total Order Value:</span>
						<span className='font-bold text-white'>
							₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
						</span>
					</div>
					<div className='flex justify-between items-center text-gray-300'>
						<span>Payment Status:</span>
						<span className='font-semibold uppercase tracking-wider text-emerald-400'>
							{order.paymentStatus || "Pending"}
						</span>
					</div>

					{isPaid && isOnline && (
						<div className='pt-2 border-t border-gray-800 text-amber-300 flex items-start gap-1.5 leading-relaxed'>
							<CheckCircle size={14} className='shrink-0 mt-0.5 text-amber-400' />
							<span>
								A full refund of ₹{Number(order.totalAmount).toLocaleString("en-IN")} will be initiated
								through Razorpay to your original payment method.
							</span>
						</div>
					)}
				</div>

				{/* Reason Selector */}
				<div className='space-y-3 mb-6'>
					<div>
						<label className='block text-xs font-semibold text-gray-300 mb-1.5'>
							Reason for cancellation <span className='text-rose-400'>*</span>
						</label>
						<select
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							disabled={isLoading}
							className='w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-accent'
						>
							{CANCELLATION_REASONS.map((r, i) => (
								<option key={i} value={r}>
									{r}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className='block text-xs font-semibold text-gray-300 mb-1.5'>
							Additional comments <span className='text-gray-500'>(Optional)</span>
						</label>
						<textarea
							rows={2}
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							disabled={isLoading}
							placeholder='Any additional feedback to help us improve...'
							className='w-full px-3.5 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-accent resize-none placeholder-gray-600'
						/>
					</div>
				</div>

				{/* Action Buttons */}
				<div className='space-y-2'>
					<button
						type='button'
						onClick={handleConfirm}
						disabled={isLoading}
						className='w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-rose-950/40 disabled:opacity-50'
					>
						{isLoading ? (
							<>
								<Loader2 size={16} className='animate-spin' />
								<span>Processing Cancellation...</span>
							</>
						) : (
							<span>Confirm Order Cancellation</span>
						)}
					</button>

					<button
						type='button'
						onClick={onClose}
						disabled={isLoading}
						className='w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors'
					>
						Keep My Order
					</button>
				</div>
			</div>
		</div>
	);
};

export default CancelOrderModal;

