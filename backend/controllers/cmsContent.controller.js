import CmsContent from "../models/cmsContent.model.js";

// Canonical seed definitions for default website sections & policies
const defaultCmsContents = [
	{
		sectionKey: "homepage_sections",
		category: "homepage",
		title: "Homepage Layout & Section Ordering",
		subtitle: "Configure visible storefront rails, section headers, and sequence",
		status: "published",
		data: {
			sections: [
				{
					id: "hero_carousel",
					name: "Hero Campaign Carousel",
					enabled: true,
					order: 1,
					badge: "EXCLUSIVE",
				},
				{
					id: "categories_rail",
					name: "Shop by Category",
					enabled: true,
					order: 2,
					heading: "SHOP BY",
					subheading: "CATEGORY",
					description: "Curated collections tailored for modern elegance.",
				},
				{
					id: "bestsellers_grid",
					name: "Last Few Bestsellers",
					enabled: true,
					order: 3,
					heading: "LAST FEW",
					subheading: "BESTSELLERS LEFT",
					description: "High-demand silhouettes in limited reserve.",
				},
				{
					id: "new_arrivals_grid",
					name: "New Arrivals Edition",
					enabled: true,
					order: 4,
					heading: "AUTUMN / WINTER",
					subheading: "NEW ARRIVALS",
					description: "Structured linens, fine poplins, and signature tailoring.",
				},
				{
					id: "brand_pillars",
					name: "Brand Philosophy & Trust Pillars",
					enabled: true,
					order: 5,
					heading: "THE LUXESTORE STANDARD",
					pillars: [
						{ title: "Ethical Craftsmanship", desc: "Hand-stitched in certified artisanal ateliers." },
						{ title: "Complimentary Delivery", desc: "Express logistics on orders over ₹1,999." },
						{ title: "7-Day Effortless Returns", desc: "Doorstep exchanges with zero hassle." },
					],
				},
			],
		},
	},
	{
		sectionKey: "footer_content",
		category: "navigation",
		title: "Global Footer Configuration",
		subtitle: "Brand narrative, navigation link columns, and social presence",
		status: "published",
		data: {
			brandDescription:
				"LuxeStore Studio is a modern luxury atelier redefining contemporary menswear and refined essentials with architectural tailoring and conscious craftsmanship.",
			newsletterHeading: "STAY IN THE SANCTUARY",
			newsletterSubheading: "Receive private invites to seasonal drops, private sales, and sartorial journal entries.",
			customerCareLinks: [
				{ label: "Track Your Order", url: "/orders" },
				{ label: "Shipping Policy", url: "/policy/shipping" },
				{ label: "Returns & Exchanges", url: "/policy/returns" },
				{ label: "Size Measurement Guide", url: "/policy/size-guide" },
				{ label: "Garment Care & Longevity", url: "/policy/product-care" },
			],
			companyLinks: [
				{ label: "About The Atelier", url: "/about" },
				{ label: "Privacy Policy", url: "/policy/privacy" },
				{ label: "Terms of Service", url: "/policy/terms" },
				{ label: "Client Concierge", url: "/contact" },
				{ label: "Frequently Asked Questions", url: "/faq" },
			],
			socialLinks: [
				{ platform: "Instagram", url: "https://instagram.com" },
				{ platform: "X / Twitter", url: "https://twitter.com" },
				{ platform: "YouTube", url: "https://youtube.com" },
			],
			copyright: "© 2026 LuxeStore Studio Inc. All rights reserved. Registered Indian Couture.",
		},
	},
	{
		sectionKey: "policy_about_us",
		category: "policies",
		title: "About LuxeStore Studio",
		subtitle: "Our heritage, philosophy, and artisanal production standards",
		status: "published",
		data: {
			heroTitle: "ARCHITECTURAL TAILORING. UNCOMPROMISED FINISH.",
			leadParagraph:
				"Founded with the vision to strip away superfluous ornamentation and focus on silhouette, drape, and enduring tactile feel, LuxeStore Studio creates garments for individuals who value understated sophistication.",
			pillars: [
				{
					title: "Conscious Materiality",
					text: "We source GOTS-certified organic cottons, European flax linens, and ethically harvested silk-blends from heritage mills.",
				},
				{
					title: "Precision Proportions",
					text: "Each pattern is refined across dozens of iterative fittings to ensure effortless movement and structured silhouette.",
				},
				{
					title: "Direct-to-Patron",
					text: "By bypassing traditional luxury markups, we deliver bespoke-level craftsmanship directly to discerning wardrobes across India.",
				},
			],
		},
	},
	{
		sectionKey: "policy_shipping",
		category: "policies",
		title: "Shipping & Fulfillment Logistics",
		subtitle: "Packaging, delivery timelines, express couriers, and tracking",
		status: "published",
		data: {
			standardDeliveryDays: "3–5 Business Days",
			expressDeliveryDays: "1–2 Business Days (Metro Cities)",
			courierPartners: ["Blue Dart Air", "Delhivery Direct", "Shiprocket Premier"],
			freeShippingRule: "Orders valued at ₹1,999 or above qualify for complimentary white-glove delivery.",
			packagingDescription:
				"All garments are encased in recycled matte luxury gift boxes, tissue-wrapped, and accompanied by botanical fragrance sachet notes.",
		},
	},
	{
		sectionKey: "policy_returns",
		category: "policies",
		title: "Returns, Refunds & Exchanges",
		subtitle: "Our 7-day effortless doorstep return policy",
		status: "published",
		data: {
			returnWindowDays: 7,
			policyHeadline: "7-Day Effortless Returns & Exchanges",
			conditions: [
				"Garments must be unworn, unwashed, and in their pristine original condition.",
				"All original designer tags, safety seals, and garment bags must remain intact.",
				"Complimentary courier pickup is scheduled directly from your doorstep.",
			],
			refundTimeline: "Refunds are processed back to the original payment source within 24–48 hours of studio inspection.",
		},
	},
	{
		sectionKey: "policy_faq",
		category: "policies",
		title: "Frequently Asked Questions",
		subtitle: "Common inquiries regarding ordering, sizing, payments, and care",
		status: "published",
		data: {
			faqs: [
				{
					q: "How do I know which size will fit me best?",
					a: "Consult our detailed Size Measurement Guide for garment chest, shoulder, waist, and length measurements. You can also contact our Client Concierge for bespoke sizing advice.",
				},
				{
					q: "What payment gateways are supported?",
					a: "We accept all major credit and debit cards, UPI (Google Pay, PhonePe, Paytm), Net Banking, and Razorpay Standard Checkout with 256-bit SSL encryption.",
				},
				{
					q: "Can I cancel or modify an order after placing it?",
					a: "Orders can be cancelled directly through your account dashboard prior to dispatch. Once dispatched with our courier partner, you can utilize our 7-day effortless return policy upon arrival.",
				},
				{
					q: "How do restock alerts work?",
					a: "Click 'NOTIFY ME WHEN AVAILABLE' on any sold-out piece or size. The instant our atelier restocks inventory, an automated priority email is dispatched directly to your inbox.",
				},
			],
		},
	},
	{
		sectionKey: "policy_contact_us",
		category: "policies",
		title: "Client Concierge & Inquiries",
		subtitle: "Reach our style advisors and customer support team",
		status: "published",
		data: {
			conciergeEmail: "concierge@luxestore.studio",
			supportPhone: "+91 9346327988",
			hours: "Monday – Saturday: 10:00 AM – 7:00 PM IST",
			studioAddress: "LuxeStore Studio Headquarters, Unimall, Phagwara, Punjab 144411, India",
			supportPromise: "All inquiries are addressed by human style advisors within 4 working hours.",
		},
	},
];

// Ensure default content documents exist
const ensureDefaultCms = async () => {
	const count = await CmsContent.countDocuments();
	if (count === 0) {
		await CmsContent.insertMany(defaultCmsContents);
		console.log("[CMS SEED] Initialized default CMS sections and policy documents.");
	}
};

/**
 * GET /api/cms/published/:sectionKey
 * Public: returns a published, active CMS content block
 */
export const getPublishedSection = async (req, res) => {
	try {
		await ensureDefaultCms();

		const { sectionKey } = req.params;
		const cleanKey = sectionKey.trim().toLowerCase();
		const now = new Date();

		const section = await CmsContent.findOne({
			sectionKey: cleanKey,
			status: { $in: ["published", "scheduled"] },
			$and: [
				{ $or: [{ scheduledPublishDate: null }, { scheduledPublishDate: { $lte: now } }] },
				{ $or: [{ scheduledExpiryDate: null }, { scheduledExpiryDate: { $gte: now } }] },
			],
		});

		if (!section) {
			// Find in default fallback
			const fallback = defaultCmsContents.find((c) => c.sectionKey === cleanKey);
			if (fallback) {
				return res.json(fallback);
			}
			return res.status(404).json({ message: `CMS section "${cleanKey}" not found.` });
		}

		res.json(section);
	} catch (error) {
		console.error("Error in getPublishedSection:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * GET /api/cms/published
 * Public: returns all published sections in a unified map for efficient frontend caching
 */
export const getAllPublishedSections = async (req, res) => {
	try {
		await ensureDefaultCms();

		const now = new Date();
		const sections = await CmsContent.find({
			status: { $in: ["published", "scheduled"] },
			$and: [
				{ $or: [{ scheduledPublishDate: null }, { scheduledPublishDate: { $lte: now } }] },
				{ $or: [{ scheduledExpiryDate: null }, { scheduledExpiryDate: { $gte: now } }] },
			],
		}).sort({ displayOrder: 1 });

		// Map to dictionary by sectionKey
		const contentMap = {};
		sections.forEach((s) => {
			contentMap[s.sectionKey] = s;
		});

		// Fallback check: fill in missing defaults
		defaultCmsContents.forEach((def) => {
			if (!contentMap[def.sectionKey]) {
				contentMap[def.sectionKey] = def;
			}
		});

		res.json(contentMap);
	} catch (error) {
		console.error("Error in getAllPublishedSections:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * GET /api/cms/admin
 * Admin: get all CMS sections with drafts, status, and version histories
 */
export const getAllSectionsAdmin = async (req, res) => {
	try {
		await ensureDefaultCms();

		const sections = await CmsContent.find()
			.populate("lastUpdatedBy", "name email")
			.sort({ category: 1, displayOrder: 1, updatedAt: -1 });

		res.json(sections);
	} catch (error) {
		console.error("Error in getAllSectionsAdmin:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * POST /api/cms/admin/:sectionKey
 * Admin: save CMS section (as draft or published) with versioning snapshot
 */
export const saveSectionAdmin = async (req, res) => {
	try {
		const { sectionKey } = req.params;
		const cleanKey = sectionKey.trim().toLowerCase();
		const {
			title,
			subtitle,
			status = "published",
			data,
			draftData,
			category,
			displayOrder,
			scheduledPublishDate,
			scheduledExpiryDate,
			comment = "Content updated via Admin Studio CMS",
		} = req.body;

		if (!data && !draftData) {
			return res.status(400).json({ message: "Content payload (data or draftData) is required." });
		}

		let section = await CmsContent.findOne({ sectionKey: cleanKey });

		if (!section) {
			// Find default template
			const def = defaultCmsContents.find((c) => c.sectionKey === cleanKey) || {};
			section = new CmsContent({
				sectionKey: cleanKey,
				category: category || def.category || "general",
				title: title || def.title || cleanKey,
				subtitle: subtitle || def.subtitle || "",
				status,
				data: data || def.data || {},
				draftData: draftData || null,
				displayOrder: displayOrder || def.displayOrder || 1,
				version: 1,
				lastUpdatedBy: req.user._id,
			});
		} else {
			// Existing section: create version history snapshot if publishing
			if (status === "published" && data) {
				const nextVersion = (section.version || 1) + 1;
				section.versionHistory.push({
					version: section.version || 1,
					data: section.data,
					updatedBy: section.lastUpdatedBy,
					updatedAt: section.updatedAt || new Date(),
					status: section.status,
					comment,
				});

				// Cap version history to last 20 snapshots
				if (section.versionHistory.length > 20) {
					section.versionHistory.shift();
				}

				section.version = nextVersion;
				section.data = data;
				section.draftData = null; // Clear draft once published
			} else if (draftData) {
				section.draftData = draftData;
			}

			if (title) section.title = title;
			if (subtitle !== undefined) section.subtitle = subtitle;
			if (category) section.category = category;
			if (status) section.status = status;
			if (displayOrder !== undefined) section.displayOrder = displayOrder;
			section.scheduledPublishDate = scheduledPublishDate ? new Date(scheduledPublishDate) : null;
			section.scheduledExpiryDate = scheduledExpiryDate ? new Date(scheduledExpiryDate) : null;
			section.lastUpdatedBy = req.user._id;
		}

		await section.save();

		res.status(200).json({
			success: true,
			message: `CMS Section "${cleanKey}" saved successfully (${section.status}).`,
			section,
		});
	} catch (error) {
		console.error("Error in saveSectionAdmin:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * POST /api/cms/admin/:sectionKey/publish
 * Admin: promote current draftData to live published data
 */
export const publishSectionAdmin = async (req, res) => {
	try {
		const { sectionKey } = req.params;
		const cleanKey = sectionKey.trim().toLowerCase();

		const section = await CmsContent.findOne({ sectionKey: cleanKey });
		if (!section) {
			return res.status(404).json({ message: "Section not found." });
		}

		if (!section.draftData) {
			return res.status(400).json({ message: "No active draft exists to publish." });
		}

		// Snapshot previous live data
		section.versionHistory.push({
			version: section.version || 1,
			data: section.data,
			updatedBy: section.lastUpdatedBy,
			updatedAt: section.updatedAt || new Date(),
			status: section.status,
			comment: "Published draft release",
		});

		section.version = (section.version || 1) + 1;
		section.data = section.draftData;
		section.draftData = null;
		section.status = "published";
		section.lastUpdatedBy = req.user._id;

		await section.save();

		res.status(200).json({
			success: true,
			message: `Draft published to live storefront (v${section.version}).`,
			section,
		});
	} catch (error) {
		console.error("Error in publishSectionAdmin:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * POST /api/cms/admin/:sectionKey/rollback/:version
 * Admin: rollback section content to an earlier version snapshot
 */
export const rollbackVersionAdmin = async (req, res) => {
	try {
		const { sectionKey, version } = req.params;
		const targetVersion = Number(version);

		const section = await CmsContent.findOne({ sectionKey: sectionKey.trim().toLowerCase() });
		if (!section) {
			return res.status(404).json({ message: "Section not found." });
		}

		const snapshot = section.versionHistory.find((v) => v.version === targetVersion);
		if (!snapshot) {
			return res.status(404).json({ message: `Version ${targetVersion} was not found in audit history.` });
		}

		// Snapshot current data before rolling back
		section.versionHistory.push({
			version: section.version || 1,
			data: section.data,
			updatedBy: section.lastUpdatedBy,
			updatedAt: new Date(),
			status: section.status,
			comment: `Pre-rollback snapshot before restoring v${targetVersion}`,
		});

		section.version = (section.version || 1) + 1;
		section.data = snapshot.data;
		section.status = "published";
		section.lastUpdatedBy = req.user._id;

		await section.save();

		res.status(200).json({
			success: true,
			message: `Section "${section.sectionKey}" successfully restored to v${targetVersion}.`,
			section,
		});
	} catch (error) {
		console.error("Error in rollbackVersionAdmin:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

