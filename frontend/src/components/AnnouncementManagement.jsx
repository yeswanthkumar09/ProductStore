import { useState, useEffect } from "react";
import { useAnnouncementStore } from "../stores/useAnnouncementStore";
import { Plus, Edit2, Trash2, Power, Megaphone, Truck, Tag, RotateCcw, X, Check } from "lucide-react";
import toast from "react-hot-toast";

const AnnouncementManagement = () => {
	const {
		allAnnouncements,
		fetchAllAnnouncementsAdmin,
		createAnnouncement,
		updateAnnouncement,
		deleteAnnouncement,
		toggleAnnouncement,
		loading,
	} = useAnnouncementStore();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingAnnouncement, setEditingAnnouncement] = useState(null);

	const [formData, setFormData] = useState({
		text: "",
		highlightText: "",
		link: "/search",
		type: "shipping",
		couponCode: "",
		freeShippingThreshold: 1999,
		returnPolicyDays: 7,
		displayOrder: 1,
		isActive: true,
	});

	useEffect(() => {
		fetchAllAnnouncementsAdmin();
	}, [fetchAllAnnouncementsAdmin]);

	const handleOpenCreate = () => {
		setEditingAnnouncement(null);
		setFormData({
			text: "FREE SHIPPING OVER ₹1,999",
			highlightText: "FREE SHIPPING",
			link: "/search",
			type: "shipping",
			couponCode: "",
			freeShippingThreshold: 1999,
			returnPolicyDays: 7,
			displayOrder: (allAnnouncements.length || 0) + 1,
			isActive: true,
		});
		setIsModalOpen(true);
	};

	const handleOpenEdit = (announcement) => {
		setEditingAnnouncement(announcement);
		setFormData({
			text: announcement.text || "",
			highlightText: announcement.highlightText || "",
			link: announcement.link || "/",
			type: announcement.type || "shipping",
			couponCode: announcement.couponCode || "",
			freeShippingThreshold: announcement.freeShippingThreshold || 1999,
			returnPolicyDays: announcement.returnPolicyDays || 7,
			displayOrder: announcement.displayOrder ?? 1,
			isActive: announcement.isActive ?? true,
		});
		setIsModalOpen(true);
	};

	const handleTypeChange = (newType) => {
		let defaultText = formData.text;
		let defaultHighlight = formData.highlightText;

		if (newType === "shipping") {
			defaultText = `FREE SHIPPING OVER ₹${formData.freeShippingThreshold || 1999}`;
			defaultHighlight = "FREE SHIPPING";
		} else if (newType === "coupon") {
			defaultText = `USE CODE ${formData.couponCode || "WELCOME10"} FOR 10% OFF`;
			defaultHighlight = formData.couponCode || "WELCOME10";
		} else if (newType === "policy") {
			defaultText = `${formData.returnPolicyDays || 7}-DAY EFFORTLESS RETURNS`;
			defaultHighlight = `${formData.returnPolicyDays || 7}-DAY`;
		}

		setFormData({
			...formData,
			type: newType,
			text: defaultText,
			highlightText: defaultHighlight,
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!formData.text) {
			toast.error("Announcement message is required");
			return;
		}

		try {
			if (editingAnnouncement) {
				await updateAnnouncement(editingAnnouncement._id, formData);
			} else {
				await createAnnouncement(formData);
			}
			setIsModalOpen(false);
		} catch (err) {
			// handled in store
		}
	};

	const handleDelete = async (id) => {
		if (window.confirm("Are you sure you want to delete this top announcement?")) {
			await deleteAnnouncement(id);
		}
	};

	const getTypeIcon = (type) => {
		switch (type) {
			case "shipping":
				return <Truck size={14} className='text-emerald-400' />;
			case "coupon":
				return <Tag size={14} className='text-purple-400' />;
			case "policy":
				return <RotateCcw size={14} className='text-sky-400' />;
			default:
				return <Megaphone size={14} className='text-amber-400' />;
		}
	};

	return (
		<div className='bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-6'>
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800'>
				<div>
					<h2 className='text-lg font-bold text-white'>Top Announcement Bar Merchandising</h2>
					<p className='text-xs text-gray-400 mt-0.5'>
						Configure the rotating top banner with dynamic shipping thresholds, coupons, and store policies.
					</p>
				</div>
				<button
					type='button'
					onClick={handleOpenCreate}
					className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-semibold text-xs transition-colors shadow-md'
				>
					<Plus size={16} />
					<span>Add Announcement</span>
				</button>
			</div>

			{/* Announcements Table */}
			<div className='mt-6 overflow-x-auto'>
				<table className='w-full text-left border-collapse text-xs'>
					<thead>
						<tr className='border-b border-gray-800 text-gray-400 uppercase font-bold text-[10px] tracking-wider'>
							<th className='py-3 px-4'>Order</th>
							<th className='py-3 px-4'>Type</th>
							<th className='py-3 px-4'>Message & Highlight</th>
							<th className='py-3 px-4'>Link Target</th>
							<th className='py-3 px-4'>Rule Context</th>
							<th className='py-3 px-4'>Status</th>
							<th className='py-3 px-4 text-right'>Actions</th>
						</tr>
					</thead>
					<tbody className='divide-y divide-gray-800/60'>
						{allAnnouncements.length === 0 ? (
							<tr>
								<td colSpan='7' className='py-8 text-center text-gray-500'>
									No announcements configured.
								</td>
							</tr>
						) : (
							allAnnouncements.map((a) => (
								<tr key={a._id} className='hover:bg-gray-800/30 transition-colors'>
									<td className='py-3.5 px-4 font-mono font-bold text-gray-300'>
										#{a.displayOrder}
									</td>
									<td className='py-3.5 px-4'>
										<div className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800'>
											{getTypeIcon(a.type)}
											<span className='font-bold uppercase text-[10px] text-gray-200'>
												{a.type}
											</span>
										</div>
									</td>
									<td className='py-3.5 px-4'>
										<p className='font-bold text-white font-heading tracking-wide uppercase'>
											{a.text}
										</p>
										{a.highlightText && (
											<span className='text-[10px] text-accent font-semibold'>
												Highlight: "{a.highlightText}"
											</span>
										)}
									</td>
									<td className='py-3.5 px-4 font-mono text-gray-400'>
										{a.link || "/"}
									</td>
									<td className='py-3.5 px-4 text-gray-300'>
										{a.type === "shipping" && (
											<span>Over ₹{a.freeShippingThreshold?.toLocaleString("en-IN")}</span>
										)}
										{a.type === "coupon" && (
											<span className='font-mono font-bold text-purple-400'>{a.couponCode || "None"}</span>
										)}
										{a.type === "policy" && (
											<span>{a.returnPolicyDays || 7} Days Window</span>
										)}
										{a.type === "custom" && <span>Custom Campaign</span>}
									</td>
									<td className='py-3.5 px-4'>
										<span
											className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
												a.isActive
													? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
													: "bg-gray-800 text-gray-400"
											}`}
										>
											{a.isActive ? "Active" : "Paused"}
										</span>
									</td>
									<td className='py-3.5 px-4 text-right'>
										<div className='flex items-center justify-end gap-1'>
											<button
												type='button'
												onClick={() => toggleAnnouncement(a._id)}
												className={`p-1.5 rounded-lg transition-colors ${
													a.isActive
														? "text-amber-400 hover:bg-amber-500/10"
														: "text-emerald-400 hover:bg-emerald-500/10"
												}`}
												title={a.isActive ? "Pause" : "Activate"}
											>
												<Power size={14} />
											</button>
											<button
												type='button'
												onClick={() => handleOpenEdit(a)}
												className='p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors'
												title='Edit'
											>
												<Edit2 size={14} />
											</button>
											<button
												type='button'
												onClick={() => handleDelete(a._id)}
												className='p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors'
												title='Delete'
											>
												<Trash2 size={14} />
											</button>
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Modal */}
			{isModalOpen && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in'>
					<div className='bg-gray-900 border border-gray-800 max-w-lg w-full p-6 rounded-2xl shadow-2xl relative'>
						<div className='flex items-center justify-between pb-4 border-b border-gray-800'>
							<h3 className='text-sm font-bold uppercase tracking-wider text-white'>
								{editingAnnouncement ? "Edit Announcement" : "New Announcement"}
							</h3>
							<button
								type='button'
								onClick={() => setIsModalOpen(false)}
								className='p-1 text-gray-400 hover:text-white'
							>
								<X size={18} />
							</button>
						</div>

						<form onSubmit={handleSubmit} className='mt-4 space-y-4 text-xs'>
							<div className='grid grid-cols-2 gap-3'>
								<div>
									<label className='block font-bold text-gray-300 uppercase mb-1'>Category Type</label>
									<select
										value={formData.type}
										onChange={(e) => handleTypeChange(e.target.value)}
										className='w-full p-2.5 rounded-lg bg-gray-950 border border-gray-800 text-white focus:outline-none focus:border-accent'
									>
										<option value='shipping'>Free Shipping Threshold</option>
										<option value='coupon'>Store Coupon Code</option>
										<option value='policy'>Effortless Returns Policy</option>
										<option value='custom'>Custom Promo Announcement</option>
									</select>
								</div>
								<div>
									<label className='block font-bold text-gray-300 uppercase mb-1'>Display Order</label>
									<input
										type='number'
										min='1'
										value={formData.displayOrder}
										onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
										className='w-full p-2.5 rounded-lg bg-gray-950 border border-gray-800 text-white focus:outline-none focus:border-accent'
									/>
								</div>
							</div>

							{formData.type === "shipping" && (
								<div>
									<label className='block font-bold text-gray-300 uppercase mb-1'>
										Free Shipping Threshold (₹)
									</label>
									<input
										type='number'
										min='0'
										value={formData.freeShippingThreshold}
										onChange={(e) => {
											const val = Number(e.target.value);
											setFormData({
												...formData,
												freeShippingThreshold: val,
												text: `FREE SHIPPING OVER ₹${val.toLocaleString("en-IN")}`,
											});
										}}
										className='w-full p-2.5 rounded-lg bg-gray-950 border border-gray-800 text-white focus:outline-none focus:border-accent'
									/>
								</div>
							)}

							{formData.type === "coupon" && (
								<div>
									<label className='block font-bold text-gray-300 uppercase mb-1'>
										Active Coupon Code
									</label>
									<input
										type='text'
										value={formData.couponCode}
										onChange={(e) => {
											const code = e.target.value.toUpperCase();
											setFormData({
												...formData,
												couponCode: code,
												text: `USE CODE ${code} FOR 10% OFF`,
												highlightText: code,
											});
										}}
										placeholder='WELCOME10'
										className='w-full p-2.5 rounded-lg bg-gray-950 border border-gray-800 text-white focus:outline-none focus:border-accent font-mono'
									/>
								</div>
							)}

							{formData.type === "policy" && (
								<div>
									<label className='block font-bold text-gray-300 uppercase mb-1'>
										Return Policy Duration (Days)
									</label>
									<input
										type='number'
										min='1'
										value={formData.returnPolicyDays}
										onChange={(e) => {
											const days = Number(e.target.value);
											setFormData({
												...formData,
												returnPolicyDays: days,
												text: `${days}-DAY EFFORTLESS RETURNS`,
												highlightText: `${days}-DAY`,
											});
										}}
										className='w-full p-2.5 rounded-lg bg-gray-950 border border-gray-800 text-white focus:outline-none focus:border-accent'
									/>
								</div>
							)}

							<div>
								<label className='block font-bold text-gray-300 uppercase mb-1'>Headline Text</label>
								<input
									type='text'
									required
									value={formData.text}
									onChange={(e) => setFormData({ ...formData, text: e.target.value })}
									placeholder='FREE SHIPPING OVER ₹1,999'
									className='w-full p-2.5 rounded-lg bg-gray-950 border border-gray-800 text-white focus:outline-none focus:border-accent uppercase'
								/>
							</div>

							<div>
								<label className='block font-bold text-gray-300 uppercase mb-1'>Click Target URL</label>
								<input
									type='text'
									value={formData.link}
									onChange={(e) => setFormData({ ...formData, link: e.target.value })}
									placeholder='/search or /profile'
									className='w-full p-2.5 rounded-lg bg-gray-950 border border-gray-800 text-white focus:outline-none focus:border-accent font-mono'
								/>
							</div>

							<div className='flex items-center justify-end gap-3 pt-3 border-t border-gray-800'>
								<button
									type='button'
									onClick={() => setIsModalOpen(false)}
									className='px-4 py-2 rounded-xl text-gray-400 hover:text-white'
								>
									Cancel
								</button>
								<button
									type='submit'
									disabled={loading}
									className='px-6 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold text-xs transition-colors shadow-md disabled:opacity-50'
								>
									{loading ? "Saving..." : editingAnnouncement ? "Save Changes" : "Create Announcement"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default AnnouncementManagement;
