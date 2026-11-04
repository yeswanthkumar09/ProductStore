import CampaignSlide from "../models/campaignSlide.model.js";
import cloudinary from "../lib/cloudinary.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BASE64_BYTES = 10 * 1024 * 1024; // 10MB limit

const initialCampaignSlides = [
	{
		badge: "LIMITED EDITION",
		leftHeadline: "LAST FEW",
		leftSubheadline: "BESTSELLERS LEFT",
		rightHeadline: "UP TO 30% OFF",
		rightSubheadline: "CURATED FOR DISCERNING TASTEMAKERS",
		ctaText: "SHOP BESTSELLERS",
		ctaLink: "/sales",
		image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1920&q=85",
		mobileImage: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=85",
		bgColor: "bg-neutral-950",
		textColor: "text-white",
		displayOrder: 1,
		isActive: true,
	},
	{
		badge: "SEASON PRIVILEGE",
		leftHeadline: "NEVER BEFORE",
		leftSubheadline: "PRICES",
		rightHeadline: "STARTING ₹999",
		rightSubheadline: "LIMITED RUN OF OUR SIGNATURE CUTS",
		ctaText: "EXPLORE OFFERS",
		ctaLink: "/search",
		image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1920&q=85",
		mobileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=85",
		bgColor: "bg-neutral-950",
		textColor: "text-white",
		offerPills: [
			{ title: "3 TOP WEAR", price: "₹2,699", link: "/category/t-shirts" },
			{ title: "2 BOTTOM WEAR", price: "₹2,899", link: "/category/jeans" },
			{ title: "SUNGLASSES", price: "₹999", link: "/category/glasses" },
			{ title: "PERFUMES", price: "50% OFF", link: "/category/perfumes" },
		],
		displayOrder: 2,
		isActive: true,
	},
	{
		badge: "NEW ARRIVALS",
		leftHeadline: "AUTUMN / WINTER",
		leftSubheadline: "EDITION 2026",
		rightHeadline: "NEW ARRIVALS",
		rightSubheadline: "TEXTURED LINENS, CASHMERE & RAW SELVEDGE",
		ctaText: "VIEW COLLECTION",
		ctaLink: "/category/jackets",
		image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1920&q=85",
		mobileImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=85",
		bgColor: "bg-neutral-950",
		textColor: "text-white",
		displayOrder: 3,
		isActive: true,
	},
];

const ensureDefaultSlides = async () => {
	const count = await CampaignSlide.countDocuments();
	if (count === 0) {
		await CampaignSlide.insertMany(initialCampaignSlides);
	}
};

/**
 * Validates a direct URL for security (SSRF prevention) and rejects non-image webpage URLs.
 */
export const isSafeImageUrl = (rawUrl) => {
	try {
		const parsed = new URL(rawUrl);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			return { valid: false, reason: "Only HTTP and HTTPS image URLs are permitted." };
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
			return { valid: false, reason: "Internal or private network URLs are prohibited." };
		}
		// Explicitly reject Unsplash webpage URLs (e.g. unsplash.com/photos/...)
		if (host === "unsplash.com" && parsed.pathname.startsWith("/photos")) {
			return {
				valid: false,
				reason: "Unsplash webpage URLs are not direct images. Please use a direct image URL (e.g. from https://images.unsplash.com/...) or upload the image directly from your computer.",
			};
		}
		return { valid: true };
	} catch (e) {
		return { valid: false, reason: "Invalid image URL format." };
	}
};

/**
 * Handles processing of base64 images (uploading to Cloudinary) or validating direct image URLs.
 */
export const processCampaignImage = async (imageInput, folder = "campaign-slides") => {
	if (!imageInput || typeof imageInput !== "string" || !imageInput.trim()) {
		return { url: "", publicId: "" };
	}

	const trimmed = imageInput.trim();

	// Case 1: Base64 data uploaded from client file picker
	if (trimmed.startsWith("data:")) {
		const match = trimmed.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
		if (!match) {
			throw new Error("Invalid base64 image data.");
		}
		const mimeType = match[1].toLowerCase();
		if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
			throw new Error("Invalid image format. Only JPEG, PNG, and WebP are allowed.");
		}

		// Check base64 byte size
		const base64Data = trimmed.split(",")[1];
		if (!base64Data) {
			throw new Error("Corrupted base64 image payload.");
		}
		const approxBytes = (base64Data.length * 3) / 4;
		if (approxBytes > MAX_BASE64_BYTES) {
			throw new Error("Image file exceeds maximum allowable size of 10MB.");
		}

		try {
			const res = await cloudinary.uploader.upload(trimmed, {
				folder,
				resource_type: "image",
				transformation: [{ quality: "auto", fetch_format: "auto" }],
			});
			return { url: res.secure_url, publicId: res.public_id };
		} catch (cloudErr) {
			console.error("Cloudinary upload failed for campaign slide image:", cloudErr.message);
			throw new Error(`Image upload failed: ${cloudErr.message || "Cloudinary error"}`);
		}
	}

	// Case 2: Direct HTTP/HTTPS URL
	const urlCheck = isSafeImageUrl(trimmed);
	if (!urlCheck.valid) {
		throw new Error(urlCheck.reason);
	}

	// Upload direct URL to Cloudinary so it is securely hosted and optimized
	try {
		const res = await cloudinary.uploader.upload(trimmed, {
			folder,
			resource_type: "image",
			transformation: [{ quality: "auto", fetch_format: "auto" }],
		});
		return { url: res.secure_url, publicId: res.public_id };
	} catch (e) {
		console.warn("Cloudinary remote URL upload fallback:", e.message);
		// Graceful fallback to verified direct URL
		return { url: trimmed, publicId: "" };
	}
};

// Public: Get currently active campaign slides
export const getActiveSlides = async (req, res) => {
	try {
		await ensureDefaultSlides();

		const now = new Date();
		const slides = await CampaignSlide.find({
			isActive: true,
			$and: [
				{ $or: [{ startDate: null }, { startDate: { $lte: now } }] },
				{ $or: [{ endDate: null }, { endDate: { $gte: now } }] },
			],
		}).sort({ displayOrder: 1, createdAt: 1 });

		res.json(slides);
	} catch (error) {
		console.error("Error in getActiveSlides:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Get all slides
export const getAllSlidesAdmin = async (req, res) => {
	try {
		await ensureDefaultSlides();
		const slides = await CampaignSlide.find().sort({ displayOrder: 1, createdAt: -1 });
		res.json(slides);
	} catch (error) {
		console.error("Error in getAllSlidesAdmin:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Create new slide
export const createSlide = async (req, res) => {
	try {
		const {
			badge = "",
			leftHeadline = "",
			leftSubheadline = "",
			rightHeadline = "",
			rightSubheadline = "",
			ctaText = "",
			ctaLink = "",
			image,
			mobileImage = "",
			bgColor = "bg-neutral-950",
			textColor = "text-white",
			offerPills = [],
			displayOrder,
			isActive = true,
			startDate = null,
			endDate = null,
		} = req.body;

		// 1. Image validation: At least one valid campaign image is required
		const trimmedImage = (image || "").trim();
		const trimmedMobileImage = (mobileImage || "").trim();

		if (!trimmedImage && !trimmedMobileImage) {
			return res.status(400).json({
				message: "A valid campaign image is required. Please provide a Desktop or Mobile Hero Image.",
			});
		}

		// 2. Conditional CTA validation: If CTA Button Text is provided, require a valid CTA Link Target
		const trimmedCtaText = (ctaText || "").trim();
		const trimmedCtaLink = (ctaLink || "").trim();

		if (trimmedCtaText && !trimmedCtaLink) {
			return res.status(400).json({
				message: "CTA Link Target is required when CTA Button Text is provided.",
			});
		}

		// 3. Process Desktop and Mobile images
		let desktopUploaded = { url: "", publicId: "" };
		let mobileUploaded = { url: "", publicId: "" };

		if (trimmedImage) {
			desktopUploaded = await processCampaignImage(trimmedImage, "campaign-slides/desktop");
		}

		if (trimmedMobileImage) {
			mobileUploaded = await processCampaignImage(trimmedMobileImage, "campaign-slides/mobile");
		}

		// Fallback so storefront always has a usable image for both desktop & mobile viewports
		const finalDesktopUrl = desktopUploaded.url || mobileUploaded.url;
		const finalDesktopPublicId = desktopUploaded.publicId || mobileUploaded.publicId;
		const finalMobileUrl = mobileUploaded.url || desktopUploaded.url;
		const finalMobilePublicId = mobileUploaded.publicId || desktopUploaded.publicId;

		// Determine displayOrder
		let order = Number(displayOrder);
		if (!order || isNaN(order) || order <= 0) {
			const highest = await CampaignSlide.findOne().sort({ displayOrder: -1 }).select("displayOrder");
			order = (highest?.displayOrder || 0) + 1;
		}

		const slide = await CampaignSlide.create({
			badge: (badge || "").trim(),
			leftHeadline: (leftHeadline || "").trim(),
			leftSubheadline: (leftSubheadline || "").trim(),
			rightHeadline: (rightHeadline || "").trim(),
			rightSubheadline: (rightSubheadline || "").trim(),
			ctaText: trimmedCtaText,
			ctaLink: trimmedCtaLink,
			image: finalDesktopUrl,
			imagePublicId: finalDesktopPublicId,
			mobileImage: finalMobileUrl,
			mobileImagePublicId: finalMobilePublicId,
			bgColor: (bgColor || "bg-neutral-950").trim(),
			textColor: (textColor || "text-white").trim(),
			offerPills: Array.isArray(offerPills) ? offerPills : [],
			displayOrder: order,
			isActive: isActive !== false,
			startDate: startDate ? new Date(startDate) : null,
			endDate: endDate ? new Date(endDate) : null,
		});

		res.status(201).json(slide);
	} catch (error) {
		console.error("Error in createSlide:", error.message);
		res.status(400).json({ message: error.message || "Failed to create campaign slide." });
	}
};

// Admin: Update slide
export const updateSlide = async (req, res) => {
	try {
		const { id } = req.params;
		const slide = await CampaignSlide.findById(id);

		if (!slide) {
			return res.status(404).json({ message: "Campaign slide not found." });
		}

		const {
			badge,
			leftHeadline,
			leftSubheadline,
			rightHeadline,
			rightSubheadline,
			ctaText,
			ctaLink,
			image,
			mobileImage,
			bgColor,
			textColor,
			offerPills,
			displayOrder,
			isActive,
			startDate,
			endDate,
		} = req.body;

		// 1. Conditional CTA validation: If CTA Button Text is provided, require a valid CTA Link Target
		const newCtaText = ctaText !== undefined ? ctaText.trim() : slide.ctaText;
		const newCtaLink = ctaLink !== undefined ? ctaLink.trim() : slide.ctaLink;

		if (newCtaText && !newCtaLink) {
			return res.status(400).json({
				message: "CTA Link Target is required when CTA Button Text is provided.",
			});
		}

		// 2. Handle desktop image replacement if changed
		if (image !== undefined && image.trim() && image.trim() !== slide.image) {
			const desktopUploaded = await processCampaignImage(image, "campaign-slides/desktop");
			// Clean up old Cloudinary asset if public ID existed
			if (slide.imagePublicId && slide.imagePublicId !== desktopUploaded.publicId) {
				cloudinary.uploader.destroy(slide.imagePublicId).catch((err) => {
					console.warn("Failed to delete previous desktop image asset:", err.message);
				});
			}
			slide.image = desktopUploaded.url;
			slide.imagePublicId = desktopUploaded.publicId;
		}

		// 3. Handle mobile image replacement if changed
		if (mobileImage !== undefined) {
			const trimmedMobile = (mobileImage || "").trim();
			if (!trimmedMobile) {
				// Mobile image removed
				if (slide.mobileImagePublicId) {
					cloudinary.uploader.destroy(slide.mobileImagePublicId).catch(() => {});
				}
				slide.mobileImage = "";
				slide.mobileImagePublicId = "";
			} else if (trimmedMobile !== slide.mobileImage) {
				const mobileUploaded = await processCampaignImage(trimmedMobile, "campaign-slides/mobile");
				if (slide.mobileImagePublicId && slide.mobileImagePublicId !== mobileUploaded.publicId) {
					cloudinary.uploader.destroy(slide.mobileImagePublicId).catch(() => {});
				}
				slide.mobileImage = mobileUploaded.url;
				slide.mobileImagePublicId = mobileUploaded.publicId;
			}
		}

		// 4. Ensure at least one usable image remains
		if (!slide.image && !slide.mobileImage) {
			return res.status(400).json({
				message: "A valid campaign image is required. At least one image must be maintained.",
			});
		}
		if (!slide.image && slide.mobileImage) {
			slide.image = slide.mobileImage;
		}
		if (!slide.mobileImage && slide.image) {
			slide.mobileImage = slide.image;
		}

		if (badge !== undefined) slide.badge = badge.trim();
		if (leftHeadline !== undefined) slide.leftHeadline = leftHeadline.trim();
		if (leftSubheadline !== undefined) slide.leftSubheadline = leftSubheadline.trim();
		if (rightHeadline !== undefined) slide.rightHeadline = rightHeadline.trim();
		if (rightSubheadline !== undefined) slide.rightSubheadline = rightSubheadline.trim();
		if (ctaText !== undefined) slide.ctaText = ctaText.trim();
		if (ctaLink !== undefined) slide.ctaLink = ctaLink.trim();
		if (bgColor !== undefined) slide.bgColor = bgColor.trim();
		if (textColor !== undefined) slide.textColor = textColor.trim();
		if (offerPills !== undefined) slide.offerPills = Array.isArray(offerPills) ? offerPills : [];
		if (displayOrder !== undefined) slide.displayOrder = Number(displayOrder);
		if (isActive !== undefined) slide.isActive = Boolean(isActive);
		if (startDate !== undefined) slide.startDate = startDate ? new Date(startDate) : null;
		if (endDate !== undefined) slide.endDate = endDate ? new Date(endDate) : null;

		await slide.save();
		res.json(slide);
	} catch (error) {
		console.error("Error in updateSlide:", error.message);
		res.status(400).json({ message: error.message || "Failed to update campaign slide." });
	}
};

// Admin: Delete slide
export const deleteSlide = async (req, res) => {
	try {
		const { id } = req.params;
		const slide = await CampaignSlide.findById(id);

		if (!slide) {
			return res.status(404).json({ message: "Campaign slide not found." });
		}

		// Clean up Cloudinary assets
		if (slide.imagePublicId) {
			cloudinary.uploader.destroy(slide.imagePublicId).catch((err) => {
				console.warn("Cloudinary asset destroy failed for desktop image:", err.message);
			});
		}
		if (slide.mobileImagePublicId) {
			cloudinary.uploader.destroy(slide.mobileImagePublicId).catch((err) => {
				console.warn("Cloudinary asset destroy failed for mobile image:", err.message);
			});
		}

		await CampaignSlide.findByIdAndDelete(id);

		res.json({ success: true, message: "Campaign slide deleted successfully." });
	} catch (error) {
		console.error("Error in deleteSlide:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Toggle active state
export const toggleSlide = async (req, res) => {
	try {
		const { id } = req.params;
		const slide = await CampaignSlide.findById(id);

		if (!slide) {
			return res.status(404).json({ message: "Campaign slide not found." });
		}

		slide.isActive = !slide.isActive;
		await slide.save();

		res.json(slide);
	} catch (error) {
		console.error("Error in toggleSlide:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
