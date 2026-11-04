import { useState, useEffect } from "react";
import { Star, Trash2, Edit3, MessageSquare, X, Check, Search } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const ReviewManagement = () => {
	const [reviews, setReviews] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchFilter, setSearchFilter] = useState("");

	// Edit Modal
	const [editingReview, setEditingReview] = useState(null);
	const [editRating, setEditRating] = useState(5);
	const [editComment, setEditComment] = useState("");
	const [updating, setUpdating] = useState(false);

	const fetchAllReviews = async () => {
		setLoading(true);
		try {
			const res = await axios.get("/reviews/admin/all");
			setReviews(res.data || []);
		} catch (err) {
			console.error("Error fetching reviews:", err);
			toast.error("Failed to load customer reviews");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAllReviews();
	}, []);

	const openEditModal = (rev) => {
		setEditingReview(rev);
		setEditRating(rev.rating);
		setEditComment(rev.comment);
	};

	const handleUpdateReview = async (e) => {
		e.preventDefault();
		if (!editingReview) return;
		setUpdating(true);
		try {
			const res = await axios.put(`/reviews/admin/${editingReview._id}`, {
				rating: editRating,
				comment: editComment,
			});
			setReviews((prev) => prev.map((r) => (r._id === editingReview._id ? res.data : r)));
			toast.success("Review updated successfully!");
			setEditingReview(null);
		} catch (err) {
			console.error("Error updating review:", err);
			toast.error(err.response?.data?.message || "Failed to update review");
		} finally {
			setUpdating(false);
		}
	};

	const handleDeleteReview = async (reviewId) => {
		if (!window.confirm("Are you sure you want to delete this customer review?")) return;
		try {
			await axios.delete(`/reviews/admin/${reviewId}`);
			setReviews((prev) => prev.filter((r) => r._id !== reviewId));
			toast.success("Review deleted and product rating updated!");
		} catch (err) {
			console.error("Error deleting review:", err);
			toast.error("Failed to delete review");
		}
	};

	const filteredReviews = reviews.filter((r) => {
		const q = searchFilter.toLowerCase();
		return (
			r.product?.name?.toLowerCase().includes(q) ||
			r.name?.toLowerCase().includes(q) ||
			r.comment?.toLowerCase().includes(q)
		);
	});

	return (
		<div className='max-w-6xl mx-auto'>
			{/* Top Header */}
			<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md'>
				<div>
					<h3 className='text-2xl font-bold text-white font-heading flex items-center gap-2'>
						<MessageSquare className='text-accent' size={24} /> Customer Review Moderation
					</h3>
					<p className='text-sm text-gray-400 mt-1'>
						Inspect customer feedback, edit reviews, and remove abusive content. Product ratings recalculate automatically.
					</p>
				</div>

				{/* Search Filter */}
				<div className='relative w-full sm:w-72'>
					<input
						type='text'
						value={searchFilter}
						onChange={(e) => setSearchFilter(e.target.value)}
						placeholder='Filter reviews or products...'
						className='w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-white text-xs focus:outline-none focus:border-accent'
					/>
					<Search size={14} className='absolute left-3 top-2.5 text-gray-500' />
				</div>
			</div>

			{/* Reviews Table / List */}
			{loading ? (
				<div className='text-center py-16 text-gray-400 text-sm'>Loading customer reviews...</div>
			) : filteredReviews.length === 0 ? (
				<div className='text-center py-16 bg-gray-900/40 rounded-2xl border border-gray-800 p-6'>
					<MessageSquare size={40} className='mx-auto text-gray-600 mb-3' />
					<h4 className='text-base font-bold text-white'>No customer reviews found</h4>
					<p className='text-xs text-gray-400 mt-1'>Reviews submitted by customers will appear here for moderation.</p>
				</div>
			) : (
				<div className='bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden shadow-xl'>
					<div className='overflow-x-auto'>
						<table className='min-w-full divide-y divide-gray-800 text-left text-sm'>
							<thead className='bg-gray-950/80 text-xs font-semibold uppercase tracking-wider text-gray-400'>
								<tr>
									<th className='px-6 py-4'>Product</th>
									<th className='px-6 py-4'>Reviewer</th>
									<th className='px-6 py-4'>Rating</th>
									<th className='px-6 py-4'>Comment</th>
									<th className='px-6 py-4'>Date</th>
									<th className='px-6 py-4 text-right'>Actions</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-gray-800/60 text-gray-300'>
								{filteredReviews.map((rev) => (
									<tr key={rev._id} className='hover:bg-gray-800/30 transition-colors'>
										<td className='px-6 py-4'>
											<div className='flex items-center gap-3'>
												<img
													src={rev.product?.image || "/placeholder.png"}
													alt={rev.product?.name || "Product"}
													className='w-10 h-10 object-cover rounded-lg bg-gray-950 border border-gray-800 flex-shrink-0'
												/>
												<div className='min-w-0'>
													<span className='font-semibold text-white truncate block max-w-xs text-xs'>
														{rev.product?.name || "Product"}
													</span>
													<span className='text-[11px] text-accent'>
														₹{rev.product?.price?.toLocaleString("en-IN")}
													</span>
												</div>
											</div>
										</td>
										<td className='px-6 py-4'>
											<div className='text-xs font-semibold text-white'>{rev.name || rev.user?.name || "Customer"}</div>
											<div className='text-[11px] text-gray-500'>{rev.user?.email || ""}</div>
										</td>
										<td className='px-6 py-4'>
											<div className='flex items-center gap-1 text-yellow-400 text-xs font-bold'>
												<Star size={13} className='fill-yellow-400' />
												<span>{rev.rating}/5</span>
											</div>
										</td>
										<td className='px-6 py-4'>
											<p className='text-xs text-gray-300 line-clamp-2 max-w-sm'>{rev.comment}</p>
										</td>
										<td className='px-6 py-4 text-xs text-gray-500 whitespace-nowrap'>
											{new Date(rev.createdAt).toLocaleDateString("en-IN", {
												day: "numeric",
												month: "short",
												year: "numeric",
											})}
										</td>
										<td className='px-6 py-4 text-right whitespace-nowrap'>
											<div className='flex items-center justify-end gap-2'>
												<button
													onClick={() => openEditModal(rev)}
													title='Edit Review'
													className='p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors'
												>
													<Edit3 size={15} />
												</button>
												<button
													onClick={() => handleDeleteReview(rev._id)}
													title='Delete Review'
													className='p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors'
												>
													<Trash2 size={15} />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Edit Review Modal */}
			{editingReview && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in'>
					<div className='relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl'>
						<div className='flex items-center justify-between pb-4 border-b border-gray-800 mb-6'>
							<h3 className='text-lg font-bold text-white font-heading'>Edit Customer Review</h3>
							<button
								type='button'
								onClick={() => setEditingReview(null)}
								className='p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800'
							>
								<X size={18} />
							</button>
						</div>

						<form onSubmit={handleUpdateReview} className='space-y-4'>
							<div>
								<span className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2'>
									Star Rating
								</span>
								<div className='flex items-center gap-2'>
									{[1, 2, 3, 4, 5].map((star) => (
										<button
											key={star}
											type='button'
											onClick={() => setEditRating(star)}
											className='p-1 focus:outline-none transition-transform hover:scale-110'
										>
											<Star
												size={24}
												className={`${
													editRating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
												}`}
											/>
										</button>
									))}
									<span className='text-sm font-bold text-yellow-400 ml-2'>{editRating} / 5</span>
								</div>
							</div>

							<div>
								<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
									Review Feedback
								</label>
								<textarea
									value={editComment}
									onChange={(e) => setEditComment(e.target.value)}
									rows={4}
									required
									className='w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-accent resize-none'
								/>
							</div>

							<div className='flex items-center justify-end gap-3 pt-4 border-t border-gray-800'>
								<button
									type='button'
									onClick={() => setEditingReview(null)}
									className='px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold'
								>
									Cancel
								</button>
								<button
									type='submit'
									disabled={updating}
									className='flex items-center gap-1.5 px-5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold shadow-md disabled:opacity-50'
								>
									<Check size={14} /> {updating ? "Saving..." : "Update Review"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default ReviewManagement;
