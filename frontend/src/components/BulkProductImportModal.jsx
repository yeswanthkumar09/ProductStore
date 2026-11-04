import { useState, useRef } from "react";
import {
	X,
	Upload,
	FileText,
	CheckCircle2,
	AlertTriangle,
	Loader2,
	RefreshCw,
	Layers,
	Download,
	Info,
} from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import toast from "react-hot-toast";

const SAMPLE_CSV = `name,description,category,price,originalPrice,stock,sku,image
"Italian Silk Evening Blazer","Tailored from pure Como silk with satin lapels.","suits",12999,16999,15,"BLZ-SLK-01","https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"
"Selvedge Indigo Raw Jacket","14oz Japanese selvedge denim with antique brass buttons.","jackets",4499,5999,20,"JCK-RAW-02","https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80"
"Classic Linen Oversized Shirt","Breathable French linen with mother-of-pearl buttons.","shirts",2199,2899,25,"SHR-LIN-03","https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80"`;

const BulkProductImportModal = ({ isOpen, onClose, onImportComplete }) => {
	const { previewBulkProducts, executeBulkImport } = useProductStore();

	const [activeTab, setActiveTab] = useState("file"); // "file" | "text"
	const [pastedText, setPastedText] = useState("");
	const [file, setFile] = useState(null);
	const [fileName, setFileName] = useState("");
	const [isValidating, setIsValidating] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [previewData, setPreviewData] = useState(null);
	const [filterTab, setFilterTab] = useState("all"); // "all" | "valid" | "invalid"

	const fileInputRef = useRef(null);

	if (!isOpen) return null;

	const handleFileSelect = (e) => {
		const selected = e.target.files?.[0];
		if (!selected) return;

		setFileName(selected.name);
		setFile(selected);

		const reader = new FileReader();
		reader.onload = async (event) => {
			const content = event.target?.result;
			if (typeof content === "string") {
				await runValidation(content, selected.name.endsWith(".json"));
			}
		};
		reader.readAsText(selected);
	};

	const runValidation = async (rawContent, isJson) => {
		try {
			setIsValidating(true);
			let payload = {};

			if (isJson || rawContent.trim().startsWith("[") || rawContent.trim().startsWith("{")) {
				try {
					const parsed = JSON.parse(rawContent);
					payload.products = Array.isArray(parsed) ? parsed : [parsed];
				} catch (err) {
					toast.error("Malformed JSON file format.");
					setIsValidating(false);
					return;
				}
			} else {
				payload.csvText = rawContent;
			}

			const res = await previewBulkProducts(payload);
			setPreviewData(res);
		} catch (err) {
			// handled in store
		} finally {
			setIsValidating(false);
		}
	};

	const handleValidatePasted = async () => {
		if (!pastedText.trim()) {
			toast.error("Please paste CSV or JSON data first.");
			return;
		}
		const isJson = pastedText.trim().startsWith("[") || pastedText.trim().startsWith("{");
		await runValidation(pastedText, isJson);
	};

	const handleImportValidRecords = async () => {
		if (!previewData || previewData.validCount === 0) {
			toast.error("There are no valid records to import.");
			return;
		}

		const validProducts = previewData.records
			.filter((r) => r.isValid)
			.map((r) => r.data);

		try {
			setIsImporting(true);
			const res = await executeBulkImport(validProducts);
			if (onImportComplete) onImportComplete(res);
			onClose();
		} catch (err) {
			// handled in store
		} finally {
			setIsImporting(false);
		}
	};

	const downloadSampleCsv = () => {
		const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.setAttribute("download", "luxestore_products_sample.csv");
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const filteredRecords = (previewData?.records || []).filter((r) => {
		if (filterTab === "valid") return r.isValid;
		if (filterTab === "invalid") return !r.isValid;
		return true;
	});

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in'>
			<div className='bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden'>
				{/* Header */}
				<div className='px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between'>
					<div>
						<h2 className='text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2'>
							<Layers size={18} className='text-accent' />
							Bulk Product Onboarding Facility
						</h2>
						<p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
							Import multi-item catalogs using structured CSV or JSON records with pre-flight schema validation.
						</p>
					</div>
					<div className='flex items-center gap-2'>
						<button
							type='button'
							onClick={downloadSampleCsv}
							className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors'
						>
							<Download size={13} />
							<span>Sample CSV</span>
						</button>
						<button
							type='button'
							onClick={onClose}
							className='p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'
						>
							<X size={18} />
						</button>
					</div>
				</div>

				{/* Body Content */}
				<div className='p-6 overflow-y-auto flex-1 space-y-6'>
					{/* Mode Switcher */}
					<div className='flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3'>
						<button
							type='button'
							onClick={() => setActiveTab("file")}
							className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
								activeTab === "file"
									? "bg-black text-white dark:bg-white dark:text-neutral-950 shadow-sm"
									: "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
							}`}
						>
							Upload CSV / JSON File
						</button>
						<button
							type='button'
							onClick={() => setActiveTab("text")}
							className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
								activeTab === "text"
									? "bg-black text-white dark:bg-white dark:text-neutral-950 shadow-sm"
									: "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
							}`}
						>
							Paste CSV / JSON Text
						</button>
					</div>

					{/* File Input Tab */}
					{activeTab === "file" && (
						<div
							onClick={() => fileInputRef.current?.click()}
							className='border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 rounded-xl p-8 text-center cursor-pointer transition-all bg-neutral-50/50 dark:bg-neutral-950/40'
						>
							<input
								ref={fileInputRef}
								type='file'
								accept='.csv,.json'
								onChange={handleFileSelect}
								className='hidden'
							/>
							<div className='mx-auto w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 mb-3'>
								<Upload size={20} />
							</div>
							<p className='text-xs font-bold text-neutral-800 dark:text-neutral-200'>
								{fileName ? `Selected: ${fileName}` : "Click to select a .csv or .json file from your computer"}
							</p>
							<p className='text-[11px] text-neutral-500 dark:text-neutral-400 mt-1'>
								Maximum 500 rows per batch. Columns: name, description, category, price, originalPrice, stock, sku, image
							</p>
						</div>
					)}

					{/* Raw Text Tab */}
					{activeTab === "text" && (
						<div className='space-y-3'>
							<textarea
								rows={6}
								value={pastedText}
								onChange={(e) => setPastedText(e.target.value)}
								placeholder='Paste raw CSV rows or JSON array of product objects here...'
								className='w-full p-3 font-mono text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-accent'
							/>
							<div className='flex justify-end'>
								<button
									type='button'
									onClick={handleValidatePasted}
									disabled={isValidating || !pastedText.trim()}
									className='px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold transition-all disabled:opacity-50'
								>
									{isValidating ? "Validating..." : "Validate Text Data"}
								</button>
							</div>
						</div>
					)}

					{/* Loading indicator */}
					{isValidating && (
						<div className='py-8 text-center text-neutral-500 dark:text-neutral-400 text-xs flex items-center justify-center gap-2'>
							<Loader2 size={16} className='animate-spin text-accent' />
							<span>Validating product records against catalog taxonomy and SKU records...</span>
						</div>
					)}

					{/* Validation Summary & Preview Table */}
					{previewData && !isValidating && (
						<div className='space-y-4'>
							<div className='p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
								<div className='flex items-center gap-3'>
									<div className='flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white'>
										<span>Total Records:</span>
										<span className='font-mono px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800'>
											{previewData.totalRecords}
										</span>
									</div>
									<div className='flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400'>
										<CheckCircle2 size={14} />
										<span>Valid: {previewData.validCount}</span>
									</div>
									{previewData.invalidCount > 0 && (
										<div className='flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400'>
											<AlertTriangle size={14} />
											<span>Invalid / Errors: {previewData.invalidCount}</span>
										</div>
									)}
								</div>

								{/* Filter pills */}
								<div className='flex items-center gap-1 text-xs'>
									<button
										type='button'
										onClick={() => setFilterTab("all")}
										className={`px-2.5 py-1 rounded-lg font-semibold ${
											filterTab === "all"
												? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950"
												: "text-neutral-600 dark:text-neutral-400"
										}`}
									>
										All ({previewData.records.length})
									</button>
									<button
										type='button'
										onClick={() => setFilterTab("valid")}
										className={`px-2.5 py-1 rounded-lg font-semibold ${
											filterTab === "valid"
												? "bg-emerald-600 text-white"
												: "text-emerald-600 dark:text-emerald-400"
										}`}
									>
										Valid ({previewData.validCount})
									</button>
									<button
										type='button'
										onClick={() => setFilterTab("invalid")}
										className={`px-2.5 py-1 rounded-lg font-semibold ${
											filterTab === "invalid"
												? "bg-rose-600 text-white"
												: "text-rose-600 dark:text-rose-400"
										}`}
									>
										Errors ({previewData.invalidCount})
									</button>
								</div>
							</div>

							{/* Records Preview Table */}
							<div className='overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl'>
								<table className='w-full text-left border-collapse text-xs'>
									<thead>
										<tr className='bg-neutral-100 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'>
											<th className='py-2.5 px-3'>#</th>
											<th className='py-2.5 px-3'>Status</th>
											<th className='py-2.5 px-3'>Product Name</th>
											<th className='py-2.5 px-3'>Category</th>
											<th className='py-2.5 px-3'>Price (₹)</th>
											<th className='py-2.5 px-3'>Stock</th>
											<th className='py-2.5 px-3'>SKU</th>
											<th className='py-2.5 px-3'>Validation Notes</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-neutral-200 dark:divide-neutral-800'>
										{filteredRecords.map((rec) => (
											<tr
												key={rec.row}
												className={`${
													rec.isValid
														? "hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
														: "bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70"
												} transition-colors`}
											>
												<td className='py-2.5 px-3 font-mono text-neutral-500'>{rec.row}</td>
												<td className='py-2.5 px-3'>
													{rec.isValid ? (
														<span className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'>
															<CheckCircle2 size={11} /> Valid
														</span>
													) : (
														<span className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'>
															<AlertTriangle size={11} /> Invalid
														</span>
													)}
												</td>
												<td className='py-2.5 px-3 font-bold text-neutral-900 dark:text-white max-w-xs truncate'>
													{rec.data.name || "(Empty Name)"}
												</td>
												<td className='py-2.5 px-3 text-neutral-700 dark:text-neutral-300 capitalize'>
													{rec.data.categoryName || rec.data.category}
												</td>
												<td className='py-2.5 px-3 font-mono text-neutral-900 dark:text-white'>
													₹{Number(rec.data.price || 0).toLocaleString("en-IN")}
												</td>
												<td className='py-2.5 px-3 font-mono text-neutral-700 dark:text-neutral-300'>
													{rec.data.stock}
												</td>
												<td className='py-2.5 px-3 font-mono text-[11px] text-neutral-600 dark:text-neutral-400'>
													{rec.data.sku}
												</td>
												<td className='py-2.5 px-3 max-w-xs'>
													{rec.errors?.length > 0 && (
														<div className='text-[10px] text-rose-600 dark:text-rose-400 font-semibold space-y-0.5'>
															{rec.errors.map((err, i) => (
																<p key={i}>• {err}</p>
															))}
														</div>
													)}
													{rec.warnings?.length > 0 && (
														<div className='text-[10px] text-amber-600 dark:text-amber-400 space-y-0.5'>
															{rec.warnings.map((wrn, i) => (
																<p key={i}>⚠️ {wrn}</p>
															))}
														</div>
													)}
													{rec.isValid && rec.warnings?.length === 0 && (
														<span className='text-[10px] text-emerald-600 dark:text-emerald-400 font-medium'>
															Ready for catalog onboarding
														</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>

				{/* Footer Controls */}
				<div className='px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-950/60'>
					<div className='text-xs text-neutral-500'>
						{previewData
							? `${previewData.validCount} ready to insert into active catalogue.`
							: "Upload file or validate text to inspect records before inserting."}
					</div>

					<div className='flex items-center gap-2'>
						<button
							type='button'
							onClick={onClose}
							className='px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-colors'
						>
							Cancel
						</button>

						<button
							type='button'
							disabled={isImporting || !previewData || previewData.validCount === 0}
							onClick={handleImportValidRecords}
							className='px-5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-2'
						>
							{isImporting ? (
								<>
									<Loader2 size={14} className='animate-spin' />
									<span>Importing {previewData?.validCount} Products...</span>
								</>
							) : (
								<>
									<CheckCircle2 size={14} />
									<span>Confirm & Import ({previewData?.validCount || 0} Valid Products)</span>
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default BulkProductImportModal;

