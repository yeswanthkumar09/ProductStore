import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Layers,
	ListPlus,
	Sliders,
	FileText,
	Palette,
	Image as ImageIcon,
	Eye,
	Send,
	Check,
	ChevronRight,
	ChevronLeft,
	Plus,
	Trash2,
	Upload,
	X,
	Sparkles,
	Star,
	CheckCircle2,
	Loader,
	AlertCircle,
	Ruler,
	Tag,
} from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import toast from "react-hot-toast";

const STEPS = [
	{ id: 1, label: "Category", icon: Layers, desc: "Department" },
	{ id: 2, label: "Subcategory", icon: ListPlus, desc: "Line" },
	{ id: 3, label: "Attributes", icon: Sliders, desc: "Specs" },
	{ id: 4, label: "General Info", icon: FileText, desc: "Pricing & Details" },
	{ id: 5, label: "Variants", icon: Palette, desc: "Colors & Sizes" },
	{ id: 6, label: "Media", icon: ImageIcon, desc: "Photos & Video" },
	{ id: 7, label: "Preview", icon: Eye, desc: "Storefront Card" },
	{ id: 8, label: "Publish", icon: Send, desc: "Status & Launch" },
];

const CreateProductForm = ({ onCreated }) => {
	const { createProduct, loading } = useProductStore();
	const { categories, fetchCategories } = useCategoryStore();

	const [currentStep, setCurrentStep] = useState(1);

	// Core Product State
	const [formData, setFormData] = useState({
		name: "",
		slug: "",
		brand: "LUXESTORE Sartorial",
		category: "",
		subcategory: "",
		categoryAttributes: {},
		price: "",
		originalPrice: "",
		stock: "50",
		sku: "",
		shortDescription: "",
		description: "",
		tags: "",
		highlights: ["100% Sustainable Natural Fiber", "Bespoke Tailored Construction", "Dry Clean Recommended"],
		image: "",
		images: [],
		video: "",
		colors: [],
		variants: [],
		status: "active",
		isFeatured: false,
		isNewArrival: false,
		newArrivalStartDate: "",
		newArrivalEndDate: "",
		shippingInfo: "Free Express Delivery on orders over ₹1,999. Hand-packed in signature garment bag.",
		warrantyInfo: "1-Year Atelier Craftsmanship Guarantee.",
		returnInfo: "30-day complimentary exchange & concierge returns.",
	});

	// Inline color creator
	const [newColorName, setNewColorName] = useState("");
	const [newColorHex, setNewColorHex] = useState("#000000");
	const [newColorImage, setNewColorImage] = useState("");

	// Inline manual variant creator
	const [manualVariant, setManualVariant] = useState({
		colorName: "",
		size: "",
		sku: "",
		price: "",
		stock: "15",
	});

	// Highlight text input
	const [highlightInput, setHighlightInput] = useState("");

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	// Current Category Document & Allowed Sizes
	const selectedCategoryDoc = categories.find((c) => c.slug === formData.category);
	const subcategoriesList = selectedCategoryDoc?.subcategories?.filter((s) => s.isActive) || [];
	const categoryAttributesList = selectedCategoryDoc?.attributes || [];
	const allowedSizesList = selectedCategoryDoc?.sizeSystem?.allowedSizes?.length
		? selectedCategoryDoc.sizeSystem.allowedSizes
		: ["XS", "S", "M", "L", "XL", "XXL"];

	const slugify = (text) =>
		text
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");

	// Handle Image File Upload (Primary)
	const handlePrimaryImageUpload = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setFormData((prev) => {
					const newImages = prev.images.includes(reader.result) ? prev.images : [reader.result, ...prev.images];
					return { ...prev, image: reader.result, images: newImages };
				});
			};
			reader.readAsDataURL(file);
		}
	};

	// Handle Gallery Images Upload
	const handleGalleryUpload = (e) => {
		const files = Array.from(e.target.files);
		files.forEach((file) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				setFormData((prev) => ({
					...prev,
					images: [...prev.images, reader.result],
					image: prev.image || reader.result,
				}));
			};
			reader.readAsDataURL(file);
		});
	};

	// Handle Color Image Upload
	const handleColorImageUpload = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setNewColorImage(reader.result);
			};
			reader.readAsDataURL(file);
		}
	};

	// Add Color Variant
	const handleAddColor = () => {
		if (!newColorName.trim()) return;
		const name = newColorName.trim();
		if (formData.colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
			toast.error("Color with this name already exists");
			return;
		}

		const colorObj = {
			name,
			hex: newColorHex,
			image: newColorImage || formData.image || "",
		};

		setFormData({
			...formData,
			colors: [...formData.colors, colorObj],
		});

		setNewColorName("");
		setNewColorHex("#000000");
		setNewColorImage("");
	};

	const handleRemoveColor = (index) => {
		const colorToRemove = formData.colors[index];
		setFormData({
			...formData,
			colors: formData.colors.filter((_, idx) => idx !== index),
			variants: formData.variants.filter((v) => v.color?.name !== colorToRemove.name),
		});
	};

	// Generate Full Matrix: (Colors × Sizes)
	const handleGenerateVariantMatrix = () => {
		if (formData.colors.length === 0) {
			toast.error("Please add at least one color before generating variants matrix.");
			return;
		}

		const basePrice = Number(formData.price) || 2999;
		const baseSkuPrefix = formData.sku || (formData.name ? slugify(formData.name).substring(0, 8).toUpperCase() : "LUXE");
		const existingCombos = new Set(
			formData.variants.map((v) => `${(v.color?.name || "").toLowerCase()}_${(v.size || "").toLowerCase()}`)
		);

		const generated = [];

		formData.colors.forEach((col) => {
			allowedSizesList.forEach((sz) => {
				const comboKey = `${col.name.toLowerCase()}_${sz.toLowerCase()}`;
				if (!existingCombos.has(comboKey)) {
					const cleanCol = col.name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
					const cleanSz = sz.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
					const variantSku = `${baseSkuPrefix}-${cleanCol}-${cleanSz}`;

					generated.push({
						color: { name: col.name, hex: col.hex, image: col.image },
						size: sz,
						sku: variantSku,
						price: basePrice,
						originalPrice: formData.originalPrice ? Number(formData.originalPrice) : Math.round(basePrice * 1.3),
						stock: Number(formData.stock) || 15,
						images: col.image ? [col.image] : formData.image ? [formData.image] : [],
						isAvailable: true,
					});
				}
			});
		});

		if (generated.length === 0) {
			toast("All combinations already exist in your variant matrix.", { icon: "ℹ️" });
			return;
		}

		setFormData({
			...formData,
			variants: [...formData.variants, ...generated],
		});
		toast.success(`Generated ${generated.length} unique variant combinations!`);
	};

	// Add Manual Variant
	const handleAddManualVariant = () => {
		if (!manualVariant.colorName || !manualVariant.size) {
			toast.error("Please select both a color and a size.");
			return;
		}

		const comboKey = `${manualVariant.colorName.toLowerCase()}_${manualVariant.size.toLowerCase()}`;
		if (formData.variants.some((v) => `${(v.color?.name || "").toLowerCase()}_${(v.size || "").toLowerCase()}` === comboKey)) {
			toast.error(`Variant with Color "${manualVariant.colorName}" & Size "${manualVariant.size}" already exists!`);
			return;
		}

		const matchedColor = formData.colors.find((c) => c.name === manualVariant.colorName) || {
			name: manualVariant.colorName,
			hex: "#171717",
		};

		const price = manualVariant.price ? Number(manualVariant.price) : Number(formData.price) || 2999;
		const sku = manualVariant.sku || `${(formData.sku || "PROD").toUpperCase()}-${manualVariant.size.toUpperCase()}`;

		setFormData({
			...formData,
			variants: [
				...formData.variants,
				{
					color: matchedColor,
					size: manualVariant.size,
					sku,
					price,
					stock: Number(manualVariant.stock) || 10,
					images: matchedColor.image ? [matchedColor.image] : formData.image ? [formData.image] : [],
					isAvailable: true,
				},
			],
		});

		setManualVariant({ colorName: "", size: "", sku: "", price: "", stock: "15" });
	};

	const handleRemoveVariant = (index) => {
		setFormData({
			...formData,
			variants: formData.variants.filter((_, idx) => idx !== index),
		});
	};

	// Step Validation Guard
	const validateCurrentStep = () => {
		if (currentStep === 1) {
			if (!formData.category) {
				toast.error("Please select a fashion department to continue.");
				return false;
			}
			return true;
		}

		if (currentStep === 2) {
			if (subcategoriesList.length > 0 && !formData.subcategory) {
				// Default to first subcategory if not chosen
				setFormData((prev) => ({ ...prev, subcategory: subcategoriesList[0].slug }));
			}
			return true;
		}

		if (currentStep === 3) {
			// Validate required category-specific attributes
			for (const attr of categoryAttributesList) {
				if (attr.required) {
					const val = formData.categoryAttributes[attr.key];
					if (val === undefined || val === null || (typeof val === "string" && !val.trim())) {
						toast.error(`Please configure required attribute: "${attr.label}"`);
						return false;
					}
				}
			}
			return true;
		}

		if (currentStep === 4) {
			if (!formData.name.trim()) {
				toast.error("Please enter a product title.");
				return false;
			}
			if (!formData.price || Number(formData.price) <= 0) {
				toast.error("Please specify a valid base price.");
				return false;
			}
			if (!formData.description.trim()) {
				toast.error("Please provide a product description.");
				return false;
			}
			return true;
		}

		if (currentStep === 5) {
			if (formData.colors.length === 0) {
				toast.error("Please add at least one color variant with an image thumbnail.");
				return false;
			}
			if (formData.variants.length === 0) {
				toast.error("Please generate or add at least one purchasable variant.");
				return false;
			}
			return true;
		}

		if (currentStep === 6) {
			if (!formData.image && (!formData.images || formData.images.length === 0)) {
				toast.error("Please upload or enter at least one primary product photograph.");
				return false;
			}
			return true;
		}

		return true;
	};

	const handleNextStep = () => {
		if (validateCurrentStep()) {
			setCurrentStep((prev) => Math.min(prev + 1, 8));
		}
	};

	const handlePrevStep = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 1));
	};

	// Final Submit
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validateCurrentStep()) return;

		try {
			const productPayload = {
				name: formData.name.trim(),
				slug: slugify(formData.slug || formData.name),
				brand: formData.brand.trim(),
				category: formData.category,
				subcategory: formData.subcategory,
				categoryAttributes: formData.categoryAttributes,
				price: Number(formData.price),
				originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
				stock: Number(formData.stock) || 50,
				sku: formData.sku.trim(),
				shortDescription: formData.shortDescription.trim(),
				description: formData.description.trim(),
				highlights: formData.highlights,
				specifications: Object.entries(formData.categoryAttributes).map(([k, v]) => ({
					key: k,
					value: Array.isArray(v) ? v.join(", ") : String(v),
				})),
				image: formData.image || formData.images[0] || "",
				images: formData.images.length > 0 ? formData.images : formData.image ? [formData.image] : [],
				video: formData.video.trim(),
				colors: formData.colors,
				variants: formData.variants,
				status: formData.status,
				isFeatured: formData.isFeatured,
				isNewArrival: formData.isNewArrival,
				newArrivalStartDate: formData.newArrivalStartDate || null,
				newArrivalEndDate: formData.newArrivalEndDate || null,
				shippingInfo: formData.shippingInfo,
				warrantyInfo: formData.warrantyInfo,
				returnInfo: formData.returnInfo,
				tags: formData.tags
					? formData.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
					: [],
			};

			await createProduct(productPayload);
			toast.success(`Published "${formData.name}" to catalog!`);

			if (onCreated) onCreated();
		} catch (err) {
			console.error("Product creation error:", err);
		}
	};

	return (
		<div className='max-w-6xl mx-auto'>
			{/* Wizard Progress Stepper */}
			<div className='bg-gray-900/60 border border-gray-800 rounded-3xl p-4 sm:p-6 mb-8 backdrop-blur-md shadow-2xl'>
				<div className='grid grid-cols-4 sm:grid-cols-8 gap-2'>
					{STEPS.map((s) => {
						const isCompleted = currentStep > s.id;
						const isCurrent = currentStep === s.id;

						return (
							<button
								key={s.id}
								type='button'
								onClick={() => {
									if (s.id < currentStep || validateCurrentStep()) {
										setCurrentStep(s.id);
									}
								}}
								className={`flex flex-col items-center text-center p-2 rounded-2xl transition-all ${
									isCurrent
										? "bg-accent text-white shadow-lg glow-accent"
										: isCompleted
										? "bg-gray-950/80 text-emerald-400 border border-emerald-900/40"
										: "bg-gray-950/40 text-gray-500 border border-gray-800/40 hover:text-gray-300"
								}`}
							>
								<div className='relative mb-1'>
									{isCompleted ? <CheckCircle2 size={18} /> : <s.icon size={18} />}
								</div>
								<span className='text-[10px] font-bold uppercase tracking-wider line-clamp-1'>
									{s.label}
								</span>
								<span className='text-[9px] opacity-70 hidden sm:block'>{s.desc}</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Wizard Main Card */}
			<div className='bg-gray-900/80 border border-gray-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md relative'>
				{/* ========================================================================= */}
				{/* STEP 1: CATEGORY SELECTION                                               */}
				{/* ========================================================================= */}
				{currentStep === 1 && (
					<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className='space-y-6'>
						<div>
							<h3 className='text-xl sm:text-2xl font-black text-white font-heading uppercase tracking-tight'>
								Step 1: Select Fashion Department
							</h3>
							<p className='text-xs text-gray-400 mt-1'>
								Choose the core department. Attributes, size guides, and styling options will adapt automatically.
							</p>
						</div>

						<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4'>
							{categories
								.filter((c) => !c.isArchived)
								.map((cat) => {
									const isSelected = formData.category === cat.slug;
									return (
										<button
											key={cat._id}
											type='button'
											onClick={() => {
												setFormData({
													...formData,
													category: cat.slug,
													subcategory: cat.subcategories?.[0]?.slug || "",
													categoryAttributes: {},
												});
											}}
											className={`group relative flex flex-col items-center rounded-2xl overflow-hidden border p-3 transition-all text-center ${
												isSelected
													? "bg-accent/20 border-accent ring-2 ring-accent text-white shadow-xl glow-accent"
													: "bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white"
											}`}
										>
											<div className='w-full aspect-square rounded-xl overflow-hidden bg-gray-900 mb-2.5'>
												<img
													src={cat.imageUrl || "/placeholder.png"}
													alt={cat.name}
													className='w-full h-full object-cover transition-transform group-hover:scale-105'
												/>
											</div>
											<span className='font-bold text-xs uppercase tracking-wider text-white line-clamp-1'>
												{cat.name}
											</span>
											<span className='text-[10px] text-gray-500 font-mono mt-0.5'>
												{cat.subcategories?.length || 0} Subcategories
											</span>
										</button>
									);
								})}
						</div>
					</motion.div>
				)}

				{/* ========================================================================= */}
				{/* STEP 2: SUBCATEGORY SELECTION                                            */}
				{/* ========================================================================= */}
				{currentStep === 2 && (
					<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className='space-y-6'>
						<div>
							<h3 className='text-xl sm:text-2xl font-black text-white font-heading uppercase tracking-tight'>
								Step 2: Select Subcategory for {selectedCategoryDoc?.name || "Department"}
							</h3>
							<p className='text-xs text-gray-400 mt-1'>
								Refine product taxonomy to ensure accurate storefront filtering and customer discovery.
							</p>
						</div>

						{subcategoriesList.length === 0 ? (
							<div className='p-8 rounded-2xl bg-gray-950 border border-gray-800 text-center text-gray-400 text-xs'>
								This category does not have dedicated subcategories configured. You can proceed directly.
							</div>
						) : (
							<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
								{subcategoriesList.map((sub) => {
									const isSelected = formData.subcategory === sub.slug;
									return (
										<button
											key={sub.slug}
											type='button'
											onClick={() => setFormData({ ...formData, subcategory: sub.slug })}
											className={`p-4 rounded-2xl border text-left transition-all ${
												isSelected
													? "bg-accent/20 border-accent ring-2 ring-accent text-white shadow-xl glow-accent"
													: "bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white"
											}`}
										>
											<div className='font-bold text-sm text-white'>{sub.name}</div>
											<div className='text-[11px] font-mono text-accent mt-0.5'>slug: {sub.slug}</div>
											{sub.description && (
												<div className='text-xs text-gray-400 mt-1 line-clamp-2'>{sub.description}</div>
											)}
										</button>
									);
								})}
							</div>
						)}
					</motion.div>
				)}

				{/* ========================================================================= */}
				{/* STEP 3: CATEGORY-SPECIFIC ATTRIBUTES                                     */}
				{/* ========================================================================= */}
				{currentStep === 3 && (
					<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className='space-y-6'>
						<div>
							<h3 className='text-xl sm:text-2xl font-black text-white font-heading uppercase tracking-tight flex items-center gap-2'>
								<Sparkles size={22} className='text-accent' />
								Step 3: {selectedCategoryDoc?.name || "Category"} Specifications
							</h3>
							<p className='text-xs text-gray-400 mt-1'>
								Configurable attributes specific to this fashion line (e.g. Collar Type, Rise, Sole Material).
							</p>
						</div>

						{categoryAttributesList.length === 0 ? (
							<div className='p-8 rounded-2xl bg-gray-950 border border-gray-800 text-center text-gray-400 text-xs'>
								No category-specific attributes configured for this department. Click Next to proceed.
							</div>
						) : (
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
								{categoryAttributesList.map((attr) => {
									const val = formData.categoryAttributes[attr.key] || "";

									return (
										<div key={attr.key} className='bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-2'>
											<div className='flex items-center justify-between'>
												<label className='block text-xs font-bold uppercase tracking-wider text-white'>
													{attr.label} {attr.required && <span className='text-rose-400'>*</span>}
												</label>
												<span className='text-[9px] font-mono text-gray-500 uppercase'>{attr.type}</span>
											</div>

											{/* Select Input */}
											{attr.type === "select" && (
												<select
													value={val}
													onChange={(e) =>
														setFormData({
															...formData,
															categoryAttributes: {
																...formData.categoryAttributes,
																[attr.key]: e.target.value,
															},
														})
													}
													required={attr.required}
													className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-accent'
												>
													<option value=''>Choose {attr.label}...</option>
													{attr.options?.map((opt, oIdx) => (
														<option key={oIdx} value={opt}>
															{opt}
														</option>
													))}
												</select>
											)}

											{/* Multiselect Tags */}
											{attr.type === "multiselect" && (
												<div className='flex flex-wrap gap-1.5 pt-1'>
													{attr.options?.map((opt, oIdx) => {
														const currentList = Array.isArray(val) ? val : [];
														const isChecked = currentList.includes(opt);

														return (
															<button
																key={oIdx}
																type='button'
																onClick={() => {
																	const updated = isChecked
																		? currentList.filter((x) => x !== opt)
																		: [...currentList, opt];
																	setFormData({
																		...formData,
																		categoryAttributes: {
																			...formData.categoryAttributes,
																			[attr.key]: updated,
																		},
																	});
																}}
																className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
																	isChecked
																		? "bg-accent border-accent text-white"
																		: "bg-gray-900 border-gray-800 text-gray-400 hover:text-white"
																}`}
															>
																{opt}
															</button>
														);
													})}
												</div>
											)}

											{/* Text / Measurement / Number Input */}
											{(attr.type === "text" || attr.type === "number" || attr.type === "measurement") && (
												<div className='relative'>
													<input
														type={attr.type === "number" ? "number" : "text"}
														value={val}
														onChange={(e) =>
															setFormData({
																...formData,
																categoryAttributes: {
																	...formData.categoryAttributes,
																	[attr.key]: e.target.value,
																},
															})
														}
														placeholder={`e.g. ${attr.defaultValue || attr.label}`}
														className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-accent'
													/>
													{attr.unit && (
														<span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-mono'>
															{attr.unit}
														</span>
													)}
												</div>
											)}

											{/* Boolean Toggle */}
											{attr.type === "boolean" && (
												<div className='flex items-center gap-3 pt-1'>
													<button
														type='button'
														onClick={() =>
															setFormData({
																...formData,
																categoryAttributes: {
																	...formData.categoryAttributes,
																	[attr.key]: true,
																},
															})
														}
														className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
															val === true
																? "bg-emerald-600 border-emerald-500 text-white"
																: "bg-gray-900 border-gray-800 text-gray-400"
														}`}
													>
														Yes
													</button>
													<button
														type='button'
														onClick={() =>
															setFormData({
																...formData,
																categoryAttributes: {
																	...formData.categoryAttributes,
																	[attr.key]: false,
																},
															})
														}
														className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
															val === false
																? "bg-gray-800 border-gray-700 text-white"
																: "bg-gray-900 border-gray-800 text-gray-400"
														}`}
													>
														No
													</button>
												</div>
											)}
										</div>
									);
								})}
							</div>
						)}
					</motion.div>
				)}

				{/* ========================================================================= */}
				{/* STEP 4: GENERAL PRODUCT INFORMATION & PRICING                            */}
				{/* ========================================================================= */}
				{currentStep === 4 && (
					<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className='space-y-5'>
						<div>
							<h3 className='text-xl sm:text-2xl font-black text-white font-heading uppercase tracking-tight'>
								Step 4: Product Title, Brand & Pricing
							</h3>
							<p className='text-xs text-gray-400 mt-1'>
								Editorial naming, base pricing in Indian Rupees (₹), and catalog copy.
							</p>
						</div>

						<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
							<div className='sm:col-span-2'>
								<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
									Product Title *
								</label>
								<input
									type='text'
									value={formData.name}
									onChange={(e) => {
										const name = e.target.value;
										setFormData({
											...formData,
											name,
											slug: slugify(name),
										});
									}}
									placeholder='e.g. Bespoke Royal Oxford Spread Collar Shirt'
									required
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent'
								/>
							</div>

							<div>
								<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
									Brand / Maison
								</label>
								<input
									type='text'
									value={formData.brand}
									onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
									placeholder='e.g. LUXESTORE Sartorial'
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent'
								/>
							</div>
						</div>

						<div className='grid grid-cols-1 sm:grid-cols-4 gap-4'>
							<div>
								<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
									Base Selling Price (₹) *
								</label>
								<input
									type='number'
									value={formData.price}
									onChange={(e) => setFormData({ ...formData, price: e.target.value })}
									placeholder='2999'
									required
									min='0'
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-accent'
								/>
							</div>

							<div>
								<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
									MRP / Original (₹)
								</label>
								<input
									type='number'
									value={formData.originalPrice}
									onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
									placeholder='3999'
									min='0'
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-accent'
								/>
							</div>

							<div>
								<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
									Master SKU Prefix
								</label>
								<input
									type='text'
									value={formData.sku}
									onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
									placeholder='SH-OXF-001'
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm font-mono uppercase focus:outline-none focus:border-accent'
								/>
							</div>

							<div>
								<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
									Base Inventory Count
								</label>
								<input
									type='number'
									value={formData.stock}
									onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
									min='0'
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-accent'
								/>
							</div>
						</div>

						<div>
							<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
								Short Description (Elevator Pitch)
							</label>
							<input
								type='text'
								value={formData.shortDescription}
								onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
								placeholder='Ultra-luxurious Italian Oxford cotton formal shirt crafted with fine Giza cotton.'
								className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-accent'
							/>
						</div>

						<div>
							<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
								Full Editorial Description *
							</label>
							<textarea
								rows={4}
								value={formData.description}
								onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								placeholder='Crafted from pure organic cotton, this silhouette features meticulous single-needle stitching...'
								required
								className='w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-accent'
							/>
						</div>

						<div>
							<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
								Search Tags (Comma-separated)
							</label>
							<input
								type='text'
								value={formData.tags}
								onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
								placeholder='formal, oxford, spread collar, luxury, wedding, evening'
								className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-accent'
							/>
						</div>
					</motion.div>
				)}

				{/* ========================================================================= */}
				{/* STEP 5: COLOURS, SIZES & VARIANT MATRIX                                  */}
				{/* ========================================================================= */}
				{currentStep === 5 && (
					<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className='space-y-6'>
						<div>
							<h3 className='text-xl sm:text-2xl font-black text-white font-heading uppercase tracking-tight flex items-center gap-2'>
								<Palette size={22} className='text-accent' />
								Step 5: Colorways, Size Systems & Variants Matrix
							</h3>
							<p className='text-xs text-gray-400 mt-1'>
								Configure color options with thumbnail photography and generate exact SKU combinations.
							</p>
						</div>

						{/* 1. Add Colorway Form */}
						<div className='bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-3'>
							<h5 className='text-xs font-bold uppercase tracking-wider text-accent'>
								1. Add Product Colorways
							</h5>
							<div className='grid grid-cols-1 sm:grid-cols-4 gap-3'>
								<div>
									<label className='block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>
										Color Name (e.g. Raw Indigo)
									</label>
									<input
										type='text'
										value={newColorName}
										onChange={(e) => setNewColorName(e.target.value)}
										placeholder='Crisp White'
										className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-accent'
									/>
								</div>
								<div>
									<label className='block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>
										Hex Color Swatch
									</label>
									<div className='flex items-center gap-2'>
										<input
											type='color'
											value={newColorHex}
											onChange={(e) => setNewColorHex(e.target.value)}
											className='w-10 h-9 rounded-lg bg-gray-900 border border-gray-800 cursor-pointer p-0.5'
										/>
										<input
											type='text'
											value={newColorHex}
											onChange={(e) => setNewColorHex(e.target.value)}
											className='flex-1 bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-2 text-white text-xs font-mono uppercase'
										/>
									</div>
								</div>
								<div className='sm:col-span-2'>
									<label className='block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>
										Color Photograph URL / Upload
									</label>
									<div className='flex gap-2'>
										<input
											type='text'
											value={newColorImage}
											onChange={(e) => setNewColorImage(e.target.value)}
											placeholder='https://images.unsplash.com/...'
											className='flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs'
										/>
										<button
											type='button'
											onClick={handleAddColor}
											disabled={!newColorName.trim()}
											className='px-4 py-2 bg-black text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 rounded-xl text-xs font-semibold shrink-0 shadow-sm'
										>
											+ Add Color
										</button>
									</div>
								</div>
							</div>

							{/* Active Colors List */}
							<div className='flex flex-wrap gap-2 pt-2'>
								{formData.colors.map((c, idx) => (
									<div
										key={idx}
										className='flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800'
									>
										{c.image ? (
											<img src={c.image} alt={c.name} className='w-5 h-6 object-cover rounded border border-gray-700' />
										) : (
											<span className='w-4 h-4 rounded-full border border-gray-700' style={{ backgroundColor: c.hex }} />
										)}
										<span className='text-xs font-bold text-white'>{c.name}</span>
										<button
											type='button'
											onClick={() => handleRemoveColor(idx)}
											className='text-gray-500 hover:text-rose-400 ml-1'
										>
											<X size={12} />
										</button>
									</div>
								))}
							</div>
						</div>

						{/* 2. Allowed Sizes Preview */}
						<div className='bg-gray-950 border border-gray-800 rounded-2xl p-4'>
							<div className='flex items-center justify-between mb-2'>
								<h5 className='text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5'>
									<Ruler size={14} /> 2. Allowed Sizes for {selectedCategoryDoc?.name || "Department"}
								</h5>
								<span className='text-[10px] font-mono text-gray-400'>
									System: {selectedCategoryDoc?.sizeSystem?.systemType?.replace("_", " ") || "Apparel Alpha"}
								</span>
							</div>
							<div className='flex flex-wrap gap-2'>
								{allowedSizesList.map((sz, idx) => (
									<span
										key={idx}
										className='px-3 py-1 rounded-lg bg-gray-900 border border-gray-700 text-white text-xs font-mono font-bold'
									>
										{sz}
									</span>
								))}
							</div>
						</div>

						{/* 3. Automatic Variant Matrix Generator Button */}
						<div className='flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-accent/20 via-gray-900 to-gray-950 border border-accent/40 shadow-lg'>
							<div>
								<div className='font-bold text-white text-sm flex items-center gap-1.5'>
									<Sparkles size={16} className='text-accent' />
									One-Click Variant Matrix Generator
								</div>
								<div className='text-xs text-gray-400 mt-0.5'>
									Automatically generate unique SKU combinations of ({formData.colors.length} Colors × {allowedSizesList.length} Sizes) with inventory stock.
								</div>
							</div>
							<button
								type='button'
								onClick={handleGenerateVariantMatrix}
								className='px-5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold text-xs uppercase tracking-wider transition-all shadow-md shrink-0'
							>
								⚡ Generate All Matrix ({formData.colors.length * allowedSizesList.length} Variants)
							</button>
						</div>

						{/* 4. Variants Table */}
						<div>
							<h5 className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2'>
								Purchasable Variants ({formData.variants.length})
							</h5>
							{formData.variants.length === 0 ? (
								<div className='text-center py-8 border border-dashed border-gray-800 rounded-xl text-gray-500 text-xs'>
									No variants created yet. Click "Generate All Matrix" above or add variants manually.
								</div>
							) : (
								<div className='max-h-72 overflow-y-auto rounded-xl border border-gray-800 bg-gray-950'>
									<table className='w-full text-left text-xs'>
										<thead className='bg-gray-900/80 text-gray-400 uppercase font-mono text-[10px] sticky top-0'>
											<tr>
												<th className='p-3'>Color</th>
												<th className='p-3'>Size</th>
												<th className='p-3'>SKU</th>
												<th className='p-3'>Price (₹)</th>
												<th className='p-3'>Stock</th>
												<th className='p-3 text-right'>Action</th>
											</tr>
										</thead>
										<tbody className='divide-y divide-gray-800/60'>
											{formData.variants.map((v, idx) => (
												<tr key={idx} className='hover:bg-gray-900/40'>
													<td className='p-3 flex items-center gap-2'>
														{v.color?.image ? (
															<img src={v.color.image} alt={v.color.name} className='w-5 h-6 object-cover rounded' />
														) : (
															<span className='w-3.5 h-3.5 rounded-full' style={{ backgroundColor: v.color?.hex }} />
														)}
														<span className='font-bold text-white'>{v.color?.name}</span>
													</td>
													<td className='p-3 font-mono font-bold text-accent'>{v.size}</td>
													<td className='p-3 font-mono text-gray-400'>{v.sku}</td>
													<td className='p-3 font-mono text-white'>₹{v.price}</td>
													<td className='p-3 font-mono'>{v.stock}</td>
													<td className='p-3 text-right'>
														<button
															type='button'
															onClick={() => handleRemoveVariant(idx)}
															className='text-gray-500 hover:text-rose-400 p-1'
														>
															<X size={14} />
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</motion.div>
				)}

				{/* ========================================================================= */}
				{/* STEP 6: PHOTOGRAPHS & VIDEOS                                             */}
				{/* ========================================================================= */}
				{currentStep === 6 && (
					<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className='space-y-6'>
						<div>
							<h3 className='text-xl sm:text-2xl font-black text-white font-heading uppercase tracking-tight flex items-center gap-2'>
								<ImageIcon size={22} className='text-accent' />
								Step 6: High-Resolution Imagery & Media
							</h3>
							<p className='text-xs text-gray-400 mt-1'>
								Upload multi-angle photography, color variant images and product runway video.
							</p>
						</div>

						{/* Primary Image */}
						<div className='bg-gray-950 border border-gray-800 rounded-2xl p-5 space-y-3'>
							<h5 className='text-xs font-bold uppercase tracking-wider text-accent'>
								Primary Catalog Cover Image *
							</h5>
							<div className='flex flex-col sm:flex-row items-center gap-4'>
								{formData.image ? (
									<div className='relative w-36 aspect-[3/4] rounded-xl overflow-hidden border border-gray-700 shrink-0 bg-neutral-900'>
										<img src={formData.image} alt='Primary' className='w-full h-full object-cover' />
										<button
											type='button'
											onClick={() => setFormData({ ...formData, image: "" })}
											className='absolute top-1 right-1 p-1 bg-black/80 text-rose-400 rounded-full hover:text-white'
										>
											<X size={12} />
										</button>
									</div>
								) : (
									<div className='w-36 aspect-[3/4] rounded-xl bg-gray-900 border border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-500 shrink-0'>
										<Upload size={24} className='mb-1 text-gray-400' />
										<span className='text-[10px]'>Primary Cover</span>
									</div>
								)}

								<div className='flex-1 space-y-2 w-full'>
									<input
										type='file'
										accept='image/*'
										onChange={handlePrimaryImageUpload}
										className='block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700'
									/>
									<div className='text-[10px] text-gray-500'>Or paste direct primary image URL:</div>
									<input
										type='text'
										value={typeof formData.image === "string" && !formData.image.startsWith("data:") ? formData.image : ""}
										onChange={(e) => setFormData({ ...formData, image: e.target.value })}
										placeholder='https://images.unsplash.com/...'
										className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent'
									/>
								</div>
							</div>
						</div>

						{/* Multi-Angle Gallery */}
						<div className='bg-gray-950 border border-gray-800 rounded-2xl p-5 space-y-3'>
							<h5 className='text-xs font-bold uppercase tracking-wider text-accent'>
								Additional Angles & Gallery Photography ({formData.images.length})
							</h5>
							<input
								type='file'
								multiple
								accept='image/*'
								onChange={handleGalleryUpload}
								className='block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700'
							/>

							<div className='grid grid-cols-3 sm:grid-cols-6 gap-3 pt-2'>
								{formData.images.map((img, idx) => (
									<div
										key={idx}
										className={`relative aspect-[3/4] rounded-xl overflow-hidden border ${
											formData.image === img ? "border-accent ring-2 ring-accent" : "border-gray-800"
										}`}
									>
										<img src={img} alt={`Gallery ${idx}`} className='w-full h-full object-cover' />
										<button
											type='button'
											onClick={() =>
												setFormData({
													...formData,
													images: formData.images.filter((_, i) => i !== idx),
												})
											}
											className='absolute top-1 right-1 p-1 bg-black/80 text-rose-400 rounded-full hover:text-white'
										>
											<X size={10} />
										</button>
										{formData.image !== img && (
											<button
												type='button'
												onClick={() => setFormData({ ...formData, image: img })}
												className='absolute bottom-1 left-1 right-1 py-0.5 bg-black/80 text-[8px] text-white font-mono rounded text-center'
											>
												Set Primary
											</button>
										)}
									</div>
								))}
							</div>
						</div>

						{/* Runway Video Link */}
						<div>
							<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
								Editorial Video Link (Optional)
							</label>
							<input
								type='text'
								value={formData.video}
								onChange={(e) => setFormData({ ...formData, video: e.target.value })}
								placeholder='https://www.youtube.com/watch?v=... or direct MP4 link'
								className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent'
							/>
						</div>
					</motion.div>
				)}

				{/* ========================================================================= */}
				{/* STEP 7: LIVE STOREFRONT PREVIEW                                          */}
				{/* ========================================================================= */}
				{currentStep === 7 && (
					<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className='space-y-6'>
						<div>
							<h3 className='text-xl sm:text-2xl font-black text-white font-heading uppercase tracking-tight flex items-center gap-2'>
								<Eye size={22} className='text-accent' />
								Step 7: Live Storefront Product Card Preview
							</h3>
							<p className='text-xs text-gray-400 mt-1'>
								This is how customers will experience this piece in the LUXESTORE dark luxury storefront.
							</p>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-950 border border-gray-800 rounded-3xl p-6 sm:p-8'>
							{/* Card Representation */}
							<div className='max-w-xs mx-auto w-full'>
								<div className='relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl'>
									<img
										src={formData.image || formData.images[0] || "/placeholder.png"}
										alt={formData.name || "Preview"}
										className='w-full h-full object-cover object-center'
									/>
									<span className='absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black text-white'>
										{formData.isNewArrival ? "NEW ARRIVAL" : formData.category.toUpperCase()}
									</span>
								</div>

								{/* Details Below Card */}
								<div className='mt-3 space-y-1'>
									<div className='text-[10px] font-bold text-accent uppercase tracking-widest'>
										{formData.brand || "LUXESTORE SARTORIAL"}
									</div>
									<div className='text-sm font-bold text-white line-clamp-1'>
										{formData.name || "Untitled Fashion Piece"}
									</div>
									<div className='flex items-baseline gap-2'>
										<span className='text-base font-black text-white font-mono'>
											₹{Number(formData.price || 0).toLocaleString("en-IN")}
										</span>
										{formData.originalPrice && Number(formData.originalPrice) > Number(formData.price) && (
											<span className='text-xs text-gray-500 line-through font-mono'>
												₹{Number(formData.originalPrice).toLocaleString("en-IN")}
											</span>
										)}
									</div>

									{/* Color Thumbnails Preview */}
									<div className='flex items-center gap-1.5 pt-1.5'>
										{formData.colors.slice(0, 4).map((c, idx) => (
											<span
												key={idx}
												className='w-3.5 h-4.5 rounded-[2px] border border-gray-700 overflow-hidden shrink-0 inline-block bg-neutral-900'
												title={c.name}
											>
												{c.image ? (
													<img src={c.image} alt={c.name} className='w-full h-full object-cover' />
												) : (
													<span className='block w-full h-full' style={{ backgroundColor: c.hex }} />
												)}
											</span>
										))}
									</div>
								</div>
							</div>

							{/* Specs & Attributes Summary */}
							<div className='space-y-4'>
								<h4 className='text-sm font-bold uppercase tracking-wider text-white border-b border-gray-800 pb-2'>
									Configured Specifications
								</h4>
								<div className='grid grid-cols-2 gap-3 text-xs'>
									<div>
										<span className='text-gray-500 block text-[10px] uppercase font-mono'>Department</span>
										<span className='text-white font-semibold capitalize'>{formData.category}</span>
									</div>
									<div>
										<span className='text-gray-500 block text-[10px] uppercase font-mono'>Subcategory</span>
										<span className='text-white font-semibold capitalize'>{formData.subcategory || "None"}</span>
									</div>
									<div>
										<span className='text-gray-500 block text-[10px] uppercase font-mono'>Available Colors</span>
										<span className='text-white font-semibold'>{formData.colors.length} Colorways</span>
									</div>
									<div>
										<span className='text-gray-500 block text-[10px] uppercase font-mono'>Purchasable Variants</span>
										<span className='text-white font-semibold'>{formData.variants.length} SKUs</span>
									</div>
								</div>

								{/* Category Attributes List */}
								{Object.keys(formData.categoryAttributes).length > 0 && (
									<div className='pt-3 border-t border-gray-800/80'>
										<span className='text-gray-500 block text-[10px] uppercase font-mono mb-2'>
											Dynamic Attributes
										</span>
										<div className='grid grid-cols-2 gap-2 text-xs'>
											{Object.entries(formData.categoryAttributes).map(([k, v]) => (
												<div key={k} className='bg-gray-900/60 p-2 rounded-lg border border-gray-800/60'>
													<span className='text-gray-500 text-[10px] block font-mono'>{k}</span>
													<span className='text-gray-200 font-medium'>
														{Array.isArray(v) ? v.join(", ") : String(v)}
													</span>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					</motion.div>
				)}

				{/* ========================================================================= */}
				{/* STEP 8: SAVE AS DRAFT OR PUBLISH                                         */}
				{/* ========================================================================= */}
				{currentStep === 8 && (
					<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className='space-y-6'>
						<div>
							<h3 className='text-xl sm:text-2xl font-black text-white font-heading uppercase tracking-tight flex items-center gap-2'>
								<Send size={22} className='text-accent' />
								Step 8: Publication Status & Launch
							</h3>
							<p className='text-xs text-gray-400 mt-1'>
								Choose visibility state, promotional flags and launch to the storefront.
							</p>
						</div>

						{/* Publication Mode Selector */}
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
							<button
								type='button'
								onClick={() => setFormData({ ...formData, status: "active" })}
								className={`p-5 rounded-2xl border text-left transition-all ${
									formData.status === "active"
										? "bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500 text-white shadow-xl"
										: "bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white"
								}`}
							>
								<div className='flex items-center gap-2 font-bold text-sm text-emerald-400'>
									<CheckCircle2 size={18} /> Publish Immediately
								</div>
								<div className='text-xs text-gray-400 mt-1'>
									Make this product instantly visible and purchasable on LUXESTORE.
								</div>
							</button>

							<button
								type='button'
								onClick={() => setFormData({ ...formData, status: "draft" })}
								className={`p-5 rounded-2xl border text-left transition-all ${
									formData.status === "draft"
										? "bg-amber-950/40 border-amber-500 ring-2 ring-amber-500 text-white shadow-xl"
										: "bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white"
								}`}
							>
								<div className='flex items-center gap-2 font-bold text-sm text-amber-400'>
									<AlertCircle size={18} /> Save as Private Draft
								</div>
								<div className='text-xs text-gray-400 mt-1'>
									Save all attributes, photos, and variants without showing on the storefront.
								</div>
							</button>
						</div>

						{/* Promotional Flags */}
						<div className='bg-gray-950 border border-gray-800 rounded-2xl p-5 space-y-4'>
							<h5 className='text-xs font-bold uppercase tracking-wider text-accent'>
								Promotional Showcases & Campaign Flags
							</h5>

							<div className='flex flex-col sm:flex-row gap-6'>
								<label className='flex items-center gap-3 cursor-pointer select-none text-xs text-white'>
									<input
										type='checkbox'
										checked={formData.isFeatured}
										onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
										className='rounded bg-gray-900 border-gray-800 text-accent focus:ring-accent w-4 h-4'
									/>
									<span>Featured Hero Showcase (Featured Carousel)</span>
								</label>

								<label className='flex items-center gap-3 cursor-pointer select-none text-xs text-white'>
									<input
										type='checkbox'
										checked={formData.isNewArrival}
										onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
										className='rounded bg-gray-900 border-gray-800 text-accent focus:ring-accent w-4 h-4'
									/>
									<span>New Arrival Editorial Badge</span>
								</label>
							</div>
						</div>
					</motion.div>
				)}

				{/* Wizard Navigation Footer */}
				<div className='pt-8 border-t border-gray-800/80 mt-8 flex items-center justify-between'>
					<div>
						{currentStep > 1 && (
							<button
								type='button'
								onClick={handlePrevStep}
								className='flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold text-xs transition-colors'
							>
								<ChevronLeft size={16} /> Previous
							</button>
						)}
					</div>

					<div className='flex items-center gap-3'>
						{currentStep < 8 ? (
							<button
								type='button'
								onClick={handleNextStep}
								className='flex items-center gap-2 px-6 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-semibold text-xs uppercase tracking-wider transition-all shadow-md'
							>
								Next Step <ChevronRight size={16} />
							</button>
						) : (
							<button
								type='button'
								onClick={handleSubmit}
								disabled={loading}
								className='flex items-center gap-2 px-8 py-3 rounded-xl bg-black text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 font-black text-xs uppercase tracking-widest transition-all shadow-xl'
							>
								{loading ? <Loader className='animate-spin' size={18} /> : <Check size={18} />}
								{formData.status === "draft" ? "Save Product as Draft" : "Publish to Storefront"}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default CreateProductForm;
