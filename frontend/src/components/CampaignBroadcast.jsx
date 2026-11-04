import { useState } from "react";
import { Send, Bell, Sparkles, Tag, Flame, Info, CheckCircle } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const CampaignBroadcast = () => {
	const [formData, setFormData] = useState({
		title: "",
		message: "",
		type: "announcement",
		link: "/",
		targetCategory: "",
	});
	const [sending, setSending] = useState(false);
	const [recentSent, setRecentSent] = useState([]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			setSending(true);
			const res = await axios.post("/notifications/broadcast", formData);
			toast.success(res.data.message || "Broadcast notification sent!");
			setRecentSent([
				{
					...formData,
					sentAt: new Date(),
				},
				...recentSent,
			]);
			setFormData({
				title: "",
				message: "",
				type: "announcement",
				link: "/",
				targetCategory: "",
			});
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to broadcast notification");
		} finally {
			setSending(false);
		}
	};

	return (
		<div className='max-w-4xl mx-auto'>
			<div className='mb-6'>
				<h2 className='text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2'>
					<Bell className='text-accent' size={24} /> Customer Notification Campaigns
				</h2>
				<p className='text-xs text-neutral-600 dark:text-gray-400 mt-1'>
					Send persistent in-app announcements directly to registered customers for sales, new arrivals, and vouchers
				</p>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
				{/* Broadcast Form */}
				<div className='lg:col-span-2 bg-white dark:bg-gray-900/60 border border-neutral-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm'>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div>
							<label className='block text-xs font-semibold text-neutral-700 dark:text-gray-300 mb-1'>
								Campaign Notification Title *
							</label>
							<input
								type='text'
								required
								placeholder='e.g. Exclusive Weekend Flash Sale is Live!'
								value={formData.title}
								onChange={(e) => setFormData({ ...formData, title: e.target.value })}
								className='w-full px-3 py-2.5 bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 rounded-xl text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-neutral-900 dark:focus:border-accent placeholder-neutral-400 dark:placeholder-gray-500'
							/>
						</div>

						<div className='grid grid-cols-2 gap-3'>
							<div>
								<label className='block text-xs font-semibold text-neutral-700 dark:text-gray-300 mb-1'>
									Notification Type
								</label>
								<select
									value={formData.type}
									onChange={(e) => setFormData({ ...formData, type: e.target.value })}
									className='w-full px-3 py-2 bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 rounded-xl text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-neutral-900 dark:focus:border-accent'
								>
									<option value='announcement'>Announcement (General)</option>
									<option value='sale'>Promotional Sale</option>
									<option value='new_arrival'>New Arrival Drop</option>
									<option value='coupon'>Discount Voucher</option>
								</select>
							</div>

							<div>
								<label className='block text-xs font-semibold text-neutral-700 dark:text-gray-300 mb-1'>
									Target Route Link
								</label>
								<input
									type='text'
									placeholder='e.g. /sales or /category/jackets'
									value={formData.link}
									onChange={(e) => setFormData({ ...formData, link: e.target.value })}
									className='w-full px-3 py-2 bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 rounded-xl text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-neutral-900 dark:focus:border-accent font-mono text-xs placeholder-neutral-400 dark:placeholder-gray-500'
								/>
							</div>
						</div>

						<div>
							<label className='block text-xs font-semibold text-neutral-700 dark:text-gray-300 mb-1'>
								Notification Message *
							</label>
							<textarea
								rows={3}
								required
								placeholder='Craft a concise and compelling message for the customer dropdown...'
								value={formData.message}
								onChange={(e) => setFormData({ ...formData, message: e.target.value })}
								className='w-full px-3 py-2.5 bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 rounded-xl text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-neutral-900 dark:focus:border-accent placeholder-neutral-400 dark:placeholder-gray-500'
							/>
						</div>

						<button
							type='submit'
							disabled={sending}
							className='w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50'
						>
							<Send size={15} />
							<span>{sending ? "Broadcasting..." : "Send Campaign to All Users"}</span>
						</button>
					</form>
				</div>

				{/* Live Customer Preview */}
				<div>
					<h3 className='text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-gray-400 mb-3'>
						Live Customer Preview
					</h3>
					<div className='bg-white dark:bg-gray-950 rounded-2xl border border-neutral-200 dark:border-gray-800 p-4 shadow-sm'>
						<div className='text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-gray-500 mb-2'>
							Customer Notification Dropdown Card:
						</div>
						<div className='p-3.5 rounded-xl bg-neutral-100 dark:bg-accent/10 border border-neutral-200 dark:border-accent/20 flex items-start gap-3'>
							<div className='w-8 h-8 rounded-xl bg-white dark:bg-gray-900 border border-neutral-200 dark:border-gray-800 flex items-center justify-center flex-shrink-0 text-accent'>
								{formData.type === "sale" && <Flame size={16} className='text-amber-500 dark:text-amber-400' />}
								{formData.type === "coupon" && <Tag size={16} className='text-emerald-500 dark:text-emerald-400' />}
								{formData.type === "new_arrival" && <Sparkles size={16} className='text-purple-500 dark:text-purple-400' />}
								{formData.type === "announcement" && <Info size={16} className='text-accent' />}
							</div>
							<div className='flex-1 min-w-0'>
								<div className='flex items-center justify-between'>
									<span className='text-xs font-bold text-neutral-900 dark:text-white truncate'>
										{formData.title || "Your Campaign Title"}
									</span>
									<span className='text-[10px] text-neutral-500 dark:text-gray-500'>Just now</span>
								</div>
								<p className='text-[11px] text-neutral-700 dark:text-gray-300 mt-1 leading-relaxed'>
									{formData.message || "Your notification message preview will render here for users..."}
								</p>
							</div>
						</div>
					</div>

					{/* Sent history */}
					{recentSent.length > 0 && (
						<div className='mt-6'>
							<h4 className='text-xs font-bold text-neutral-600 dark:text-gray-400 mb-2'>Sent In This Session</h4>
							<div className='space-y-2'>
								{recentSent.map((s, idx) => (
									<div key={idx} className='p-2.5 rounded-xl bg-white dark:bg-gray-900/60 border border-neutral-200 dark:border-gray-800 text-xs shadow-sm'>
										<div className='font-bold text-neutral-900 dark:text-white flex items-center gap-1.5'>
											<CheckCircle size={12} className='text-emerald-500 dark:text-emerald-400' />
											{s.title}
										</div>
										<div className='text-[10px] text-neutral-500 dark:text-gray-500 mt-0.5'>
											Type: {s.type} • Destination: {s.link}
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default CampaignBroadcast;
