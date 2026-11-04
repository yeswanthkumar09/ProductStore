import { ArrowRight, CheckCircle, Package, MapPin, Truck, ShieldCheck, ShoppingBag, ExternalLink, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import axios from "../lib/axios";
import Confetti from "react-confetti";
import OrderDetailModal from "../components/OrderDetailModal";

const PurchaseSuccessPage = () => {
	const [searchParams] = useSearchParams();
	const [isProcessing, setIsProcessing] = useState(true);
	const [order, setOrder] = useState(null);
	const [error, setError] = useState(null);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const { clearCart } = useCartStore();

	useEffect(() => {
		const orderId = searchParams.get("order_id");
		const sessionId = searchParams.get("session_id");

		const fetchRealOrder = async (id) => {
			try {
				const res = await axios.get(`/orders/${id}`);
				setOrder(res.data);
				clearCart();
			} catch (err) {
				console.error("Error fetching confirmed order:", err);
				setError("Your payment was processed, but we had trouble retrieving receipt details.");
			} finally {
				setIsProcessing(false);
			}
		};

		const handleStripeSuccess = async (sId) => {
			try {
				const res = await axios.post("/payments/checkout-success", { sessionId: sId });
				if (res.data?.orderId) {
					fetchRealOrder(res.data.orderId);
				} else {
					clearCart();
					setIsProcessing(false);
				}
			} catch (err) {
				console.error("Error confirming checkout session:", err);
				setError("Failed to confirm order with payment provider.");
				setIsProcessing(false);
			}
		};

		if (orderId) {
			fetchRealOrder(orderId);
		} else if (sessionId) {
			handleStripeSuccess(sessionId);
		} else {
			setIsProcessing(false);
			setError("No order reference found in the confirmation URL.");
		}
	}, [searchParams, clearCart]);

	if (isProcessing) {
		return (
			<div className='min-h-[70vh] flex flex-col items-center justify-center px-4 text-emerald-400'>
				<RefreshCw size={36} className='animate-spin mb-4' />
				<h2 className='text-xl font-bold font-heading text-white'>Verifying Payment with Razorpay...</h2>
				<p className='text-sm text-gray-400 mt-1'>Finalizing your order and reserving inventory.</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className='min-h-[70vh] flex items-center justify-center px-4'>
				<div className='max-w-md w-full bg-gray-900 border border-rose-500/30 rounded-3xl p-7 text-center shadow-2xl'>
					<div className='w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20'>
						<CheckCircle size={28} className='rotate-45' />
					</div>
					<h3 className='text-lg font-bold text-white mb-2 font-heading'>Order Notice</h3>
					<p className='text-xs text-rose-300 mb-6 leading-relaxed'>
						{typeof error === "object" ? error?.message || "Order notice." : String(error)}
					</p>
					<div className='flex gap-2 justify-center'>
						<Link
							to='/orders'
							className='px-4 py-2.5 bg-black text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-xl text-xs font-bold transition-all shadow-md'
						>
							View Order History
						</Link>
						<Link
							to='/cart'
							className='px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold'
						>
							Return to Cart
						</Link>
					</div>
				</div>
			</div>
		);
	}

	const orderNumber = order?._id ? order._id.slice(-8).toUpperCase() : "CONFIRMED";
	const products = order?.products || [];
	const address = order?.shippingAddress || {};

	return (
		<div className='min-h-screen py-10 px-4 sm:px-6 relative'>
			<Confetti
				width={window.innerWidth}
				height={window.innerHeight}
				gravity={0.08}
				style={{ zIndex: 99, pointerEvents: "none" }}
				numberOfPieces={500}
				recycle={false}
			/>

			<div className='max-w-3xl mx-auto space-y-6 relative z-10'>
				{/* Success Banner Card */}
				<div className='bg-gray-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-center relative overflow-hidden'>
					<div className='absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none' />

					<div className='inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4'>
						<CheckCircle size={36} />
					</div>

					<h1 className='text-2xl sm:text-3xl font-extrabold text-white font-heading'>
						Payment Verified & Order Confirmed!
					</h1>
					<p className='text-sm text-gray-300 mt-2 max-w-lg mx-auto'>
						Thank you for shopping with LuxeStore. Your payment has been authorized and securely recorded.
					</p>

					{/* Metadata Pills */}
					<div className='mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-950/70 border border-gray-800/80 rounded-2xl p-4 text-xs'>
						<div>
							<span className='text-gray-500 block uppercase text-[10px] font-bold tracking-wider'>
								Order Reference
							</span>
							<span className='font-mono font-bold text-white text-sm'>#{orderNumber}</span>
						</div>
						<div>
							<span className='text-gray-500 block uppercase text-[10px] font-bold tracking-wider'>
								Payment Method
							</span>
							<span className='font-semibold text-emerald-400 capitalize'>
								{order?.paymentMethod || "Razorpay"}
							</span>
						</div>
						<div>
							<span className='text-gray-500 block uppercase text-[10px] font-bold tracking-wider'>
								Payment Status
							</span>
							<span className='font-bold uppercase text-emerald-400'>
								{order?.paymentStatus || "Paid"}
							</span>
						</div>
						<div>
							<span className='text-gray-500 block uppercase text-[10px] font-bold tracking-wider'>
								Estimated Delivery
							</span>
							<span className='font-medium text-white'>
								{order?.estimatedDeliveryDays || "2-4 business days"}
							</span>
						</div>
					</div>
				</div>

				{/* Purchased Items Snapshot */}
				<div className='bg-gray-900/80 border border-gray-800 rounded-3xl p-6 sm:p-7 shadow-xl'>
					<div className='flex items-center justify-between pb-4 border-b border-gray-800 mb-4'>
						<div className='flex items-center gap-2'>
							<Package size={18} className='text-accent' />
							<h3 className='text-base font-bold text-white font-heading'>
								Purchased Items ({products.length})
							</h3>
						</div>
						<span className='text-xs text-gray-400'>
							Total: <strong className='text-accent text-sm'>₹{Number(order?.totalAmount || 0).toLocaleString("en-IN")}</strong>
						</span>
					</div>

					<div className='divide-y divide-gray-800/60'>
						{products.map((item, idx) => {
							const p = item.product || {};
							return (
								<div key={idx} className='py-3.5 flex items-center gap-3.5'>
									<img
										src={p.image || "/placeholder.png"}
										alt={p.name || "Item"}
										className='w-14 h-14 object-cover rounded-xl bg-gray-950 border border-gray-800 shrink-0'
									/>
									<div className='flex-1 min-w-0'>
										<h4 className='text-sm font-semibold text-white truncate'>
											{p.name || "Product"}
										</h4>
										<p className='text-xs text-gray-400 mt-0.5'>
											Qty: {item.quantity} × ₹{Number(item.price || 0).toLocaleString("en-IN")}
											{item.selectedColor && ` • Color: ${item.selectedColor}`}
											{item.selectedSize && ` • Size: ${item.selectedSize}`}
										</p>
									</div>
									<div className='text-sm font-bold text-white'>
										₹{Number((item.quantity || 1) * (item.price || 0)).toLocaleString("en-IN")}
									</div>
								</div>
							);
						})}
					</div>

					{/* Cost summary */}
					<div className='pt-4 mt-2 border-t border-gray-800/80 space-y-1.5 text-xs text-gray-400'>
						{order?.deliveryFee > 0 && (
							<div className='flex justify-between'>
								<span>Delivery Fee</span>
								<span className='text-white font-semibold'>₹{order.deliveryFee.toLocaleString("en-IN")}</span>
							</div>
						)}
						{order?.discountAmount > 0 && (
							<div className='flex justify-between text-accent font-semibold'>
								<span>Coupon Discount ({order.couponCode})</span>
								<span>-₹{Number(order.discountAmount).toLocaleString("en-IN")}</span>
							</div>
						)}
						<div className='flex justify-between text-sm font-bold text-white pt-2 border-t border-gray-800'>
							<span>Total Paid</span>
							<span className='text-base font-black text-accent'>
								₹{Number(order?.totalAmount || 0).toLocaleString("en-IN")}
							</span>
						</div>
					</div>
				</div>

				{/* Delivery Address & Dispatch Details */}
				<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
					<div className='bg-gray-900/80 border border-gray-800 rounded-3xl p-5 text-xs space-y-2'>
						<div className='flex items-center gap-1.5 font-bold text-white'>
							<MapPin size={15} className='text-accent' />
							<span>Shipping Destination</span>
						</div>
						<p className='font-semibold text-gray-200 text-sm'>{address.fullName || "Customer"}</p>
						<p className='text-gray-400 leading-relaxed'>
							{[address.houseFlat, address.street, address.locality, address.city, address.state]
								.filter(Boolean)
								.join(", ")}{" "}
							- {address.pincode}
						</p>
						{address.phone && <p className='text-gray-400'>Phone: {address.phone}</p>}
					</div>

					<div className='bg-gray-900/80 border border-gray-800 rounded-3xl p-5 text-xs space-y-2'>
						<div className='flex items-center gap-1.5 font-bold text-white'>
							<Truck size={15} className='text-accent' />
							<span>Fulfillment & Logistics</span>
						</div>
						<p className='text-gray-300'>
							Carrier: <strong className='text-white'>{order?.courierName || "Express Courier"}</strong>
						</p>
						<p className='text-gray-300'>
							Delivery Estimate:{" "}
							<span className='text-emerald-400 font-semibold'>
								{order?.estimatedDeliveryDays || "2-4 business days"}
							</span>
						</p>
						<p className='text-gray-400 text-[11px] leading-relaxed'>
							A shipment notification with live tracking milestones will be sent to your email once dispatched.
						</p>
					</div>
				</div>

				{/* Action CTAs */}
				<div className='flex flex-wrap items-center justify-between gap-3 pt-4'>
					<div className='flex flex-wrap items-center gap-2.5'>
						<button
							type='button'
							onClick={() => setIsDetailModalOpen(true)}
							className='inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md'
						>
							<ExternalLink size={15} /> View Full Receipt
						</button>

						<Link
							to='/orders'
							className='inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-black text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold text-xs sm:text-sm transition-all shadow-md'
						>
							<Package size={15} /> Go to My Orders
						</Link>
					</div>

					<Link
						to='/'
						className='inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-400 hover:text-white transition-colors'
					>
						<ShoppingBag size={15} /> Continue Shopping <ArrowRight size={14} />
					</Link>
				</div>
			</div>

			{/* Full Detailed Receipt Modal */}
			<OrderDetailModal
				isOpen={isDetailModalOpen}
				onClose={() => setIsDetailModalOpen(false)}
				order={order}
			/>
		</div>
	);
};

export default PurchaseSuccessPage;
