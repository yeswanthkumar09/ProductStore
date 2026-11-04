import { useState, useEffect } from "react";
import {
	ShoppingCart,
	Search,
	Filter,
	Eye,
	Ban,
	RefreshCw,
	CheckCircle,
	AlertTriangle,
	Truck,
	Clock,
	DollarSign,
	Calendar,
	X,
	Loader2,
	ChevronLeft,
	ChevronRight,
	MapPin,
	ShieldAlert,
} from "lucide-react";
import { useOrderStore } from "../stores/useOrderStore";
import OrderDetailModal from "./OrderDetailModal";

const OrderManagement = () => {
	const {
		adminOrders,
		adminTotal,
		adminPage,
		adminPages,
		adminMetrics,
		adminLoading,
		fetchAdminOrders,
		adminCancelOrder,
		adminRefundOrder,
		adminUpdateOrderStatus,
	} = useOrderStore();

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [paymentFilter, setPaymentFilter] = useState("all");
	const [shipmentFilter, setShipmentFilter] = useState("all");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");

	// Modals state
	const [activeDetailOrder, setActiveDetailOrder] = useState(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);

	const [cancelTargetOrder, setCancelTargetOrder] = useState(null);
	const [cancelReason, setCancelReason] = useState("");
	const [initiateRefundOnCancel, setInitiateRefundOnCancel] = useState(true);
	const [isCancelling, setIsCancelling] = useState(false);

	const [refundTargetOrder, setRefundTargetOrder] = useState(null);
	const [refundAmount, setRefundAmount] = useState("");
	const [refundReason, setRefundReason] = useState("");
	const [isRefunding, setIsRefunding] = useState(false);

	const [statusTargetOrder, setStatusTargetOrder] = useState(null);
	const [newStatus, setNewStatus] = useState("");
	const [newShipmentStatus, setNewShipmentStatus] = useState("");
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

	// Load orders on mount or filter change
	useEffect(() => {
		fetchAdminOrders({
			search,
			status: statusFilter,
			paymentStatus: paymentFilter,
			shipmentStatus: shipmentFilter,
			dateFrom,
			dateTo,
			page: 1,
			limit: 15,
		});
	}, [statusFilter, paymentFilter, shipmentFilter, dateFrom, dateTo]);

	const handleSearchSubmit = (e) => {
		e.preventDefault();
		fetchAdminOrders({
			search,
			status: statusFilter,
			paymentStatus: paymentFilter,
			shipmentStatus: shipmentFilter,
			dateFrom,
			dateTo,
			page: 1,
			limit: 15,
		});
	};

	const handlePageChange = (newPage) => {
		fetchAdminOrders({
			search,
			status: statusFilter,
			paymentStatus: paymentFilter,
			shipmentStatus: shipmentFilter,
			dateFrom,
			dateTo,
			page: newPage,
			limit: 15,
		});
	};

	// Cancellation submission
	const handleAdminCancelSubmit = async () => {
		if (!cancelTargetOrder || !cancelReason.trim()) return;
		setIsCancelling(true);
		const res = await adminCancelOrder(cancelTargetOrder._id, {
			reason: cancelReason.trim(),
			initiateRefund: initiateRefundOnCancel,
		});
		setIsCancelling(false);
		if (res.success) {
			setCancelTargetOrder(null);
			setCancelReason("");
			fetchAdminOrders({ page: adminPage });
		}
	};

	// Direct Refund submission
	const handleAdminRefundSubmit = async () => {
		if (!refundTargetOrder) return;
		setIsRefunding(true);
		const res = await adminRefundOrder(refundTargetOrder._id, {
			amount: refundAmount ? Number(refundAmount) : refundTargetOrder.totalAmount,
			reason: refundReason.trim() || "Administrative refund via control panel",
		});
		setIsRefunding(false);
		if (res.success) {
			setRefundTargetOrder(null);
			setRefundAmount("");
			setRefundReason("");
			fetchAdminOrders({ page: adminPage });
		}
	};

	// Status update submission
	const handleAdminStatusSubmit = async () => {
		if (!statusTargetOrder) return;
		setIsUpdatingStatus(true);
		const res = await adminUpdateOrderStatus(statusTargetOrder._id, {
			status: newStatus || statusTargetOrder.status,
			shipmentStatus: newShipmentStatus || statusTargetOrder.shipmentStatus,
		});
		setIsUpdatingStatus(false);
		if (res.success) {
			setStatusTargetOrder(null);
			fetchAdminOrders({ page: adminPage });
		}
	};

	return (
		<div className='space-y-6'>
			{/* Metrics Overview Cards */}
			<div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
				<div className='bg-white dark:bg-gray-900/80 border border-neutral-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm'>
					<div className='flex items-center justify-between text-neutral-600 dark:text-gray-400 mb-1 text-xs font-semibold'>
						<span>Total Orders</span>
						<ShoppingCart size={16} className='text-accent' />
					</div>
					<div className='text-2xl font-black text-neutral-900 dark:text-white'>{adminMetrics.totalOrders || 0}</div>
				</div>

				<div className='bg-white dark:bg-gray-900/80 border border-neutral-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm'>
					<div className='flex items-center justify-between text-neutral-600 dark:text-gray-400 mb-1 text-xs font-semibold'>
						<span>Paid Volume</span>
						<CheckCircle size={16} className='text-emerald-500 dark:text-emerald-400' />
					</div>
					<div className='text-2xl font-black text-emerald-600 dark:text-emerald-400'>
						₹{Math.round(adminMetrics.totalRevenue || 0).toLocaleString("en-IN")}
					</div>
				</div>

				<div className='bg-white dark:bg-gray-900/80 border border-neutral-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm'>
					<div className='flex items-center justify-between text-neutral-600 dark:text-gray-400 mb-1 text-xs font-semibold'>
						<span>Cancelled Orders</span>
						<Ban size={16} className='text-rose-500 dark:text-rose-400' />
					</div>
					<div className='text-2xl font-black text-rose-600 dark:text-rose-400'>{adminMetrics.cancelledOrders || 0}</div>
				</div>

				<div className='bg-white dark:bg-gray-900/80 border border-neutral-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm'>
					<div className='flex items-center justify-between text-neutral-600 dark:text-gray-400 mb-1 text-xs font-semibold'>
						<span>Refunded Volume</span>
						<RefreshCw size={16} className='text-amber-500 dark:text-amber-400' />
					</div>
					<div className='text-2xl font-black text-amber-600 dark:text-amber-400'>
						₹{Math.round(adminMetrics.totalRefunded || 0).toLocaleString("en-IN")}
					</div>
				</div>
			</div>

			{/* Search & Filter Toolbar */}
			<div className='bg-white dark:bg-gray-900/80 border border-neutral-200 dark:border-gray-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm'>
				<form onSubmit={handleSearchSubmit} className='flex flex-wrap sm:flex-nowrap gap-2'>
					<div className='relative flex-1'>
						<Search size={16} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-gray-500' />
						<input
							type='text'
							placeholder='Search by Order ID, customer, phone, Razorpay ID, AWB...'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className='w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-gray-500 focus:outline-none focus:border-neutral-900 dark:focus:border-accent'
						/>
					</div>
					<button
						type='submit'
						className='px-5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold text-xs sm:text-sm shrink-0 shadow-md'
					>
						Search
					</button>
				</form>

				{/* Dropdowns Row */}
				<div className='flex flex-wrap items-center gap-2.5 text-xs'>
					<div className='flex items-center gap-1.5 text-neutral-600 dark:text-gray-400'>
						<Filter size={14} />
						<span className='font-semibold'>Filters:</span>
					</div>

					{/* Order Status */}
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className='px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none'
					>
						<option value='all'>All Order Statuses</option>
						<option value='pending'>Pending</option>
						<option value='confirmed'>Confirmed</option>
						<option value='processing'>Processing</option>
						<option value='shipped'>Shipped</option>
						<option value='delivered'>Delivered</option>
						<option value='cancelled'>Cancelled</option>
					</select>

					{/* Payment Status */}
					<select
						value={paymentFilter}
						onChange={(e) => setPaymentFilter(e.target.value)}
						className='px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none'
					>
						<option value='all'>All Payments</option>
						<option value='paid'>Paid</option>
						<option value='pending'>Pending</option>
						<option value='refunded'>Refunded</option>
						<option value='failed'>Failed</option>
					</select>

					{/* Shipment Status */}
					<select
						value={shipmentFilter}
						onChange={(e) => setShipmentFilter(e.target.value)}
						className='px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none'
					>
						<option value='all'>All Shipments</option>
						<option value='pending'>Pending</option>
						<option value='created'>Created</option>
						<option value='shipped'>Shipped</option>
						<option value='delivered'>Delivered</option>
						<option value='cancelled'>Cancelled</option>
					</select>

					{/* Date pickers */}
					<input
						type='date'
						value={dateFrom}
						onChange={(e) => setDateFrom(e.target.value)}
						className='px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white text-[11px] focus:outline-none'
					/>
					<span className='text-neutral-500 dark:text-gray-500 font-medium'>to</span>
					<input
						type='date'
						value={dateTo}
						onChange={(e) => setDateTo(e.target.value)}
						className='px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white text-[11px] focus:outline-none'
					/>

					{(statusFilter !== "all" ||
						paymentFilter !== "all" ||
						shipmentFilter !== "all" ||
						dateFrom ||
						dateTo ||
						search) && (
						<button
							type='button'
							onClick={() => {
								setStatusFilter("all");
								setPaymentFilter("all");
								setShipmentFilter("all");
								setDateFrom("");
								setDateTo("");
								setSearch("");
								fetchAdminOrders({ page: 1 });
							}}
							className='px-2.5 py-1 text-accent hover:underline font-semibold text-xs'
						>
							Reset Filters
						</button>
					)}
				</div>
			</div>

			{/* Orders Data Table */}
			<div className='bg-white dark:bg-gray-900/80 border border-neutral-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm'>
				<div className='overflow-x-auto'>
					<table className='w-full text-left border-collapse text-xs'>
						<thead>
							<tr className='border-b border-neutral-200 dark:border-gray-800 bg-neutral-100/90 dark:bg-gray-950/60 text-neutral-700 dark:text-gray-400 font-bold uppercase tracking-wider text-[11px]'>
								<th className='p-4'>Order Reference</th>
								<th className='p-4'>Customer</th>
								<th className='p-4'>Date</th>
								<th className='p-4'>Total</th>
								<th className='p-4'>Order Status</th>
								<th className='p-4'>Payment</th>
								<th className='p-4'>Shipment</th>
								<th className='p-4 text-right'>Actions</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-neutral-200 dark:divide-gray-800/60'>
							{adminLoading ? (
								<tr>
									<td colSpan={8} className='text-center py-12 text-gray-400'>
										<Loader2 size={24} className='animate-spin mx-auto mb-2 text-accent' />
										<span>Loading order registry...</span>
									</td>
								</tr>
							) : adminOrders.length === 0 ? (
								<tr>
									<td colSpan={8} className='text-center py-12 text-gray-500'>
										No orders found matching the filter criteria.
									</td>
								</tr>
							) : (
								adminOrders.map((ord) => {
									const isCancelled = ord.status === "cancelled" || ord.cancellation?.isCancelled;
									const isPaid = ord.paymentStatus === "paid";
									const isRefunded = ord.paymentStatus === "refunded" || ord.refund?.status === "processed";

									return (
										<tr key={ord._id} className='hover:bg-neutral-50 dark:hover:bg-gray-800/30 transition-colors'>
											{/* Order ID */}
											<td className='p-4'>
												<span className='font-mono font-bold text-neutral-900 dark:text-white'>
													#{ord._id?.slice(-8).toUpperCase()}
												</span>
												{ord.razorpayOrderId && (
													<span className='block text-[10px] text-neutral-500 dark:text-gray-400 font-mono truncate max-w-[120px]'>
														{ord.razorpayOrderId}
													</span>
												)}
											</td>

											{/* Customer */}
											<td className='p-4'>
												<div className='font-semibold text-neutral-900 dark:text-gray-100'>
													{ord.shippingAddress?.fullName || ord.user?.name || "Customer"}
												</div>
												<div className='text-[11px] text-neutral-500 dark:text-gray-400'>
													{ord.user?.email || ord.shippingAddress?.phone}
												</div>
											</td>

											{/* Date */}
											<td className='p-4 text-neutral-700 dark:text-gray-300 whitespace-nowrap font-medium'>
												{new Date(ord.createdAt).toLocaleDateString("en-IN", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}
											</td>

											{/* Total Amount */}
											<td className='p-4 font-black text-neutral-900 dark:text-white whitespace-nowrap'>
												₹{Number(ord.totalAmount || 0).toLocaleString("en-IN")}
											</td>

											{/* Order Status Badge */}
											<td className='p-4'>
												<span
													className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] border ${
														isCancelled
															? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
															: ord.status === "delivered"
															? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
															: ord.status === "shipped"
															? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
															: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
													}`}
												>
													{ord.status}
												</span>
											</td>

											{/* Payment Status Badge */}
											<td className='p-4'>
												<span
													className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] border ${
														isPaid
															? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
															: isRefunded
															? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
															: ord.paymentStatus === "failed"
															? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
															: "bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
													}`}
												>
													{ord.paymentStatus}
												</span>
												{ord.refund?.status === "failed" && (
													<span className='block text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 font-semibold'>
														Refund Failed
													</span>
												)}
											</td>

											{/* Shipment Status Badge */}
											<td className='p-4'>
												<span className='px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'>
													{ord.shipmentStatus || "Pending"}
												</span>
												{ord.shiprocketAwb && (
													<span className='block text-[10px] text-neutral-500 dark:text-gray-400 font-mono mt-0.5 truncate max-w-[100px]'>
														{ord.shiprocketAwb}
													</span>
												)}
											</td>

											{/* Action Buttons */}
											<td className='p-4 text-right whitespace-nowrap'>
												<div className='flex items-center justify-end gap-1.5'>
													{/* View Details */}
													<button
														type='button'
														title='View Full Order Details'
														onClick={() => {
															setActiveDetailOrder(ord);
															setIsDetailOpen(true);
														}}
														className='p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 border border-neutral-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-white dark:border-transparent transition-colors'
													>
														<Eye size={14} />
													</button>

													{/* Status Updater */}
													<button
														type='button'
														title='Update Status'
														onClick={() => {
															setStatusTargetOrder(ord);
															setNewStatus(ord.status);
															setNewShipmentStatus(ord.shipmentStatus);
														}}
														className='p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-colors'
													>
														<Clock size={14} />
													</button>

													{/* Cancel Order */}
													{!isCancelled && (
														<button
															type='button'
															title='Cancel Order'
															onClick={() => {
																setCancelTargetOrder(ord);
																setCancelReason("");
																setInitiateRefundOnCancel(ord.paymentStatus === "paid");
															}}
															className='p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors'
														>
															<Ban size={14} />
														</button>
													)}

													{/* Direct Refund */}
													{isPaid && !isRefunded && (
														<button
															type='button'
															title='Initiate Razorpay Refund'
															onClick={() => {
																setRefundTargetOrder(ord);
																setRefundAmount(ord.totalAmount);
																setRefundReason("");
															}}
															className='p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-colors'
														>
															<RefreshCw size={14} />
														</button>
													)}
												</div>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination Controls */}
				<div className='p-4 border-t border-neutral-200 dark:border-gray-800 flex items-center justify-between text-xs text-neutral-600 dark:text-gray-400'>
					<div>
						Showing {adminOrders.length} of {adminTotal} total orders
					</div>
					<div className='flex items-center gap-2'>
						<button
							type='button'
							disabled={adminPage <= 1 || adminLoading}
							onClick={() => handlePageChange(adminPage - 1)}
							className='p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-neutral-800 border border-neutral-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-transparent transition-colors'
						>
							<ChevronLeft size={16} />
						</button>
						<span className='font-medium'>
							Page {adminPage} of {adminPages}
						</span>
						<button
							type='button'
							disabled={adminPage >= adminPages || adminLoading}
							onClick={() => handlePageChange(adminPage + 1)}
							className='p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-neutral-800 border border-neutral-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-transparent transition-colors'
						>
							<ChevronRight size={16} />
						</button>
					</div>
				</div>
			</div>

			{/* Modal: Admin Full Order Details */}
			<OrderDetailModal
				isOpen={isDetailOpen}
				onClose={() => setIsDetailOpen(false)}
				order={activeDetailOrder}
			/>

			{/* Modal: Admin Order Cancellation */}
			{cancelTargetOrder && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in'>
					<div className='bg-white dark:bg-gray-900 border border-neutral-200 dark:border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative'>
						<div className='flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-gray-800 mb-4'>
							<div className='flex items-center gap-2 text-rose-500 dark:text-rose-400 font-bold'>
								<Ban size={18} />
								<h3 className='text-base text-neutral-900 dark:text-white font-heading'>Admin Order Cancellation</h3>
							</div>
							<button onClick={() => setCancelTargetOrder(null)} className='p-1 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors'>
								<X size={16} />
							</button>
						</div>

						<p className='text-xs text-neutral-600 dark:text-gray-300 mb-4 leading-relaxed'>
							You are cancelling Order #{cancelTargetOrder._id?.slice(-8).toUpperCase()} for customer{" "}
							<strong className='text-neutral-900 dark:text-white'>{cancelTargetOrder.shippingAddress?.fullName}</strong>.
						</p>

						<div className='space-y-4 mb-5 text-xs'>
							<div>
								<label className='block font-semibold text-neutral-700 dark:text-gray-300 mb-1.5'>
									Cancellation Reason / Policy Justification <span className='text-rose-500 dark:text-rose-400'>*</span>
								</label>
								<input
									type='text'
									value={cancelReason}
									onChange={(e) => setCancelReason(e.target.value)}
									placeholder='e.g., Customer requested via support desk, stock damaged, delivery address unserviceable...'
									className='w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-accent'
								/>
							</div>

							{cancelTargetOrder.paymentStatus === "paid" && (
								<label className='flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 cursor-pointer'>
									<input
										type='checkbox'
										checked={initiateRefundOnCancel}
										onChange={(e) => setInitiateRefundOnCancel(e.target.checked)}
										className='accent-emerald-500 rounded'
									/>
									<span className='text-emerald-700 dark:text-emerald-300 font-medium'>
										Initiate full Razorpay refund of ₹
										{Number(cancelTargetOrder.totalAmount).toLocaleString("en-IN")}
									</span>
								</label>
							)}

							<p className='text-[11px] text-neutral-600 dark:text-gray-400 leading-relaxed bg-neutral-50 dark:bg-gray-950/60 p-2.5 rounded-xl border border-neutral-200 dark:border-gray-800/80'>
								Inventory will automatically be restored back to product catalog. If Shiprocket shipment
								exists, shipment cancellation will be synchronized.
							</p>
						</div>

						<div className='flex gap-2 justify-end'>
							<button
								type='button'
								onClick={() => setCancelTargetOrder(null)}
								disabled={isCancelling}
								className='px-4 py-2 rounded-xl text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors'
							>
								Dismiss
							</button>
							<button
								type='button'
								onClick={handleAdminCancelSubmit}
								disabled={!cancelReason.trim() || isCancelling}
								className='px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs disabled:opacity-50 transition-colors'
							>
								{isCancelling ? "Cancelling..." : "Confirm Cancellation"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal: Admin Razorpay Refund */}
			{refundTargetOrder && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in'>
					<div className='bg-white dark:bg-gray-900 border border-neutral-200 dark:border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative'>
						<div className='flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-gray-800 mb-4'>
							<div className='flex items-center gap-2 text-amber-500 dark:text-amber-400 font-bold'>
								<RefreshCw size={18} />
								<h3 className='text-base text-neutral-900 dark:text-white font-heading'>Initiate Gateway Refund</h3>
							</div>
							<button onClick={() => setRefundTargetOrder(null)} className='p-1 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors'>
								<X size={16} />
							</button>
						</div>

						<div className='bg-neutral-50 dark:bg-gray-950/60 border border-neutral-200 dark:border-gray-800 rounded-xl p-3 mb-4 text-xs space-y-1'>
							<div className='flex justify-between text-neutral-600 dark:text-gray-300'>
								<span>Razorpay Payment ID:</span>
								<span className='font-mono font-bold text-neutral-900 dark:text-white'>{refundTargetOrder.razorpayPaymentId}</span>
							</div>
							<div className='flex justify-between text-neutral-600 dark:text-gray-300'>
								<span>Original Paid Amount:</span>
								<span className='font-bold text-neutral-900 dark:text-accent'>
									₹{Number(refundTargetOrder.totalAmount).toLocaleString("en-IN")}
								</span>
							</div>
						</div>

						<div className='space-y-3 mb-5 text-xs'>
							<div>
								<label className='block font-semibold text-neutral-700 dark:text-gray-300 mb-1'>Refund Amount (INR)</label>
								<input
									type='number'
									value={refundAmount}
									onChange={(e) => setRefundAmount(e.target.value)}
									className='w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-accent'
								/>
							</div>
							<div>
								<label className='block font-semibold text-neutral-700 dark:text-gray-300 mb-1'>Refund Reason</label>
								<input
									type='text'
									value={refundReason}
									onChange={(e) => setRefundReason(e.target.value)}
									placeholder='Administrative or dispute settlement note'
									className='w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-accent'
								/>
							</div>
						</div>

						<div className='flex gap-2 justify-end'>
							<button
								type='button'
								onClick={() => setRefundTargetOrder(null)}
								disabled={isRefunding}
								className='px-4 py-2 rounded-xl text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors'
							>
								Cancel
							</button>
							<button
								type='button'
								onClick={handleAdminRefundSubmit}
								disabled={isRefunding}
								className='px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs disabled:opacity-50 transition-colors'
							>
								{isRefunding ? "Processing Refund..." : "Authorize Gateway Refund"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal: Admin Order Status Updater */}
			{statusTargetOrder && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in'>
					<div className='bg-white dark:bg-gray-900 border border-neutral-200 dark:border-gray-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative'>
						<div className='flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-gray-800 mb-4'>
							<h3 className='text-base text-neutral-900 dark:text-white font-heading font-bold'>Update Order Status</h3>
							<button onClick={() => setStatusTargetOrder(null)} className='p-1 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors'>
								<X size={16} />
							</button>
						</div>

						<div className='space-y-4 mb-5 text-xs'>
							<div>
								<label className='block font-semibold text-neutral-700 dark:text-gray-300 mb-1.5'>Order Fulfillment Status</label>
								<select
									value={newStatus}
									onChange={(e) => setNewStatus(e.target.value)}
									className='w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none'
								>
									<option value='pending'>pending</option>
									<option value='confirmed'>confirmed</option>
									<option value='processing'>processing</option>
									<option value='awaiting_shipment'>awaiting_shipment</option>
									<option value='shipped'>shipped</option>
									<option value='out_for_delivery'>out_for_delivery</option>
									<option value='delivered'>delivered</option>
									<option value='cancelled'>cancelled</option>
								</select>
							</div>

							<div>
								<label className='block font-semibold text-neutral-700 dark:text-gray-300 mb-1.5'>Shipment Logistics Status</label>
								<select
									value={newShipmentStatus}
									onChange={(e) => setNewShipmentStatus(e.target.value)}
									className='w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none'
								>
									<option value='pending'>pending</option>
									<option value='created'>created</option>
									<option value='shipped'>shipped</option>
									<option value='delivered'>delivered</option>
									<option value='cancelled'>cancelled</option>
								</select>
							</div>
						</div>

						<div className='flex gap-2 justify-end'>
							<button
								type='button'
								onClick={() => setStatusTargetOrder(null)}
								disabled={isUpdatingStatus}
								className='px-4 py-2 rounded-xl text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors'
							>
								Cancel
							</button>
							<button
								type='button'
								onClick={handleAdminStatusSubmit}
								disabled={isUpdatingStatus}
								className='px-5 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold text-xs disabled:opacity-50 shadow-md transition-colors'
							>
								{isUpdatingStatus ? "Updating..." : "Save Status"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default OrderManagement;

