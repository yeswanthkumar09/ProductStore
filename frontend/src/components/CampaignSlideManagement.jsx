import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useCampaignSlideStore } from "../stores/useCampaignSlideStore";
import {
	Plus,
	Edit2,
	Trash2,
	Power,
	Image as ImageIcon,
	Upload,
	Link2,
	X,
	Check,
	AlertCircle,
	ArrowRight,
	Smartphone,
	Monitor,
	Loader2,
	Calendar,
	RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

const validateFile = (file) => {
	if (!file) return { valid: false, error: "No file selected." };
	if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
		return {
			valid: false,
			error: "Invalid file format. Only JPEG, PNG, and WebP images are permitted.",
		};
	}
	if (file.size > MAX_FILE_SIZE_BYTES) {
		const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
		return {
			valid: false,
			error: `File size (${sizeMB} MB) exceeds maximum allowed limit of 10 MB.`,
		};
	}
	return { valid: true };
};

const validateDirectUrl = (rawUrl) => {
	if (!rawUrl || !rawUrl.trim()) {
		return { valid: false, error: "Image URL cannot be empty." };
	}
	try {
		const parsed = new URL(rawUrl.trim());
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			return { valid: false, error: "Only HTTP and HTTPS image URLs are permitted." };
		}
		const host = parsed.hostname.toLowerCase();
		if (
			host === "localhost" ||
			host === "127.0.0.1" ||
			host === "0.0.0.0" ||
			host === "::1" ||
			host.startsWith("10.") ||
			host.startsWith("192.168.") ||
			host.startsWith("169.254.") ||
			host.endsWith(".internal") ||
			host.endsWith(".local") ||
			/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
		) {
			return { valid: false, error: "Localhost and private internal network URLs are prohibited." };
		}
		if (host === "unsplash.com" && parsed.pathname.startsWith("/photos")) {
			return {
				valid: false,
				error: "Unsplash webpage URLs are not direct images. Please provide a direct image link (e.g. from https://images.unsplash.com/...) or upload the image directly from your computer.",
			};
		}
		return { valid: true };
	} catch (e) {
		return { valid: false, error: "Please enter a valid URL." };
	}
};

const CampaignSlideManagement = () => {
	const {
		allSlides,
		fetchAllSlidesAdmin,
		createSlide,
		updateSlide,
		deleteSlide,
		toggleSlide,
		loading,
	} = useCampaignSlideStore();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSlide, setEditingSlide] = useState(null);

	// Form text fields
	const [formData, setFormData] = useState({
		badge: "",
		leftHeadline: "",
		leftSubheadline: "",
		rightHeadline: "",
		rightSubheadline: "",
		ctaText: "",
		ctaLink: "",
		image: "",
		mobileImage: "",
		bgColor: "bg-neutral-950",
		textColor: "text-white",
		displayOrder: 1,
		isActive: true,
		startDate: "",
		endDate: "",
	});

	// Desktop image upload state
	const [desktopMode, setDesktopMode] = useState("upload"); // 'upload' | 'url'
	const [desktopPreview, setDesktopPreview] = useState("");
	const [desktopFileName, setDesktopFileName] = useState("");
	const [desktopUrlInput, setDesktopUrlInput] = useState("");
	const [desktopError, setDesktopError] = useState("");
	const desktopFileInputRef = useRef(null);

	// Mobile image upload state (optional)
	const [mobileMode, setMobileMode] = useState("upload"); // 'upload' | 'url'
	const [mobilePreview, setMobilePreview] = useState("");
	const [mobileFileName, setMobileFileName] = useState("");
	const [mobileUrlInput, setMobileUrlInput] = useState("");
	const [mobileError, setMobileError] = useState("");
	const mobileFileInputRef = useRef(null);

	useEffect(() => {
		fetchAllSlidesAdmin();
	}, [fetchAllSlidesAdmin]);

	// Prevent background scroll and handle Escape key when modal is open
	useEffect(() => {
		if (!isModalOpen) return;

		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				setIsModalOpen(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			document.body.style.overflow = originalOverflow;
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isModalOpen]);

	const handleOpenCreate = () => {
		setEditingSlide(null);
		setFormData({
			badge: "",
			leftHeadline: "",
			leftSubheadline: "",
			rightHeadline: "",
			rightSubheadline: "",
			ctaText: "",
			ctaLink: "",
			image: "",
			mobileImage: "",
			bgColor: "bg-neutral-950",
			textColor: "text-white",
			displayOrder: (allSlides.length || 0) + 1,
			isActive: true,
			startDate: "",
			endDate: "",
		});
		setDesktopMode("upload");
		setDesktopPreview("");
		setDesktopFileName("");
		setDesktopUrlInput("");
		setDesktopError("");

		setMobileMode("upload");
		setMobilePreview("");
		setMobileFileName("");
		setMobileUrlInput("");
		setMobileError("");

		setIsModalOpen(true);
	};

	const handleOpenEdit = (slide) => {
		setEditingSlide(slide);
		setFormData({
			badge: slide.badge || "",
			leftHeadline: slide.leftHeadline || "",
			leftSubheadline: slide.leftSubheadline || "",
			rightHeadline: slide.rightHeadline || "",
			rightSubheadline: slide.rightSubheadline || "",
			ctaText: slide.ctaText || "",
			ctaLink: slide.ctaLink || "",
			image: slide.image || "",
			mobileImage: slide.mobileImage || "",
			bgColor: slide.bgColor || "bg-neutral-950",
			textColor: slide.textColor || "text-white",
			displayOrder: slide.displayOrder ?? 1,
			isActive: slide.isActive ?? true,
			startDate: slide.startDate ? new Date(slide.startDate).toISOString().slice(0, 16) : "",
			endDate: slide.endDate ? new Date(slide.endDate).toISOString().slice(0, 16) : "",
		});

		// Configure desktop preview
		setDesktopPreview(slide.image || "");
		setDesktopFileName("");
		setDesktopError("");
		if (slide.image && slide.image.startsWith("http")) {
			setDesktopMode("url");
			setDesktopUrlInput(slide.image);
		} else {
			setDesktopMode("upload");
			setDesktopUrlInput("");
		}

		// Configure mobile preview
		setMobilePreview(slide.mobileImage || "");
		setMobileFileName("");
		setMobileError("");
		if (slide.mobileImage && slide.mobileImage.startsWith("http")) {
			setMobileMode("url");
			setMobileUrlInput(slide.mobileImage);
		} else {
			setMobileMode("upload");
			setMobileUrlInput("");
		}

		setIsModalOpen(true);
	};

	// Desktop File Selection Handler
	const handleDesktopFileChange = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const validation = validateFile(file);
		if (!validation.valid) {
			setDesktopError(validation.error);
			toast.error(validation.error);
			return;
		}

		setDesktopError("");
		setDesktopFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);

		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = reader.result;
			setDesktopPreview(dataUrl);
			setFormData((prev) => ({ ...prev, image: dataUrl }));
		};
		reader.onerror = () => {
			setDesktopError("Failed to read image file.");
			toast.error("Failed to read image file from disk.");
		};
		reader.readAsDataURL(file);
	};

	// Desktop URL Change Handler
	const handleDesktopUrlChange = (value) => {
		setDesktopUrlInput(value);
		if (!value.trim()) {
			setDesktopError("");
			setDesktopPreview("");
			setFormData((prev) => ({ ...prev, image: "" }));
			return;
		}

		const validation = validateDirectUrl(value);
		if (!validation.valid) {
			setDesktopError(validation.error);
			setDesktopPreview("");
			setFormData((prev) => ({ ...prev, image: "" }));
		} else {
			setDesktopError("");
			setDesktopPreview(value.trim());
			setFormData((prev) => ({ ...prev, image: value.trim() }));
		}
	};

	// Mobile File Selection Handler
	const handleMobileFileChange = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const validation = validateFile(file);
		if (!validation.valid) {
			setMobileError(validation.error);
			toast.error(validation.error);
			return;
		}

		setMobileError("");
		setMobileFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);

		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = reader.result;
			setMobilePreview(dataUrl);
			setFormData((prev) => ({ ...prev, mobileImage: dataUrl }));
		};
		reader.onerror = () => {
			setMobileError("Failed to read mobile image file.");
			toast.error("Failed to read mobile image file from disk.");
		};
		reader.readAsDataURL(file);
	};

	// Mobile URL Change Handler
	const handleMobileUrlChange = (value) => {
		setMobileUrlInput(value);
		if (!value.trim()) {
			setMobileError("");
			setMobilePreview("");
			setFormData((prev) => ({ ...prev, mobileImage: "" }));
			return;
		}

		const validation = validateDirectUrl(value);
		if (!validation.valid) {
			setMobileError(validation.error);
			setMobilePreview("");
			setFormData((prev) => ({ ...prev, mobileImage: "" }));
		} else {
			setMobileError("");
			setMobilePreview(value.trim());
			setFormData((prev) => ({ ...prev, mobileImage: value.trim() }));
		}
	};

	// Remove Desktop Image
	const handleRemoveDesktopImage = () => {
		setDesktopPreview("");
		setDesktopFileName("");
		setDesktopUrlInput("");
		setDesktopError("");
		setFormData((prev) => ({ ...prev, image: "" }));
		if (desktopFileInputRef.current) desktopFileInputRef.current.value = "";
	};

	// Remove Mobile Image
	const handleRemoveMobileImage = () => {
		setMobilePreview("");
		setMobileFileName("");
		setMobileUrlInput("");
		setMobileError("");
		setFormData((prev) => ({ ...prev, mobileImage: "" }));
		if (mobileFileInputRef.current) mobileFileInputRef.current.value = "";
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// 1. Validate Image: At least one valid image is required
		const hasDesktop = Boolean(formData.image && formData.image.trim());
		const hasMobile = Boolean(formData.mobileImage && formData.mobileImage.trim());

		if (!hasDesktop && !hasMobile) {
			toast.error("At least one campaign image (Desktop or Mobile Hero Image) is required.");
			return;
		}
		if (desktopError) {
			toast.error(`Desktop Image: ${desktopError}`);
			return;
		}
		if (mobileError) {
			toast.error(`Mobile Image: ${mobileError}`);
			return;
		}

		// 2. Validate CTA: If CTA text is entered, require a valid link destination
		const trimmedCtaText = (formData.ctaText || "").trim();
		const trimmedCtaLink = (formData.ctaLink || "").trim();

		if (trimmedCtaText && !trimmedCtaLink) {
			toast.error("CTA Link Target is required when CTA Button Text is entered.");
			return;
		}

		const payload = {
			...formData,
			badge: (formData.badge || "").trim(),
			leftHeadline: (formData.leftHeadline || "").trim(),
			leftSubheadline: (formData.leftSubheadline || "").trim(),
			rightHeadline: (formData.rightHeadline || "").trim(),
			rightSubheadline: (formData.rightSubheadline || "").trim(),
			ctaText: trimmedCtaText,
			ctaLink: trimmedCtaLink,
			displayOrder: Number(formData.displayOrder) || 1,
			startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
			endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
		};

		try {
			if (editingSlide) {
				await updateSlide(editingSlide._id, payload);
			} else {
				await createSlide(payload);
			}
			setIsModalOpen(false);
		} catch (err) {
			// error toast already handled in useCampaignSlideStore
		}
	};

	const handleDelete = async (id) => {
		if (window.confirm("Are you sure you want to permanently delete this hero campaign slide?")) {
			await deleteSlide(id);
		}
	};

	return (
		<div className='bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-6'>
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800'>
				<div>
					<h2 className='text-lg font-bold text-neutral-900 dark:text-white'>Homepage Hero Campaign Slides</h2>
					<p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
						Manage dynamic editorial hero slides rotating on the customer-facing storefront.
					</p>
				</div>
				<button
					type='button'
					onClick={handleOpenCreate}
					className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-md'
				>
					<Plus size={16} />
					<span>Add Campaign Slide</span>
				</button>
			</div>

			{/* Slides Grid / List */}
			<div className='mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
				{allSlides.length === 0 ? (
					<div className='col-span-full py-16 text-center text-gray-500 border border-dashed border-gray-800 rounded-2xl'>
						<ImageIcon size={36} className='mx-auto mb-3 opacity-30 text-gray-400' />
						<p className='text-sm font-semibold text-gray-300'>No campaign slides registered yet</p>
						<p className='text-xs text-gray-500 mt-1'>Click &quot;Add Campaign Slide&quot; to publish your first homepage showcase.</p>
					</div>
				) : (
					allSlides.map((slide) => (
						<div
							key={slide._id}
							className='bg-white dark:bg-gray-950/80 border border-neutral-200 dark:border-gray-800/80 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-neutral-300 dark:hover:border-gray-700 transition-all shadow-sm group'
						>
							{/* Slide Preview Header */}
							<div className='relative h-48 w-full bg-gray-900 overflow-hidden'>
								<img
									src={slide.image}
									alt={slide.leftHeadline}
									className='w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500'
									onError={(e) => {
										e.target.src = "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80";
									}}
								/>
								<div className='absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40' />

								{/* Badges on Top */}
								<div className='absolute top-3 left-3 right-3 flex items-center justify-between'>
									<span className='px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-black/85 text-white border border-gray-700 rounded'>
										{slide.badge || "CAMPAIGN"}
									</span>
									<span className='px-2 py-0.5 text-[9px] font-mono font-bold bg-gray-900/90 text-gray-200 border border-gray-800 rounded'>
										Order: #{slide.displayOrder}
									</span>
								</div>

								{/* Mobile Banner Indicator */}
								{slide.mobileImage && slide.mobileImage !== slide.image && (
									<div className='absolute top-10 right-3'>
										<span className='inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-bold bg-neutral-900/90 text-emerald-400 border border-emerald-500/30 rounded'>
											<Smartphone size={10} /> Mobile Optimized
										</span>
									</div>
								)}

								{/* Bottom Headline Overlay */}
								<div className='absolute bottom-3 left-3 right-3 text-white'>
									{slide.leftHeadline ? (
										<>
											<p className='text-xs font-light uppercase tracking-wider text-gray-300'>
												{slide.leftHeadline}
											</p>
											{slide.leftSubheadline && (
												<p className='text-sm font-black uppercase tracking-wide truncate mt-0.5'>
													{slide.leftSubheadline}
												</p>
											)}
										</>
									) : (
										<p className='text-[11px] font-semibold tracking-wide text-gray-400 italic'>
											{slide.badge ? slide.badge : "Image-Only Campaign"}
										</p>
									)}
								</div>
							</div>

							{/* Info Body */}
							<div className='p-4 space-y-2.5 text-xs'>
								<div className='flex items-center justify-between text-neutral-600 dark:text-gray-400 font-medium'>
									<span>Promo Offer:</span>
									<span className='font-bold text-neutral-900 dark:text-white'>{slide.rightHeadline || "—"}</span>
								</div>
								<div className='flex items-center justify-between text-neutral-600 dark:text-gray-400 font-medium'>
									<span>Sub-Promo:</span>
									<span className='text-neutral-800 dark:text-gray-300 truncate max-w-[180px]'>{slide.rightSubheadline || "—"}</span>
								</div>
								<div className='flex items-center justify-between text-neutral-600 dark:text-gray-400 font-medium'>
									<span>CTA Action:</span>
									<span className='font-mono text-neutral-800 dark:text-gray-300 text-[11px]'>
										{slide.ctaText ? `${slide.ctaText} → ${slide.ctaLink || "—"}` : "None (Image Only)"}
									</span>
								</div>
								<div className='flex items-center justify-between text-neutral-600 dark:text-gray-400 pt-1 border-t border-neutral-200 dark:border-gray-800/80 font-medium'>
									<span>Storefront Visibility:</span>
									<span
										className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
											slide.isActive
												? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
												: "bg-neutral-100 text-neutral-700 border border-neutral-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
										}`}
									>
										{slide.isActive ? "Active (Live)" : "Paused"}
									</span>
								</div>
							</div>

							{/* Actions Footer */}
							<div className='p-3 bg-neutral-50 dark:bg-gray-950 border-t border-neutral-200 dark:border-gray-800/80 flex items-center justify-between'>
								<button
									type='button'
									onClick={() => toggleSlide(slide._id)}
									className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
										slide.isActive
											? "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
											: "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
									}`}
								>
									<Power size={13} />
									<span>{slide.isActive ? "Pause" : "Activate"}</span>
								</button>

								<div className='flex items-center gap-1.5'>
									<button
										type='button'
										onClick={() => handleOpenEdit(slide)}
										className='p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200 dark:border-transparent dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors'
										title='Edit Slide'
									>
										<Edit2 size={14} />
									</button>
									<button
										type='button'
										onClick={() => handleDelete(slide._id)}
										className='p-2 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-neutral-200 dark:border-transparent dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/10 transition-colors'
										title='Delete Slide'
									>
										<Trash2 size={14} />
									</button>
								</div>
							</div>
						</div>
					))
				)}
			</div>

			{/* Slide Edit / Create Modal - rendered via React Portal directly into document.body */}
			{isModalOpen &&
				typeof document !== "undefined" &&
				createPortal(
					<div
						className='fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in'
						onClick={() => {
							if (!loading) setIsModalOpen(false);
						}}
					>
						<div
							role='dialog'
							aria-modal='true'
							aria-labelledby='campaign-modal-title'
							onClick={(e) => e.stopPropagation()}
							className='relative flex flex-col w-full max-w-2xl max-h-[90vh] max-h-[90dvh] bg-white dark:bg-gray-900 border border-neutral-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden'
						>
							{/* Fixed Header */}
							<div className='flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900'>
								<div>
									<h3 id='campaign-modal-title' className='text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white'>
										{editingSlide ? "Edit Homepage Hero Slide" : "Create New Campaign Hero Slide"}
									</h3>
									<p className='text-[11px] text-neutral-500 dark:text-gray-400 mt-0.5'>
										Upload photography or provide high-resolution assets to publish to the storefront carousel.
									</p>
								</div>
								<button
									type='button'
									onClick={() => setIsModalOpen(false)}
									className='p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors'
									aria-label='Close modal'
								>
									<X size={18} />
								</button>
							</div>

							<form onSubmit={handleSubmit} className='flex flex-col flex-1 min-h-0 overflow-hidden'>
								{/* Scrollable Form Body */}
								<div className='flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs overscroll-contain custom-scrollbar'>
							{/* BADGE & DISPLAY ORDER */}
							<div className='grid grid-cols-2 gap-3'>
								<div>
									<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>
										Badge Pill Text <span className='text-neutral-400 dark:text-gray-500 font-normal'>(Optional)</span>
									</label>
									<input
										type='text'
										value={formData.badge}
										onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
										placeholder='Optional: e.g. LIMITED EDITION, NEW ARRIVAL'
										className='w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-accent placeholder-neutral-400 dark:placeholder-gray-500'
									/>
								</div>
								<div>
									<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>Display Order (Sequence)</label>
									<input
										type='number'
										min='1'
										value={formData.displayOrder}
										onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
										className='w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-accent'
									/>
								</div>
							</div>

							{/* HEADLINES */}
							<div className='grid grid-cols-2 gap-3'>
								<div>
									<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>
										Left Headline <span className='text-neutral-400 dark:text-gray-500 font-normal'>(Optional)</span>
									</label>
									<input
										type='text'
										value={formData.leftHeadline}
										onChange={(e) => setFormData({ ...formData, leftHeadline: e.target.value })}
										placeholder='Optional: e.g. LAST FEW'
										className='w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-accent placeholder-neutral-400 dark:placeholder-gray-500'
									/>
								</div>
								<div>
									<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>
										Left Subheadline <span className='text-neutral-400 dark:text-gray-500 font-normal'>(Optional)</span>
									</label>
									<input
										type='text'
										value={formData.leftSubheadline}
										onChange={(e) => setFormData({ ...formData, leftSubheadline: e.target.value })}
										placeholder='Optional: e.g. BESTSELLERS LEFT'
										className='w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-accent placeholder-neutral-400 dark:placeholder-gray-500'
									/>
								</div>
							</div>

							<div className='grid grid-cols-2 gap-3'>
								<div>
									<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>
										Right Headline / Offer <span className='text-neutral-400 dark:text-gray-500 font-normal'>(Optional)</span>
									</label>
									<input
										type='text'
										value={formData.rightHeadline}
										onChange={(e) => setFormData({ ...formData, rightHeadline: e.target.value })}
										placeholder='Optional: e.g. UP TO 30% OFF'
										className='w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-accent placeholder-neutral-400 dark:placeholder-gray-500'
									/>
								</div>
								<div>
									<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>
										Right Subheadline <span className='text-neutral-400 dark:text-gray-500 font-normal'>(Optional)</span>
									</label>
									<input
										type='text'
										value={formData.rightSubheadline}
										onChange={(e) => setFormData({ ...formData, rightSubheadline: e.target.value })}
										placeholder='Optional: e.g. CURATED FOR DISCERNING TASTEMAKERS'
										className='w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-accent placeholder-neutral-400 dark:placeholder-gray-500'
									/>
								</div>
							</div>

							{/* ======================================================== */}
							{/* SECTION: DESKTOP CAMPAIGN IMAGE (RECOMMENDED)            */}
							{/* ======================================================== */}
							<div className='p-4 rounded-xl bg-gray-950/70 border border-gray-800 space-y-3'>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-2'>
										<Monitor size={15} className='text-accent' />
										<span className='font-bold uppercase tracking-wider text-white text-[11px]'>
											Desktop Hero Image
										</span>
										<span className='text-[10px] text-gray-400'>(1920×800 recommended &bull; At least one image required)</span>
									</div>

									{/* Toggle between Upload and URL */}
									<div className='flex items-center bg-gray-900 border border-gray-800 rounded-lg p-0.5 text-[10px]'>
										<button
											type='button'
											onClick={() => setDesktopMode("upload")}
											className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
												desktopMode === "upload"
													? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold shadow-sm"
													: "text-gray-400 hover:text-white"
											}`}
										>
											<Upload size={11} /> Upload File
										</button>
										<button
											type='button'
											onClick={() => setDesktopMode("url")}
											className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
												desktopMode === "url"
													? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold shadow-sm"
													: "text-gray-400 hover:text-white"
											}`}
										>
											<Link2 size={11} /> Image URL
										</button>
									</div>
								</div>

								{/* MODE A: UPLOAD FILE FROM COMPUTER */}
								{desktopMode === "upload" && (
									<div>
										<input
											type='file'
											ref={desktopFileInputRef}
											accept='image/jpeg,image/png,image/webp'
											onChange={handleDesktopFileChange}
											className='hidden'
										/>
										<div
											onClick={() => desktopFileInputRef.current?.click()}
											className='border-2 border-dashed border-gray-800 hover:border-gray-700 bg-gray-900/50 hover:bg-gray-900 rounded-xl p-4 text-center cursor-pointer transition-all'
										>
											<Upload size={22} className='mx-auto mb-1.5 text-gray-400' />
											<p className='text-xs font-semibold text-gray-300'>
												Click or drag to upload original desktop photography
											</p>
											<p className='text-[10px] text-gray-500 mt-0.5'>
												JPEG, PNG, or WebP &bull; Maximum file size: 10 MB
											</p>
										</div>
									</div>
								)}

								{/* MODE B: DIRECT IMAGE URL */}
								{desktopMode === "url" && (
									<div>
										<input
											type='url'
											value={desktopUrlInput}
											onChange={(e) => handleDesktopUrlChange(e.target.value)}
											placeholder='https://images.unsplash.com/photo-...'
											className='w-full p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white font-mono text-[11px] focus:outline-none focus:border-accent'
										/>
										<p className='text-[10px] text-gray-500 mt-1'>
											Note: Enter direct image link. Unsplash webpage URLs (/photos/...) are automatically rejected.
										</p>
									</div>
								)}

								{/* Desktop Error Message */}
								{desktopError && (
									<div className='flex items-start gap-1.5 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-[11px]'>
										<AlertCircle size={14} className='shrink-0 mt-0.5 text-rose-400' />
										<span>{desktopError}</span>
									</div>
								)}

								{/* Desktop Live Preview */}
								{desktopPreview && (
									<div className='relative rounded-xl overflow-hidden border border-gray-800 bg-black mt-2'>
										<div className='relative h-32 w-full'>
											<img
												src={desktopPreview}
												alt='Desktop Preview'
												className='w-full h-full object-cover object-center'
											/>
											<div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent' />
											<div className='absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-white'>
												<span className='font-mono truncate max-w-[300px]'>
													{desktopFileName || "Desktop Preview Loaded"}
												</span>
												<div className='flex items-center gap-2'>
													<button
														type='button'
														onClick={() => desktopFileInputRef.current?.click()}
														className='px-2 py-0.5 bg-gray-900/90 hover:bg-gray-800 rounded border border-gray-700 font-semibold'
													>
														Replace
													</button>
													<button
														type='button'
														onClick={handleRemoveDesktopImage}
														className='p-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded'
														title='Remove'
													>
														<X size={12} />
													</button>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* ======================================================== */}
							{/* SECTION: MOBILE CAMPAIGN IMAGE (OPTIONAL)                */}
							{/* ======================================================== */}
							<div className='p-4 rounded-xl bg-gray-950/70 border border-gray-800 space-y-3'>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-2'>
										<Smartphone size={15} className='text-emerald-400' />
										<span className='font-bold uppercase tracking-wider text-white text-[11px]'>
											Mobile Hero Image <span className='text-gray-500 font-normal'>(Optional)</span>
										</span>
										<span className='text-[10px] text-gray-500'>(800×1000 or 4:5 vertical ratio)</span>
									</div>

									{/* Toggle between Upload and URL */}
									<div className='flex items-center bg-gray-900 border border-gray-800 rounded-lg p-0.5 text-[10px]'>
										<button
											type='button'
											onClick={() => setMobileMode("upload")}
											className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
												mobileMode === "upload"
													? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold shadow-sm"
													: "text-gray-400 hover:text-white"
											}`}
										>
											<Upload size={11} /> Upload File
										</button>
										<button
											type='button'
											onClick={() => setMobileMode("url")}
											className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
												mobileMode === "url"
													? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold shadow-sm"
													: "text-gray-400 hover:text-white"
											}`}
										>
											<Link2 size={11} /> Image URL
										</button>
									</div>
								</div>

								{/* MODE A: UPLOAD FILE FROM COMPUTER */}
								{mobileMode === "upload" && (
									<div>
										<input
											type='file'
											ref={mobileFileInputRef}
											accept='image/jpeg,image/png,image/webp'
											onChange={handleMobileFileChange}
											className='hidden'
										/>
										<div
											onClick={() => mobileFileInputRef.current?.click()}
											className='border-2 border-dashed border-gray-800 hover:border-gray-700 bg-gray-900/50 hover:bg-gray-900 rounded-xl p-3 text-center cursor-pointer transition-all'
										>
											<Upload size={18} className='mx-auto mb-1 text-gray-400' />
											<p className='text-xs font-semibold text-gray-300'>
												Click or drag to upload mobile portrait photography
											</p>
											<p className='text-[10px] text-gray-500 mt-0.5'>
												JPEG, PNG, or WebP &bull; Maximum file size: 10 MB
											</p>
										</div>
									</div>
								)}

								{/* MODE B: DIRECT IMAGE URL */}
								{mobileMode === "url" && (
									<div>
										<input
											type='url'
											value={mobileUrlInput}
											onChange={(e) => handleMobileUrlChange(e.target.value)}
											placeholder='https://images.unsplash.com/photo-...'
											className='w-full p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white font-mono text-[11px] focus:outline-none focus:border-accent'
										/>
									</div>
								)}

								{/* Mobile Error Message */}
								{mobileError && (
									<div className='flex items-start gap-1.5 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-[11px]'>
										<AlertCircle size={14} className='shrink-0 mt-0.5 text-rose-400' />
										<span>{mobileError}</span>
									</div>
								)}

								{/* Mobile Live Preview */}
								{mobilePreview && (
									<div className='relative rounded-xl overflow-hidden border border-gray-800 bg-black mt-2'>
										<div className='relative h-28 w-full'>
											<img
												src={mobilePreview}
												alt='Mobile Preview'
												className='w-full h-full object-cover object-center'
											/>
											<div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent' />
											<div className='absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-white'>
												<span className='font-mono truncate max-w-[300px]'>
													{mobileFileName || "Mobile Preview Loaded"}
												</span>
												<div className='flex items-center gap-2'>
													<button
														type='button'
														onClick={() => mobileFileInputRef.current?.click()}
														className='px-2 py-0.5 bg-gray-900/90 hover:bg-gray-800 rounded border border-gray-700 font-semibold'
													>
														Replace
													</button>
													<button
														type='button'
														onClick={handleRemoveMobileImage}
														className='p-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded'
														title='Remove'
													>
														<X size={12} />
													</button>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* CTA BUTTON CONFIGURATION */}
							<div className='grid grid-cols-2 gap-3'>
								<div>
									<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>
										CTA Button Text <span className='text-neutral-400 dark:text-gray-500 font-normal'>(Optional)</span>
									</label>
									<input
										type='text'
										value={formData.ctaText}
										onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
										placeholder='Optional: e.g. SHOP NOW'
										className='w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-accent placeholder-neutral-400 dark:placeholder-gray-500'
									/>
								</div>
								<div>
									<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>
										CTA Link Target <span className='text-neutral-400 dark:text-gray-500 font-normal'>(Required if CTA text entered)</span>
									</label>
									<input
										type='text'
										value={formData.ctaLink}
										onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
										placeholder='Optional: e.g. /sales or /category/suits'
										className='w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-accent font-mono text-[11px] placeholder-neutral-400 dark:placeholder-gray-500'
									/>
								</div>
							</div>

							{/* SCHEDULED DATES (OPTIONAL) */}
							<div className='grid grid-cols-2 gap-3'>
								<div>
									<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>
										Start Schedule <span className='text-neutral-400 dark:text-gray-500 font-normal'>(Optional)</span>
									</label>
									<input
										type='datetime-local'
										value={formData.startDate}
										onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
										className='w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-accent'
									/>
								</div>
								<div>
									<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>
										End Schedule <span className='text-neutral-400 dark:text-gray-500 font-normal'>(Optional)</span>
									</label>
									<input
										type='datetime-local'
										value={formData.endDate}
										onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
										className='w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-accent'
									/>
								</div>
							</div>

							{/* ACTIVE TOGGLE */}
							<div className='flex items-center gap-3 p-3 bg-neutral-50 dark:bg-gray-950 rounded-xl border border-neutral-200 dark:border-gray-800'>
								<input
									type='checkbox'
									id='isActiveSlide'
									checked={formData.isActive}
									onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
									className='w-4 h-4 rounded text-accent focus:ring-accent border-neutral-300 dark:border-gray-700 bg-white dark:bg-gray-900 cursor-pointer'
								/>
								<label htmlFor='isActiveSlide' className='cursor-pointer text-xs font-semibold text-neutral-800 dark:text-gray-300'>
									Activate immediately on storefront carousel
								</label>
							</div>

								</div>

								{/* Fixed Modal Footer Actions */}
								<div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-gray-800 shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm'>
									<button
										type='button'
										onClick={() => setIsModalOpen(false)}
										disabled={loading}
										className='px-4 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors text-xs font-semibold'
									>
										Cancel
									</button>
									<button
										type='submit'
										disabled={loading}
										className='inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 transition-all shadow-md text-xs'
									>
										{loading ? (
											<>
												<Loader2 size={15} className='animate-spin' />
												<span>Uploading & Saving...</span>
											</>
										) : editingSlide ? (
											<span>Save Changes</span>
										) : (
											<span>Create Slide</span>
										)}
									</button>
								</div>
							</form>
						</div>
					</div>,
					document.body
				)}
		</div>
	);
};

export default CampaignSlideManagement;
