import { useState, useEffect } from "react";
import { X, Check, Upload, Plus, Trash2, Video, Sparkles, Layers, ShieldCheck, Tag } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useCategoryStore } from "../stores/useCategoryStore";

const EditProductModal = ({ product, onClose, onUpdated }) => {
	const { updateProduct } = useProductStore();
	const { categories, fetchCategories } = useCategoryStore();

	const [activeSection, setActiveSection] = useState("general");
	const [loading, setLoading] = useState(false);

	const [formData, setFormData] = useState({
		name: "",
		slug: "",
		brand: "",
		category: "",
		subcategory: "",
		sku: "",
		status: "active",
		price: "",
		originalPrice: "",
		stock: "50",
		shortDescription: "",
		description: "",
		shippingInfo: "",
		warrantyInfo: "",
		returnInfo: "",
		isFeatured: false,
		isNewArrival: false,
		newArrivalStartDate: "",
		newArrivalEndDate: "",
		video: "",
		tags: "",
		image: "",
		images: [],
		colors: [],
		variants: [],
		highlights: [],
		specifications: [],
	});

	// Dynamic inputs
	const [newImageUrl, setNewImageUrl] = useState("");
	const [newColorName, setNewColorName] = useState("");
	const [newColorHex, setNewColorHex] = useState("#000000");

	// Variant input form
	const [newVariant, setNewVariant] = useState({
		colorName: "",
		colorHex: "#000000",
		size: "",
		sku: "",
		price: "",
		originalPrice: "",
		stock: "20",
	});

	// Specification input
	const [newSpecKey, setNewSpecKey] = useState("");
	const [newSpecValue, setNewSpecValue] = useState("");
	const [newHighlight, setNewHighlight] = useState("");

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	useEffect(() => {
		if (product) {
			setFormData({
				name: product.name || "",
				slug: product.slug || "",
				brand: product.brand || "",
				category: product.category || "",
				subcategory: product.subcategory || "",
				sku: product.sku || "",
				status: product.status || "active",
				price: product.price !== undefined ? product.price : "",
				originalPrice: product.originalPrice !== undefined ? product.originalPrice : "",
				stock: product.stock !== undefined ? product.stock : "50",
				shortDescription: product.shortDescription || "",
				description: product.description || "",
				shippingInfo: product.shippingInfo || "Free Express Shipping on orders over ₹1,999.",
				warrantyInfo: product.warrantyInfo || "1-Year Brand Quality Assurance guarantee.",
				returnInfo: product.returnInfo || "Hassle-free 30-day exchange and return policy.",
				isFeatured: !!product.isFeatured,
				isNewArrival: !!product.isNewArrival,
				newArrivalStartDate: product.newArrivalStartDate ? new Date(product.newArrivalStartDate).toISOString().split("T")[0] : "",
				newArrivalEndDate: product.newArrivalEndDate ? new Date(product.newArrivalEndDate).toISOString().split("T")[0] : "",
				video: product.video || "",
				tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
				image: product.image || "",
				images: product.images || (product.image ? [product.image] : []),
				colors: product.colors || [],
				variants: product.variants || [],
				highlights: product.highlights || [],
				specifications: product.specifications || [],
				categoryAttributes: product.categoryAttributes || {},
			});
		}
	}, [product]);

	const selectedCatDoc = categories.find((c) => c.slug === formData.category);

	const handleImageUpload = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setFormData((prev) => ({
					...prev,
					image: prev.image || reader.result,
					images: [reader.result, ...prev.images],
				}));
			};
			reader.readAsDataURL(file);
		}
	};

	const handleAddImageUrl = () => {
		if (!newImageUrl.trim()) return;
		setFormData((prev) => ({
			...prev,
			images: [...prev.images, newImageUrl.trim()],
			image: prev.image || newImageUrl.trim(),
		}));
		setNewImageUrl("");
	};

	const handleSetPrimaryImage = (imgUrl) => {
		setFormData((prev) => ({
			...prev,
			image: imgUrl,
		}));
	};

	const handleRemoveImage = (idx) => {
		setFormData((prev) => {
			const updated = prev.images.filter((_, i) => i !== idx);
			return {
				...prev,
				images: updated,
				image: updated[0] || "",
			};
		});
	};

	// Variants
	const handleAddVariant = () => {
		if (!newVariant.price || Number(newVariant.price) < 0) {
			alert("Please enter a valid selling price for this variant.");
			return;
		}

		const variantColor = {
			name: newVariant.colorName.trim() || "Default",
			hex: newVariant.colorHex || "#000000",
		};

		const variantToAdd = {
			color: variantColor,
			size: newVariant.size.trim() || "Standard",
			sku: newVariant.sku.trim() || `VAR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
			price: Number(newVariant.price),
			originalPrice: newVariant.originalPrice ? Number(newVariant.originalPrice) : undefined,
			stock: Number(newVariant.stock) || 0,
			images: formData.images,
			isAvailable: true,
		};

		setFormData((prev) => {
			const updatedColors = prev.colors.some((c) => c.name.toLowerCase() === variantColor.name.toLowerCase())
				? prev.colors
				: [...prev.colors, variantColor];

			return {
				...prev,
				variants: [...prev.variants, variantToAdd],
				colors: updatedColors,
			};
		});

		setNewVariant({
			colorName: "",
			colorHex: "#000000",
			size: "",
			sku: "",
			price: "",
			originalPrice: "",
			stock: "20",
		});
	};

	const handleRemoveVariant = (idx) => {
		setFormData((prev) => ({
			...prev,
			variants: prev.variants.filter((_, i) => i !== idx),
		}));
	};

	// Specs & Highlights
	const handleAddSpec = () => {
		if (!newSpecKey.trim() || !newSpecValue.trim()) return;
		setFormData((prev) => ({
			...prev,
			specifications: [...prev.specifications, { key: newSpecKey.trim(), value: newSpecValue.trim() }],
		}));
		setNewSpecKey("");
		setNewSpecValue("");
	};

	const handleRemoveSpec = (idx) => {
		setFormData((prev) => ({
			...prev,
			specifications: prev.specifications.filter((_, i) => i !== idx),
		}));
	};

	const handleAddHighlight = () => {
		if (!newHighlight.trim()) return;
		setFormData((prev) => ({
			...prev,
			highlights: [...prev.highlights, newHighlight.trim()],
		}));
		setNewHighlight("");
	};

	const handleRemoveHighlight = (idx) => {
		setFormData((prev) => ({
			...prev,
			highlights: prev.highlights.filter((_, i) => i !== idx),
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			const payload = {
				...formData,
				price: Number(formData.price),
				originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
				stock: Number(formData.stock) || 0,
				newArrivalStartDate: formData.newArrivalStartDate || null,
				newArrivalEndDate: formData.newArrivalEndDate || null,
				tags: formData.tags
					? formData.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
					: [],
			};

			await updateProduct(product._id, payload);
			if (onUpdated) onUpdated();
			onClose();
		} catch (err) {
			console.error("Update product failed:", err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in'>
			<div className='relative w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-3xl p-5 sm:p-8 shadow-2xl my-6 max-h-[92vh] overflow-y-auto flex flex-col'>
				{/* Header */}
				<div className='flex items-center justify-between pb-4 border-b border-gray-800 mb-6'>
					<div>
						<h3 className='text-xl sm:text-2xl font-bold text-white font-heading'>
							Edit Product & Advanced Variants
						</h3>
						<p className='text-xs text-gray-400 mt-0.5'>
							Manage SKU, variant-level pricing, photo gallery, video, technical specs & new arrival scheduling.
						</p>
					</div>
					<button
						type='button'
						onClick={onClose}
						className='p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors'
					>
						<X size={20} />
					</button>
				</div>

				{/* Section Navigation Tabs */}
				<div className='flex flex-wrap items-center gap-2 mb-6 border-b border-gray-800/80 pb-3'>
					{[
						{ id: "general", label: "General & Pricing" },
						{ id: "variants", label: `Variants (${formData.variants?.length || 0})` },
						{ id: "media", label: `Media & Video (${formData.images?.length || 0})` },
						{ id: "specs", label: "Highlights & Specs" },
						{ id: "campaign", label: "New Arrival & Shipping" },
					].map((tab) => (
						<button
							key={tab.id}
							type='button'
							onClick={() => setActiveSection(tab.id)}
							className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
								activeSection === tab.id
									? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold shadow-md"
									: "bg-gray-950 text-gray-400 hover:text-white hover:bg-gray-800"
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>

				<form onSubmit={handleSubmit} className='space-y-6 flex-1'>
					{/* SECTION 1: GENERAL & PRICING */}
					{activeSection === "general" && (
						<div className='space-y-4'>
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								<div>
									<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
										Product Name *
									</label>
									<input
										type='text'
										value={formData.name}
										onChange={(e) => setFormData({ ...formData, name: e.target.value })}
										required
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent'
									/>
								</div>
								<div>
									<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
										URL Slug
									</label>
									<input
										type='text'
										value={formData.slug}
										onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
										placeholder='auto-generated-from-name'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent'
									/>
								</div>
							</div>

							<div className='grid grid-cols-1 sm:grid-cols-4 gap-4'>
								<div>
									<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
										Base Price (₹ INR) *
									</label>
									<input
										type='number'
										value={formData.price}
										onChange={(e) => setFormData({ ...formData, price: e.target.value })}
										required
										min='0'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent'
									/>
								</div>
								<div>
									<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
										MRP / Original (₹ INR)
									</label>
									<input
										type='number'
										value={formData.originalPrice}
										onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
										min='0'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent'
									/>
								</div>
								<div>
									<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
										Base Stock
									</label>
									<input
										type='number'
										value={formData.stock}
										onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
										min='0'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent'
									/>
								</div>
								<div>
									<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
										SKU
									</label>
									<input
										type='text'
										value={formData.sku}
										onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
										placeholder='e.g. JEANS-SEL-001'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent'
									/>
								</div>
							</div>

							<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
								<div>
									<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
										Category *
									</label>
									<select
										value={formData.category}
										onChange={(e) => setFormData({ ...formData, category: e.target.value })}
										required
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent capitalize'
									>
										<option value=''>Select Category</option>
										{categories.map((c) => (
											<option key={c._id || c.slug} value={c.slug}>
												{c.name}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
										Subcategory
									</label>
									{selectedCatDoc?.subcategories?.length > 0 ? (
										<select
											value={formData.subcategory}
											onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
											className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent capitalize'
										>
											<option value=''>Select Subcategory</option>
											{selectedCatDoc.subcategories.map((s) => (
												<option key={s.slug} value={s.slug}>
													{s.name}
												</option>
											))}
										</select>
									) : (
										<input
											type='text'
											value={formData.subcategory}
											onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
											placeholder='e.g. Raw Denim, Aviators'
											className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent'
										/>
									)}
								</div>
								<div>
									<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
										Brand
									</label>
									<input
										type='text'
										value={formData.brand}
										onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
										placeholder='e.g. Levi&apos;s, Nike'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent'
									/>
								</div>
							</div>

							<div>
								<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
									Short Description
								</label>
								<input
									type='text'
									value={formData.shortDescription}
									onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
									placeholder='Concise 1-line summary for product cards and search results'
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-accent'
								/>
							</div>

							<div>
								<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
									Full Description *
								</label>
								<textarea
									value={formData.description}
									onChange={(e) => setFormData({ ...formData, description: e.target.value })}
									rows={4}
									required
									className='w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-accent resize-none'
								/>
							</div>

							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								<div>
									<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
										Product Status
									</label>
									<select
										value={formData.status}
										onChange={(e) => setFormData({ ...formData, status: e.target.value })}
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent'
									>
										<option value='active'>Active (Published)</option>
										<option value='draft'>Draft (Hidden)</option>
										<option value='inactive'>Inactive (Paused)</option>
										<option value='archived'>Archived</option>
									</select>
								</div>
								<div>
									<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
										Search Tags (comma separated)
									</label>
									<input
										type='text'
										value={formData.tags}
										onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
										placeholder='denim, slim, casual, luxury'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-accent'
									/>
								</div>
							</div>
						</div>
					)}

					{/* SECTION 2: VARIANTS */}
					{activeSection === "variants" && (
						<div className='space-y-5'>
							<div className='bg-gray-950/80 p-4 rounded-2xl border border-gray-800'>
								<h4 className='text-sm font-bold text-white mb-3'>Add Product Variant</h4>
								<div className='grid grid-cols-1 sm:grid-cols-4 gap-3'>
									<div>
										<label className='block text-[11px] text-gray-400 mb-1'>Color Name</label>
										<input
											type='text'
											value={newVariant.colorName}
											onChange={(e) => setNewVariant({ ...newVariant, colorName: e.target.value })}
											placeholder='e.g. Midnight Blue'
											className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-white text-xs'
										/>
									</div>
									<div className='flex items-center gap-2'>
										<div className='flex-1'>
											<label className='block text-[11px] text-gray-400 mb-1'>Swatch Hex</label>
											<input
												type='color'
												value={newVariant.colorHex}
												onChange={(e) => setNewVariant({ ...newVariant, colorHex: e.target.value })}
												className='w-full h-8 rounded-lg bg-gray-900 border border-gray-800 cursor-pointer p-0.5'
											/>
										</div>
										<div className='flex-1'>
											<label className='block text-[11px] text-gray-400 mb-1'>Size / Spec</label>
											<input
												type='text'
												value={newVariant.size}
												onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
												placeholder='M / 32 / UK 9'
												className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-white text-xs'
											/>
										</div>
									</div>
									<div>
										<label className='block text-[11px] text-gray-400 mb-1'>Selling Price (₹)</label>
										<input
											type='number'
											value={newVariant.price}
											onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
											placeholder='₹ 2,199'
											className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-white text-xs'
										/>
									</div>
									<div>
										<label className='block text-[11px] text-gray-400 mb-1'>MRP / Original (₹)</label>
										<input
											type='number'
											value={newVariant.originalPrice}
											onChange={(e) => setNewVariant({ ...newVariant, originalPrice: e.target.value })}
											placeholder='₹ 2,999'
											className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-white text-xs'
										/>
									</div>
								</div>

								<div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 items-end'>
									<div>
										<label className='block text-[11px] text-gray-400 mb-1'>Variant SKU</label>
										<input
											type='text'
											value={newVariant.sku}
											onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
											placeholder='e.g. SNEAK-BLK-09'
											className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-white text-xs'
										/>
									</div>
									<div>
										<label className='block text-[11px] text-gray-400 mb-1'>Stock Quantity</label>
										<input
											type='number'
											value={newVariant.stock}
											onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
											min='0'
											className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-white text-xs'
										/>
									</div>
									<button
										type='button'
										onClick={handleAddVariant}
										className='w-full py-2 px-3 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm'
									>
										<Plus size={14} /> Add Variant
									</button>
								</div>
							</div>

							{/* Variants List Table */}
							<div className='overflow-x-auto'>
								<table className='w-full text-left text-xs text-gray-300 divide-y divide-gray-800'>
									<thead className='bg-gray-950 text-gray-400 uppercase font-semibold'>
										<tr>
											<th className='py-2 px-3'>Color</th>
											<th className='py-2 px-3'>Size</th>
											<th className='py-2 px-3'>SKU</th>
											<th className='py-2 px-3'>Selling Price</th>
											<th className='py-2 px-3'>MRP</th>
											<th className='py-2 px-3'>Stock</th>
											<th className='py-2 px-3 text-right'>Action</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-800/80'>
										{formData.variants?.length === 0 ? (
											<tr>
												<td colSpan={7} className='py-6 text-center text-gray-500'>
													No custom variants defined yet. The base price and stock will apply.
												</td>
											</tr>
										) : (
											formData.variants.map((v, idx) => (
												<tr key={idx} className='hover:bg-gray-800/40'>
													<td className='py-2.5 px-3'>
														<span className='inline-flex items-center gap-1.5'>
															<span
																className='w-3 h-3 rounded-full border border-gray-600'
																style={{ backgroundColor: v.color?.hex || "#000" }}
															/>
															{v.color?.name || "Standard"}
														</span>
													</td>
													<td className='py-2.5 px-3 font-medium text-white'>{v.size || "-"}</td>
													<td className='py-2.5 px-3 font-mono text-gray-400'>{v.sku || "-"}</td>
													<td className='py-2.5 px-3 font-bold text-accent'>
														₹{Number(v.price).toLocaleString("en-IN")}
													</td>
													<td className='py-2.5 px-3 text-gray-500 line-through'>
														{v.originalPrice ? `₹${Number(v.originalPrice).toLocaleString("en-IN")}` : "-"}
													</td>
													<td className='py-2.5 px-3'>
														<span
															className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
																v.stock > 10
																	? "bg-emerald-500/10 text-emerald-400"
																	: v.stock > 0
																	? "bg-amber-500/10 text-amber-400"
																	: "bg-rose-500/10 text-rose-400"
															}`}
														>
															{v.stock} in stock
														</span>
													</td>
													<td className='py-2.5 px-3 text-right'>
														<button
															type='button'
															onClick={() => handleRemoveVariant(idx)}
															className='text-gray-400 hover:text-rose-400'
														>
															<Trash2 size={14} />
														</button>
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* SECTION 3: MEDIA & VIDEO */}
					{activeSection === "media" && (
						<div className='space-y-4'>
							<div>
								<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
									Product Photos Gallery ({formData.images?.length || 0})
								</label>
								<div className='flex flex-wrap gap-3 mb-3'>
									{formData.images?.map((img, idx) => (
										<div
											key={idx}
											className={`relative w-20 h-24 rounded-xl overflow-hidden border bg-gray-950 group cursor-pointer ${
												formData.image === img ? "border-accent ring-2 ring-accent" : "border-gray-800"
											}`}
											onClick={() => handleSetPrimaryImage(img)}
											title='Click to set as primary cover photo'
										>
											<img src={img} alt={`Product ${idx + 1}`} className='w-full h-full object-cover' />
											{formData.image === img && (
												<span className='absolute bottom-0 inset-x-0 bg-accent text-[9px] text-white text-center font-bold py-0.5'>
													Primary
												</span>
											)}
											<button
												type='button'
												onClick={(e) => {
													e.stopPropagation();
													handleRemoveImage(idx);
												}}
												className='absolute top-1 right-1 p-1 rounded-md bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity'
											>
												<X size={12} />
											</button>
										</div>
									))}
								</div>

								<div className='flex flex-wrap items-center gap-2'>
									<input
										type='text'
										value={newImageUrl}
										onChange={(e) => setNewImageUrl(e.target.value)}
										placeholder='Paste photo image URL (https://...)'
										className='flex-1 min-w-[200px] bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-accent'
									/>
									<button
										type='button'
										onClick={handleAddImageUrl}
										className='px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold'
									>
										Add Image URL
									</button>
									<label className='cursor-pointer px-3.5 py-2 rounded-xl border border-gray-700 bg-gray-950 hover:bg-gray-800 text-xs font-semibold text-accent flex items-center gap-1.5'>
										<Upload size={14} /> Upload File
										<input type='file' accept='image/*' onChange={handleImageUpload} className='sr-only' />
									</label>
								</div>
								<p className='text-[11px] text-gray-500 mt-1'>
									Click any image to designate it as the primary cover photo for catalog grids.
								</p>
							</div>

							<div className='pt-3 border-t border-gray-800'>
								<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1.5'>
									<Video size={14} className='text-accent' /> Product Demo Video URL
								</label>
								<input
									type='url'
									value={formData.video}
									onChange={(e) => setFormData({ ...formData, video: e.target.value })}
									placeholder='https://www.youtube.com/watch?v=... or direct mp4/webm stream'
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent'
								/>
								<p className='text-[11px] text-gray-500 mt-1'>
									Embeds a high-definition interactive video player directly on the customer product detail page.
								</p>
							</div>
						</div>
					)}

					{/* SECTION 4: HIGHLIGHTS & SPECS */}
					{activeSection === "specs" && (
						<div className='space-y-5'>
							<div>
								<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2'>
									Key Highlights (Bullet Points)
								</label>
								<div className='space-y-1.5 mb-3'>
									{formData.highlights?.map((h, idx) => (
										<div key={idx} className='flex items-center justify-between p-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-200'>
											<span className='flex items-center gap-2'>
												<span className='w-1.5 h-1.5 rounded-full bg-accent' /> {h}
											</span>
											<button type='button' onClick={() => handleRemoveHighlight(idx)} className='text-gray-500 hover:text-rose-400'>
												<X size={14} />
											</button>
										</div>
									))}
								</div>
								<div className='flex gap-2'>
									<input
										type='text'
										value={newHighlight}
										onChange={(e) => setNewHighlight(e.target.value)}
										placeholder='e.g. 100% Japanese Selvedge Cotton'
										className='flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-accent'
									/>
									<button
										type='button'
										onClick={handleAddHighlight}
										className='px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold'
									>
										Add
									</button>
								</div>
							</div>

							<div className='pt-4 border-t border-gray-800'>
								<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2'>
									Technical Specifications (Key - Value)
								</label>
								<div className='grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3'>
									{formData.specifications?.map((s, idx) => (
										<div key={idx} className='flex items-center justify-between p-2.5 rounded-xl bg-gray-950 border border-gray-800 text-xs'>
											<div>
												<span className='font-bold text-gray-400'>{s.key}:</span>{" "}
												<span className='text-white'>{s.value}</span>
											</div>
											<button type='button' onClick={() => handleRemoveSpec(idx)} className='text-gray-500 hover:text-rose-400'>
												<X size={14} />
											</button>
										</div>
									))}
								</div>
								<div className='grid grid-cols-1 sm:grid-cols-3 gap-2'>
									<input
										type='text'
										value={newSpecKey}
										onChange={(e) => setNewSpecKey(e.target.value)}
										placeholder='Attribute (e.g. Material, Fit)'
										className='bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-accent'
									/>
									<input
										type='text'
										value={newSpecValue}
										onChange={(e) => setNewSpecValue(e.target.value)}
										placeholder='Value (e.g. 100% Cotton, Slim)'
										className='bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-accent'
									/>
									<button
										type='button'
										onClick={handleAddSpec}
										className='py-2 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold'
									>
										Add Specification
									</button>
								</div>
							</div>
						</div>
					)}

					{/* SECTION 5: CAMPAIGNS & SHIPPING */}
					{activeSection === "campaign" && (
						<div className='space-y-4'>
							<div className='p-4 rounded-2xl bg-gray-950 border border-gray-800 space-y-3'>
								<div className='flex items-center gap-3'>
									<input
										type='checkbox'
										id='isNewArrival'
										checked={formData.isNewArrival}
										onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
										className='w-4 h-4 rounded text-accent bg-gray-900 border-gray-700'
									/>
									<label htmlFor='isNewArrival' className='text-sm font-bold text-white cursor-pointer flex items-center gap-1.5'>
										<Sparkles size={16} className='text-amber-400' /> Mark as New Arrival
									</label>
								</div>
								<p className='text-xs text-gray-400 pl-7'>
									Displays in the dedicated New Arrivals section on the homepage and shows the &ldquo;NEW&rdquo; badge.
								</p>

								{formData.isNewArrival && (
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 pl-7'>
										<div>
											<label className='block text-[11px] text-gray-400 mb-1'>Campaign Start Date</label>
											<input
												type='date'
												value={formData.newArrivalStartDate}
												onChange={(e) => setFormData({ ...formData, newArrivalStartDate: e.target.value })}
												className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs'
											/>
										</div>
										<div>
											<label className='block text-[11px] text-gray-400 mb-1'>Campaign End Date</label>
											<input
												type='date'
												value={formData.newArrivalEndDate}
												onChange={(e) => setFormData({ ...formData, newArrivalEndDate: e.target.value })}
												className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs'
											/>
										</div>
									</div>
								)}
							</div>

							<div className='p-4 rounded-2xl bg-gray-950 border border-gray-800'>
								<div className='flex items-center gap-3'>
									<input
										type='checkbox'
										id='isFeatured'
										checked={formData.isFeatured}
										onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
										className='w-4 h-4 rounded text-accent bg-gray-900 border-gray-700'
									/>
									<label htmlFor='isFeatured' className='text-sm font-bold text-white cursor-pointer flex items-center gap-1.5'>
										Featured Spotlight Showcase
									</label>
								</div>
							</div>

							<div>
								<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
									Shipping Information
								</label>
								<input
									type='text'
									value={formData.shippingInfo}
									onChange={(e) => setFormData({ ...formData, shippingInfo: e.target.value })}
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs'
								/>
							</div>

							<div>
								<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
									Warranty & Authenticity Guarantee
								</label>
								<input
									type='text'
									value={formData.warrantyInfo}
									onChange={(e) => setFormData({ ...formData, warrantyInfo: e.target.value })}
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs'
								/>
							</div>

							<div>
								<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
									Return & Exchange Policy
								</label>
								<input
									type='text'
									value={formData.returnInfo}
									onChange={(e) => setFormData({ ...formData, returnInfo: e.target.value })}
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs'
								/>
							</div>
						</div>
					)}

					{/* Modal Footer Actions */}
					<div className='flex items-center justify-between pt-6 border-t border-gray-800 mt-6'>
						<div className='text-xs text-gray-500'>
							Status: <strong className='text-white capitalize'>{formData.status}</strong>
						</div>
						<div className='flex items-center gap-3'>
							<button
								type='button'
								onClick={onClose}
								className='px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold'
							>
								Cancel
							</button>
							<button
								type='submit'
								disabled={loading}
								className='flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold shadow-md disabled:opacity-50'
							>
								<Check size={14} /> {loading ? "Saving Changes..." : "Save Product Details"}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

export default EditProductModal;
