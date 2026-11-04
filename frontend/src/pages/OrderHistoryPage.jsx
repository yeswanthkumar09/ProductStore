import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
	Package,
	Clock,
	CheckCircle,
	ArrowRight,
	ShoppingBag,
	Truck,
	Navigation,
	MapPin,
	Ban,
	RefreshCw,
	Eye,
	AlertCircle,
} from "lucide-react";
import { useOrderStore } from "../stores/useOrderStore";
import ShipmentTrackingModal from "../components/ShipmentTrackingModal";
import OrderDetailModal from "../components/OrderDetailModal";
import CancelOrderModal from "../components/CancelOrderModal";

const OrderHistoryPage = () => {
	const { orders, fetchOrders, loading, cancelOrder, cancellingId } = useOrderStore();
	const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(null);
	const [isTrackingOpen, setIsTrackingOpen] = useState(false);

	const [selectedDetailOrder, setSelectedDetailOrder] = useState(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);

	const [cancellingOrder, setCancellingOrder] = useState(null);
	const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

	useEffect(() => {
		fetchOrders();
	}, [fetchOrders]);

	const handleOpenTracking = (orderId) => {
		setActiveTrackingOrderId(orderId);
		setIsTrackingOpen(true);
	};

	const handleOpenDetail = (order) => {
		setSelectedDetailOrder(order);
		setIsDetailOpen(true);
	};

	const handleOpenCancelModal = (order) => {
		setCancellingOrder(order);
		setIsCancelModalOpen(true);
	};

	const handleConfirmCancellation = async ({ reason, comment }) => {
		if (!cancellingOrder) return;
		const res = await cancelOrder(cancellingOrder._id, { reason, comment });
		if (res.success) {
			setIsCancelModalOpen(false);
			setCancellingOrder(null);
			if (selectedDetailOrder?._id === cancellingOrder._id) {
				setSelectedDetailOrder(res.order);
			}
		}
	};

	const completedOrders = (orders || []).filter((order) =>
		["paid", "refunded", "partially_refunded"].includes(order.paymentStatus)
	);

	return (
		<div className='max-w-5xl mx-auto px-4 sm:px-6 py-12'>
			<div className='flex items-center justify-between pb-6 mb-8 border-b border-neutral-200 dark:border-neutral-800'>
				<div>
					<h1 className='text-2xl sm:text-3xl font-black uppercase tracking-wider text-neutral-950 dark:text-white font-heading'>
						My Orders & Purchases
					</h1>
					<p className='text-xs uppercase tracking-widest text-neutral-500 mt-1'>
						Manage orders, view itemized receipts, track live deliveries, or cancel eligible purchases
					</p>
				</div>
				<Link
					to='/'
					className='hidden sm:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white hover:underline'
				>
					<ShoppingBag size={14} /> Shop New Arrivals
				</Link>
			</div>

			{loading && completedOrders.length === 0 ? (
				<div className='py-20 text-center text-xs uppercase tracking-widest text-neutral-400'>
					Loading your orders...
				</div>
			) : completedOrders.length === 0 ? (
				<div className='text-center py-24 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8'>
					<Package size={44} className='mx-auto text-neutral-400 mb-4' />
					<h2 className='text-xl font-black uppercase tracking-tight text-neutral-950 dark:text-white mb-2 font-heading'>
						No orders placed yet
					</h2>
					<p className='text-neutral-500 text-xs uppercase tracking-wider max-w-md mx-auto mb-6'>
						Once you complete a purchase, your itemized receipts and live delivery tracking will appear here.
					</p>
					<Link
						to='/'
						className='inline-flex items-center gap-2 px-8 py-3.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-widest transition-all'
					>
						<ShoppingBag size={16} /> Explore Collections
					</Link>
				</div>
			) : (
				<div className='space-y-6'>
					{completedOrders.map((order) => {
						const isCancelled = order.status === "cancelled" || order.cancellation?.isCancelled;
						const isPaid = order.paymentStatus === "paid";
						const isRefunded = order.paymentStatus === "refunded" || order.refund?.status === "processed";
						const isEligibleForCancel =
							!isCancelled &&
							!["shipped", "out_for_delivery", "delivered"].includes(order.status) &&
							!["shipped", "delivered"].includes(order.shipmentStatus);

						return (
							<div
								key={order._id}
								className={`bg-white dark:bg-neutral-900 border transition-all ${
									isCancelled
										? "border-rose-200 dark:border-rose-900/40 bg-neutral-50/50"
										: "border-neutral-200 dark:border-neutral-800"
								} p-6 sm:p-7 shadow-sm`}
							>
								{/* Order Header */}
								<div className='flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800'>
									<div>
										<span className='text-[10px] font-bold text-neutral-400 uppercase tracking-widest'>
											Order Reference
										</span>
										<p className='text-sm font-mono font-bold text-neutral-950 dark:text-white'>
											#{order._id?.slice(-8).toUpperCase()}
										</p>
									</div>

									<div>
										<span className='text-[10px] font-bold text-neutral-400 uppercase tracking-widest'>
											Date Placed
										</span>
										<p className='text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 mt-0.5'>
											<Clock size={13} className='text-neutral-400' />
											{new Date(order.createdAt).toLocaleDateString("en-IN", {
												year: "numeric",
												month: "short",
												day: "numeric",
											})}
										</p>
									</div>

									<div>
										<span className='text-[10px] font-bold text-neutral-400 uppercase tracking-widest'>
											Total Paid
										</span>
										<p className='text-base font-black text-neutral-950 dark:text-white'>
											₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
										</p>
									</div>

									{/* Status Badges */}
									<div className='flex flex-wrap items-center gap-2'>
										{isCancelled ? (
											<span className='inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200'>
												<Ban size={12} /> Cancelled
											</span>
										) : isRefunded ? (
											<span className='inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200'>
												<RefreshCw size={12} /> Refunded
											</span>
										) : isPaid ? (
											<span className='inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-neutral-950 text-white'>
												<CheckCircle size={12} /> Paid & Confirmed
											</span>
										) : (
											<span className='inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-300'>
												{order.status || "Pending"}
											</span>
										)}

										{order.shipmentStatus && !isCancelled && (
											<span className='inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-900 border border-neutral-200'>
												<Truck size={12} /> {order.shipmentStatus}
											</span>
										)}
									</div>
								</div>

								{/* Cancellation / Refund Summary Alert */}
								{isCancelled && (
									<div className='my-3 p-3 bg-rose-50/60 border border-rose-200 text-xs text-rose-900 flex flex-wrap items-center justify-between gap-2'>
										<div>
											<strong>Order Cancelled:</strong> {order.cancellation?.reason || "Cancelled by customer"}
											{order.cancellation?.cancelledAt &&
												` on ${new Date(order.cancellation.cancelledAt).toLocaleDateString("en-IN")}`}
										</div>
										{order.refund?.status === "processed" && (
											<div className='flex items-center gap-1 text-emerald-700 font-bold'>
												<RefreshCw size={12} />
												<span>Refund of ₹{Number(order.refund.amount).toLocaleString("en-IN")} Processed</span>
											</div>
										)}
										{order.refund?.status === "failed" && (
											<div className='flex items-center gap-1 text-amber-800 font-semibold'>
												<AlertCircle size={12} />
												<span>Refund pending review</span>
											</div>
										)}
									</div>
								)}

								{/* Shipping Destination & Courier Details */}
								{order.shippingAddress && (
									<div className='py-3 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between text-xs text-neutral-500 gap-2'>
										<div className='flex items-center gap-1.5'>
											<MapPin size={13} className='text-neutral-400' />
											<span>
												Delivering to:{" "}
												<strong className='text-neutral-900 dark:text-white font-medium'>
													{order.shippingAddress.fullName || "Recipient"}
												</strong>
												, {order.shippingAddress.city} - {order.shippingAddress.pincode}
											</span>
										</div>
										{order.courierName && (
											<div className='flex items-center gap-1 text-neutral-700 dark:text-neutral-300'>
												<Truck size={13} className='text-neutral-500' />
												<span>Partner: {order.courierName}</span>
											</div>
										)}
									</div>
								)}

								{/* Order Items */}
								<div className='divide-y divide-neutral-100 dark:divide-neutral-800 my-4'>
									{order.products?.map((item, idx) => {
										const prod = item.product && typeof item.product === "object" ? item.product : null;
										const prodId = prod?._id || (typeof item.product === "string" ? item.product : null);
										const itemName = prod?.name || item.name || "Purchased Garment";
										const itemImg = prod?.image || item.image || "/placeholder.png";
										const isAvailable = Boolean(prod && prod._id);

										return (
											<div key={idx} className='py-3.5 flex items-center gap-4'>
												{isAvailable ? (
													<Link
														to={`/product/${prodId}`}
														className='block shrink-0 w-16 h-20 overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 hover:opacity-85 transition-opacity'
														aria-label={`View ${itemName}`}
													>
														<img
															src={itemImg}
															alt={itemName}
															className='w-full h-full object-cover object-top'
														/>
													</Link>
												) : (
													<div className='relative shrink-0 w-16 h-20 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 overflow-hidden'>
														<img
															src={itemImg}
															alt={itemName}
															className='w-full h-full object-cover opacity-60 grayscale'
														/>
													</div>
												)}

												<div className='flex-1 min-w-0'>
													{isAvailable ? (
														<Link
															to={`/product/${prodId}`}
															className='hover:underline block'
														>
															<h4 className='text-xs sm:text-sm font-bold uppercase tracking-tight text-neutral-950 dark:text-white truncate'>
																{itemName}
															</h4>
														</Link>
													) : (
														<div>
															<h4 className='text-xs sm:text-sm font-bold uppercase tracking-tight text-neutral-500 truncate'>
																{itemName}
															</h4>
															<span className='text-[10px] uppercase font-bold text-neutral-400'>
																Catalogue Archived
															</span>
														</div>
													)}
													<p className='text-xs text-neutral-500 mt-1'>
														Qty: {item.quantity} × ₹
														{Number(item.price || 0).toLocaleString("en-IN")}
														{item.selectedColor && ` • Color: ${item.selectedColor}`}
														{item.selectedSize && ` • Size: ${item.selectedSize}`}
													</p>
												</div>
												<div className='text-xs sm:text-sm font-black text-neutral-950 dark:text-white'>
													₹{Number((item.quantity || 1) * (item.price || 0)).toLocaleString("en-IN")}
												</div>
											</div>
										);
									})}
								</div>

								{/* Actions Footer */}
								<div className='pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 dark:border-neutral-800'>
									<div className='flex flex-wrap items-center gap-2'>
										{/* View Details Button */}
										<button
											type='button'
											onClick={() => handleOpenDetail(order)}
											className='inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-bold uppercase tracking-wider transition-all'
										>
											<Eye size={13} /> Receipt & Breakdown
										</button>

										{/* Live Interactive Map Tracking Button */}
										{!isCancelled && (
											<button
												type='button'
												onClick={() => handleOpenTracking(order._id)}
												className='inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm'
											>
												<Navigation size={13} /> Track Route Map
											</button>
										)}

										{/* Customer Cancel Order Button */}
										{isEligibleForCancel && (
											<button
												type='button'
												onClick={() => handleOpenCancelModal(order)}
												disabled={cancellingId === order._id}
												className='inline-flex items-center gap-1.5 px-4 py-2 border border-rose-300 hover:bg-rose-50 text-rose-600 text-xs font-bold uppercase tracking-wider transition-all'
											>
												<Ban size={13} /> Cancel Order
											</button>
										)}
									</div>

									<Link
										to='/'
										className='inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-950 dark:hover:text-white transition-colors'
									>
										Shop More <ArrowRight size={13} />
									</Link>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Interactive Shipment Tracking Modal */}
			<ShipmentTrackingModal
				orderId={activeTrackingOrderId}
				isOpen={isTrackingOpen}
				onClose={() => setIsTrackingOpen(false)}
			/>

			{/* Comprehensive Order Detail Modal */}
			<OrderDetailModal
				isOpen={isDetailOpen}
				onClose={() => setIsDetailOpen(false)}
				order={selectedDetailOrder}
				onCancelClick={(ord) => {
					setIsDetailOpen(false);
					handleOpenCancelModal(ord);
				}}
				onOpenTracking={handleOpenTracking}
			/>

			{/* Customer Cancellation Confirmation Modal */}
			<CancelOrderModal
				isOpen={isCancelModalOpen}
				onClose={() => setIsCancelModalOpen(false)}
				order={cancellingOrder}
				isLoading={cancellingId === cancellingOrder?._id}
				onConfirm={handleConfirmCancellation}
			/>
		</div>
	);
};

export default OrderHistoryPage;
