import { useState } from "react";
import { Star, Trash2, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";

const ReviewSection = ({ reviews = [], onAddReview, onDeleteReview, productId }) => {
	const { user } = useUserStore();
	const [rating, setRating] = useState(5);
	const [hoverRating, setHoverRating] = useState(0);
	const [comment, setComment] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!comment.trim() || comment.trim().length < 5) return;
		setSubmitting(true);
		try {
			await onAddReview(productId, { rating, comment: comment.trim() });
			setComment("");
			setRating(5);
		} finally {
			setSubmitting(false);
		}
	};

	const userHasReviewed = user && reviews.some((r) => r.user?._id === user._id || r.user === user._id);

	return (
		<div className='mt-12 border-t border-gray-800 pt-8'>
			<h3 className='text-2xl font-bold text-white mb-6 flex items-center gap-2 font-heading'>
				<MessageSquare className='text-accent' size={24} />
				Customer Reviews ({reviews.length})
			</h3>

			{/* Review Submission Form */}
			{user ? (
				userHasReviewed ? (
					<div className='bg-gray-900/40 border border-gray-800 rounded-2xl p-4 mb-8 text-xs text-gray-400 flex items-center gap-2'>
						<ShieldCheck size={16} className='text-accent' />
						<span>You have already submitted feedback for this product. Thank you for your review.</span>
					</div>
				) : (
					<form
						onSubmit={handleSubmit}
						className='bg-gray-900/60 border border-gray-800 rounded-2xl p-6 mb-8 backdrop-blur-md shadow-xl'
					>
						<h4 className='text-base font-bold text-white mb-3 font-heading'>Write a Review</h4>

						{/* Star Selector */}
						<div className='flex items-center gap-2 mb-4'>
							<span className='text-xs text-gray-300 font-semibold'>Rating:</span>
							<div className='flex items-center'>
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={star}
										type='button'
										onClick={() => setRating(star)}
										onMouseEnter={() => setHoverRating(star)}
										onMouseLeave={() => setHoverRating(0)}
										className='p-1 focus:outline-none transition-transform hover:scale-125'
									>
										<Star
											size={20}
											className={`${
												(hoverRating || rating) >= star
													? "text-yellow-400 fill-yellow-400"
													: "text-gray-600"
											} transition-colors`}
										/>
									</button>
								))}
							</div>
							<span className='text-xs font-bold text-yellow-400 ml-1.5'>
								{(hoverRating || rating)} / 5
							</span>
						</div>

						{/* Comment textarea */}
						<div className='mb-4'>
							<textarea
								value={comment}
								onChange={(e) => setComment(e.target.value)}
								placeholder='Share your genuine feedback about the material, comfort, durability, and fit (min. 5 characters)...'
								rows={3}
								required
								minLength={5}
								maxLength={1000}
								className='w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-xs resize-none'
							/>
						</div>

						<button
							type='submit'
							disabled={submitting || comment.trim().length < 5}
							className='flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md'
						>
							<Send size={14} />
							{submitting ? "Posting Review..." : "Submit Review"}
						</button>
					</form>
				)
			) : (
				<div className='bg-gray-900/40 border border-gray-800 rounded-2xl p-5 mb-8 text-center text-xs text-gray-400'>
					Please <span className='text-accent font-semibold'>sign in</span> to leave a genuine product review.
				</div>
			)}

			{/* Reviews list */}
			{reviews.length === 0 ? (
				<div className='py-8 text-center bg-gray-950/40 border border-dashed border-gray-800 rounded-2xl p-6'>
					<MessageSquare className='mx-auto text-gray-600 mb-2' size={32} />
					<h4 className='text-sm font-semibold text-gray-300'>No reviews yet</h4>
					<p className='text-xs text-gray-500 mt-1 max-w-sm mx-auto'>
						Be the first verified customer to share your thoughts on the craftsmanship, fit, and quality of this item.
					</p>
				</div>
			) : (
				<div className='space-y-3'>
					{reviews.map((rev) => {
						const isAuthor =
							user && (rev.user?._id === user._id || rev.user === user._id || user.role === "admin");
						return (
							<div
								key={rev._id}
								className='bg-gray-900/40 border border-gray-800 rounded-2xl p-5 backdrop-blur-sm hover:border-gray-700 transition-colors'
							>
								<div className='flex items-start justify-between'>
									<div>
										<div className='flex items-center gap-3'>
											<div className='w-8 h-8 rounded-full bg-accent-light text-accent flex items-center justify-center font-bold text-xs uppercase'>
												{(rev.user?.name || rev.name || "C")[0]}
											</div>
											<div>
												<div className='flex items-center gap-2 flex-wrap'>
													<h5 className='text-xs font-bold text-white'>
														{rev.user?.name || rev.name || "Customer"}
													</h5>

													{rev.isVerifiedPurchase && (
														<span className='inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20'>
															<ShieldCheck size={11} /> Verified Purchase
														</span>
													)}
												</div>

												<span className='text-[10px] text-gray-500'>
													{new Date(rev.createdAt).toLocaleDateString("en-IN", {
														year: "numeric",
														month: "short",
														day: "numeric",
													})}
												</span>
											</div>
										</div>

										<div className='flex items-center gap-1 mt-2'>
											{[1, 2, 3, 4, 5].map((star) => (
												<Star
													key={star}
													size={13}
													className={
														star <= rev.rating
															? "text-yellow-400 fill-yellow-400"
															: "text-gray-700"
													}
												/>
											))}
										</div>
									</div>

									{isAuthor && onDeleteReview && (
										<button
											onClick={() => onDeleteReview(productId, rev._id)}
											title='Delete review'
											className='text-gray-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-gray-800 transition-colors'
										>
											<Trash2 size={14} />
										</button>
									)}
								</div>

								<p className='text-xs text-gray-300 mt-3 leading-relaxed'>{rev.comment}</p>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default ReviewSection;
