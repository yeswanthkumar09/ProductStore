import { useState, useEffect } from "react";
import { Ruler, Save, Plus, Trash2, Edit2, CheckCircle2, Loader, Sparkles } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const SizeChartManagement = () => {
	const [charts, setCharts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedCategory, setSelectedCategory] = useState("shirts");
	const [editingChart, setEditingChart] = useState(null);
	const [saving, setSaving] = useState(false);

	const loadCharts = async () => {
		setLoading(true);
		try {
			const res = await axios.get("/size-charts");
			setCharts(res.data || []);
			if (res.data && res.data.length > 0) {
				const current = res.data.find((c) => c.category === selectedCategory) || res.data[0];
				setEditingChart(JSON.parse(JSON.stringify(current)));
				setSelectedCategory(current.category);
			}
		} catch (err) {
			console.error("Error loading size charts:", err);
			toast.error("Failed to load size charts");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadCharts();
	}, []);

	const handleCategoryChange = (cat) => {
		setSelectedCategory(cat);
		const match = charts.find((c) => c.category === cat);
		if (match) {
			setEditingChart(JSON.parse(JSON.stringify(match)));
		}
	};

	const handleRowChange = (index, field, value) => {
		if (!editingChart) return;
		const updatedRows = [...editingChart.rows];
		updatedRows[index][field] = value;

		// Dynamic CM vs IN conversion
		if (field === "chestCm" && value) {
			updatedRows[index].chestIn = Number((Number(value) / 2.54).toFixed(1));
		} else if (field === "chestIn" && value) {
			updatedRows[index].chestCm = Number((Number(value) * 2.54).toFixed(1));
		} else if (field === "waistCm" && value) {
			updatedRows[index].waistIn = Number((Number(value) / 2.54).toFixed(1));
		} else if (field === "waistIn" && value) {
			updatedRows[index].waistCm = Number((Number(value) * 2.54).toFixed(1));
		}

		setEditingChart({ ...editingChart, rows: updatedRows });
	};

	const handleAddRow = () => {
		if (!editingChart) return;
		const newRow = {
			size: "Custom",
			chestCm: 100,
			chestIn: 39.4,
			shoulderCm: 46,
			shoulderIn: 18.1,
			lengthCm: 72,
			lengthIn: 28.3,
			sleeveCm: 64,
			sleeveIn: 25.2,
			conversions: { in: "", us: "", uk: "", eu: "", intl: "" },
		};
		setEditingChart({ ...editingChart, rows: [...editingChart.rows, newRow] });
	};

	const handleDeleteRow = (index) => {
		if (!editingChart) return;
		const updatedRows = editingChart.rows.filter((_, i) => i !== index);
		setEditingChart({ ...editingChart, rows: updatedRows });
	};

	const handleSave = async (e) => {
		e.preventDefault();
		if (!editingChart) return;

		setSaving(true);
		try {
			await axios.post("/size-charts", editingChart);
			toast.success(`Size guide for "${editingChart.category}" updated!`);
			loadCharts();
		} catch (err) {
			console.error("Save error:", err);
			toast.error(err.response?.data?.message || "Failed to save size chart");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className='bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl'>
			<div className='flex flex-wrap items-center justify-between pb-6 border-b border-neutral-800 gap-4 mb-6'>
				<div>
					<div className='flex items-center gap-2'>
						<Ruler size={20} className='text-[#e05338]' />
						<h2 className='text-xl font-bold uppercase tracking-wide font-heading'>
							Size Chart &amp; Fit Studio
						</h2>
					</div>
					<p className='text-xs text-neutral-400 mt-1'>
						Manage category measurement tables, metric/imperial unit conversions, and garment measuring instructions.
					</p>
				</div>

				{editingChart && (
					<button
						type='button'
						onClick={handleSave}
						disabled={saving}
						className='px-5 py-2.5 rounded-xl bg-[#e05338] hover:bg-[#d04328] font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50'
					>
						{saving ? <Loader className='animate-spin' size={15} /> : <Save size={15} />}
						<span>Save Changes</span>
					</button>
				)}
			</div>

			{loading ? (
				<div className='py-16 text-center text-neutral-500'>
					<Loader className='animate-spin mx-auto mb-2 text-[#e05338]' size={24} />
					<p className='text-xs font-bold uppercase tracking-wider'>Loading Size Guides...</p>
				</div>
			) : (
				<div className='space-y-6'>
					{/* Category Selector Buttons */}
					<div className='flex flex-wrap gap-2'>
						{charts.map((c) => (
							<button
								key={c.category}
								type='button'
								onClick={() => handleCategoryChange(c.category)}
								className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
									selectedCategory === c.category
										? "bg-white text-black border-white shadow-lg"
										: "bg-neutral-800/60 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
								}`}
							>
								{c.category}
							</button>
						))}
					</div>

					{editingChart && (
						<div className='space-y-6 bg-neutral-950/60 p-6 rounded-xl border border-neutral-800/80'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div>
									<label className='block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1'>
										Guide Title
									</label>
									<input
										type='text'
										value={editingChart.name}
										onChange={(e) => setEditingChart({ ...editingChart, name: e.target.value })}
										className='w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white'
									/>
								</div>
								<div>
									<label className='block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1'>
										Fit Note / Recommendation
									</label>
									<input
										type='text'
										value={editingChart.fitDescription}
										onChange={(e) =>
											setEditingChart({ ...editingChart, fitDescription: e.target.value })
										}
										className='w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white'
									/>
								</div>
							</div>

							{/* Measurements Table */}
							<div>
								<div className='flex items-center justify-between mb-3'>
									<h4 className='text-xs font-extrabold uppercase tracking-wider text-neutral-300'>
										Size Rows &amp; Dimension Metrics
									</h4>
									<button
										type='button'
										onClick={handleAddRow}
										className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold uppercase tracking-wider'
									>
										<Plus size={13} />
										<span>Add Size Row</span>
									</button>
								</div>

								<div className='overflow-x-auto border border-neutral-800 rounded-xl'>
									<table className='w-full text-left text-xs'>
										<thead className='bg-neutral-900 text-neutral-400 font-extrabold uppercase tracking-wider'>
											<tr>
												<th className='py-2.5 px-3'>Size</th>
												<th className='py-2.5 px-3'>Chest (cm)</th>
												<th className='py-2.5 px-3'>Chest (in)</th>
												<th className='py-2.5 px-3'>Shoulder (cm)</th>
												<th className='py-2.5 px-3'>Length (cm)</th>
												<th className='py-2.5 px-3'>Sleeve (cm)</th>
												<th className='py-2.5 px-3'>US / UK</th>
												<th className='py-2.5 px-3'>EU</th>
												<th className='py-2.5 px-3 text-right'>Action</th>
											</tr>
										</thead>
										<tbody className='divide-y divide-neutral-800 font-medium'>
											{editingChart.rows.map((row, idx) => (
												<tr key={idx} className='hover:bg-neutral-900/40'>
													<td className='py-2 px-3'>
														<input
															type='text'
															value={row.size}
															onChange={(e) => handleRowChange(idx, "size", e.target.value)}
															className='w-20 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-bold'
														/>
													</td>
													<td className='py-2 px-3'>
														<input
															type='number'
															value={row.chestCm || ""}
															onChange={(e) => handleRowChange(idx, "chestCm", e.target.value)}
															className='w-16 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs'
														/>
													</td>
													<td className='py-2 px-3 text-neutral-400 font-mono'>
														{row.chestIn || "-"}
													</td>
													<td className='py-2 px-3'>
														<input
															type='number'
															value={row.shoulderCm || ""}
															onChange={(e) =>
																handleRowChange(idx, "shoulderCm", e.target.value)
															}
															className='w-16 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs'
														/>
													</td>
													<td className='py-2 px-3'>
														<input
															type='number'
															value={row.lengthCm || ""}
															onChange={(e) => handleRowChange(idx, "lengthCm", e.target.value)}
															className='w-16 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs'
														/>
													</td>
													<td className='py-2 px-3'>
														<input
															type='number'
															value={row.sleeveCm || ""}
															onChange={(e) => handleRowChange(idx, "sleeveCm", e.target.value)}
															className='w-16 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs'
														/>
													</td>
													<td className='py-2 px-3'>
														<input
															type='text'
															value={row.conversions?.us || ""}
															onChange={(e) => {
																const conv = { ...row.conversions, us: e.target.value, uk: e.target.value };
																handleRowChange(idx, "conversions", conv);
															}}
															className='w-16 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs'
														/>
													</td>
													<td className='py-2 px-3'>
														<input
															type='text'
															value={row.conversions?.eu || ""}
															onChange={(e) => {
																const conv = { ...row.conversions, eu: e.target.value };
																handleRowChange(idx, "conversions", conv);
															}}
															className='w-16 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs'
														/>
													</td>
													<td className='py-2 px-3 text-right'>
														<button
															type='button'
															onClick={() => handleDeleteRow(idx)}
															className='text-neutral-500 hover:text-rose-500 p-1'
															title='Delete Row'
														>
															<Trash2 size={14} />
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default SizeChartManagement;

