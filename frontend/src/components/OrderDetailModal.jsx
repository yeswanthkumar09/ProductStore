import { Link } from "react-router-dom";
import { X, Package, MapPin, Truck, ShieldCheck, AlertCircle, RefreshCw, Clock, Ban } from "lucide-react";

const OrderDetailModal = ({ isOpen, onClose, order, onCancelClick, onOpenTracking }) => {
	if (!isOpen || !order) return null;

	const isCancelled = order.status === "cancelled" || order.cancellation?.isCancelled;
	const isEligibleForCancel =
		!isCancelled &&
		!["shipped", "out_for_delivery", "delivered"].includes(order.status) &&
		!["shipped", "delivered"].includes(order.shipmentStatus);

	const refund = order.refund;
	const hasRefund = refund && refund.status && refund.status !== "not_applicable";

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in'>
			<div className='bg-white dark:bg-gray-900 border border-neutral-200 dark:border-gray-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden'>
				{/* Top Modal Header */}
				<div className='flex items-center justify-between p-5 sm:p-6 border-b border-neutral-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/90 sticky top-0 z-10'>
					<div className='flex items-center gap-3'>
						<div className='p-2.5 rounded-2xl bg-accent/10 border border-accent/20 text-accent'>
							<Package size={22} />
						</div>
						<div>
							<div className='flex items-center gap-2'>
								<h3 className='text-base sm:text-lg font-bold text-neutral-900 dark:text-white font-heading'>
									Order Details
								</h3>
								<span className='font-mono text-xs text-neutral-500 dark:text-gray-400 font-semibold'>
									#{order._id?.slice(-8).toUpperCase()}
								</span>
							</div>
							<p className='text-xs text-neutral-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5'>
								<Clock size={12} />
								Placed on{" "}
								{new Date(order.createdAt).toLocaleDateString("en-IN", {
									year: "numeric",
									month: "short",
									day: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</p>
						</div>
					</div>

					<button
						type='button'
						onClick={onClose}
						className='p-2 text-neutral-400 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors'
					>
						<X size={18} />
					</button>
				</div>

				{/* Scrollable Body */}
				<div className='p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar'>
					{/* Status Badges Row */}
					<div className='flex flex-wrap items-center gap-2 p-3.5 bg-neutral-50 dark:bg-gray-950/70 border border-neutral-200 dark:border-gray-800/80 rounded-2xl text-xs'>
						<span className='text-neutral-600 dark:text-gray-400 font-medium'>Status:</span>

						{/* Order Status */}
						<span
							className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] border ${
								isCancelled
									? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
									: order.status === "delivered"
									? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
									: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
							}`}
						>
							{order.status}
						</span>

						{/* Payment Status */}
						<span
							className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] border ${
								order.paymentStatus === "paid"
									? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
									: order.paymentStatus === "refunded"
									? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
									: "bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
							}`}
						>
							Payment: {order.paymentStatus}
						</span>

						{/* Shipment Status */}
						{order.shipmentStatus && (
							<span className='px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1'>
								<Truck size={12} /> {order.shipmentStatus}
							</span>
						)}
					</div>

					{/* Cancellation Notice Banner */}
					{isCancelled && (
						<div className='p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-1.5'>
							<div className='flex items-center gap-2 font-bold text-rose-400 text-sm'>
								<Ban size={16} />
								<span>Order Cancelled</span>
							</div>
							<p>
								Cancelled by:{" "}
								<strong className='capitalize text-white'>
									{order.cancellation?.cancelledBy || "Customer"}
								</strong>
								{order.cancellation?.cancelledAt &&
									` on ${new Date(order.cancellation.cancelledAt).toLocaleDateString("en-IN")}`}
							</p>
							{order.cancellation?.reason && (
								<p>
									Reason: <span className='text-gray-200'>{order.cancellation.reason}</span>
								</p>
							)}
						</div>
					)}

					{/* Refund Notice Banner */}
					{hasRefund && (
						<div
							className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
								refund.status === "processed"
									? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
									: refund.status === "failed"
									? "bg-rose-500/10 border-rose-500/20 text-rose-300"
									: "bg-amber-500/10 border-amber-500/20 text-amber-300"
							}`}
						>
							<div className='flex items-center justify-between font-bold text-sm'>
								<div className='flex items-center gap-2'>
									<RefreshCw size={15} />
									<span>
										Refund {refund.status === "processed" ? "Processed" : refund.status?.toUpperCase()}
									</span>
								</div>
								<span className='font-mono font-black text-base'>
									₹{Number(refund.amount || order.totalAmount).toLocaleString("en-IN")}
								</span>
							</div>

							{refund.refundId && (
								<p className='font-mono text-[11px] opacity-90'>
									Razorpay Refund ID: <strong>{refund.refundId}</strong>
								</p>
							)}
							{refund.failureReason && (
								<p className='text-rose-400 font-medium'>
									Failure Note: {refund.failureReason}
								</p>
							)}
							<p className='text-[11px] opacity-75'>
								Funds reflect back to the customer&apos;s source account according to bank clearance timelines.
							</p>
						</div>
					)}

					{/* Purchased Items List */}
					<div>
						<h4 className='text-xs font-bold text-gray-400 uppercase tracking-wider mb-3'>
							Purchased Items ({order.products?.length || 0})
						</h4>
						<div className='divide-y divide-neutral-200 dark:divide-gray-800/80 bg-neutral-50 dark:bg-gray-950/50 rounded-2xl border border-neutral-200 dark:border-gray-800/80 p-2'>
							{order.products?.map((item, idx) => {
								const prod = item.product && typeof item.product === "object" ? item.product : null;
								const prodId = prod?._id || (typeof item.product === "string" ? item.product : null);
								const itemName = prod?.name || item.name || "Purchased Piece";
								const itemImg = prod?.image || item.image || "/placeholder.png";
								const isAvailable = Boolean(prod && prod._id);

								return (
									<div key={idx} className='p-3 flex items-center gap-3.5'>
										{isAvailable ? (
											<Link
												to={`/product/${prodId}`}
												onClick={onClose}
												className='block shrink-0 w-14 h-16 rounded-xl overflow-hidden bg-white dark:bg-gray-900 border border-neutral-200 dark:border-gray-800 hover:opacity-85 transition-opacity'
												aria-label={`View ${itemName}`}
											>
												<img
													src={itemImg}
													alt={itemName}
													className='w-full h-full object-cover object-top'
												/>
											</Link>
										) : (
											<div className='relative shrink-0 w-14 h-16 rounded-xl overflow-hidden bg-neutral-100 dark:bg-gray-900 border border-neutral-200 dark:border-gray-800'>
												<img
													src={itemImg}
													alt={itemName}
													className='w-full h-full object-cover opacity-50 grayscale'
												/>
											</div>
										)}

										<div className='flex-1 min-w-0'>
											{isAvailable ? (
												<Link
													to={`/product/${prodId}`}
													onClick={onClose}
													className='hover:underline block'
												>
													<h5 className='text-sm font-semibold text-neutral-900 dark:text-white truncate hover:text-accent transition-colors'>
														{itemName}
													</h5>
												</Link>
											) : (
												<div>
													<h5 className='text-sm font-semibold text-neutral-600 dark:text-gray-400 truncate'>
														{itemName}
													</h5>
													<span className='text-[10px] uppercase font-bold text-neutral-500 dark:text-gray-500'>
														Catalog Archived
													</span>
												</div>
											)}
											<p className='text-xs text-neutral-600 dark:text-gray-400 mt-0.5'>
												Qty: <strong className='text-neutral-900 dark:text-white'>{item.quantity}</strong> × ₹
												{Number(item.price || 0).toLocaleString("en-IN")}
												{item.selectedColor && ` • Color: ${item.selectedColor}`}
												{item.selectedSize && ` • Size: ${item.selectedSize}`}
											</p>
											{item.sku && (
												<p className='text-[10px] text-neutral-500 dark:text-gray-500 font-mono'>SKU: {item.sku}</p>
											)}
										</div>
										<div className='text-sm font-bold text-neutral-900 dark:text-white text-right'>
											₹{Number((item.quantity || 1) * (item.price || 0)).toLocaleString("en-IN")}
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Shipping Address & Courier Summary Grid */}
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						{/* Delivery Address */}
						<div className='bg-neutral-50 dark:bg-gray-950/50 border border-neutral-200 dark:border-gray-800/80 rounded-2xl p-4 text-xs space-y-1.5'>
							<div className='flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white mb-2'>
								<MapPin size={14} className='text-accent' />
								<span>Delivery Address</span>
							</div>
							<p className='font-semibold text-neutral-900 dark:text-gray-200'>
								{order.shippingAddress?.fullName || "Recipient"}
							</p>
							<p className='text-neutral-600 dark:text-gray-400'>
								{[
									order.shippingAddress?.houseFlat,
									order.shippingAddress?.street,
									order.shippingAddress?.locality,
									order.shippingAddress?.city,
									order.shippingAddress?.state,
								]
									.filter(Boolean)
									.join(", ")}{" "}
								- {order.shippingAddress?.pincode}
							</p>
							{order.shippingAddress?.phone && (
								<p className='text-neutral-600 dark:text-gray-400'>Phone: {order.shippingAddress.phone}</p>
							)}
						</div>

						{/* Courier & Payment Info */}
						<div className='bg-neutral-50 dark:bg-gray-950/50 border border-neutral-200 dark:border-gray-800/80 rounded-2xl p-4 text-xs space-y-1.5'>
							<div className='flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white mb-2'>
								<Truck size={14} className='text-accent' />
								<span>Logistics & Courier</span>
							</div>
							<p className='text-neutral-700 dark:text-gray-300'>
								Partner:{" "}
								<strong className='text-neutral-900 dark:text-white'>{order.courierName || "Express Delivery"}</strong>
							</p>
							<p className='text-neutral-700 dark:text-gray-300'>
								Estimated Window:{" "}
								<span className='text-emerald-600 dark:text-emerald-400 font-medium'>
									{order.estimatedDeliveryDays || "2-4 business days"}
								</span>
							</p>
							{order.shiprocketAwb && (
								<p className='text-neutral-600 dark:text-gray-400 font-mono text-[11px]'>
									AWB: <strong>{order.shiprocketAwb}</strong>
								</p>
							)}

							{onOpenTracking && (
								<button
									type='button'
									onClick={() => onOpenTracking(order._id)}
									className='mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline'
								>
									Track on Live Route Map →
								</button>
							)}
						</div>
					</div>

					{/* Financial Summary */}
					<div className='bg-neutral-50 dark:bg-gray-950/80 border border-neutral-200 dark:border-gray-800 rounded-2xl p-4 space-y-2 text-xs'>
						<div className='flex justify-between text-neutral-600 dark:text-gray-400'>
							<span>Items Subtotal</span>
							<span className='font-semibold text-neutral-900 dark:text-white'>
								₹
								{(
									order.products?.reduce(
										(sum, i) => sum + (i.price || 0) * (i.quantity || 1),
										0
									) || order.totalAmount
								).toLocaleString("en-IN")}
							</span>
						</div>

						{order.deliveryFee > 0 ? (
							<div className='flex justify-between text-neutral-600 dark:text-gray-400'>
								<span>Delivery Fee</span>
								<span className='font-semibold text-neutral-900 dark:text-white'>
									₹{order.deliveryFee.toLocaleString("en-IN")}
								</span>
							</div>
						) : (
							<div className='flex justify-between text-neutral-600 dark:text-gray-400'>
								<span>Delivery</span>
								<span className='font-semibold text-emerald-600 dark:text-emerald-400'>FREE</span>
							</div>
						)}

						{order.discountAmount > 0 && (
							<div className='flex justify-between text-accent font-semibold'>
								<span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
								<span>-₹{Number(order.discountAmount).toLocaleString("en-IN")}</span>
							</div>
						)}

						<div className='border-t border-neutral-200 dark:border-gray-800 pt-2 flex justify-between items-center text-sm font-bold text-neutral-900 dark:text-white'>
							<span>Final Total</span>
							<span className='text-base font-black text-accent'>
								₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
							</span>
						</div>

						<div className='pt-1 text-[11px] text-neutral-500 dark:text-gray-500 flex items-center justify-between'>
							<span>Payment Method: {order.paymentMethod?.toUpperCase()}</span>
							{order.razorpayPaymentId && (
								<span className='font-mono'>Ref: {order.razorpayPaymentId}</span>
							)}
						</div>
					</div>
				</div>

				{/* Footer Controls */}
				<div className='p-4 sm:p-5 border-t border-neutral-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/90 flex flex-wrap items-center justify-between gap-3 sticky bottom-0'>
					{isEligibleForCancel && onCancelClick ? (
						<button
							type='button'
							onClick={() => onCancelClick(order)}
							className='px-4 py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all shadow-md'
						>
							Cancel Order
						</button>
					) : (
						<div />
					)}

					<button
						type='button'
						onClick={onClose}
						className='px-5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-transparent text-xs font-semibold transition-all'
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

export default OrderDetailModal;

