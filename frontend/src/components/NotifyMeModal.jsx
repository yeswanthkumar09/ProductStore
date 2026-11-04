import { useState, useEffect } from "react";
import { X, Bell, Check, Mail, Sparkles } from "lucide-react";
import { useRestockStore } from "../stores/useRestockStore";
import { useUserStore } from "../stores/useUserStore";
import toast from "react-hot-toast";

const NotifyMeModal = ({ isOpen, onClose, product, selectedSize, selectedColor, selectedVariantId }) => {
	const { user } = useUserStore();
	const { subscribe, loading } = useRestockStore();

	const [email, setEmail] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [feedbackMsg, setFeedbackMsg] = useState("");

	useEffect(() => {
		if (user && user.email) {
			setEmail(user.email);
		} else {
			setEmail("");
		}
		setSubmitted(false);
		setFeedbackMsg("");
	}, [user, isOpen]);

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

	if (!isOpen || !product) return null;

	const handleSubmit = async (e) => {
		e.preventDefault();
		const targetEmail = (email || user?.email || "").trim();

		if (!targetEmail || !/^\S+@\S+\.\S+$/.test(targetEmail)) {
			toast.error("Please provide a valid email address");
			return;
		}

		try {
			const res = await subscribe({
				productId: product._id || product.id,
				variantId: selectedVariantId || null,
				size: selectedSize || "",
				color: selectedColor || null,
				email: targetEmail,
			});

			setSubmitted(true);
			setFeedbackMsg(
				res.message ||
					`We will notify you at ${targetEmail} as soon as this item arrives back in stock.`
			);
		} catch (err) {
			// handled in store
		}
	};

	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in'
			onClick={onClose}
		>
			<div
				className='relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 overflow-hidden'
				onClick={(e) => e.stopPropagation()}
			>
				{/* Close Button */}
				<button
					type='button'
					onClick={onClose}
					className='absolute top-3.5 right-3.5 p-1 text-neutral-400 hover:text-black dark:hover:text-white transition-colors'
					aria-label='Close'
				>
					<X size={18} />
				</button>

				{!submitted ? (
					<div>
						{/* Header */}
						<div className='flex items-center gap-2 mb-2'>
							<div className='w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white'>
								<Bell size={16} />
							</div>
							<div>
								<span className='text-[10px] font-black uppercase tracking-widest text-neutral-400'>
									Priority Availability Alert
								</span>
								<h3 className='text-sm font-black uppercase tracking-wide text-neutral-950 dark:text-white'>
									Notify Me When Available
								</h3>
							</div>
						</div>

						{/* Product Snapshot */}
						<div className='my-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3'>
							<img
								src={product.image}
								alt={product.name}
								className='w-12 h-16 object-cover bg-neutral-200 dark:bg-neutral-700 flex-shrink-0'
							/>
							<div className='flex-1 min-w-0'>
								<h4 className='text-xs font-bold text-neutral-900 dark:text-white truncate'>
									{product.name}
								</h4>
								<div className='text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 space-x-1.5'>
									{selectedSize && <span>Size: <strong>{selectedSize}</strong></span>}
									{selectedColor && <span>&bull; Color: <strong>{selectedColor.name || selectedColor}</strong></span>}
								</div>
								<p className='text-xs font-bold text-neutral-950 dark:text-white mt-1'>
									₹{Number(product.price).toLocaleString("en-IN")}
								</p>
							</div>
						</div>

						<p className='text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4'>
							Be the first to know when our atelier restocks this selection. You will receive an automated priority notification directly to your inbox.
						</p>

						<form onSubmit={handleSubmit} className='space-y-4'>
							<div>
								<label className='block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5'>
									Email Address for Notification
								</label>
								<div className='relative'>
									<Mail
										size={14}
										className='absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400'
									/>
									<input
										type='email'
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder='your.email@example.com'
										className='w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white'
									/>
								</div>
								{user && (
									<p className='text-[10px] text-neutral-400 mt-1'>
										Pre-filled from your signed-in account.
									</p>
								)}
							</div>

							<div className='flex items-center justify-end gap-2 pt-2'>
								<button
									type='button'
									onClick={onClose}
									className='px-4 py-2.5 text-xs font-bold uppercase text-neutral-500 hover:text-black dark:hover:text-white transition-colors'
								>
									Cancel
								</button>
								<button
									type='submit'
									disabled={loading}
									className='px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider hover:opacity-85 disabled:opacity-50 transition-opacity'
								>
									{loading ? "Subscribing..." : "Notify Me"}
								</button>
							</div>
						</form>
					</div>
				) : (
					/* Confirmation State */
					<div className='py-6 text-center space-y-4'>
						<div className='w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto'>
							<Check size={24} />
						</div>
						<h3 className='text-sm font-black uppercase tracking-wider text-neutral-950 dark:text-white'>
							Alert Subscription Confirmed
						</h3>
						<p className='text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto'>
							{feedbackMsg}
						</p>
						<div className='pt-2'>
							<button
								type='button'
								onClick={onClose}
								className='w-full py-3 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-widest hover:opacity-85 transition-opacity'
							>
								Continue Browsing
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default NotifyMeModal;

