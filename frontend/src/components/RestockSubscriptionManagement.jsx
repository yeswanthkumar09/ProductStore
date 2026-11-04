import { useState, useEffect } from "react";
import { useRestockStore } from "../stores/useRestockStore";
import {
	Bell,
	RotateCw,
	CheckCircle,
	AlertTriangle,
	Search,
	Filter,
	ExternalLink,
	PackageCheck,
	Clock,
	XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

const RestockSubscriptionManagement = () => {
	const {
		adminSubscriptions,
		adminMetrics,
		adminTotal,
		fetchAdminSubscriptions,
		retryNotification,
		loading,
	} = useRestockStore();

	const [statusFilter, setStatusFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [retryingId, setRetryingId] = useState(null);

	useEffect(() => {
		fetchAdminSubscriptions({ status: statusFilter, search: searchQuery });
	}, [statusFilter, fetchAdminSubscriptions]);

	const handleSearch = (e) => {
		e.preventDefault();
		fetchAdminSubscriptions({ status: statusFilter, search: searchQuery });
	};

	const handleRetry = async (id) => {
		try {
			setRetryingId(id);
			await retryNotification(id);
		} finally {
			setRetryingId(null);
		}
	};

	// Helper to safely mask email: y***@example.com
	const maskEmail = (email) => {
		if (!email) return "—";
		const [userPart, domainPart] = email.split("@");
		if (!domainPart) return email;
		const maskedUser = userPart.length > 2 ? `${userPart[0]}***${userPart[userPart.length - 1]}` : `${userPart[0]}***`;
		return `${maskedUser}@${domainPart}`;
	};

	return (
		<div className='bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800'>
				<div>
					<div className='flex items-center gap-2'>
						<Bell size={20} className='text-amber-400' />
						<h2 className='text-lg font-bold text-white'>Restock Subscriptions & Telemetry</h2>
					</div>
					<p className='text-xs text-gray-400 mt-0.5'>
						Monitor customer demand on out-of-stock items, delivery logs, and automated restock email alerts.
					</p>
				</div>
				<button
					type='button'
					onClick={() => fetchAdminSubscriptions({ status: statusFilter, search: searchQuery })}
					disabled={loading}
					className='inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 text-xs font-semibold transition-colors disabled:opacity-50'
				>
					<RotateCw size={14} className={loading ? "animate-spin" : ""} />
					<span>Refresh</span>
				</button>
			</div>

			{/* KPI Summary Cards */}
			<div className='grid grid-cols-2 sm:grid-cols-4 gap-3 my-6'>
				<div className='p-4 rounded-xl bg-white dark:bg-gray-950 border border-neutral-200 dark:border-gray-800 shadow-sm'>
					<div className='flex items-center justify-between text-neutral-600 dark:text-gray-400 mb-1'>
						<span className='text-[10px] font-bold uppercase tracking-wider'>Active Alerts</span>
						<Clock size={14} className='text-amber-500 dark:text-amber-400' />
					</div>
					<p className='text-xl font-black text-neutral-900 dark:text-white'>{adminMetrics.active || 0}</p>
					<span className='text-[10px] text-neutral-500 dark:text-gray-500'>Awaiting inventory arrival</span>
				</div>

				<div className='p-4 rounded-xl bg-white dark:bg-gray-950 border border-neutral-200 dark:border-gray-800 shadow-sm'>
					<div className='flex items-center justify-between text-neutral-600 dark:text-gray-400 mb-1'>
						<span className='text-[10px] font-bold uppercase tracking-wider'>Alerts Sent</span>
						<CheckCircle size={14} className='text-emerald-500 dark:text-emerald-400' />
					</div>
					<p className='text-xl font-black text-emerald-600 dark:text-emerald-400'>{adminMetrics.notified || 0}</p>
					<span className='text-[10px] text-neutral-500 dark:text-gray-500'>Restock emails delivered</span>
				</div>

				<div className='p-4 rounded-xl bg-white dark:bg-gray-950 border border-neutral-200 dark:border-gray-800 shadow-sm'>
					<div className='flex items-center justify-between text-neutral-600 dark:text-gray-400 mb-1'>
						<span className='text-[10px] font-bold uppercase tracking-wider'>Failed / Retrying</span>
						<AlertTriangle size={14} className='text-rose-500 dark:text-rose-400' />
					</div>
					<p className='text-xl font-black text-rose-600 dark:text-rose-400'>{adminMetrics.failed || 0}</p>
					<span className='text-[10px] text-neutral-500 dark:text-gray-500'>Provider or SMTP error</span>
				</div>

				<div className='p-4 rounded-xl bg-white dark:bg-gray-950 border border-neutral-200 dark:border-gray-800 shadow-sm'>
					<div className='flex items-center justify-between text-neutral-600 dark:text-gray-400 mb-1'>
						<span className='text-[10px] font-bold uppercase tracking-wider'>Total Interest</span>
						<PackageCheck size={14} className='text-accent' />
					</div>
					<p className='text-xl font-black text-neutral-900 dark:text-white'>{adminMetrics.total || 0}</p>
					<span className='text-[10px] text-neutral-500 dark:text-gray-500'>Historical subscriptions</span>
				</div>
			</div>

			{/* Filter & Search Bar */}
			<div className='flex flex-col sm:flex-row items-center justify-between gap-3 mb-6'>
				<div className='flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0'>
					{["all", "active", "notified", "failed", "cancelled"].map((st) => (
						<button
							key={st}
							type='button'
							onClick={() => setStatusFilter(st)}
							className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
								statusFilter === st
									? "bg-black text-white dark:bg-white dark:text-neutral-950 font-bold shadow-sm"
									: "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100 hover:text-black dark:bg-gray-800/80 dark:border-transparent dark:text-gray-300 dark:hover:text-white"
							}`}
						>
							{st}
						</button>
					))}
				</div>

				<form onSubmit={handleSearch} className='flex items-center gap-2 w-full sm:w-72'>
					<div className='relative flex-1'>
						<Search size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-gray-500' />
						<input
							type='text'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder='Search email, size...'
							className='w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-gray-500 focus:outline-none focus:border-accent'
						/>
					</div>
					<button
						type='submit'
						className='px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-semibold rounded-lg'
					>
						Search
					</button>
				</form>
			</div>

			{/* Subscriptions Table */}
			<div className='overflow-x-auto'>
				<table className='w-full text-left border-collapse text-xs'>
					<thead>
						<tr className='border-b border-neutral-200 dark:border-gray-800 text-neutral-600 dark:text-gray-400 uppercase font-bold text-[10px] tracking-wider'>
							<th className='py-3 px-4'>Piece / Product</th>
							<th className='py-3 px-4'>Selection</th>
							<th className='py-3 px-4'>Subscriber</th>
							<th className='py-3 px-4'>Live Inventory</th>
							<th className='py-3 px-4'>Alert Status</th>
							<th className='py-3 px-4'>Subscribed At</th>
							<th className='py-3 px-4 text-right'>Action</th>
						</tr>
					</thead>
					<tbody className='divide-y divide-neutral-200 dark:divide-gray-800/60'>
						{adminSubscriptions.length === 0 ? (
							<tr>
								<td colSpan='7' className='py-10 text-center text-neutral-400 dark:text-gray-500'>
									No subscriptions matching current filter criteria.
								</td>
							</tr>
						) : (
							adminSubscriptions.map((sub) => {
								const product = sub.product || {};
								const liveStock = product.stock ?? 0;

								return (
									<tr key={sub._id} className='hover:bg-neutral-50 dark:hover:bg-gray-800/30 transition-colors'>
										<td className='py-3.5 px-4'>
											<div className='flex items-center gap-2.5'>
												<img
													src={product.image}
													alt={product.name}
													className='w-9 h-12 object-cover rounded bg-neutral-100 dark:bg-gray-800 flex-shrink-0'
												/>
												<div>
													<p className='font-bold text-neutral-900 dark:text-white max-w-xs truncate'>
														{product.name || "Archived Garment"}
													</p>
													<p className='text-[10px] text-neutral-500 dark:text-gray-500'>
														₹{Number(product.price || 0).toLocaleString("en-IN")}
													</p>
												</div>
											</div>
										</td>
										<td className='py-3.5 px-4'>
											<div className='font-mono font-bold text-neutral-800 dark:text-gray-200'>
												{sub.size ? `Size: ${sub.size}` : "Any Size"}
											</div>
											{sub.color?.name && (
												<span className='text-[10px] text-neutral-500 dark:text-gray-400'>
													Color: {sub.color.name}
												</span>
											)}
										</td>
										<td className='py-3.5 px-4'>
											<p className='font-mono text-neutral-700 dark:text-gray-300'>{maskEmail(sub.email)}</p>
											{sub.user && (
												<span className='text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold'>
													Registered Member
												</span>
											)}
										</td>
										<td className='py-3.5 px-4'>
											<span
												className={`px-2 py-0.5 rounded text-[10px] font-bold ${
													liveStock > 0
														? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
														: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
												}`}
											>
												{liveStock > 0 ? `${liveStock} In Stock` : "Sold Out (0)"}
											</span>
										</td>
										<td className='py-3.5 px-4'>
											{sub.status === "active" && (
												<span className='px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'>
													Active
												</span>
											)}
											{sub.status === "queued" && (
												<span className='px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 animate-pulse'>
													Queued
												</span>
											)}
											{sub.status === "notified" && (
												<span className='px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'>
													Notified
												</span>
											)}
											{sub.status === "failed" && (
												<span className='px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'>
													Failed
												</span>
											)}
											{sub.status === "cancelled" && (
												<span className='px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-300 dark:bg-gray-800 dark:text-gray-300'>
													Cancelled
												</span>
											)}
										</td>
										<td className='py-3.5 px-4 text-neutral-500 dark:text-gray-400 text-[11px]'>
											{new Date(sub.createdAt).toLocaleDateString("en-IN")}
										</td>
										<td className='py-3.5 px-4 text-right'>
											{(sub.status === "failed" || (sub.status === "active" && liveStock > 0)) && (
												<button
													type='button'
													onClick={() => handleRetry(sub._id)}
													disabled={retryingId === sub._id}
													className='px-2.5 py-1 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-[10px] font-bold uppercase disabled:opacity-50 shadow-sm'
												>
													{retryingId === sub._id ? "Sending..." : "Dispatch Alert"}
												</button>
											)}
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default RestockSubscriptionManagement;

