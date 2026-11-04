import { useState, useEffect } from "react";
import { useCmsStore } from "../stores/useCmsStore";
import {
	Layout,
	FileText,
	Eye,
	Save,
	UploadCloud,
	RotateCcw,
	Check,
	Clock,
	Layers,
	ChevronRight,
	HelpCircle,
	ShieldCheck,
	Truck,
	Phone,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import toast from "react-hot-toast";

const CmsManagement = () => {
	const {
		allSectionsAdmin,
		fetchAllSectionsAdmin,
		saveSectionAdmin,
		publishSectionAdmin,
		rollbackVersionAdmin,
		loading,
	} = useCmsStore();

	const [activeSubTab, setActiveSubTab] = useState("homepage");
	const [selectedSectionKey, setSelectedSectionKey] = useState("homepage_sections");
	const [activeEditorData, setActiveEditorData] = useState(null);
	const [showVersionModal, setShowVersionModal] = useState(false);
	const [showLivePreview, setShowLivePreview] = useState(false);
	const [versionHistoryList, setVersionHistoryList] = useState([]);

	useEffect(() => {
		fetchAllSectionsAdmin();
	}, [fetchAllSectionsAdmin]);

	// Sync editor when selected section changes or allSectionsAdmin updates
	useEffect(() => {
		const current = allSectionsAdmin.find((s) => s.sectionKey === selectedSectionKey);
		if (current) {
			// Prefer draftData if active, otherwise live data
			setActiveEditorData(JSON.parse(JSON.stringify(current.draftData || current.data || {})));
			setVersionHistoryList(current.versionHistory || []);
		}
	}, [selectedSectionKey, allSectionsAdmin]);

	const currentSection = allSectionsAdmin.find((s) => s.sectionKey === selectedSectionKey);

	const handleSave = async (asDraft = false) => {
		if (!currentSection || !activeEditorData) return;

		const payload = {
			title: currentSection.title,
			subtitle: currentSection.subtitle,
			status: asDraft ? "draft" : "published",
			data: asDraft ? currentSection.data : activeEditorData,
			draftData: asDraft ? activeEditorData : null,
			comment: asDraft ? "Saved draft changes" : "Published live update via CMS Editor",
		};

		await saveSectionAdmin(selectedSectionKey, payload);
	};

	const handlePublishDraft = async () => {
		if (!currentSection) return;
		await publishSectionAdmin(selectedSectionKey);
	};

	const handleRollback = async (version) => {
		if (window.confirm(`Are you sure you want to restore Version ${version}?`)) {
			await rollbackVersionAdmin(selectedSectionKey, version);
			setShowVersionModal(false);
		}
	};

	// Categorize sections
	const homepageSections = allSectionsAdmin.filter(
		(s) => s.category === "homepage" || s.sectionKey === "homepage_sections"
	);
	const policySections = allSectionsAdmin.filter(
		(s) => s.category === "policies" || s.sectionKey.startsWith("policy_")
	);
	const navigationSections = allSectionsAdmin.filter(
		(s) => s.category === "navigation" || s.sectionKey === "footer_content"
	);

	return (
		<div className='bg-white dark:bg-gray-900/60 backdrop-blur-xl border border-neutral-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm'>
			{/* Top Header */}
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-gray-800'>
				<div>
					<div className='flex items-center gap-2'>
						<Layout size={20} className='text-accent' />
						<h2 className='text-lg font-bold text-neutral-900 dark:text-white'>Dynamic Website Content Management (CMS)</h2>
					</div>
					<p className='text-xs text-neutral-500 dark:text-gray-400 mt-0.5'>
						Update homepage rails, policies, legal documents, and footer without touching React codebase.
					</p>
				</div>

				<div className='flex items-center gap-2'>
					<button
						type='button'
						onClick={() => setShowLivePreview((prev) => !prev)}
						className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
							showLivePreview
								? "bg-accent/20 border-accent text-accent"
								: "bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200 hover:text-black dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:text-white"
						}`}
					>
						<Eye size={14} />
						<span>{showLivePreview ? "Hide Preview" : "Live Preview"}</span>
					</button>

					<button
						type='button'
						onClick={() => setShowVersionModal(true)}
						className='inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 text-neutral-700 border border-neutral-300 hover:bg-neutral-200 hover:text-black dark:bg-gray-800 dark:border-transparent dark:hover:bg-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors'
					>
						<Clock size={14} />
						<span>v{currentSection?.version || 1} History</span>
					</button>
				</div>
			</div>

			{/* Sub-Category Nav */}
			<div className='flex items-center gap-2 my-6 border-b border-neutral-200 dark:border-gray-800 pb-3 overflow-x-auto'>
				<button
					type='button'
					onClick={() => {
						setActiveSubTab("homepage");
						setSelectedSectionKey("homepage_sections");
					}}
					className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all ${
						activeSubTab === "homepage"
							? "bg-black text-white dark:bg-white dark:text-neutral-950 font-bold shadow-sm"
							: "text-neutral-600 hover:text-black hover:bg-neutral-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/60 font-medium"
					}`}
				>
					<Layers size={14} />
					<span>Homepage Sections</span>
				</button>

				<button
					type='button'
					onClick={() => {
						setActiveSubTab("policies");
						setSelectedSectionKey("policy_about_us");
					}}
					className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all ${
						activeSubTab === "policies"
							? "bg-black text-white dark:bg-white dark:text-neutral-950 font-bold shadow-sm"
							: "text-neutral-600 hover:text-black hover:bg-neutral-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/60 font-medium"
					}`}
				>
					<FileText size={14} />
					<span>Policies & Atelier Info</span>
				</button>

				<button
					type='button'
					onClick={() => {
						setActiveSubTab("navigation");
						setSelectedSectionKey("footer_content");
					}}
					className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all ${
						activeSubTab === "navigation"
							? "bg-black text-white dark:bg-white dark:text-neutral-950 font-bold shadow-sm"
							: "text-neutral-600 hover:text-black hover:bg-neutral-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/60 font-medium"
					}`}
				>
					<Layout size={14} />
					<span>Global Footer & Links</span>
				</button>
			</div>

			{/* Main Editor Grid (Sidebar + Editor Panel) */}
			<div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
				{/* Section Selector Sidebar */}
				<div className='lg:col-span-1 space-y-2'>
					<p className='text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2'>
						Managed Content Blocks
					</p>

					{activeSubTab === "homepage" && (
						<div className='space-y-1.5'>
							{homepageSections.map((s) => (
								<button
									key={s.sectionKey}
									type='button'
									onClick={() => setSelectedSectionKey(s.sectionKey)}
									className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
										selectedSectionKey === s.sectionKey
											? "bg-black text-white border-black dark:bg-white dark:text-neutral-950 dark:border-white shadow-sm font-bold"
											: "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:text-black dark:bg-gray-950/60 dark:border-gray-800/60 dark:text-gray-400 dark:hover:bg-gray-800/40 dark:hover:text-gray-200 font-medium"
									}`}
								>
									<div>
										<p className='text-xs font-bold'>{s.title}</p>
										<span className='text-[10px] text-gray-500 capitalize'>{s.status}</span>
									</div>
									<ChevronRight size={14} />
								</button>
							))}
						</div>
					)}

					{activeSubTab === "policies" && (
						<div className='space-y-1.5'>
							{policySections.map((s) => (
								<button
									key={s.sectionKey}
									type='button'
									onClick={() => setSelectedSectionKey(s.sectionKey)}
									className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
										selectedSectionKey === s.sectionKey
											? "bg-black text-white border-black dark:bg-white dark:text-neutral-950 dark:border-white shadow-sm font-bold"
											: "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:text-black dark:bg-gray-950/60 dark:border-gray-800/60 dark:text-gray-400 dark:hover:bg-gray-800/40 dark:hover:text-gray-200 font-medium"
									}`}
								>
									<div>
										<p className='text-xs font-bold'>{s.title}</p>
										<span className='text-[10px] text-gray-500 capitalize'>{s.status}</span>
									</div>
									<ChevronRight size={14} />
								</button>
							))}
						</div>
					)}

					{activeSubTab === "navigation" && (
						<div className='space-y-1.5'>
							{navigationSections.map((s) => (
								<button
									key={s.sectionKey}
									type='button'
									onClick={() => setSelectedSectionKey(s.sectionKey)}
									className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
										selectedSectionKey === s.sectionKey
											? "bg-black text-white border-black dark:bg-white dark:text-neutral-950 dark:border-white shadow-sm font-bold"
											: "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:text-black dark:bg-gray-950/60 dark:border-gray-800/60 dark:text-gray-400 dark:hover:bg-gray-800/40 dark:hover:text-gray-200 font-medium"
									}`}
								>
									<div>
										<p className='text-xs font-bold'>{s.title}</p>
										<span className='text-[10px] text-gray-500 capitalize'>{s.status}</span>
									</div>
									<ChevronRight size={14} />
								</button>
							))}
						</div>
					)}
				</div>

				{/* Active Editor Panel */}
				<div className='lg:col-span-3 bg-white dark:bg-gray-950/80 border border-neutral-200 dark:border-gray-800/80 rounded-xl p-6 flex flex-col justify-between shadow-sm'>
					{activeEditorData ? (
						<div className='space-y-6'>
							{/* Section Header Info */}
							<div className='flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-gray-800/80'>
								<div>
									<h3 className='text-sm font-black uppercase tracking-wider text-neutral-900 dark:text-white'>
										{currentSection?.title}
									</h3>
									<p className='text-xs text-neutral-500 dark:text-gray-400 mt-0.5'>{currentSection?.subtitle}</p>
								</div>
								<div className='flex items-center gap-2'>
									{currentSection?.draftData && (
										<span className='px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'>
											Unpublished Draft Active
										</span>
									)}
									<span className='px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'>
										v{currentSection?.version || 1} Live
									</span>
								</div>
							</div>

							{/* 1. HOMEPAGE SECTIONS CONFIGURATION */}
							{selectedSectionKey === "homepage_sections" && Array.isArray(activeEditorData.sections) && (
								<div className='space-y-4'>
									<p className='text-xs text-neutral-500 dark:text-gray-400'>
										Toggle storefront rails and customize editorial headings without code changes.
									</p>
									<div className='space-y-3'>
										{activeEditorData.sections.map((sec, idx) => (
											<div
												key={sec.id}
												className='p-4 bg-neutral-50 dark:bg-gray-900 border border-neutral-200 dark:border-gray-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3'
											>
												<div className='flex items-center gap-3'>
													<span className='font-mono font-bold text-neutral-500 dark:text-gray-400 text-xs'>
														#{sec.order || idx + 1}
													</span>
													<div>
														<h4 className='text-xs font-bold text-neutral-900 dark:text-white'>{sec.name}</h4>
														<p className='text-[10px] text-neutral-500 dark:text-gray-500'>ID: {sec.id}</p>
													</div>
												</div>

												{sec.heading !== undefined && (
													<div className='flex items-center gap-2 flex-1 max-w-sm'>
														<input
															type='text'
															value={sec.heading || ""}
															onChange={(e) => {
																const newSections = [...activeEditorData.sections];
																newSections[idx].heading = e.target.value;
																setActiveEditorData({ ...activeEditorData, sections: newSections });
															}}
															placeholder='Main Heading'
															className='p-1.5 bg-white dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-xs text-neutral-900 dark:text-white rounded w-1/2 focus:outline-none focus:border-neutral-900 dark:focus:border-accent placeholder-neutral-400 dark:placeholder-gray-500'
														/>
														<input
															type='text'
															value={sec.subheading || ""}
															onChange={(e) => {
																const newSections = [...activeEditorData.sections];
																newSections[idx].subheading = e.target.value;
																setActiveEditorData({ ...activeEditorData, sections: newSections });
															}}
															placeholder='Subheading'
															className='p-1.5 bg-white dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-xs text-neutral-900 dark:text-white rounded w-1/2 focus:outline-none focus:border-neutral-900 dark:focus:border-accent placeholder-neutral-400 dark:placeholder-gray-500'
														/>
													</div>
												)}

												<div className='flex items-center gap-3'>
													<button
														type='button'
														onClick={() => {
															const newSections = [...activeEditorData.sections];
															newSections[idx].enabled = !newSections[idx].enabled;
															setActiveEditorData({ ...activeEditorData, sections: newSections });
														}}
														className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors ${
															sec.enabled
																? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
																: "bg-neutral-100 text-neutral-700 border border-neutral-300 dark:bg-gray-800 dark:text-gray-400 dark:border-transparent"
														}`}
													>
														{sec.enabled ? "Enabled" : "Disabled"}
													</button>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{/* 2. POLICY: ABOUT US */}
							{selectedSectionKey === "policy_about_us" && (
								<div className='space-y-4 text-xs'>
									<div>
										<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>Hero Title</label>
										<input
											type='text'
											value={activeEditorData.heroTitle || ""}
											onChange={(e) => setActiveEditorData({ ...activeEditorData, heroTitle: e.target.value })}
											className='w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white font-bold'
										/>
									</div>
									<div>
										<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>Lead Narrative</label>
										<textarea
											rows={3}
											value={activeEditorData.leadParagraph || ""}
											onChange={(e) => setActiveEditorData({ ...activeEditorData, leadParagraph: e.target.value })}
											className='w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white leading-relaxed'
										/>
									</div>
								</div>
							)}

							{/* 3. POLICY: SHIPPING */}
							{selectedSectionKey === "policy_shipping" && (
								<div className='space-y-4 text-xs'>
									<div className='grid grid-cols-2 gap-3'>
										<div>
											<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>Standard Delivery Time</label>
											<input
												type='text'
												value={activeEditorData.standardDeliveryDays || ""}
												onChange={(e) => setActiveEditorData({ ...activeEditorData, standardDeliveryDays: e.target.value })}
												className='w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white'
											/>
										</div>
										<div>
											<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>Express Delivery Time</label>
											<input
												type='text'
												value={activeEditorData.expressDeliveryDays || ""}
												onChange={(e) => setActiveEditorData({ ...activeEditorData, expressDeliveryDays: e.target.value })}
												className='w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white'
											/>
										</div>
									</div>
									<div>
										<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>Free Shipping Rule Statement</label>
										<input
											type='text'
											value={activeEditorData.freeShippingRule || ""}
											onChange={(e) => setActiveEditorData({ ...activeEditorData, freeShippingRule: e.target.value })}
											className='w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white'
										/>
									</div>
								</div>
							)}

							{/* 4. POLICY: RETURNS */}
							{selectedSectionKey === "policy_returns" && (
								<div className='space-y-4 text-xs'>
									<div className='grid grid-cols-2 gap-3'>
										<div>
											<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>Return Window (Days)</label>
											<input
												type='number'
												value={activeEditorData.returnWindowDays || 7}
												onChange={(e) => setActiveEditorData({ ...activeEditorData, returnWindowDays: Number(e.target.value) })}
												className='w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white'
											/>
										</div>
										<div>
											<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>Refund SLA Timeline</label>
											<input
												type='text'
												value={activeEditorData.refundTimeline || ""}
												onChange={(e) => setActiveEditorData({ ...activeEditorData, refundTimeline: e.target.value })}
												className='w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white'
											/>
										</div>
									</div>
								</div>
							)}

							{/* 5. POLICY: CONTACT US */}
							{selectedSectionKey === "policy_contact_us" && (
								<div className='space-y-4 text-xs'>
									<div className='grid grid-cols-2 gap-3'>
										<div>
											<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>Concierge Email</label>
											<input
												type='email'
												value={activeEditorData.conciergeEmail || ""}
												onChange={(e) => setActiveEditorData({ ...activeEditorData, conciergeEmail: e.target.value })}
												className='w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white'
											/>
										</div>
										<div>
											<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>Support Phone</label>
											<input
												type='text'
												value={activeEditorData.supportPhone || ""}
												onChange={(e) => setActiveEditorData({ ...activeEditorData, supportPhone: e.target.value })}
												className='w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white'
											/>
										</div>
									</div>
									<div>
										<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>Operating Hours</label>
										<input
											type='text'
											value={activeEditorData.hours || ""}
											onChange={(e) => setActiveEditorData({ ...activeEditorData, hours: e.target.value })}
											className='w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white'
										/>
									</div>
									<div>
										<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>Headquarters Address</label>
										<input
											type='text'
											value={activeEditorData.studioAddress || ""}
											onChange={(e) => setActiveEditorData({ ...activeEditorData, studioAddress: e.target.value })}
											className='w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white'
										/>
									</div>
								</div>
							)}

							{/* 6. POLICY: FAQ */}
							{selectedSectionKey === "policy_faq" && Array.isArray(activeEditorData.faqs) && (
								<div className='space-y-4 text-xs'>
									<div className='flex items-center justify-between'>
										<p className='text-neutral-600 dark:text-gray-400'>Manage questions and answers displayed to customers.</p>
										<button
											type='button'
											onClick={() => {
												setActiveEditorData({
													...activeEditorData,
													faqs: [
														...activeEditorData.faqs,
														{ q: "New Question Title", a: "Provide helpful answer details here." },
													],
												});
											}}
											className='inline-flex items-center gap-1 text-accent text-xs font-bold hover:underline'
										>
											<Plus size={13} />
											<span>Add FAQ</span>
										</button>
									</div>

									<div className='space-y-3'>
										{activeEditorData.faqs.map((faq, idx) => (
											<div key={idx} className='p-3.5 bg-neutral-50 dark:bg-gray-900 border border-neutral-200 dark:border-gray-800 rounded-xl space-y-2'>
												<div className='flex items-center justify-between gap-2'>
													<input
														type='text'
														value={faq.q}
														onChange={(e) => {
															const newFaqs = [...activeEditorData.faqs];
															newFaqs[idx].q = e.target.value;
															setActiveEditorData({ ...activeEditorData, faqs: newFaqs });
														}}
														className='flex-1 p-2 bg-white dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 font-bold text-neutral-900 dark:text-white rounded'
													/>
													<button
														type='button'
														onClick={() => {
															const newFaqs = activeEditorData.faqs.filter((_, i) => i !== idx);
															setActiveEditorData({ ...activeEditorData, faqs: newFaqs });
														}}
														className='p-1.5 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300'
													>
														<Trash2 size={13} />
													</button>
												</div>
												<textarea
													rows={2}
													value={faq.a}
													onChange={(e) => {
														const newFaqs = [...activeEditorData.faqs];
														newFaqs[idx].a = e.target.value;
														setActiveEditorData({ ...activeEditorData, faqs: newFaqs });
													}}
													className='w-full p-2 bg-white dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-800 dark:text-gray-300 rounded'
												/>
											</div>
										))}
									</div>
								</div>
							)}

							{/* 7. FOOTER CONTENT */}
							{selectedSectionKey === "footer_content" && (
								<div className='space-y-4 text-xs'>
									<div>
										<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>Brand Atelier Blurb</label>
										<textarea
											rows={2}
											value={activeEditorData.brandDescription || ""}
											onChange={(e) => setActiveEditorData({ ...activeEditorData, brandDescription: e.target.value })}
											className='w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white'
										/>
									</div>
									<div className='grid grid-cols-2 gap-3'>
										<div>
											<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>Newsletter Title</label>
											<input
												type='text'
												value={activeEditorData.newsletterHeading || ""}
												onChange={(e) => setActiveEditorData({ ...activeEditorData, newsletterHeading: e.target.value })}
												className='w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white'
											/>
										</div>
										<div>
											<label className='block font-bold text-neutral-700 dark:text-gray-300 uppercase mb-1'>Copyright Statement</label>
											<input
												type='text'
												value={activeEditorData.copyright || ""}
												onChange={(e) => setActiveEditorData({ ...activeEditorData, copyright: e.target.value })}
												className='w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-gray-950 border border-neutral-300 dark:border-gray-800 text-neutral-900 dark:text-white'
											/>
										</div>
									</div>
								</div>
							)}

							{/* Live Preview Panel (Collapsible) */}
							{showLivePreview && (
								<div className='mt-6 p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-white'>
									<div className='flex items-center justify-between pb-2 mb-3 border-b border-neutral-800'>
										<span className='text-[10px] font-mono uppercase tracking-widest text-neutral-400'>
											Live Storefront Preview
										</span>
									</div>
									<pre className='text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48'>
										{JSON.stringify(activeEditorData, null, 2)}
									</pre>
								</div>
							)}
						</div>
					) : (
						<div className='py-20 text-center text-gray-500'>Select a content block to edit.</div>
					)}

					{/* Action Buttons */}
					<div className='mt-8 pt-4 border-t border-neutral-200 dark:border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-3'>
						<div className='text-[11px] text-neutral-500 dark:text-gray-500'>
							Changes are version-tracked and auditable.
						</div>

						<div className='flex items-center gap-2'>
							<button
								type='button'
								disabled={loading}
								onClick={() => handleSave(true)}
								className='px-4 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors disabled:opacity-50'
							>
								Save As Draft
							</button>

							{currentSection?.draftData && (
								<button
									type='button'
									disabled={loading}
									onClick={handlePublishDraft}
									className='px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors disabled:opacity-50'
								>
									Publish Draft Live
								</button>
							)}

							<button
								type='button'
								disabled={loading}
								onClick={() => handleSave(false)}
								className='px-6 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold transition-colors disabled:opacity-50 shadow-md'
							>
								{loading ? "Publishing..." : "Publish Directly"}
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Version History Modal */}
			{showVersionModal && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in'>
					<div className='bg-white dark:bg-gray-900 border border-neutral-200 dark:border-gray-800 max-w-lg w-full p-6 rounded-2xl shadow-2xl relative max-h-[80vh] overflow-y-auto'>
						<div className='flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-gray-800'>
							<div>
								<h3 className='text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white'>
									Version History Audit Log
								</h3>
								<p className='text-xs text-neutral-500 dark:text-gray-400 mt-0.5'>{currentSection?.title}</p>
							</div>
							<button
								type='button'
								onClick={() => setShowVersionModal(false)}
								className='p-1 text-neutral-400 hover:text-neutral-900 dark:text-gray-400 dark:hover:text-white'
							>
								<X size={18} />
							</button>
						</div>

						<div className='mt-4 divide-y divide-neutral-200 dark:divide-gray-800 text-xs'>
							{versionHistoryList.length === 0 ? (
								<div className='py-8 text-center text-neutral-400 dark:text-gray-500'>
									No earlier version snapshots recorded yet.
								</div>
							) : (
								versionHistoryList.map((ver, idx) => (
									<div key={idx} className='py-3.5 flex items-center justify-between gap-3'>
										<div>
											<div className='flex items-center gap-2'>
												<span className='font-mono font-bold text-accent'>
													Version {ver.version}
												</span>
												<span className='text-[10px] text-neutral-500 dark:text-gray-500'>
													{new Date(ver.updatedAt).toLocaleString("en-IN")}
												</span>
											</div>
											<p className='text-neutral-700 dark:text-gray-300 mt-0.5'>{ver.comment || "Content revision"}</p>
										</div>

										<button
											type='button'
											onClick={() => handleRollback(ver.version)}
											className='px-3 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 font-bold transition-colors'
										>
											Restore
										</button>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default CmsManagement;

