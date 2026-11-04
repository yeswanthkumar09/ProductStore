import { useState, useEffect } from "react";
import { Tag, Plus, Trash2, CheckCircle, XCircle, Percent, IndianRupee } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const CouponManagement = () => {
	const [coupons, setCoupons] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showCreateModal, setShowCreateModal] = useState(false);

	const [formData, setFormData] = useState({
		code: "",
		name: "",
		description: "",
		discountType: "percentage",
		discountValue: 10,
		maxDiscountCap: "",
		minOrderAmount: 0,
		startDate: new Date().toISOString().split("T")[0],
		expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
		scope: "storewide",
		eligibleCategories: "",
		perUserLimit: 1,
		isFirstOrderOnly: false,
		isActive: true,
	});

	const fetchCoupons = async () => {
		try {
			setLoading(true);
			const res = await axios.get("/coupons/admin");
			setCoupons(res.data || []);
		} catch (err) {
			console.error("Error fetching coupons:", err);
			toast.error("Failed to load coupons");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCoupons();
	}, []);

	const handleCreateCoupon = async (e) => {
		e.preventDefault();
		try {
			const payload = {
				...formData,
				eligibleCategories: formData.eligibleCategories
					? formData.eligibleCategories.split(",").map((c) => c.trim().toLowerCase())
					: [],
				maxDiscountCap: formData.maxDiscountCap ? Number(formData.maxDiscountCap) : null,
				minOrderAmount: Number(formData.minOrderAmount) || 0,
				discountValue: Number(formData.discountValue),
				perUserLimit: Number(formData.perUserLimit) || 1,
			};

			await axios.post("/coupons/admin", payload);
			toast.success("Coupon created successfully!");
			setShowCreateModal(false);
			fetchCoupons();
			setFormData({
				code: "",
				name: "",
				description: "",
				discountType: "percentage",
				discountValue: 10,
				maxDiscountCap: "",
				minOrderAmount: 0,
				startDate: new Date().toISOString().split("T")[0],
				expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
				scope: "storewide",
				eligibleCategories: "",
				perUserLimit: 1,
				isFirstOrderOnly: false,
				isActive: true,
			});
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to create coupon");
		}
	};

	const handleDeleteCoupon = async (id) => {
		if (!window.confirm("Are you sure you want to delete this coupon?")) return;
		try {
			await axios.delete(`/coupons/admin/${id}`);
			toast.success("Coupon deleted");
			setCoupons(coupons.filter((c) => c._id !== id));
		} catch (err) {
			toast.error("Failed to delete coupon");
		}
	};

	const handleToggleActive = async (coupon) => {
		try {
			const res = await axios.put(`/coupons/admin/${coupon._id}`, {
				isActive: !coupon.isActive,
			});
			setCoupons(coupons.map((c) => (c._id === coupon._id ? res.data : c)));
			toast.success(`Coupon ${res.data.isActive ? "activated" : "disabled"}`);
		} catch (err) {
			toast.error("Failed to update status");
		}
	};

	return (
		<div className='max-w-6xl mx-auto'>
			{/* Top Bar */}
			<div className='flex items-center justify-between mb-6'>
				<div>
					<h2 className='text-2xl font-bold text-white flex items-center gap-2'>
						<Tag className='text-accent' size={24} /> Coupon & Voucher Management
					</h2>
					<p className='text-xs text-gray-400 mt-1'>
						Create whole-store, category-specific, percentage, and fixed discounts in ₹ INR
					</p>
				</div>
				<button
					onClick={() => setShowCreateModal(true)}
					className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold text-xs uppercase tracking-wider transition-all shadow-md'
				>
					<Plus size={16} /> Create Coupon
				</button>
			</div>

			{/* Coupons Table */}
			<div className='overflow-hidden rounded-2xl bg-gray-900/60 border border-gray-800 shadow-xl'>
				<table className='w-full text-left text-xs text-gray-300'>
					<thead className='bg-gray-950/80 uppercase tracking-wider text-[11px] text-gray-400 border-b border-gray-800'>
						<tr>
							<th className='py-3.5 px-4'>Code & Name</th>
							<th className='py-3.5 px-4'>Discount</th>
							<th className='py-3.5 px-4'>Scope</th>
							<th className='py-3.5 px-4'>Min Order</th>
							<th className='py-3.5 px-4'>Validity</th>
							<th className='py-3.5 px-4'>Usage</th>
							<th className='py-3.5 px-4'>Status</th>
							<th className='py-3.5 px-4 text-right'>Actions</th>
						</tr>
					</thead>
					<tbody className='divide-y divide-gray-800/60'>
						{loading ? (
							<tr>
								<td colSpan={8} className='text-center py-8 text-gray-500'>
									Loading coupons...
								</td>
							</tr>
						) : coupons.length === 0 ? (
							<tr>
								<td colSpan={8} className='text-center py-8 text-gray-500'>
									No coupons configured yet. Click &quot;Create Coupon&quot; to begin.
								</td>
							</tr>
						) : (
							coupons.map((coupon) => (
								<tr key={coupon._id} className='hover:bg-gray-800/30 transition-colors'>
									<td className='py-3.5 px-4'>
										<div className='font-mono font-black text-white text-sm tracking-wide'>
											{coupon.code}
										</div>
										<div className='text-[11px] text-gray-400'>{coupon.name || "—"}</div>
									</td>
									<td className='py-3.5 px-4 font-bold text-accent'>
										{coupon.discountType === "fixed" ? (
											<span className='flex items-center gap-0.5'>
												₹{coupon.discountValue?.toLocaleString("en-IN")} OFF
											</span>
										) : (
											<span>
												{coupon.discountValue}% OFF
												{coupon.maxDiscountCap && (
													<span className='block text-[10px] text-gray-400 font-normal'>
														Max ₹{coupon.maxDiscountCap}
													</span>
												)}
											</span>
										)}
									</td>
									<td className='py-3.5 px-4 uppercase text-[11px] font-semibold text-neutral-800 dark:text-gray-300'>
										<span className='px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700/80 font-bold'>
											{coupon.scope}
										</span>
										{coupon.scope === "category" && coupon.eligibleCategories?.length > 0 && (
											<div className='text-[10px] text-neutral-600 dark:text-gray-400 mt-1 lowercase font-normal'>
												{coupon.eligibleCategories.join(", ")}
											</div>
										)}
									</td>
									<td className='py-3.5 px-4 font-mono'>
										{coupon.minOrderAmount > 0
											? `₹${coupon.minOrderAmount.toLocaleString("en-IN")}`
											: "None"}
									</td>
									<td className='py-3.5 px-4 text-[11px] text-gray-400'>
										Exp: {new Date(coupon.expirationDate).toLocaleDateString("en-IN")}
									</td>
									<td className='py-3.5 px-4 font-mono text-[11px]'>
										{coupon.usedCount || 0}
										{coupon.maxUses ? ` / ${coupon.maxUses}` : " uses"}
									</td>
									<td className='py-3.5 px-4'>
										<button
											onClick={() => handleToggleActive(coupon)}
											className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
												coupon.isActive
													? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
													: "bg-rose-500/10 text-rose-400 border border-rose-500/30"
											}`}
										>
											{coupon.isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
											<span>{coupon.isActive ? "ACTIVE" : "DISABLED"}</span>
										</button>
									</td>
									<td className='py-3.5 px-4 text-right'>
										<button
											onClick={() => handleDeleteCoupon(coupon._id)}
											className='p-1.5 text-gray-400 hover:text-rose-400 transition-colors'
											title='Delete Coupon'
										>
											<Trash2 size={15} />
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Create Coupon Modal */}
			{showCreateModal && (
				<div className='fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto'>
					<div className='bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl'>
						<h3 className='text-xl font-bold text-white mb-4'>Create Promotional Coupon</h3>

						<form onSubmit={handleCreateCoupon} className='space-y-4'>
							<div className='grid grid-cols-2 gap-3'>
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>Coupon Code *</label>
									<input
										type='text'
										required
										placeholder='e.g. LUXE20'
										value={formData.code}
										onChange={(e) =>
											setFormData({ ...formData, code: e.target.value.toUpperCase() })
										}
										className='w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white uppercase font-mono font-bold text-sm focus:border-accent'
									/>
								</div>
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>Display Name</label>
									<input
										type='text'
										placeholder='e.g. Season Opening'
										value={formData.name}
										onChange={(e) => setFormData({ ...formData, name: e.target.value })}
										className='w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:border-accent'
									/>
								</div>
							</div>

							<div className='grid grid-cols-2 gap-3'>
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>Discount Type</label>
									<select
										value={formData.discountType}
										onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
										className='w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:border-accent'
									>
										<option value='percentage'>Percentage (% off)</option>
										<option value='fixed'>Fixed Amount (₹ off)</option>
									</select>
								</div>
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>Discount Value *</label>
									<input
										type='number'
										required
										min='1'
										placeholder={formData.discountType === "percentage" ? "10%" : "₹500"}
										value={formData.discountValue}
										onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
										className='w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:border-accent'
									/>
								</div>
							</div>

							<div className='grid grid-cols-2 gap-3'>
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>
										Max Cap (₹, optional)
									</label>
									<input
										type='number'
										placeholder='e.g. 1500'
										value={formData.maxDiscountCap}
										onChange={(e) => setFormData({ ...formData, maxDiscountCap: e.target.value })}
										className='w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:border-accent'
									/>
								</div>
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>Min Order (₹)</label>
									<input
										type='number'
										placeholder='e.g. 999'
										value={formData.minOrderAmount}
										onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
										className='w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:border-accent'
									/>
								</div>
							</div>

							<div className='grid grid-cols-2 gap-3'>
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>Scope</label>
									<select
										value={formData.scope}
										onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
										className='w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:border-accent'
									>
										<option value='storewide'>Storewide (All products)</option>
										<option value='category'>Category Specific</option>
									</select>
								</div>
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>Expiry Date *</label>
									<input
										type='date'
										required
										value={formData.expirationDate}
										onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
										className='w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:border-accent'
									/>
								</div>
							</div>

							{formData.scope === "category" && (
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>
										Eligible Categories (comma separated)
									</label>
									<input
										type='text'
										placeholder='e.g. jackets, jeans, suits'
										value={formData.eligibleCategories}
										onChange={(e) =>
											setFormData({ ...formData, eligibleCategories: e.target.value })
										}
										className='w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:border-accent'
									/>
								</div>
							)}

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
									className='px-6 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold text-xs uppercase tracking-wider transition-all shadow-md'
								>
									Save Coupon
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default CouponManagement;
