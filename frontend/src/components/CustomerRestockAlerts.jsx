import { useEffect } from "react";
import { Bell, Trash2, ExternalLink, PackageCheck, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useRestockStore } from "../stores/useRestockStore";

const CustomerRestockAlerts = () => {
	const { mySubscriptions, fetchMySubscriptions, cancelSubscription, loading } = useRestockStore();

	useEffect(() => {
		fetchMySubscriptions();
	}, [fetchMySubscriptions]);

	return (
		<div className='p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'>
			<div className='flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-6'>
				<div className='flex items-center gap-2'>
					<Bell size={18} className='text-amber-500' />
					<h3 className='text-sm font-black uppercase tracking-wider text-neutral-950 dark:text-white'>
						Restock & Availability Alerts
					</h3>
				</div>
				<span className='text-xs font-bold text-neutral-400'>
					{mySubscriptions.length} Subscribed
				</span>
			</div>

			{loading && mySubscriptions.length === 0 ? (
				<div className='py-8 text-center text-xs text-neutral-400'>Loading your alert preferences...</div>
			) : mySubscriptions.length === 0 ? (
				<div className='py-12 text-center text-neutral-400 space-y-2'>
					<Bell size={28} className='mx-auto opacity-30' />
					<p className='text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white'>
						No Active Restock Alerts
					</p>
					<p className='text-[11px] max-w-xs mx-auto text-neutral-500'>
						When an item you love is sold out, click "NOTIFY ME WHEN AVAILABLE" on its product page to receive priority alerts.
					</p>
				</div>
			) : (
				<div className='divide-y divide-neutral-100 dark:divide-neutral-800'>
					{mySubscriptions.map((sub) => {
						const product = sub.product || {};
						const isStocked = (product.stock || 0) > 0;

						return (
							<div
								key={sub._id}
								className='py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4'
							>
								{/* Left: Product Thumbnail & Details */}
								<div className='flex items-center gap-3'>
									<img
										src={product.image}
										alt={product.name}
										className='w-14 h-18 object-cover bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex-shrink-0'
									/>
									<div>
										<h4 className='text-xs font-bold text-neutral-900 dark:text-white'>
											{product.name}
										</h4>
										<div className='flex items-center gap-2 mt-1 text-[11px] text-neutral-500'>
											{sub.size && <span>Size: <strong>{sub.size}</strong></span>}
											{sub.color?.name && <span>&bull; Color: <strong>{sub.color.name}</strong></span>}
											<span>&bull; ₹{Number(product.price || 0).toLocaleString("en-IN")}</span>
										</div>
										<p className='text-[10px] text-neutral-400 mt-0.5'>
											Subscribed on {new Date(sub.createdAt).toLocaleDateString("en-IN")}
										</p>
									</div>
								</div>

								{/* Right: Status Pill & Actions */}
								<div className='flex items-center justify-between sm:justify-end gap-3'>
									<div>
										{sub.status === "active" && (
											<span className='inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'>
												<span className='w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse' />
												Waiting for Restock
											</span>
										)}
										{sub.status === "notified" && (
											<span className='inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'>
												<PackageCheck size={11} />
												Alert Sent ({new Date(sub.notifiedAt).toLocaleDateString("en-IN")})
											</span>
										)}
										{sub.status === "cancelled" && (
											<span className='px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-400'>
												Cancelled
											</span>
										)}
									</div>

									<div className='flex items-center gap-1.5'>
										{product._id && (
											<Link
												to={`/product/${product._id}`}
												className='p-2 rounded text-neutral-500 hover:text-black dark:hover:text-white transition-colors'
												title='View Product'
											>
												<ExternalLink size={14} />
											</Link>
										)}
										{sub.status === "active" && (
											<button
												type='button'
												onClick={() => cancelSubscription(sub._id)}
												className='p-2 rounded text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors'
												title='Cancel Alert'
											>
												<Trash2 size={14} />
											</button>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default CustomerRestockAlerts;

