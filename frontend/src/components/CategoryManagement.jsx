import { useState, useEffect } from "react";
import {
	PlusCircle,
	Edit3,
	Trash2,
	FolderPlus,
	Upload,
	X,
	Check,
	Sliders,
	Layers,
	Ruler,
	Tag,
	ArrowUp,
	ArrowDown,
	Search,
	Archive,
	RotateCcw,
	Eye,
	ListPlus,
	HelpCircle,
	Sparkles,
} from "lucide-react";
import { useCategoryStore } from "../stores/useCategoryStore";

const SIZE_SYSTEM_PRESETS = {
	apparel_alpha: {
		label: "Apparel Alpha (XS - XXXL)",
		sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
		hasDimensions: false,
	},
	waist_numeric: {
		label: "Numeric Waist (28 - 40)",
		sizes: ["28", "30", "32", "34", "36", "38", "40"],
		hasDimensions: false,
	},
	footwear_numeric: {
		label: "Footwear UK / India (UK 6 - 12)",
		sizes: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"],
		hasDimensions: false,
	},
	dimensions: {
		label: "Physical Dimensions / Frame",
		sizes: ["Standard", "Compact", "Large"],
		hasDimensions: true,
	},
	one_size: {
		label: "One Size / Universal",
		sizes: ["One Size"],
		hasDimensions: false,
	},
};

const CategoryManagement = () => {
	const {
		categories,
		fetchCategories,
		createCategory,
		updateCategory,
		deleteCategory,
		reorderCategories,
		loading,
	} = useCategoryStore();

	const [searchQuery, setSearchQuery] = useState("");
	const [includeArchived, setIncludeArchived] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [activeModalTab, setActiveModalTab] = useState("general");
	const [editingCategory, setEditingCategory] = useState(null);

	// Form State for Create / Edit
	const [formData, setFormData] = useState({
		name: "",
		slug: "",
		parentCategory: "MEN'S FASHION",
		description: "",
		image: "",
		displayOrder: 0,
		isActive: true,
		isArchived: false,
		subcategories: [],
		attributes: [],
		sizeSystem: {
			systemType: "apparel_alpha",
			allowedSizes: ["XS", "S", "M", "L", "XL", "XXL"],
			hasDimensions: false,
		},
	});

	// Inline subcategory input
	const [newSubName, setNewSubName] = useState("");
	const [newSubDescription, setNewSubDescription] = useState("");

	// Inline attribute input
	const [newAttrLabel, setNewAttrLabel] = useState("");
	const [newAttrKey, setNewAttrKey] = useState("");
	const [newAttrType, setNewAttrType] = useState("select");
	const [newAttrRequired, setNewAttrRequired] = useState(false);
	const [newAttrUnit, setNewAttrUnit] = useState("");
	const [newAttrOptions, setNewAttrOptions] = useState([]);
	const [currentOptionInput, setCurrentOptionInput] = useState("");

	// Custom size tag input
	const [customSizeInput, setCurrentSizeInput] = useState("");

	useEffect(() => {
		fetchCategories(includeArchived);
	}, [fetchCategories, includeArchived]);

	const slugify = (text) =>
		text
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");

	const toCamelCase = (str) =>
		str
			.trim()
			.replace(/[^a-zA-Z0-9 ]/g, "")
			.split(/\s+/)
			.map((word, index) =>
				index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
			)
			.join("");

	const openCreateModal = () => {
		setEditingCategory(null);
		setActiveModalTab("general");
		setFormData({
			name: "",
			slug: "",
			parentCategory: "MEN'S FASHION",
			description: "",
			image: "",
			displayOrder: (categories.length || 0) + 1,
			isActive: true,
			isArchived: false,
			subcategories: [],
			attributes: [],
			sizeSystem: {
				systemType: "apparel_alpha",
				allowedSizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
				hasDimensions: false,
			},
		});
		setIsModalOpen(true);
	};

	const openEditModal = (cat) => {
		setEditingCategory(cat);
		setActiveModalTab("general");
		setFormData({
			name: cat.name,
			slug: cat.slug,
			parentCategory: cat.parentCategory || "MEN'S FASHION",
			description: cat.description || "",
			image: cat.imageUrl || "",
			displayOrder: cat.displayOrder || 0,
			isActive: cat.isActive !== undefined ? cat.isActive : true,
			isArchived: cat.isArchived || false,
			subcategories: Array.isArray(cat.subcategories) ? [...cat.subcategories] : [],
			attributes: Array.isArray(cat.attributes) ? [...cat.attributes] : [],
			sizeSystem: cat.sizeSystem || {
				systemType: "apparel_alpha",
				allowedSizes: ["XS", "S", "M", "L", "XL", "XXL"],
				hasDimensions: false,
			},
		});
		setIsModalOpen(true);
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setFormData({ ...formData, image: reader.result });
			};
			reader.readAsDataURL(file);
		}
	};

	// Subcategory operations in modal
	const handleAddSubcategory = () => {
		if (!newSubName.trim()) return;
		const cleanSlug = slugify(newSubName);
		if (formData.subcategories.some((s) => s.slug === cleanSlug)) {
			alert("A subcategory with this name/slug already exists in this category.");
			return;
		}
		setFormData({
			...formData,
			subcategories: [
				...formData.subcategories,
				{
					name: newSubName.trim(),
					slug: cleanSlug,
					description: newSubDescription.trim(),
					displayOrder: formData.subcategories.length + 1,
					isActive: true,
				},
			],
		});
		setNewSubName("");
		setNewSubDescription("");
	};

	const handleRemoveSubcategory = (index) => {
		setFormData({
			...formData,
			subcategories: formData.subcategories.filter((_, idx) => idx !== index),
		});
	};

	// Attribute operations in modal
	const handleAddOptionToAttr = () => {
		if (!currentOptionInput.trim()) return;
		if (!newAttrOptions.includes(currentOptionInput.trim())) {
			setNewAttrOptions([...newAttrOptions, currentOptionInput.trim()]);
		}
		setCurrentOptionInput("");
	};

	const handleRemoveOptionFromAttr = (optIndex) => {
		setNewAttrOptions(newAttrOptions.filter((_, idx) => idx !== optIndex));
	};

	const handleAddAttribute = () => {
		if (!newAttrLabel.trim()) return;
		const cleanKey = newAttrKey.trim() || toCamelCase(newAttrLabel);

		if (formData.attributes.some((a) => a.key === cleanKey)) {
			alert(`An attribute with key "${cleanKey}" already exists.`);
			return;
		}

		setFormData({
			...formData,
			attributes: [
				...formData.attributes,
				{
					key: cleanKey,
					label: newAttrLabel.trim(),
					type: newAttrType,
					required: newAttrRequired,
					unit: newAttrUnit.trim(),
					options: [...newAttrOptions],
					defaultValue: "",
				},
			],
		});

		setNewAttrLabel("");
		setNewAttrKey("");
		setNewAttrType("select");
		setNewAttrRequired(false);
		setNewAttrUnit("");
		setNewAttrOptions([]);
		setCurrentOptionInput("");
	};

	const handleRemoveAttribute = (attrIndex) => {
		setFormData({
			...formData,
			attributes: formData.attributes.filter((_, idx) => idx !== attrIndex),
		});
	};

	// Sizing system change
	const handleSizeSystemChange = (type) => {
		const preset = SIZE_SYSTEM_PRESETS[type];
		if (preset) {
			setFormData({
				...formData,
				sizeSystem: {
					systemType: type,
					allowedSizes: [...preset.sizes],
					hasDimensions: preset.hasDimensions,
				},
			});
		}
	};

	const handleAddCustomSize = () => {
		if (!customSizeInput.trim()) return;
		const size = customSizeInput.trim().toUpperCase();
		if (!formData.sizeSystem.allowedSizes.includes(size)) {
			setFormData({
				...formData,
				sizeSystem: {
					...formData.sizeSystem,
					allowedSizes: [...formData.sizeSystem.allowedSizes, size],
				},
			});
		}
		setCurrentSizeInput("");
	};

	const handleRemoveCustomSize = (sizeToRemove) => {
		setFormData({
			...formData,
			sizeSystem: {
				...formData.sizeSystem,
				allowedSizes: formData.sizeSystem.allowedSizes.filter((s) => s !== sizeToRemove),
			},
		});
	};

	// Submit Modal
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!formData.name.trim()) return;

		try {
			if (editingCategory) {
				await updateCategory(editingCategory._id, formData);
			} else {
				await createCategory(formData);
			}
			setIsModalOpen(false);
		} catch (err) {
			console.error("Save category error:", err);
		}
	};

	const handleDelete = async (cat) => {
		if (
			window.confirm(
				`Are you sure you want to delete or archive category "${cat.name}"?\n(If products exist, it will be safely archived without deleting your products.)`
			)
		) {
			await deleteCategory(cat._id);
		}
	};

	// Reorder sequence up/down
	const handleMove = async (index, direction) => {
		const newIndex = direction === "up" ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= categories.length) return;

		const reordered = [...categories];
		const temp = reordered[index];
		reordered[index] = reordered[newIndex];
		reordered[newIndex] = temp;

		const payload = reordered.map((cat, idx) => ({
			id: cat._id,
			displayOrder: idx + 1,
		}));

		await reorderCategories(payload);
	};

	// Filter categories by search
	const filteredCategories = categories.filter((cat) => {
		const q = searchQuery.toLowerCase().trim();
		if (!q) return true;
		return (
			cat.name.toLowerCase().includes(q) ||
			cat.slug.toLowerCase().includes(q) ||
			(cat.subcategories && cat.subcategories.some((s) => s.name.toLowerCase().includes(q)))
		);
	});

	return (
		<div className='max-w-7xl mx-auto'>
			{/* Header */}
			<div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md shadow-xl'>
				<div>
					<div className='flex items-center gap-2.5'>
						<div className='p-2 rounded-xl bg-accent/20 text-accent border border-accent/30'>
							<Layers size={22} />
						</div>
						<h3 className='text-2xl font-black text-white font-heading uppercase tracking-tight'>
							Department & Category Management
						</h3>
					</div>
					<p className='text-xs text-gray-400 mt-1 max-w-2xl'>
						Design fashion taxonomy, configure subcategories, custom product attributes & category-specific sizing systems. Changes instantly synchronize across storefront filters and the product creator.
					</p>
				</div>
				<div className='flex items-center gap-3 w-full md:w-auto'>
					<button
						type='button'
						onClick={openCreateModal}
						className='flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-semibold text-xs uppercase tracking-wider transition-all shadow-md'
					>
						<PlusCircle size={16} /> Add New Category
					</button>
				</div>
			</div>

			{/* Filter Toolbar */}
			<div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 bg-gray-900/40 border border-gray-800/80 rounded-xl p-4'>
				<div className='relative flex-1 max-w-md'>
					<Search className='absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400' size={16} />
					<input
						type='text'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder='Search categories, subcategories, or slugs...'
						className='w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent'
					/>
				</div>

				<div className='flex items-center gap-4 text-xs text-gray-400'>
					<label className='flex items-center gap-2 cursor-pointer select-none'>
						<input
							type='checkbox'
							checked={includeArchived}
							onChange={(e) => setIncludeArchived(e.target.checked)}
							className='rounded bg-gray-950 border-gray-800 text-accent focus:ring-accent'
						/>
						<span>Show Archived Categories</span>
					</label>
					<span className='text-gray-600'>|</span>
					<span className='font-mono text-gray-300'>{filteredCategories.length} Departments Configured</span>
				</div>
			</div>

			{/* Categories Grid */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{filteredCategories.map((cat, idx) => {
					const isArchived = cat.isArchived;
					const isActive = cat.isActive && !isArchived;

					return (
						<div
							key={cat._id}
							className={`group relative bg-gray-900/70 border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-xl ${
								isArchived
									? "border-rose-900/40 opacity-75"
									: isActive
									? "border-gray-800 hover:border-neutral-600"
									: "border-amber-900/40"
							}`}
						>
							{/* Top Image Banner */}
							<div className='relative h-44 bg-gray-950 overflow-hidden'>
								<img
									src={cat.imageUrl || "/placeholder.png"}
									alt={cat.name}
									className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
								/>
								<div className='absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent' />

								{/* Order Badge & Reorder Controls */}
								<div className='absolute top-3 left-3 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg border border-neutral-700 text-xs font-mono text-white'>
									<span className='font-bold text-amber-400'>#{cat.displayOrder || idx + 1}</span>
									<button
										onClick={() => handleMove(idx, "up")}
										disabled={idx === 0}
										className='p-0.5 text-gray-300 hover:text-white disabled:opacity-30'
										title='Move up in display order'
									>
										<ArrowUp size={12} />
									</button>
									<button
										onClick={() => handleMove(idx, "down")}
										disabled={idx === categories.length - 1}
										className='p-0.5 text-gray-300 hover:text-white disabled:opacity-30'
										title='Move down in display order'
									>
										<ArrowDown size={12} />
									</button>
								</div>

								{/* Status Badge */}
								<div className='absolute top-3 right-3 flex items-center gap-1.5'>
									{isArchived ? (
										<span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 uppercase tracking-wider'>
											Archived
										</span>
									) : isActive ? (
										<span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase tracking-wider'>
											Active
										</span>
									) : (
										<span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 uppercase tracking-wider'>
											Inactive
										</span>
									)}
								</div>

								{/* Category Title Overlay */}
								<div className='absolute bottom-3 left-4 right-4 flex items-end justify-between'>
									<div>
										<span className='text-[10px] font-bold uppercase tracking-widest text-amber-400'>
											{cat.parentCategory || "MEN'S FASHION"}
										</span>
										<h4 className='text-lg font-black text-white font-heading uppercase tracking-tight drop-shadow'>
											{cat.name}
										</h4>
										<span className='text-[11px] font-mono text-gray-200'>/category/{cat.slug}</span>
									</div>
									<div className='text-right'>
										<span className='inline-block px-2 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-gray-800 text-xs font-bold text-white shadow-md'>
											{cat.itemCount || 0} Products
										</span>
									</div>
								</div>
							</div>

							{/* Card Body & Specs */}
							<div className='p-5 flex flex-col justify-between flex-1 gap-4'>
								<p className='text-xs text-gray-400 line-clamp-2 leading-relaxed'>
									{cat.description || "No editorial description configured for this department."}
								</p>

								{/* Subcategories preview chips */}
								<div>
									<div className='text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center justify-between'>
										<span>Subcategories ({cat.subcategories?.length || 0})</span>
									</div>
									<div className='flex flex-wrap gap-1.5'>
										{cat.subcategories && cat.subcategories.length > 0 ? (
											<>
												{cat.subcategories.slice(0, 3).map((sub, sIdx) => (
													<span
														key={sIdx}
														className='px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200 text-[10px] font-medium'
													>
														{sub.name}
													</span>
												))}
												{cat.subcategories.length > 3 && (
													<span className='px-1.5 py-0.5 text-[10px] text-neutral-800 dark:text-accent font-mono font-bold'>
														+{cat.subcategories.length - 3} more
													</span>
												)}
											</>
										) : (
											<span className='text-[11px] text-gray-600 italic'>None configured</span>
										)}
									</div>
								</div>

								{/* Attributes & Size System Summary */}
								<div className='pt-3 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400'>
									<div className='flex items-center gap-1.5'>
										<Sliders size={13} className='text-accent' />
										<span>{cat.attributes?.length || 0} Attributes</span>
									</div>
									<div className='flex items-center gap-1.5 font-mono text-gray-300'>
										<Ruler size={13} className='text-accent' />
										<span className='capitalize'>
											{cat.sizeSystem?.systemType?.replace("_", " ") || "Apparel Alpha"}
										</span>
									</div>
								</div>

								{/* Action Buttons */}
								<div className='pt-3 border-t border-gray-800/80 flex items-center justify-end gap-2'>
									<button
										onClick={() => openEditModal(cat)}
										className='flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold transition-colors'
									>
										<Edit3 size={13} /> Edit Department
									</button>
									<button
										onClick={() => handleDelete(cat)}
										className='p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/50 text-rose-400 hover:text-rose-200 transition-colors'
										title={isArchived ? "Delete permanently" : "Archive Category"}
									>
										<Trash2 size={13} />
									</button>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* ========================================================================= */}
			{/* MODAL: Full Category, Subcategory, Attributes & Size System Configurator   */}
			{/* ========================================================================= */}
			{isModalOpen && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto'>
					<div className='relative w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-auto max-h-[92vh] overflow-y-auto flex flex-col'>
						{/* Modal Header */}
						<div className='flex items-center justify-between pb-4 border-b border-gray-800 mb-6'>
							<div className='flex items-center gap-3'>
								<div className='p-2 rounded-xl bg-accent text-white'>
									<FolderPlus size={20} />
								</div>
								<div>
									<h3 className='text-xl sm:text-2xl font-bold text-white font-heading'>
										{editingCategory ? `Configure Department: ${editingCategory.name}` : "Create New Fashion Department"}
									</h3>
									<p className='text-xs text-gray-400 mt-0.5'>
										Configure URL routing, subcategories, product attribute schemas & sizing models.
									</p>
								</div>
							</div>
							<button
								type='button'
								onClick={() => setIsModalOpen(false)}
								className='p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors'
							>
								<X size={20} />
							</button>
						</div>

						{/* Modal Navigation Tabs */}
						<div className='flex flex-wrap items-center gap-2 mb-6 border-b border-gray-800/80 pb-3'>
							{[
								{ id: "general", label: "1. Department Info", icon: Layers },
								{ id: "subcategories", label: `2. Subcategories (${formData.subcategories?.length || 0})`, icon: ListPlus },
								{ id: "attributes", label: `3. Product Attributes (${formData.attributes?.length || 0})`, icon: Sliders },
								{ id: "sizes", label: "4. Sizing System", icon: Ruler },
							].map((tab) => (
								<button
									key={tab.id}
									type='button'
									onClick={() => setActiveModalTab(tab.id)}
									className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
										activeModalTab === tab.id
											? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold shadow-md"
											: "bg-gray-950 text-gray-400 hover:text-white hover:bg-gray-800"
									}`}
								>
									<tab.icon size={14} />
									{tab.label}
								</button>
							))}
						</div>

						{/* Form Body */}
						<form onSubmit={handleSubmit} className='flex-1 flex flex-col justify-between'>
							{/* TAB 1: GENERAL INFO */}
							{activeModalTab === "general" && (
								<div className='space-y-5 animate-in fade-in'>
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
										<div>
											<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
												Category / Department Name *
											</label>
											<input
												type='text'
												value={formData.name}
												onChange={(e) => {
													const name = e.target.value;
													const slug = slugify(name);
													setFormData({
														...formData,
														name,
														slug: editingCategory ? formData.slug : slug,
													});
												}}
												placeholder='e.g. Shirts, Knitwear, Formalwear'
												required
												className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent'
											/>
										</div>

										<div>
											<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
												URL Slug *
											</label>
											<input
												type='text'
												value={formData.slug}
												onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
												placeholder='e.g. shirts, knitwear'
												required
												className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-accent'
											/>
										</div>
									</div>

									<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
										<div>
											<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
												Parent Department
											</label>
											<input
												type='text'
												value={formData.parentCategory}
												onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
												placeholder="MEN'S FASHION"
												className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent'
											/>
										</div>

										<div>
											<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
												Display Order Sequence
											</label>
											<input
												type='number'
												value={formData.displayOrder}
												onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
												min='0'
												className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent'
											/>
										</div>

										<div>
											<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
												Publication Status
											</label>
											<select
												value={formData.isArchived ? "archived" : formData.isActive ? "active" : "inactive"}
												onChange={(e) => {
													const val = e.target.value;
													setFormData({
														...formData,
														isActive: val === "active",
														isArchived: val === "archived",
													});
												}}
												className='w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent'
											>
												<option value='active'>Active (Published to Storefront)</option>
												<option value='inactive'>Inactive (Hidden from Menu)</option>
												<option value='archived'>Archived (Read-Only)</option>
											</select>
										</div>
									</div>

									<div>
										<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1'>
											Department Editorial Description
										</label>
										<textarea
											rows={3}
											value={formData.description}
											onChange={(e) => setFormData({ ...formData, description: e.target.value })}
											placeholder='Describe this fashion line, fabric philosophy and style details...'
											className='w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-accent'
										/>
									</div>

									{/* Category Hero Image */}
									<div>
										<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5'>
											Category Hero Image (High Resolution)
										</label>
										<div className='flex flex-col sm:flex-row items-center gap-4 bg-gray-950 border border-gray-800 rounded-2xl p-4'>
											{formData.image ? (
												<div className='relative w-32 h-32 rounded-xl overflow-hidden border border-gray-700 shrink-0'>
													<img src={formData.image} alt='Preview' className='w-full h-full object-cover' />
													<button
														type='button'
														onClick={() => setFormData({ ...formData, image: "" })}
														className='absolute top-1 right-1 p-1 bg-black/80 text-rose-400 rounded-full hover:text-white'
													>
														<X size={12} />
													</button>
												</div>
											) : (
												<div className='w-32 h-32 rounded-xl bg-gray-900 border border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-500 shrink-0'>
													<Upload size={24} className='mb-1' />
													<span className='text-[10px]'>No image</span>
												</div>
											)}
											<div className='flex-1 space-y-2 w-full'>
												<input
													type='file'
													accept='image/*'
													onChange={handleImageChange}
													className='block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700'
												/>
												<div className='text-[10px] text-gray-500'>Or paste direct image asset URL:</div>
												<input
													type='text'
													value={typeof formData.image === "string" && !formData.image.startsWith("data:") ? formData.image : ""}
													onChange={(e) => setFormData({ ...formData, image: e.target.value })}
													placeholder='https://images.unsplash.com/...'
													className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent'
												/>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* TAB 2: SUBCATEGORIES */}
							{activeModalTab === "subcategories" && (
								<div className='space-y-6 animate-in fade-in'>
									{/* Add Subcategory Row */}
									<div className='bg-gray-950 border border-gray-800 rounded-2xl p-4'>
										<h5 className='text-xs font-bold uppercase tracking-wider text-accent mb-3 flex items-center gap-1.5'>
											<PlusCircle size={14} /> Add Subcategory to {formData.name || "Category"}
										</h5>
										<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3'>
											<input
												type='text'
												value={newSubName}
												onChange={(e) => setNewSubName(e.target.value)}
												placeholder='Subcategory name (e.g. Formal Shirts, Chinos)'
												className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-accent'
											/>
											<input
												type='text'
												value={newSubDescription}
												onChange={(e) => setNewSubDescription(e.target.value)}
												placeholder='Editorial description (optional)'
												className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-accent'
											/>
										</div>
										<button
											type='button'
											onClick={handleAddSubcategory}
											disabled={!newSubName.trim()}
											className='px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 font-semibold text-xs transition-all shadow-sm'
										>
											+ Add Subcategory
										</button>
									</div>

									{/* Existing Subcategories List */}
									<div>
										<h5 className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2'>
											Configured Subcategories ({formData.subcategories.length})
										</h5>
										{formData.subcategories.length === 0 ? (
											<div className='text-center py-8 border border-dashed border-gray-800 rounded-xl text-gray-500 text-xs'>
												No subcategories yet. Products will be grouped under the parent department directly.
											</div>
										) : (
											<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
												{formData.subcategories.map((sub, idx) => (
													<div
														key={idx}
														className='flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800 group hover:border-gray-700'
													>
														<div>
															<div className='font-bold text-white text-xs'>{sub.name}</div>
															<div className='text-[10px] font-mono text-accent'>slug: {sub.slug}</div>
															{sub.description && (
																<div className='text-[10px] text-gray-500 mt-0.5'>{sub.description}</div>
															)}
														</div>
														<button
															type='button'
															onClick={() => handleRemoveSubcategory(idx)}
															className='p-1.5 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors'
														>
															<X size={14} />
														</button>
													</div>
												))}
											</div>
										)}
									</div>
								</div>
							)}

							{/* TAB 3: PRODUCT ATTRIBUTES BUILDER */}
							{activeModalTab === "attributes" && (
								<div className='space-y-6 animate-in fade-in'>
									{/* Attribute Creator Card */}
									<div className='bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-3'>
										<h5 className='text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5'>
											<Sparkles size={14} /> Define Category-Specific Product Attribute
										</h5>
										<p className='text-[11px] text-gray-400'>
											These fields will dynamically appear in the "Add Product" form when this category is selected (e.g. Collar Type, Sole Material, Laptop Compartment).
										</p>

										<div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
											<div>
												<label className='block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>
													Attribute Label *
												</label>
												<input
													type='text'
													value={newAttrLabel}
													onChange={(e) => {
														setNewAttrLabel(e.target.value);
														if (!newAttrKey) setNewAttrKey(toCamelCase(e.target.value));
													}}
													placeholder='e.g. Collar Type, Fabric'
													className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-accent'
												/>
											</div>

											<div>
												<label className='block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>
													Attribute Key (Schema Identifier)
												</label>
												<input
													type='text'
													value={newAttrKey}
													onChange={(e) => setNewAttrKey(e.target.value)}
													placeholder='e.g. collarType, fabric'
													className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-accent'
												/>
											</div>

											<div>
												<label className='block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>
													Field Input Type
												</label>
												<select
													value={newAttrType}
													onChange={(e) => setNewAttrType(e.target.value)}
													className='w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-accent capitalize'
												>
													<option value='select'>Single Select (Dropdown)</option>
													<option value='multiselect'>Multi-Select (Tags)</option>
													<option value='text'>Free Text</option>
													<option value='number'>Numeric</option>
													<option value='measurement'>Measurement (with Unit)</option>
													<option value='boolean'>Yes / No (Boolean)</option>
												</select>
											</div>
										</div>

										{/* Measurement Unit if applicable */}
										{newAttrType === "measurement" && (
											<div>
												<label className='block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>
													Measurement Unit
												</label>
												<input
													type='text'
													value={newAttrUnit}
													onChange={(e) => setNewAttrUnit(e.target.value)}
													placeholder='e.g. cm, mm, in, Litres, grams'
													className='w-full sm:w-1/3 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-accent'
												/>
											</div>
										)}

										{/* Allowed Options for Select / Multiselect */}
										{(newAttrType === "select" || newAttrType === "multiselect" || newAttrType === "measurement") && (
											<div>
												<label className='block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>
													Allowed Option Choices (Type and press Enter)
												</label>
												<div className='flex gap-2 mb-2'>
													<input
														type='text'
														value={currentOptionInput}
														onChange={(e) => setCurrentOptionInput(e.target.value)}
														onKeyDown={(e) => {
															if (e.key === "Enter") {
																e.preventDefault();
																handleAddOptionToAttr();
															}
														}}
														placeholder='e.g. Classic Collar, Mandarin, Spread Collar'
														className='flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-accent'
													/>
													<button
														type='button'
														onClick={handleAddOptionToAttr}
														className='px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold'
													>
														Add Option
													</button>
												</div>

												{/* Options Chips */}
												<div className='flex flex-wrap gap-1.5 min-h-6'>
													{newAttrOptions.map((opt, oIdx) => (
														<span
															key={oIdx}
															className='flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent/20 border border-accent/40 text-white text-xs'
														>
															{opt}
															<button
																type='button'
																onClick={() => handleRemoveOptionFromAttr(oIdx)}
																className='text-accent hover:text-white'
															>
																<X size={12} />
															</button>
														</span>
													))}
												</div>
											</div>
										)}

										<div className='flex items-center justify-between pt-2'>
											<label className='flex items-center gap-2 cursor-pointer select-none text-xs text-gray-300'>
												<input
													type='checkbox'
													checked={newAttrRequired}
													onChange={(e) => setNewAttrRequired(e.target.checked)}
													className='rounded bg-gray-900 border-gray-800 text-accent focus:ring-accent'
												/>
												<span>Mandatory during product creation (Required)</span>
											</label>

											<button
												type='button'
												onClick={handleAddAttribute}
												disabled={!newAttrLabel.trim()}
												className='px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 font-semibold text-xs transition-all shadow-sm'
											>
												+ Add Attribute
											</button>
										</div>
									</div>

									{/* Existing Attributes Table */}
									<div>
										<h5 className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2'>
											Configured Attributes for {formData.name || "This Category"} ({formData.attributes.length})
										</h5>
										{formData.attributes.length === 0 ? (
											<div className='text-center py-8 border border-dashed border-gray-800 rounded-xl text-gray-500 text-xs'>
												No custom attributes defined yet.
											</div>
										) : (
											<div className='space-y-2'>
												{formData.attributes.map((attr, idx) => (
													<div
														key={idx}
														className='flex items-center justify-between p-3.5 rounded-xl bg-gray-950 border border-gray-800 group hover:border-gray-700'
													>
														<div className='space-y-1'>
															<div className='flex items-center gap-2'>
																<span className='font-bold text-white text-xs'>{attr.label}</span>
																<span className='px-1.5 py-0.5 rounded text-[9px] font-mono bg-gray-800 text-accent uppercase'>
																	{attr.type}
																</span>
																{attr.required && (
																	<span className='px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-300 uppercase'>
																		Required
																	</span>
																)}
															</div>
															<div className='text-[10px] font-mono text-gray-500'>key: {attr.key}</div>
															{attr.options && attr.options.length > 0 && (
																<div className='text-[10px] text-gray-400'>
																	Choices ({attr.options.length}): {attr.options.join(", ")}
																</div>
															)}
														</div>
														<button
															type='button'
															onClick={() => handleRemoveAttribute(idx)}
															className='p-1.5 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors'
														>
															<X size={14} />
														</button>
													</div>
												))}
											</div>
										)}
									</div>
								</div>
							)}

							{/* TAB 4: SIZING SYSTEM */}
							{activeModalTab === "sizes" && (
								<div className='space-y-6 animate-in fade-in'>
									<div>
										<label className='block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2'>
											Select Category Sizing Model
										</label>
										<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
											{Object.entries(SIZE_SYSTEM_PRESETS).map(([key, val]) => (
												<button
													key={key}
													type='button'
													onClick={() => handleSizeSystemChange(key)}
													className={`p-3.5 rounded-2xl border text-left transition-all ${
														formData.sizeSystem.systemType === key
															? "bg-accent/15 border-accent text-white shadow-lg"
															: "bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white"
													}`}
												>
													<div className='font-bold text-xs'>{val.label}</div>
													<div className='text-[10px] text-gray-500 mt-1 line-clamp-1'>
														{val.sizes.join(", ")}
													</div>
												</button>
											))}
										</div>
									</div>

									{/* Allowed Sizes Tag Manager */}
									<div className='bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-3'>
										<h5 className='text-xs font-bold uppercase tracking-wider text-accent'>
											Available Sizing Matrix
										</h5>
										<p className='text-[11px] text-gray-400'>
											These are the sizes available when creating product variants under this department.
										</p>

										<div className='flex gap-2'>
											<input
												type='text'
												value={customSizeInput}
												onChange={(e) => setCurrentSizeInput(e.target.value)}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														handleAddCustomSize();
													}
												}}
												placeholder='Add custom size (e.g. 42, XXL, UK 11.5)'
												className='flex-1 sm:w-1/3 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-accent'
											/>
											<button
												type='button'
												onClick={handleAddCustomSize}
												className='px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold'
											>
												+ Add Size
											</button>
										</div>

										<div className='flex flex-wrap gap-2 pt-2'>
											{formData.sizeSystem.allowedSizes.map((sz, sIdx) => (
												<span
													key={sIdx}
													className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-white text-xs font-mono font-bold'
												>
													{sz}
													<button
														type='button'
														onClick={() => handleRemoveCustomSize(sz)}
														className='text-gray-400 hover:text-rose-400'
													>
														<X size={12} />
													</button>
												</span>
											))}
										</div>
									</div>
								</div>
							)}

							{/* Modal Footer Controls */}
							<div className='pt-6 border-t border-gray-800 mt-8 flex items-center justify-between'>
								<div className='text-xs text-gray-400 font-mono'>
									Department: <span className='text-white font-bold'>{formData.name || "Untitled"}</span>
								</div>
								<div className='flex items-center gap-3'>
									<button
										type='button'
										onClick={() => setIsModalOpen(false)}
										className='px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold text-xs transition-colors'
									>
										Cancel
									</button>
									<button
										type='submit'
										disabled={loading || !formData.name.trim()}
										className='px-6 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2'
									>
										<Check size={16} />
										{editingCategory ? "Save Changes" : "Create Department"}
									</button>
								</div>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default CategoryManagement;
