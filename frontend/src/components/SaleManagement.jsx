import { useState, useEffect } from "react";
import { Flame, Plus, Trash2, Calendar, CheckCircle2, Clock } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const SaleManagement = () => {
	const [sales, setSales] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showCreateModal, setShowCreateModal] = useState(false);

	const [formData, setFormData] = useState({
		name: "",
		badgeText: "FESTIVE SALE",
		description: "",
		bannerImage: "",
		discountType: "percentage",
		discountValue: 20,
		startDate: new Date().toISOString().split("T")[0],
		endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
		scope: "storewide",
		eligibleCategories: "",
		sendNotification: true,
	});

	const fetchSales = async () => {
		try {
			setLoading(true);
			const res = await axios.get("/sales/admin/all");
			setSales(res.data || []);
		} catch (err) {
			console.error("Error fetching sales:", err);
			toast.error("Failed to load sale campaigns");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSales();
	}, []);

	const handleCreateSale = async (e) => {
		e.preventDefault();
		try {
			const payload = {
				...formData,
				eligibleCategories: formData.eligibleCategories
					? formData.eligibleCategories.split(",").map((c) => c.trim().toLowerCase())
					: [],
				discountValue: Number(formData.discountValue),
			};

			await axios.post("/sales/admin", payload);
			toast.success("Sale campaign created and launched!");
			setShowCreateModal(false);
			fetchSales();
			setFormData({
				name: "",
				badgeText: "FESTIVE SALE",
				description: "",
				bannerImage: "",
				discountType: "percentage",
				discountValue: 20,
				startDate: new Date().toISOString().split("T")[0],
				endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
				scope: "storewide",
				eligibleCategories: "",
				sendNotification: true,
			});
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to create sale campaign");
		}
	};

	const handleDeleteSale = async (id) => {
		if (!window.confirm("Are you sure you want to delete this sale campaign?")) return;
		try {
			await axios.delete(`/sales/admin/${id}`);
			toast.success("Sale campaign deleted");
			setSales(sales.filter((s) => s._id !== id));
		} catch (err) {
			toast.error("Failed to delete campaign");
		}
	};

	return (
		<div className='max-w-6xl mx-auto'>
			{/* Header */}
			<div className='flex items-center justify-between mb-6'>
				<div>
					<h2 className='text-2xl font-bold text-white flex items-center gap-2'>
						<Flame className='text-amber-400' size={24} /> Promotional Campaigns & Sales
					</h2>
					<p className='text-xs text-gray-400 mt-1'>
						Schedule and launch storewide promotional events with live countdown clocks and customer banners
					</p>
				</div>
				<button
					onClick={() => setShowCreateModal(true)}
					className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg glow-amber'
				>
					<Plus size={16} /> Create Campaign
				</button>
			</div>

			{/* Sales List */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{loading ? (
					<div className='col-span-full py-12 text-center text-gray-500'>
						Loading campaigns...
					</div>
				) : sales.length === 0 ? (
					<div className='col-span-full py-12 text-center text-gray-500 bg-gray-900/40 rounded-3xl border border-gray-800'>
						No active promotional campaigns yet.
					</div>
				) : (
					sales.map((sale) => {
						const isLive =
							sale.isActive &&
							new Date(sale.startDate) <= new Date() &&
							new Date(sale.endDate) >= new Date();

						return (
							<div
								key={sale._id}
								className='bg-gray-900/60 border border-gray-800 rounded-3xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all'
							>
								<div>
									<div className='flex items-center justify-between gap-2 mb-3'>
										<span
											className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
												isLive
													? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
													: "bg-gray-800 text-gray-400 border border-gray-700"
											}`}
										>
											{isLive ? "LIVE NOW" : "SCHEDULED / EXPIRED"}
										</span>
										<button
											onClick={() => handleDeleteSale(sale._id)}
											className='text-gray-500 hover:text-rose-400 p-1 transition-colors'
											title='Delete Campaign'
										>
											<Trash2 size={16} />
										</button>
									</div>

									<h3 className='text-lg font-black text-white font-heading'>
										{sale.name}
									</h3>
									<p className='text-xs text-gray-400 mt-1 line-clamp-2'>
										{sale.description || "Special limited-time promotional pricing event."}
									</p>

									<div className='mt-4 pt-3 border-t border-gray-800 space-y-2 text-xs'>
										<div className='flex justify-between text-gray-300'>
											<span className='text-gray-500'>Discount:</span>
											<span className='font-bold text-amber-400'>
												Up to {sale.discountValue}% OFF
											</span>
										</div>
										<div className='flex justify-between text-gray-300'>
											<span className='text-gray-500'>Scope:</span>
											<span className='font-semibold uppercase text-[11px]'>
												{sale.scope}
											</span>
										</div>
										<div className='flex justify-between text-gray-300'>
											<span className='text-gray-500'>Duration:</span>
											<span className='text-[11px]'>
												{new Date(sale.startDate).toLocaleDateString("en-IN", {
													month: "short",
													day: "numeric",
												})}{" "}
												-{" "}
												{new Date(sale.endDate).toLocaleDateString("en-IN", {
													month: "short",
													day: "numeric",
												})}
											</span>
										</div>
									</div>
								</div>

								<div className='mt-5 pt-3 border-t border-gray-800/80 flex items-center justify-between'>
									<a
										href={`/sales/${sale._id}`}
										target='_blank'
										rel='noreferrer'
										className='text-xs font-bold text-accent hover:underline'
									>
										Preview Landing Page →
									</a>
								</div>
							</div>
						);
					})
				)}
			</div>

			{/* Create Campaign Modal */}
			{showCreateModal && (
				<div className='fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto'>
					<div className='bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl'>
						<h3 className='text-xl font-bold text-white mb-4'>Create Sale Campaign</h3>

						<form onSubmit={handleCreateSale} className='space-y-4'>
							<div>
								<label className='block text-xs font-semibold text-gray-300 mb-1'>
									Campaign Name *
								</label>
								<input
									type='text'
									required
									placeholder='e.g. Diwali Grand Fashion Festival'
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									className='w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:border-amber-400'
								/>
							</div>

							<div className='grid grid-cols-2 gap-3'>
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>Badge Text</label>
									<input
										type='text'
										placeholder='e.g. FESTIVE SALE'
										value={formData.badgeText}
										onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
										className='w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:border-amber-400'
									/>
								</div>
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>Discount % *</label>
									<input
										type='number'
										required
										min='1'
										max='90'
										value={formData.discountValue}
										onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
										className='w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:border-amber-400'
									/>
								</div>
							</div>

							<div>
								<label className='block text-xs font-semibold text-gray-300 mb-1'>Description</label>
								<textarea
									rows={2}
									placeholder='Short promotional pitch for banner and landing page...'
									value={formData.description}
									onChange={(e) => setFormData({ ...formData, description: e.target.value })}
									className='w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:border-amber-400'
								/>
							</div>

							<div className='grid grid-cols-2 gap-3'>
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>Start Date *</label>
									<input
										type='date'
										required
										value={formData.startDate}
										onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
										className='w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:border-amber-400'
									/>
								</div>
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>End Date *</label>
									<input
										type='date'
										required
										value={formData.endDate}
										onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
										className='w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:border-amber-400'
									/>
								</div>
							</div>

							<div className='flex items-center gap-2 pt-2'>
								<input
									type='checkbox'
									id='notifCheckbox'
									checked={formData.sendNotification}
									onChange={(e) =>
										setFormData({ ...formData, sendNotification: e.target.checked })
									}
									className='w-4 h-4 rounded text-amber-500 focus:ring-amber-400'
								/>
								<label htmlFor='notifCheckbox' className='text-xs text-gray-300 cursor-pointer'>
									Broadcast in-app alert notification to all registered customers
								</label>
							</div>

							<div className='flex items-center justify-end gap-3 pt-4 border-t border-gray-800'>
								<button
									type='button'
									onClick={() => setShowCreateModal(false)}
									className='px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white'
								>
									Cancel
								</button>
								<button
									type='submit'
									className='px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs uppercase tracking-wider'
								>
									Launch Campaign
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default SaleManagement;
