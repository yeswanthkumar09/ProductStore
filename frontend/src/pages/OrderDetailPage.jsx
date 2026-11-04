import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
	Package,
	ArrowLeft,
	MapPin,
	Truck,
	Clock,
	CheckCircle,
	Ban,
	RefreshCw,
	Navigation,
	ExternalLink,
	ShieldCheck,
} from "lucide-react";
import { useOrderStore } from "../stores/useOrderStore";
import CancelOrderModal from "../components/CancelOrderModal";
import ShipmentTrackingModal from "../components/ShipmentTrackingModal";

const OrderDetailPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { fetchOrderDetail, currentOrder, loading, cancelOrder, cancellingId } = useOrderStore();

	const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
	const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

	useEffect(() => {
		if (id) {
			fetchOrderDetail(id);
		}
	}, [id, fetchOrderDetail]);

	const handleConfirmCancellation = async ({ reason, comment }) => {
		if (!id) return;
		const res = await cancelOrder(id, { reason, comment });
		if (res.success) {
			setIsCancelModalOpen(false);
			fetchOrderDetail(id);
		}
	};

	if (loading && !currentOrder) {
		return (
			<div className='min-h-[70vh] flex items-center justify-center text-gray-400'>
				<div className='animate-pulse text-base font-semibold'>Loading order details...</div>
			</div>
		);
	}

	if (!currentOrder) {
		return (
			<div className='min-h-[70vh] flex flex-col items-center justify-center px-4 text-center'>
				<Package size={48} className='text-gray-600 mb-3' />
				<h2 className='text-xl font-bold text-white font-heading mb-1'>Order Not Found</h2>
				<p className='text-xs text-gray-400 mb-6'>
					We couldn&apos;t retrieve details for order #{id?.slice(-8).toUpperCase() || id}.
				</p>
				<Link
					to='/orders'
					className='px-5 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold text-xs transition-all shadow-md'
				>
					Return to My Orders
				</Link>
			</div>
		);
	}

	const order = currentOrder;
	const isCancelled = order.status === "cancelled" || order.cancellation?.isCancelled;
	const isPaid = order.paymentStatus === "paid";
	const isRefunded = order.paymentStatus === "refunded" || order.refund?.status === "processed";
	const isEligibleForCancel =
		!isCancelled &&
		!["shipped", "out_for_delivery", "delivered"].includes(order.status) &&
		!["shipped", "delivered"].includes(order.shipmentStatus);

	const refund = order.refund;
	const hasRefund = refund && refund.status && refund.status !== "not_applicable";

	return (
		<div className='max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6'>
			{/* Back Link */}
			<div>
				<Link
					to='/orders'
					className='inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors'
				>
					<ArrowLeft size={14} /> Back to Order History
				</Link>
			</div>

			{/* Main Order Card */}
			<div className='bg-gray-900/80 border border-gray-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6'>
				{/* Top Header */}
				<div className='flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-800'>
					<div className='flex items-center gap-3'>
						<div className='p-3 rounded-2xl bg-accent/10 border border-accent/20 text-accent'>
							<Package size={24} />
						</div>
						<div>
							<div className='flex items-center gap-2'>
								<h1 className='text-xl sm:text-2xl font-black text-white font-heading'>
									Order #{order._id?.slice(-8).toUpperCase()}
								</h1>
							</div>
							<p className='text-xs text-gray-400 mt-1 flex items-center gap-1.5'>
								<Clock size={13} className='text-accent' />
								Placed on{" "}
								{new Date(order.createdAt).toLocaleDateString("en-IN", {
									year: "numeric",
									month: "long",
									day: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</p>
						</div>
					</div>

					{/* Status Badges */}
					<div className='flex flex-wrap items-center gap-2'>
						{isCancelled ? (
							<span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30'>
								<Ban size={14} /> Cancelled
							</span>
						) : isRefunded ? (
							<span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30'>
								<RefreshCw size={14} /> Refunded
							</span>
						) : isPaid ? (
							<span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'>
								<CheckCircle size={14} /> Paid
							</span>
						) : (
							<span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase'>
								{order.status}
							</span>
						)}

						{order.shipmentStatus && !isCancelled && (
							<span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 capitalize'>
								<Truck size={14} /> {order.shipmentStatus}
							</span>
						)}
					</div>
				</div>

				{/* Cancellation Banner */}
				{isCancelled && (
					<div className='p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-1'>
						<div className='flex items-center gap-1.5 font-bold text-rose-400 text-sm'>
							<Ban size={15} /> Order Cancellation Record
						</div>
						<p>
							Initiated by:{" "}
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

				{/* Refund Banner */}
				{hasRefund && (
					<div
						className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
							refund.status === "processed"
								? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
								: "bg-amber-500/10 border-amber-500/20 text-amber-300"
						}`}
					>
						<div className='flex items-center justify-between font-bold text-sm'>
							<div className='flex items-center gap-1.5'>
								<RefreshCw size={15} />
								<span>
									Refund {refund.status === "processed" ? "Processed" : refund.status?.toUpperCase()}
								</span>
							</div>
							<span className='font-mono font-bold text-base'>
								₹{Number(refund.amount || order.totalAmount).toLocaleString("en-IN")}
							</span>
						</div>
						{refund.refundId && (
							<p className='font-mono text-[11px] opacity-90'>
								Razorpay Refund Reference: <strong>{refund.refundId}</strong>
							</p>
						)}
						{refund.failureReason && (
							<p className='text-rose-400 font-semibold'>Note: {refund.failureReason}</p>
						)}
					</div>
				)}

				{/* Products Section */}
				<div>
					<h3 className='text-xs font-bold text-gray-400 uppercase tracking-wider mb-3'>
						Order Items ({order.products?.length || 0})
					</h3>
					<div className='divide-y divide-gray-800/80 bg-gray-950/60 rounded-2xl border border-gray-800 p-2'>
						{order.products?.map((item, idx) => {
							const p = item.product || {};
							return (
								<div key={idx} className='p-3.5 flex items-center gap-4'>
									<img
										src={p.image || "/placeholder.png"}
										alt={p.name || "Item"}
										className='w-16 h-16 object-cover rounded-xl bg-gray-900 border border-gray-800 shrink-0'
									/>
									<div className='flex-1 min-w-0'>
										<h4 className='text-sm font-semibold text-white truncate'>
											{p.name || "Product Item"}
										</h4>
										<p className='text-xs text-gray-400 mt-0.5'>
											Qty: <strong>{item.quantity}</strong> × ₹
											{Number(item.price || 0).toLocaleString("en-IN")}
											{item.selectedColor && ` • Color: ${item.selectedColor}`}
											{item.selectedSize && ` • Size: ${item.selectedSize}`}
										</p>
										{item.sku && (
											<p className='text-[10px] text-gray-500 font-mono'>SKU: {item.sku}</p>
										)}
									</div>
									<div className='text-sm font-bold text-white text-right'>
										₹{Number((item.quantity || 1) * (item.price || 0)).toLocaleString("en-IN")}
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Shipping & Delivery Grid */}
				<div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs'>
					<div className='bg-gray-950/60 border border-gray-800 rounded-2xl p-4 space-y-1.5'>
						<div className='flex items-center gap-1.5 font-bold text-white mb-2'>
							<MapPin size={14} className='text-accent' />
							<span>Delivery Destination</span>
						</div>
						<p className='font-semibold text-gray-200 text-sm'>
							{order.shippingAddress?.fullName || "Recipient"}
						</p>
						<p className='text-gray-400 leading-relaxed'>
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
							<p className='text-gray-400'>Phone: {order.shippingAddress.phone}</p>
						)}
					</div>

					<div className='bg-gray-950/60 border border-gray-800 rounded-2xl p-4 space-y-1.5'>
						<div className='flex items-center gap-1.5 font-bold text-white mb-2'>
							<Truck size={14} className='text-accent' />
							<span>Logistics & Shipping</span>
						</div>
						<p className='text-gray-300'>
							Partner: <strong className='text-white'>{order.courierName || "Express Delivery"}</strong>
						</p>
						<p className='text-gray-300'>
							Estimated Window:{" "}
							<span className='text-emerald-400 font-semibold'>
								{order.estimatedDeliveryDays || "2-4 business days"}
							</span>
						</p>
						{order.shiprocketAwb && (
							<p className='text-gray-400 font-mono text-[11px]'>
								AWB: <strong>{order.shiprocketAwb}</strong>
							</p>
						)}
						<button
							type='button'
							onClick={() => setIsTrackingModalOpen(true)}
							className='mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-[11px] hover:bg-emerald-500/20 transition-all border border-emerald-500/20'
						>
							<Navigation size={12} /> Track on Route Map
						</button>
					</div>
				</div>

				{/* Financial Breakdown */}
				<div className='bg-gray-950/80 border border-gray-800 rounded-2xl p-4 space-y-2 text-xs'>
					<div className='flex justify-between text-gray-400'>
						<span>Items Subtotal</span>
						<span className='font-semibold text-white'>
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
						<div className='flex justify-between text-gray-400'>
							<span>Delivery Fee</span>
							<span className='text-white font-semibold'>
								₹{order.deliveryFee.toLocaleString("en-IN")}
							</span>
						</div>
					) : (
						<div className='flex justify-between text-gray-400'>
							<span>Delivery</span>
							<span className='text-emerald-400 font-semibold'>FREE</span>
						</div>
					)}

					{order.discountAmount > 0 && (
						<div className='flex justify-between text-accent font-semibold'>
							<span>Coupon Discount ({order.couponCode})</span>
							<span>-₹{Number(order.discountAmount).toLocaleString("en-IN")}</span>
						</div>
					)}

					<div className='border-t border-gray-800 pt-2 flex justify-between items-center text-sm font-bold text-white'>
						<span>Total Paid</span>
						<span className='text-base font-black text-accent'>
							₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
						</span>
					</div>

					<div className='pt-1 text-[11px] text-gray-500 flex items-center justify-between'>
						<span>Payment Gateway: Razorpay Standard Checkout</span>
						{order.razorpayPaymentId && (
							<span className='font-mono'>Payment Ref: {order.razorpayPaymentId}</span>
						)}
					</div>
				</div>

				{/* Footer Controls */}
				<div className='pt-4 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3'>
					{isEligibleForCancel && (
						<button
							type='button'
							onClick={() => setIsCancelModalOpen(true)}
							disabled={cancellingId === order._id}
							className='inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all shadow-md'
						>
							<Ban size={14} /> Cancel Order
						</button>
					)}

					<div className='flex gap-2 ml-auto'>
						<Link
							to='/orders'
							className='px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold'
						>
							View All Orders
						</Link>
						<Link
							to='/'
							className='px-4 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold shadow-md'
						>
							Continue Shopping
						</Link>
					</div>
				</div>
			</div>

			{/* Interactive Shipment Tracking Modal */}
			<ShipmentTrackingModal
				orderId={order._id}
				isOpen={isTrackingModalOpen}
				onClose={() => setIsTrackingModalOpen(false)}
			/>

			{/* Cancellation Confirmation Modal */}
			<CancelOrderModal
				isOpen={isCancelModalOpen}
				onClose={() => setIsCancelModalOpen(false)}
				order={order}
				isLoading={cancellingId === order._id}
				onConfirm={handleConfirmCancellation}
			/>
		</div>
	);
};

export default OrderDetailPage;

