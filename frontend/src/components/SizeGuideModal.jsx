import { useState, useEffect } from "react";
import { X, Ruler, HelpCircle, Globe, Check, Sparkles, Loader } from "lucide-react";
import axios from "../lib/axios";

const SizeGuideModal = ({ isOpen, onClose, category = "shirts", productName = "Garment" }) => {
	const [activeTab, setActiveTab] = useState("measurements"); // "measurements" | "international" | "how_to_measure"
	const [unit, setUnit] = useState("cm"); // "cm" | "in"
	const [sizeChart, setSizeChart] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (isOpen) {
			setLoading(true);
			axios
				.get(`/size-charts/category/${encodeURIComponent(category)}`)
				.then((res) => {
					setSizeChart(res.data);
				})
				.catch((err) => {
					console.error("Error loading size chart:", err);
				})
				.finally(() => {
					setLoading(false);
				});
		}
	}, [isOpen, category]);

	if (!isOpen) return null;

	const rows = sizeChart?.rows || [];
	const instructions = sizeChart?.instructions || [];

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in select-none'>
			<div className='relative w-full max-w-2xl bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200'>
				{/* Modal Header */}
				<div className='p-5 sm:p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between'>
					<div>
						<div className='flex items-center gap-2'>
							<Ruler size={16} className='text-[#e05338]' />
							<span className='text-[10px] font-extrabold uppercase tracking-widest text-neutral-400'>
								Intelligent Fit Guide &bull; {category.toUpperCase()}
							</span>
						</div>
						<h2 className='text-lg sm:text-xl font-black uppercase tracking-tight text-neutral-900 dark:text-white mt-0.5'>
							{sizeChart?.name || `${productName} Size Guide`}
						</h2>
					</div>
					<button
						type='button'
						onClick={onClose}
						className='p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-black dark:hover:text-white transition-colors'
						aria-label='Close size guide'
					>
						<X size={20} />
					</button>
				</div>

				{/* Navigation Tabs & Unit Toggle Bar */}
				<div className='px-5 sm:px-6 py-3 bg-neutral-50 dark:bg-neutral-900/40 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3'>
					<div className='flex items-center gap-1 sm:gap-2'>
						<button
							type='button'
							onClick={() => setActiveTab("measurements")}
							className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
								activeTab === "measurements"
									? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
									: "text-neutral-500 hover:text-black dark:hover:text-white"
							}`}
						>
							Measurements
						</button>
						<button
							type='button'
							onClick={() => setActiveTab("international")}
							className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
								activeTab === "international"
									? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
									: "text-neutral-500 hover:text-black dark:hover:text-white"
							}`}
						>
							International Conversion
						</button>
						<button
							type='button'
							onClick={() => setActiveTab("how_to_measure")}
							className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
								activeTab === "how_to_measure"
									? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
									: "text-neutral-500 hover:text-black dark:hover:text-white"
							}`}
						>
							How To Measure
						</button>
					</div>

					{/* Unit Toggle: CM vs INCHES */}
					{activeTab === "measurements" && (
						<div className='inline-flex items-center p-0.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-[11px] font-bold uppercase tracking-wider'>
							<button
								type='button'
								onClick={() => setUnit("cm")}
								className={`px-2.5 py-1 rounded-md transition-all ${
									unit === "cm"
										? "bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white shadow-sm"
										: "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
								}`}
							>
								CM
							</button>
							<button
								type='button'
								onClick={() => setUnit("in")}
								className={`px-2.5 py-1 rounded-md transition-all ${
									unit === "in"
										? "bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white shadow-sm"
										: "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
								}`}
							>
								INCHES
							</button>
						</div>
					)}
				</div>

				{/* Modal Body */}
				<div className='p-5 sm:p-6 overflow-y-auto flex-1'>
					{loading ? (
						<div className='py-16 text-center text-neutral-400'>
							<Loader className='animate-spin mx-auto mb-2 text-[#e05338]' size={24} />
							<p className='text-xs font-bold uppercase tracking-widest'>Calculating Fit Metrics...</p>
						</div>
					) : (
						<>
							{/* TAB 1: MEASUREMENTS TABLE */}
							{activeTab === "measurements" && (
								<div className='space-y-4'>
									{sizeChart?.fitDescription && (
										<p className='text-xs text-neutral-500 dark:text-neutral-400 italic bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800'>
											&ldquo;{sizeChart.fitDescription}&rdquo;
										</p>
									)}

									<div className='overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl'>
										<table className='w-full text-left text-xs'>
											<thead className='bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 uppercase font-extrabold tracking-wider'>
												<tr>
													<th className='py-3 px-4'>Brand Size</th>
													{sizeChart?.columns?.includes("chest") && (
														<th className='py-3 px-4'>Chest ({unit.toUpperCase()})</th>
													)}
													{sizeChart?.columns?.includes("shoulder") && (
														<th className='py-3 px-4'>Shoulder ({unit.toUpperCase()})</th>
													)}
													{sizeChart?.columns?.includes("length") && (
														<th className='py-3 px-4'>Length ({unit.toUpperCase()})</th>
													)}
													{sizeChart?.columns?.includes("sleeve") && (
														<th className='py-3 px-4'>Sleeve ({unit.toUpperCase()})</th>
													)}
													{sizeChart?.columns?.includes("waist") && (
														<th className='py-3 px-4'>Waist ({unit.toUpperCase()})</th>
													)}
													{sizeChart?.columns?.includes("hip") && (
														<th className='py-3 px-4'>Hip ({unit.toUpperCase()})</th>
													)}
													{sizeChart?.columns?.includes("inseam") && (
														<th className='py-3 px-4'>Inseam ({unit.toUpperCase()})</th>
													)}
													{sizeChart?.columns?.includes("footLength") && (
														<th className='py-3 px-4'>Foot Length ({unit.toUpperCase()})</th>
													)}
												</tr>
											</thead>
											<tbody className='divide-y divide-neutral-100 dark:divide-neutral-800/80 font-medium'>
												{rows.map((r, rIdx) => (
													<tr
														key={rIdx}
														className='hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors'
													>
														<td className='py-3 px-4 font-bold text-neutral-950 dark:text-white uppercase'>
															{r.size}
														</td>
														{sizeChart?.columns?.includes("chest") && (
															<td className='py-3 px-4 font-mono'>
																{unit === "cm" ? r.chestCm : r.chestIn || "-"}
															</td>
														)}
														{sizeChart?.columns?.includes("shoulder") && (
															<td className='py-3 px-4 font-mono'>
																{unit === "cm" ? r.shoulderCm : r.shoulderIn || "-"}
															</td>
														)}
														{sizeChart?.columns?.includes("length") && (
															<td className='py-3 px-4 font-mono'>
																{unit === "cm" ? r.lengthCm : r.lengthIn || "-"}
															</td>
														)}
														{sizeChart?.columns?.includes("sleeve") && (
															<td className='py-3 px-4 font-mono'>
																{unit === "cm" ? r.sleeveCm : r.sleeveIn || "-"}
															</td>
														)}
														{sizeChart?.columns?.includes("waist") && (
															<td className='py-3 px-4 font-mono'>
																{unit === "cm" ? r.waistCm : r.waistIn || "-"}
															</td>
														)}
														{sizeChart?.columns?.includes("hip") && (
															<td className='py-3 px-4 font-mono'>
																{unit === "cm" ? r.hipCm : r.hipIn || "-"}
															</td>
														)}
														{sizeChart?.columns?.includes("inseam") && (
															<td className='py-3 px-4 font-mono'>
																{unit === "cm" ? r.inseamCm : r.inseamIn || "-"}
															</td>
														)}
														{sizeChart?.columns?.includes("footLength") && (
															<td className='py-3 px-4 font-mono'>
																{unit === "cm" ? r.footLengthCm : r.footLengthIn || "-"}
															</td>
														)}
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							)}

							{/* TAB 2: INTERNATIONAL SIZE CONVERSION */}
							{activeTab === "international" && (
								<div className='space-y-4'>
									<div className='overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl'>
										<table className='w-full text-left text-xs'>
											<thead className='bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 uppercase font-extrabold tracking-wider'>
												<tr>
													<th className='py-3 px-4'>LuxeStore Size</th>
													<th className='py-3 px-4'>India (IN)</th>
													<th className='py-3 px-4'>United States (US)</th>
													<th className='py-3 px-4'>United Kingdom (UK)</th>
													<th className='py-3 px-4'>Europe (EU)</th>
													<th className='py-3 px-4'>International</th>
												</tr>
											</thead>
											<tbody className='divide-y divide-neutral-100 dark:divide-neutral-800/80 font-medium'>
												{rows.map((r, rIdx) => (
													<tr
														key={rIdx}
														className='hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors'
													>
														<td className='py-3 px-4 font-bold text-neutral-950 dark:text-white uppercase'>
															{r.size}
														</td>
														<td className='py-3 px-4 font-mono font-semibold text-[#e05338]'>
															{r.conversions?.in || r.size}
														</td>
														<td className='py-3 px-4 font-mono'>{r.conversions?.us || "-"}</td>
														<td className='py-3 px-4 font-mono'>{r.conversions?.uk || "-"}</td>
														<td className='py-3 px-4 font-mono'>{r.conversions?.eu || "-"}</td>
														<td className='py-3 px-4 font-mono font-bold'>{r.conversions?.intl || r.size}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							)}

							{/* TAB 3: HOW TO MEASURE GUIDE */}
							{activeTab === "how_to_measure" && (
								<div className='space-y-4'>
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
										{instructions.map((ins, iIdx) => (
											<div
												key={iIdx}
												className='p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40'
											>
												<div className='flex items-center gap-2 mb-1.5'>
													<span className='w-5 h-5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black font-bold text-[10px] flex items-center justify-center'>
														{iIdx + 1}
													</span>
													<h4 className='text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white'>
														{ins.title}
													</h4>
												</div>
												<p className='text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed'>
													{ins.instruction}
												</p>
												{ins.tip && (
													<p className='text-[11px] text-[#e05338] font-medium mt-2'>
														Pro Tip: {ins.tip}
													</p>
												)}
											</div>
										))}
									</div>

									<div className='p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5'>
										<HelpCircle size={16} className='shrink-0 mt-0.5' />
										<p>
											Between sizes? If your chest or waist measurement falls between two standard sizes, we recommend selecting the larger size for a relaxed drape or the smaller size for a tailored slim silhouette.
										</p>
									</div>
								</div>
							)}
						</>
					)}
				</div>

				{/* Modal Footer */}
				<div className='p-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500'>
					<span>Effortless 7-day size exchange available on all orders.</span>
					<button
						type='button'
						onClick={onClose}
						className='px-4 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-bold uppercase tracking-wider text-[11px]'
					>
						Done
					</button>
				</div>
			</div>
		</div>
	);
};

export default SizeGuideModal;

