import { XCircle, ArrowLeft, RotateCcw, ShoppingBag, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const PurchaseCancelPage = () => {
	return (
		<div className='min-h-[75vh] flex items-center justify-center px-4 py-12'>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
				className='max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden text-center'
			>
				{/* Ambient Glow */}
				<div className='absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none' />

				<div className='w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-4'>
					<XCircle size={32} />
				</div>

				<h1 className='text-2xl font-bold text-white font-heading mb-2'>Checkout Cancelled</h1>
				<p className='text-xs text-gray-300 mb-6 leading-relaxed'>
					Your payment attempt was cancelled or dismissed. No funds were debited from your account, and your
					items remain saved in your cart.
				</p>

				<div className='bg-gray-950/70 border border-gray-800 rounded-2xl p-4 mb-6 text-left space-y-2 text-xs'>
					<div className='flex items-center gap-2 text-amber-300 font-semibold'>
						<ShieldAlert size={14} className='shrink-0' />
						<span>Did you encounter an issue?</span>
					</div>
					<p className='text-gray-400 leading-relaxed text-[11px]'>
						If your bank or card rejected the transaction, you can try an alternative payment method (UPI,
						Netbanking, or Credit/Debit Card) on Razorpay.
					</p>
				</div>

				<div className='space-y-2.5'>
					<Link
						to='/cart'
						className='w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-black text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs sm:text-sm font-bold transition-all shadow-md'
					>
						<RotateCcw size={16} /> Return to Cart & Retry
					</Link>

					<Link
						to='/'
						className='w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors'
					>
						<ShoppingBag size={14} /> Continue Shopping
					</Link>
				</div>
			</motion.div>
		</div>
	);
};

export default PurchaseCancelPage;
