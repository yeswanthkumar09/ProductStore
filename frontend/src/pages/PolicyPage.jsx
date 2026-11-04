import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { useCmsStore } from "../stores/useCmsStore";
import { ArrowLeft, ShieldCheck, Truck, RotateCcw, HelpCircle, Mail, Phone, MapPin } from "lucide-react";

const keyMapping = {
	"about": "policy_about_us",
	"shipping": "policy_shipping",
	"returns": "policy_returns",
	"faq": "policy_faq",
	"contact": "policy_contact_us",
	"privacy": "policy_privacy",
	"terms": "policy_terms",
	"size-guide": "size_guide",
	"product-care": "product_care",
};

const PolicyPage = () => {
	const { slug } = useParams();
	const location = useLocation();
	const { fetchPublishedSection, loading } = useCmsStore();

	const [sectionContent, setSectionContent] = useState(null);

	// Determine section key
	let rawKey = slug;
	if (!rawKey) {
		if (location.pathname.includes("/about")) rawKey = "about";
		else if (location.pathname.includes("/faq")) rawKey = "faq";
		else if (location.pathname.includes("/contact")) rawKey = "contact";
		else rawKey = "shipping";
	}

	const sectionKey = keyMapping[rawKey] || `policy_${rawKey}`;

	useEffect(() => {
		fetchPublishedSection(sectionKey).then((data) => {
			if (data) setSectionContent(data);
		});
	}, [sectionKey, fetchPublishedSection]);

	const data = sectionContent?.data || {};

	return (
		<div className='min-h-screen max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16'>
			{/* Breadcrumb / Back Link */}
			<div className='mb-8'>
				<Link
					to='/'
					className='inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black dark:hover:text-white transition-colors'
				>
					<ArrowLeft size={14} />
					<span>Back to Storefront</span>
				</Link>
			</div>

			{/* Section Header */}
			<header className='border-b border-neutral-200 dark:border-neutral-800 pb-8 mb-10'>
				<span className='text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400'>
					LuxeStore Studio Atelier
				</span>
				<h1 className='text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-neutral-950 dark:text-white font-heading mt-2'>
					{sectionContent?.title || "Information & Policy"}
				</h1>
				{sectionContent?.subtitle && (
					<p className='text-sm text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed'>
						{sectionContent.subtitle}
					</p>
				)}
			</header>

			{/* Dynamic Content Body */}
			<div className='space-y-8 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed'>
				{/* 1. About Us Presentation */}
				{sectionKey === "policy_about_us" && (
					<div className='space-y-6'>
						{data.heroTitle && (
							<h2 className='text-xl font-bold uppercase tracking-wide text-neutral-950 dark:text-white'>
								{data.heroTitle}
							</h2>
						)}
						{data.leadParagraph && (
							<p className='text-base text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal'>
								{data.leadParagraph}
							</p>
						)}

						{Array.isArray(data.pillars) && (
							<div className='grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-neutral-100 dark:border-neutral-800'>
								{data.pillars.map((pillar, idx) => (
									<div key={idx} className='p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'>
										<h4 className='text-xs font-bold uppercase tracking-wider text-neutral-950 dark:text-white mb-2'>
											{pillar.title}
										</h4>
										<p className='text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed'>
											{pillar.text}
										</p>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* 2. Shipping Policy Presentation */}
				{sectionKey === "policy_shipping" && (
					<div className='space-y-6'>
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
							<div className='p-5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'>
								<Truck size={20} className='text-neutral-500 mb-2' />
								<h3 className='text-xs font-bold uppercase tracking-wider text-neutral-950 dark:text-white'>
									Standard Delivery
								</h3>
								<p className='text-lg font-black text-neutral-900 dark:text-white mt-1'>
									{data.standardDeliveryDays || "3–5 Business Days"}
								</p>
							</div>

							<div className='p-5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'>
								<ShieldCheck size={20} className='text-neutral-500 mb-2' />
								<h3 className='text-xs font-bold uppercase tracking-wider text-neutral-950 dark:text-white'>
									Express Metro Delivery
								</h3>
								<p className='text-lg font-black text-neutral-900 dark:text-white mt-1'>
									{data.expressDeliveryDays || "1–2 Business Days"}
								</p>
							</div>
						</div>

						{data.freeShippingRule && (
							<div className='p-4 bg-neutral-100 dark:bg-neutral-900 border-l-4 border-black dark:border-white text-xs font-semibold'>
								{data.freeShippingRule}
							</div>
						)}

						{data.packagingDescription && (
							<div>
								<h3 className='text-xs font-bold uppercase tracking-wider text-neutral-950 dark:text-white mb-2'>
									Luxury Atelier Packaging
								</h3>
								<p className='text-neutral-600 dark:text-neutral-400 leading-relaxed'>
									{data.packagingDescription}
								</p>
							</div>
						)}
					</div>
				)}

				{/* 3. Returns & Refunds Presentation */}
				{sectionKey === "policy_returns" && (
					<div className='space-y-6'>
						<div className='p-6 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'>
							<div className='flex items-center gap-3 mb-3'>
								<RotateCcw size={22} className='text-neutral-700 dark:text-neutral-300' />
								<h2 className='text-lg font-black uppercase text-neutral-950 dark:text-white'>
									{data.policyHeadline || `${data.returnWindowDays || 7}-Day Effortless Returns`}
								</h2>
							</div>
							<p className='text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed'>
								We arrange complimentary doorstep courier pickup for all exchange or return requests submitted within {data.returnWindowDays || 7} days of delivery.
							</p>
						</div>

						{Array.isArray(data.conditions) && (
							<div>
								<h3 className='text-xs font-bold uppercase tracking-wider text-neutral-950 dark:text-white mb-3'>
									Conditions for Return
								</h3>
								<ul className='space-y-2 list-disc list-inside text-xs text-neutral-600 dark:text-neutral-400'>
									{data.conditions.map((cond, idx) => (
										<li key={idx}>{cond}</li>
									))}
								</ul>
							</div>
						)}

						{data.refundTimeline && (
							<p className='text-xs font-semibold text-neutral-700 dark:text-neutral-300 pt-2'>
								<strong>Refund SLA:</strong> {data.refundTimeline}
							</p>
						)}
					</div>
				)}

				{/* 4. FAQ Presentation */}
				{sectionKey === "policy_faq" && Array.isArray(data.faqs) && (
					<div className='space-y-4'>
						{data.faqs.map((faq, idx) => (
							<div
								key={idx}
								className='p-5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'
							>
								<h3 className='text-xs sm:text-sm font-bold text-neutral-950 dark:text-white mb-2 flex items-center gap-2'>
									<HelpCircle size={15} className='text-neutral-400 shrink-0' />
									<span>{faq.q}</span>
								</h3>
								<p className='text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed pl-6'>
									{faq.a}
								</p>
							</div>
						))}
					</div>
				)}

				{/* 5. Contact Us Presentation */}
				{sectionKey === "policy_contact_us" && (
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div className='p-6 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4'>
							<div className='flex items-center gap-3'>
								<Mail size={18} className='text-neutral-500' />
								<div>
									<p className='text-[10px] font-bold uppercase tracking-wider text-neutral-400'>
										Client Concierge
									</p>
									<a
										href={`mailto:${data.conciergeEmail || "concierge@luxestore.studio"}`}
										className='text-xs font-bold text-neutral-950 dark:text-white hover:underline font-mono'
									>
										{data.conciergeEmail || "concierge@luxestore.studio"}
									</a>
								</div>
							</div>

							<div className='flex items-center gap-3'>
								<Phone size={18} className='text-neutral-500' />
								<div>
									<p className='text-[10px] font-bold uppercase tracking-wider text-neutral-400'>
										Support Line
									</p>
									<p className='text-xs font-bold text-neutral-950 dark:text-white font-mono'>
										{data.supportPhone || "+91 9346327988"}
									</p>
								</div>
							</div>

							{data.hours && (
								<p className='text-xs text-neutral-500 pt-2 border-t border-neutral-200 dark:border-neutral-800'>
									<strong>Concierge Hours:</strong> {data.hours}
								</p>
							)}
						</div>

						<div className='p-6 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3'>
							<div className='flex items-start gap-3'>
								<MapPin size={18} className='text-neutral-500 shrink-0 mt-0.5' />
								<div>
									<p className='text-[10px] font-bold uppercase tracking-wider text-neutral-400'>
										Atelier Headquarters
									</p>
									<p className='text-xs font-semibold text-neutral-800 dark:text-neutral-200 leading-relaxed mt-1'>
										{data.studioAddress || "Unimall, Phagwara, Punjab, India"}
									</p>
								</div>
							</div>
							{data.supportPromise && (
								<p className='text-[11px] text-neutral-500 italic pt-2'>
									"{data.supportPromise}"
								</p>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default PolicyPage;

