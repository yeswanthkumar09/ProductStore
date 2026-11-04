import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, AlertCircle } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";

const CartItem = ({ item }) => {
	const { removeFromCart, updateQuantity } = useCartStore();
	const itemId = item.cartItemId || item._id;
	const canonicalProductId = item.productId || item.product?._id || item.product || item._id;
	const isUnavailable = item.isAvailable === false || item.isDeleted === true;

	return (
		<div
			className={`border p-4 sm:p-5 select-none transition-colors ${
				isUnavailable
					? "border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20"
					: "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
			}`}
		>
			<div className='space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0'>
				{/* Item Thumbnail with Accessible Link */}
				<div className='shrink-0 md:order-1'>
					{isUnavailable ? (
						<div className='relative h-24 w-20 md:h-28 md:w-22 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center border border-neutral-300 dark:border-neutral-700'>
							<img
								className='h-full w-full object-cover opacity-50 grayscale'
								src={item.image || "/placeholder.png"}
								alt={item.name || "Unavailable Product"}
							/>
							<span className='absolute inset-0 bg-black/40 flex items-center justify-center text-[9px] font-black uppercase tracking-wider text-white px-1 text-center'>
								Unavailable
							</span>
						</div>
					) : (
						<Link
							to={`/product/${canonicalProductId}`}
							className='block h-24 w-20 md:h-28 md:w-22 overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 hover:opacity-85 transition-opacity'
							aria-label={`View product details for ${item.name}`}
						>
							<img
								className='h-full w-full object-cover object-top'
								src={item.image || "/placeholder.png"}
								alt={item.name}
							/>
						</Link>
					)}
				</div>

				{/* Item Details */}
				<div className='w-full min-w-0 flex-1 space-y-1.5 md:order-2 md:max-w-md'>
					{isUnavailable ? (
						<div>
							<h3 className='text-sm sm:text-base font-semibold text-neutral-500 dark:text-neutral-400 line-through leading-snug'>
								{item.name || "Archived Item"}
							</h3>
							<div className='mt-1 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold'>
								<AlertCircle size={13} />
								<span>{item.unavailableReason || "This item is no longer available in the catalogue."}</span>
							</div>
						</div>
					) : (
						<Link
							to={`/product/${canonicalProductId}`}
							className='block group hover:underline'
						>
							<h3 className='text-sm sm:text-base font-semibold text-neutral-950 dark:text-white leading-snug group-hover:text-black dark:group-hover:text-white'>
								{item.name}
							</h3>
						</Link>
					)}

					{/* Variant Specifications */}
					<div className='flex flex-wrap items-center gap-2 text-xs text-neutral-500'>
						{item.selectedColor && (
							<span>
								Color: <strong className='text-neutral-900 dark:text-white'>{item.selectedColor}</strong>
							</span>
						)}
						{item.selectedSize && (
							<span>
								• Size: <strong className='text-neutral-900 dark:text-white'>{item.selectedSize}</strong>
							</span>
						)}
						{item.sku && (
							<span className='font-mono text-[10px] text-neutral-400'>
								({item.sku})
							</span>
						)}
					</div>

					{/* Smart Stock Warning */}
					{item.stock !== undefined && item.stock <= 3 && item.stock > 0 && !isUnavailable && (
						<div className='text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1'>
							<span>⚡ Only {item.stock} left in stock - order soon</span>
						</div>
					)}
					{item.stock !== undefined && item.quantity >= item.stock && item.stock > 0 && !isUnavailable && (
						<p className='text-[10px] font-medium text-rose-500 mt-0.5'>
							Maximum available quantity reached
						</p>
					)}

					{/* Remove Button */}
					<div className='pt-2'>
						<button
							type='button'
							className='inline-flex items-center gap-1 text-[11px] font-bold text-neutral-400 hover:text-rose-600 transition-colors uppercase tracking-wider'
							onClick={() => removeFromCart(itemId, canonicalProductId, item.variantId)}
						>
							<Trash2 size={13} /> Remove
						</button>
					</div>
				</div>

				{/* Quantity & Price */}
				<div className='flex items-center justify-between md:order-3 md:justify-end gap-6'>
					{/* Stepper */}
					{!isUnavailable ? (
						<div className='flex items-center border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950'>
							<button
								type='button'
								aria-label='Decrease quantity'
								className='p-1.5 text-neutral-500 hover:text-black dark:hover:text-white transition-colors'
								onClick={() => updateQuantity(itemId, item.quantity - 1, item.variantId)}
							>
								<Minus size={13} />
							</button>
							<span className='text-xs font-bold text-neutral-950 dark:text-white px-2.5'>
								{item.quantity}
							</span>
							<button
								type='button'
								aria-label='Increase quantity'
								disabled={item.stock !== undefined && item.quantity >= item.stock}
								className='p-1.5 text-neutral-500 hover:text-black dark:hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
								onClick={() => updateQuantity(itemId, item.quantity + 1, item.variantId)}
							>
								<Plus size={13} />
							</button>
						</div>
					) : (
						<span className='text-xs text-rose-500 font-bold uppercase'>Action Required</span>
					)}

					{/* Item Total Price */}
					<div className='text-end md:w-28'>
						{!isUnavailable ? (
							<>
								<p className='text-base sm:text-lg font-black text-neutral-950 dark:text-white'>
									₹{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString("en-IN")}
								</p>
								<p className='text-[10px] text-neutral-400 font-mono'>
									₹{Number(item.price || 0).toLocaleString("en-IN")} ea
								</p>
							</>
						) : (
							<p className='text-xs text-neutral-400'>N/A</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default CartItem;
