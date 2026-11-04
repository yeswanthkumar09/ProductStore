import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Star, Edit3, Search, Image as ImageIcon, Upload } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import EditProductModal from "./EditProductModal";
import BulkProductImportModal from "./BulkProductImportModal";

const ProductsList = () => {
	const { deleteProduct, toggleFeaturedProduct, products, fetchAllProducts } = useProductStore();
	const [editingProduct, setEditingProduct] = useState(null);
	const [deletingProduct, setDeletingProduct] = useState(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [showBulkModal, setShowBulkModal] = useState(false);

	const filteredProducts = (products || []).filter((product) => {
		if (!searchQuery.trim()) return true;
		const query = searchQuery.toLowerCase();
		return (
			product.name?.toLowerCase().includes(query) ||
			product.category?.toLowerCase().includes(query) ||
			product.brand?.toLowerCase().includes(query)
		);
	});

	return (
		<>
			<motion.div
				className='bg-gray-900 border border-gray-800 shadow-2xl rounded-2xl overflow-hidden max-w-6xl mx-auto'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
			>
				{/* Top bar with count & search */}
				<div className='p-4 sm:p-6 border-b border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4'>
					<div>
						<h2 className='text-lg font-bold text-neutral-900 dark:text-white font-heading'>
							All Catalog Products ({filteredProducts.length})
						</h2>
						<p className='text-xs text-neutral-600 dark:text-gray-400 mt-0.5'>
							Review inventory, toggle featured status, edit pricing in ₹ INR, or delete items.
						</p>
					</div>

					<div className='flex items-center gap-3 w-full sm:w-auto'>
						<div className='relative flex-1 sm:w-72'>
							<Search className='absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-gray-400 w-4 h-4' />
							<input
								type='text'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder='Filter by name or category...'
								className='w-full bg-white dark:bg-gray-950 border border-neutral-200 dark:border-gray-800 rounded-xl pl-9 pr-4 py-2 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-gray-500 text-xs focus:outline-none focus:border-black dark:focus:border-accent'
							/>
						</div>

						<button
							type='button'
							onClick={() => setShowBulkModal(true)}
							className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 text-xs font-semibold border border-neutral-300 dark:border-neutral-700 transition-colors shadow-sm whitespace-nowrap'
						>
							<Upload size={13} />
							<span>Bulk Import</span>
						</button>
					</div>
				</div>

				<div className='overflow-x-auto'>
					<table className='min-w-full divide-y divide-neutral-200 dark:divide-gray-800 text-left'>
						<thead className='bg-neutral-50 dark:bg-gray-950/70 border-b border-neutral-200 dark:border-gray-800'>
							<tr>
								<th className='px-6 py-3.5 text-xs font-semibold text-neutral-600 dark:text-gray-400 uppercase tracking-wider'>
									Product
								</th>
								<th className='px-6 py-3.5 text-xs font-semibold text-neutral-600 dark:text-gray-400 uppercase tracking-wider'>
									Price (₹ INR)
								</th>
								<th className='px-6 py-3.5 text-xs font-semibold text-neutral-600 dark:text-gray-400 uppercase tracking-wider'>
									Category
								</th>
								<th className='px-6 py-3.5 text-xs font-semibold text-neutral-600 dark:text-gray-400 uppercase tracking-wider'>
									Stock
								</th>
								<th className='px-6 py-3.5 text-xs font-semibold text-neutral-600 dark:text-gray-400 uppercase tracking-wider'>
									Rating
								</th>
								<th className='px-6 py-3.5 text-xs font-semibold text-neutral-600 dark:text-gray-400 uppercase tracking-wider'>
									Featured
								</th>
								<th className='px-6 py-3.5 text-xs font-semibold text-neutral-600 dark:text-gray-400 uppercase tracking-wider text-right'>
									Actions
								</th>
							</tr>
						</thead>

						<tbody className='divide-y divide-neutral-200 dark:divide-gray-800 bg-white dark:bg-gray-900'>
							{filteredProducts.length === 0 ? (
								<tr>
									<td colSpan={7} className='px-6 py-12 text-center text-gray-400 text-sm'>
										No products found matching &ldquo;{searchQuery}&rdquo;.
									</td>
								</tr>
							) : (
								filteredProducts.map((product) => (
									<tr key={product._id} className='admin-product-row hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 transition-colors duration-200 ease-in-out'>
										<td className='px-6 py-4 whitespace-nowrap'>
											<div className='flex items-center gap-3'>
												<div className='h-12 w-12 rounded-xl overflow-hidden bg-gray-950 border border-gray-800 flex-shrink-0 relative'>
													{product.image ? (
														<img
															className='h-full w-full object-cover'
															src={product.image}
															alt={product.name}
														/>
													) : (
														<div className='h-full w-full flex items-center justify-center text-gray-600'>
															<ImageIcon size={18} />
														</div>
													)}
													{product.images?.length > 1 && (
														<span className='absolute bottom-0 right-0 bg-black/80 text-[9px] text-gray-200 px-1 rounded-tl'>
															+{product.images.length - 1}
														</span>
													)}
												</div>
												<div>
													<div className='text-sm font-semibold text-neutral-900 dark:text-white max-w-[200px] truncate'>
														{product.name}
													</div>
													{product.brand && (
														<div className='text-[11px] text-accent font-medium'>
															{product.brand}
														</div>
													)}
												</div>
											</div>
										</td>

										<td className='px-6 py-4 whitespace-nowrap'>
											<div className='text-sm font-bold text-neutral-900 dark:text-white'>
												₹{Number(product.price).toLocaleString("en-IN")}
											</div>
											{product.originalPrice && (
												<div className='text-xs text-neutral-500 dark:text-gray-500 line-through'>
													₹{Number(product.originalPrice).toLocaleString("en-IN")}
												</div>
											)}
										</td>

										<td className='px-6 py-4 whitespace-nowrap'>
											<span className='inline-block px-2.5 py-1 text-xs rounded-full bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 capitalize border border-neutral-200 dark:border-neutral-700 font-medium'>
												{product.category}
											</span>
										</td>

										<td className='px-6 py-4 whitespace-nowrap'>
											<span
												className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
													(product.stock ?? 50) > 10
														? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
														: (product.stock ?? 50) > 0
														? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
														: "bg-rose-500/10 text-rose-400 border border-rose-500/20"
												}`}
											>
												{product.stock ?? 50} in stock
											</span>
										</td>

										<td className='px-6 py-4 whitespace-nowrap'>
											<div className='flex items-center gap-1 text-amber-400 text-xs font-bold'>
												<Star className='w-3.5 h-3.5 fill-amber-400' />
												<span>{product.rating ? Number(product.rating).toFixed(1) : "New"}</span>
												{product.numReviews > 0 && (
													<span className='text-[10px] text-gray-400 font-normal'>
														({product.numReviews})
													</span>
												)}
											</div>
										</td>

										<td className='px-6 py-4 whitespace-nowrap'>
											<button
												onClick={() => toggleFeaturedProduct(product._id)}
												title={product.isFeatured ? "Unset featured" : "Set as featured"}
												className={`p-1.5 rounded-lg border transition-all ${
													product.isFeatured
														? "bg-amber-400/20 border-amber-400/40 text-amber-500 dark:text-amber-300"
														: "bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-500 hover:text-black dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white"
												}`}
											>
												<Star
													className={`h-4 w-4 ${product.isFeatured ? "fill-amber-400 text-amber-500" : ""}`}
												/>
											</button>
										</td>

										<td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
											<div className='flex items-center justify-end gap-2'>
												<button
													onClick={() => setEditingProduct(product)}
													title='Edit product details'
													className='p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 hover:text-black dark:bg-gray-800 dark:hover:bg-accent/20 dark:border-gray-700 dark:text-gray-300 dark:hover:text-accent transition-colors'
												>
													<Edit3 className='h-4 w-4' />
												</button>

												<button
													onClick={() => setDeletingProduct(product)}
													title='Delete product'
													className='p-1.5 rounded-lg bg-neutral-100 hover:bg-rose-100 border border-neutral-200 hover:border-rose-300 text-neutral-700 hover:text-rose-600 dark:bg-gray-800 dark:hover:bg-rose-900/30 dark:border-gray-700 dark:text-gray-400 dark:hover:text-rose-400 transition-colors'
												>
													<Trash2 className='h-4 w-4' />
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</motion.div>

			{/* Edit Product Modal */}
			{editingProduct && (
				<EditProductModal
					product={editingProduct}
					onClose={() => setEditingProduct(null)}
					onUpdated={() => {
						fetchAllProducts();
					}}
				/>
			)}

			{/* In-App Delete Confirmation Modal (no browser window.confirm blocking) */}
			{deletingProduct && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in'>
					<div className='bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4'>
						<div className='flex items-center gap-3'>
							<div className='w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0'>
								<Trash2 size={20} />
							</div>
							<div>
								<h3 className='text-base font-bold text-white font-heading'>
									Delete Product
								</h3>
								<p className='text-xs text-gray-400'>
									This action cannot be undone.
								</p>
							</div>
						</div>

						<p className='text-xs text-gray-300 leading-relaxed bg-gray-950/60 p-3.5 rounded-xl border border-gray-800'>
							Are you sure you want to permanently delete <strong className='text-white'>&quot;{deletingProduct.name}&quot;</strong> from your catalog?
						</p>

						<div className='flex items-center justify-end gap-3 pt-2'>
							<button
								type='button'
								disabled={isDeleting}
								onClick={() => setDeletingProduct(null)}
								className='px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50'
							>
								Cancel
							</button>
							<button
								type='button'
								disabled={isDeleting}
								onClick={async () => {
									setIsDeleting(true);
									const success = await deleteProduct(deletingProduct._id);
									setIsDeleting(false);
									if (success) {
										setDeletingProduct(null);
										fetchAllProducts();
									}
								}}
								className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50'
							>
								{isDeleting ? "Deleting..." : "Yes, Delete Product"}
							</button>
						</div>
					</div>
				</div>
			)}

			<BulkProductImportModal
				isOpen={showBulkModal}
				onClose={() => setShowBulkModal(false)}
				onImportComplete={() => fetchAllProducts()}
			/>
		</>
	);
};

export default ProductsList;
