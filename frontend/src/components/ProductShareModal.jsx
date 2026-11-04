import { useState, useEffect } from "react";
import { X, Copy, Check, MessageCircle, Mail, Share2, Send } from "lucide-react";
import toast from "react-hot-toast";

const ProductShareModal = ({ isOpen, onClose, product }) => {
	const [copied, setCopied] = useState(false);

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

	const canonicalUrl = `${window.location.origin}/product/${product._id || product.id}`;
	const shareTitle = `${product.name} | LuxeStore Studio`;
	const shareMessage = `Discover the ${product.name} at ₹${Number(product.price || 0).toLocaleString("en-IN")} on LuxeStore Studio: ${canonicalUrl}`;

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(canonicalUrl);
			setCopied(true);
			toast.success("Link copied to clipboard!");
			setTimeout(() => setCopied(false), 2500);
		} catch (err) {
			toast.error("Failed to copy link");
		}
	};

	const handleNativeShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: shareTitle,
					text: `Check out ${product.name} on LuxeStore Studio`,
					url: canonicalUrl,
				});
			} catch (err) {
				// User cancelled share
			}
		} else {
			handleCopy();
		}
	};

	const handleWhatsAppShare = () => {
		const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
		window.open(url, "_blank", "noopener,noreferrer");
	};

	const handleEmailShare = () => {
		const subject = encodeURIComponent(shareTitle);
		const body = encodeURIComponent(
			`Hello,\n\nI thought you might appreciate this signature piece from LuxeStore Studio:\n\n${product.name}\nPrice: ₹${Number(product.price || 0).toLocaleString("en-IN")}\n\nExplore here: ${canonicalUrl}\n\n`
		);
		window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
	};

	const handleTwitterShare = () => {
		const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Elevate your wardrobe with ${product.name} from LuxeStore Studio`)}&url=${encodeURIComponent(canonicalUrl)}`;
		window.open(url, "_blank", "noopener,noreferrer");
	};

	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200'
			onClick={onClose}
		>
			<div
				className='relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden'
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className='flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800'>
					<div className='flex items-center gap-2'>
						<Share2 size={16} className='text-neutral-500' />
						<h3 className='text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-white'>
							Share Signature Piece
						</h3>
					</div>
					<button
						type='button'
						onClick={onClose}
						className='p-1 text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors'
						aria-label='Close dialog'
					>
						<X size={18} />
					</button>
				</div>

				<div className='p-6 space-y-6'>
					{/* Product Preview Card */}
					<div className='flex items-center gap-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800'>
						<img
							src={product.image}
							alt={product.name}
							className='w-16 h-20 object-cover bg-neutral-200 dark:bg-neutral-700 flex-shrink-0'
						/>
						<div className='flex-1 min-w-0'>
							<p className='text-[10px] font-bold uppercase tracking-wider text-neutral-400'>
								{product.category || "Couture"}
							</p>
							<h4 className='text-sm font-semibold text-neutral-900 dark:text-white truncate mt-0.5'>
								{product.name}
							</h4>
							<p className='text-sm font-bold text-neutral-950 dark:text-neutral-100 mt-1'>
								₹{Number(product.price || 0).toLocaleString("en-IN")}
							</p>
						</div>
					</div>

					{/* Share Options Grid */}
					<div>
						<p className='text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3'>
							Instant Channels
						</p>
						<div className='grid grid-cols-3 gap-2.5'>
							<button
								type='button'
								onClick={handleWhatsAppShare}
								className='flex flex-col items-center justify-center gap-2 p-3 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group'
							>
								<div className='w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform'>
									<MessageCircle size={18} />
								</div>
								<span className='text-[10px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300'>
									WhatsApp
								</span>
							</button>

							<button
								type='button'
								onClick={handleEmailShare}
								className='flex flex-col items-center justify-center gap-2 p-3 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-950 dark:hover:border-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all group'
							>
								<div className='w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center group-hover:scale-110 transition-transform'>
									<Mail size={18} />
								</div>
								<span className='text-[10px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300'>
									Email
								</span>
							</button>

							<button
								type='button'
								onClick={handleTwitterShare}
								className='flex flex-col items-center justify-center gap-2 p-3 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-950 dark:hover:border-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all group'
							>
								<div className='w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center group-hover:scale-110 transition-transform'>
									<Send size={18} />
								</div>
								<span className='text-[10px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300'>
									X / Post
								</span>
							</button>
						</div>
					</div>

					{/* Copy Canonical URL Input */}
					<div>
						<p className='text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2'>
							Canonical URL
						</p>
						<div className='flex items-center gap-2 p-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'>
							<input
								type='text'
								readOnly
								value={canonicalUrl}
								className='flex-1 bg-transparent px-2 text-xs font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none truncate select-all'
							/>
							<button
								type='button'
								onClick={handleCopy}
								className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
									copied
										? "bg-emerald-600 text-white"
										: "bg-black dark:bg-white text-white dark:text-black hover:opacity-85"
								}`}
							>
								{copied ? <Check size={12} /> : <Copy size={12} />}
								<span>{copied ? "COPIED" : "COPY"}</span>
							</button>
						</div>
					</div>

					{/* Web Share API Fallback */}
					{navigator.share && (
						<button
							type='button'
							onClick={handleNativeShare}
							className='w-full py-2.5 text-center text-xs font-bold tracking-widest uppercase border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-800 dark:text-neutral-200'
						>
							More System Options...
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default ProductShareModal;

