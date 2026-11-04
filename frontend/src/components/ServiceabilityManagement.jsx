import { useState, useEffect } from "react";
import {
	MapPin,
	Plus,
	Search,
	Download,
	Upload,
	FileText,
	CheckCircle,
	XCircle,
	Edit,
	Trash2,
	RefreshCw,
	Layers,
	Truck,
	AlertCircle,
	Building2,
	Send,
	ShieldAlert,
	Loader2,
} from "lucide-react";
import { useServiceabilityStore } from "../stores/useServiceabilityStore";
import { toast } from "react-hot-toast";

const INDIAN_STATES = [
	"Andhra Pradesh",
	"Arunachal Pradesh",
	"Assam",
	"Bihar",
	"Chhattisgarh",
	"Goa",
	"Gujarat",
	"Haryana",
	"Himachal Pradesh",
	"Jharkhand",
	"Karnataka",
	"Kerala",
	"Madhya Pradesh",
	"Maharashtra",
	"Manipur",
	"Meghalaya",
	"Mizoram",
	"Nagaland",
	"Odisha",
	"Punjab",
	"Rajasthan",
	"Sikkim",
	"Tamil Nadu",
	"Telangana",
	"Tripura",
	"Uttar Pradesh",
	"Uttarakhand",
	"West Bengal",
	"Delhi",
	"Chandigarh",
	"Jammu & Kashmir",
	"Ladakh",
	"Puducherry",
];

const ServiceabilityManagement = () => {
	const {
		locations,
		total,
		page,
		pages,
		stats,
		loading,
		warehouseSettings,
		warehouseLoading,
		fetchLocations,
		fetchStats,
		fetchWarehouseSettings,
		updateWarehouseSettings,
		testShiprocket,
		createLocation,
		updateLocation,
		deleteLocation,
		importCsv,
		exportCsv,
		downloadTemplate,
	} = useServiceabilityStore();

	const [search, setSearch] = useState("");
	const [selectedState, setSelectedState] = useState("all");
	const [activeFilter, setActiveFilter] = useState("all");
	const [currentPage, setCurrentPage] = useState(1);

	// Warehouse form state
	const [warehouseForm, setWarehouseForm] = useState({
		warehouseName: "Primary Fulfillment Hub",
		pickupPincode: "110001",
		contactPerson: "Warehouse Manager",
		contactPhone: "+91 98765 43210",
		addressLine1: "Connaught Place Hub",
		city: "New Delhi",
		state: "Delhi",
	});
	const [isSavingWarehouse, setIsSavingWarehouse] = useState(false);

	// Shiprocket Inspector state
	const [testPincode, setTestPincode] = useState("144411");
	const [testCod, setTestCod] = useState(0);
	const [testWeight, setTestWeight] = useState("0.5");
	const [testDeclaredValue, setTestDeclaredValue] = useState("1000");
	const [testLoading, setTestLoading] = useState(false);
	const [testResult, setTestResult] = useState(null);

	// Modals
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [editingLocation, setEditingLocation] = useState(null);
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [importFile, setImportFile] = useState(null);
	const [importPreview, setImportPreview] = useState(null);
	const [importing, setImporting] = useState(false);

	const [formData, setFormData] = useState({
		state: "Maharashtra",
		district: "",
		city: "",
		locality: "",
		pincode: "",
		deliveryFee: 0,
		minOrderValue: 0,
		freeDeliveryThreshold: 1999,
		estimatedDeliveryDays: "2-4 business days",
		serviceRestrictions: "",
		isActive: true,
	});

	useEffect(() => {
		fetchStats();
		fetchWarehouseSettings();
	}, [fetchStats, fetchWarehouseSettings]);

	useEffect(() => {
		if (warehouseSettings) {
			setWarehouseForm({
				warehouseName: warehouseSettings.warehouseName || "Primary Fulfillment Hub",
				pickupPincode: warehouseSettings.pickupPincode || "110001",
				contactPerson: warehouseSettings.contactPerson || "",
				contactPhone: warehouseSettings.contactPhone || "",
				addressLine1: warehouseSettings.addressLine1 || "",
				city: warehouseSettings.city || "New Delhi",
				state: warehouseSettings.state || "Delhi",
			});
		}
	}, [warehouseSettings]);

	useEffect(() => {
		fetchLocations({
			search,
			state: selectedState,
			isActive: activeFilter,
			page: currentPage,
			limit: 15,
		});
	}, [fetchLocations, search, selectedState, activeFilter, currentPage]);

	const handleSaveWarehouse = async (e) => {
		e.preventDefault();
		if (!warehouseForm.pickupPincode || warehouseForm.pickupPincode.length !== 6) {
			toast.error("Please enter a valid 6-digit origin pickup PIN code.");
			return;
		}
		setIsSavingWarehouse(true);
		try {
			await updateWarehouseSettings(warehouseForm);
		} finally {
			setIsSavingWarehouse(false);
		}
	};

	const handleTestServiceability = async (e) => {
		e.preventDefault();
		if (!testPincode || testPincode.length !== 6) {
			toast.error("Please enter a valid 6-digit destination PIN code.");
			return;
		}
		setTestLoading(true);
		setTestResult(null);
		try {
			const res = await testShiprocket({
				destinationPincode: testPincode,
				cod: Number(testCod),
				weight: Number(testWeight) || 0.5,
				declaredValue: Number(testDeclaredValue) || 1000,
			});
			setTestResult(res);
		} catch (err) {
			setTestResult({
				serviceable: false,
				isInconclusive: true,
				message: err.response?.data?.message || "Failed to reach Shiprocket API.",
			});
		} finally {
			setTestLoading(false);
		}
	};

	const handleOpenAdd = () => {
		setEditingLocation(null);
		setFormData({
			state: "Maharashtra",
			district: "",
			city: "",
			locality: "",
			pincode: "",
			deliveryFee: 0,
			minOrderValue: 0,
			freeDeliveryThreshold: 1999,
			estimatedDeliveryDays: "2-4 business days",
			serviceRestrictions: "",
			isActive: true,
		});
		setIsAddModalOpen(true);
	};

	const handleOpenEdit = (loc) => {
		setEditingLocation(loc);
		setFormData({
			state: loc.state,
			district: loc.district,
			city: loc.city,
			locality: loc.locality || "",
			pincode: loc.pincode,
			deliveryFee: loc.deliveryFee || 0,
			minOrderValue: loc.minOrderValue || 0,
			freeDeliveryThreshold: loc.freeDeliveryThreshold || 1999,
			estimatedDeliveryDays: loc.estimatedDeliveryDays || "2-4 business days",
			serviceRestrictions: loc.serviceRestrictions || "",
			isActive: loc.isActive,
		});
		setIsAddModalOpen(true);
	};

	const handleSubmitForm = async (e) => {
		e.preventDefault();
		try {
			if (editingLocation) {
				await updateLocation(editingLocation._id, formData);
			} else {
				await createLocation(formData);
			}
			setIsAddModalOpen(false);
		} catch (err) {
			// error handled in store toast
		}
	};

	const handleToggleActive = async (loc) => {
		await updateLocation(loc._id, { isActive: !loc.isActive });
	};

	const handlePreviewCsv = async () => {
		if (!importFile) return;
		setImporting(true);
		try {
			const res = await importCsv(importFile, true);
			setImportPreview(res);
		} finally {
			setImporting(false);
		}
	};

	const handleApplyImport = async () => {
		if (!importFile) return;
		setImporting(true);
		try {
			await importCsv(importFile, false);
			setIsImportModalOpen(false);
			setImportFile(null);
			setImportPreview(null);
		} finally {
			setImporting(false);
		}
	};

	return (
		<div className='space-y-6 max-w-7xl mx-auto'>
			{/* Top Metric Cards */}
			<div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
				<div className='bg-gray-900/60 border border-gray-800 rounded-2xl p-4 backdrop-blur-md'>
					<div className='flex items-center gap-3'>
						<div className='p-2.5 rounded-xl bg-accent-light text-accent'>
							<MapPin size={20} />
						</div>
						<div>
							<p className='text-xs text-gray-400 font-medium'>Total Locations</p>
							<p className='text-xl font-bold text-white font-mono mt-0.5'>
								{stats?.totalLocations ?? total}
							</p>
						</div>
					</div>
				</div>

				<div className='bg-gray-900/60 border border-gray-800 rounded-2xl p-4 backdrop-blur-md'>
					<div className='flex items-center gap-3'>
						<div className='p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400'>
							<CheckCircle size={20} />
						</div>
						<div>
							<p className='text-xs text-gray-400 font-medium'>Active PINs</p>
							<p className='text-xl font-bold text-emerald-400 font-mono mt-0.5'>
								{stats?.activeLocations ?? 0}
							</p>
						</div>
					</div>
				</div>

				<div className='bg-gray-900/60 border border-gray-800 rounded-2xl p-4 backdrop-blur-md'>
					<div className='flex items-center gap-3'>
						<div className='p-2.5 rounded-xl bg-blue-500/10 text-blue-400'>
							<Layers size={20} />
						</div>
						<div>
							<p className='text-xs text-gray-400 font-medium'>States Covered</p>
							<p className='text-xl font-bold text-blue-400 font-mono mt-0.5'>
								{stats?.statesCovered ?? 0}
							</p>
						</div>
					</div>
				</div>

				<div className='bg-gray-900/60 border border-gray-800 rounded-2xl p-4 backdrop-blur-md'>
					<div className='flex items-center gap-3'>
						<div className='p-2.5 rounded-xl bg-purple-500/10 text-purple-400'>
							<Truck size={20} />
						</div>
						<div>
							<p className='text-xs text-gray-400 font-medium'>Cities Covered</p>
							<p className='text-xl font-bold text-purple-400 font-mono mt-0.5'>
								{stats?.citiesCovered ?? 0}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Shiprocket Warehouse & Live Courier Inspector Section */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
				{/* Card 1: Warehouse / Pickup Settings */}
				<div className='bg-gray-900/80 border border-gray-800 rounded-3xl p-6 shadow-xl backdrop-blur-md'>
					<div className='flex items-center justify-between pb-4 border-b border-gray-800 mb-4'>
						<div className='flex items-center gap-2.5'>
							<div className='p-2 rounded-xl bg-accent-light text-accent'>
								<Building2 size={18} />
							</div>
							<div>
								<h3 className='text-sm font-bold text-white font-heading'>Pickup & Warehouse Address</h3>
								<p className='text-[11px] text-gray-400'>
									Origin PIN code used by Shiprocket to calculate delivery routes and freight rates
								</p>
							</div>
						</div>
					</div>

					<form onSubmit={handleSaveWarehouse} className='space-y-3.5 text-xs'>
						<div className='grid grid-cols-2 gap-3'>
							<div>
								<label className='block font-semibold text-gray-300 mb-1'>Hub / Warehouse Name *</label>
								<input
									type='text'
									required
									value={warehouseForm.warehouseName}
									onChange={(e) => setWarehouseForm({ ...warehouseForm, warehouseName: e.target.value })}
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent'
								/>
							</div>
							<div>
								<label className='block font-semibold text-emerald-400 mb-1 flex items-center gap-1'>
									<MapPin size={13} /> Pickup PIN Code *
								</label>
								<input
									type='text'
									required
									maxLength={6}
									value={warehouseForm.pickupPincode}
									onChange={(e) =>
										setWarehouseForm({ ...warehouseForm, pickupPincode: e.target.value.replace(/\D/g, "") })
									}
									className='w-full bg-gray-950 border border-emerald-500/40 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-400'
								/>
							</div>
						</div>

						<div className='grid grid-cols-2 gap-3'>
							<div>
								<label className='block font-semibold text-gray-300 mb-1'>Contact Person</label>
								<input
									type='text'
									value={warehouseForm.contactPerson}
									onChange={(e) => setWarehouseForm({ ...warehouseForm, contactPerson: e.target.value })}
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent'
								/>
							</div>
							<div>
								<label className='block font-semibold text-gray-300 mb-1'>Contact Phone</label>
								<input
									type='tel'
									value={warehouseForm.contactPhone}
									onChange={(e) => setWarehouseForm({ ...warehouseForm, contactPhone: e.target.value })}
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-accent'
								/>
							</div>
						</div>

						<div>
							<label className='block font-semibold text-gray-300 mb-1'>Street Address</label>
							<input
								type='text'
								value={warehouseForm.addressLine1}
								onChange={(e) => setWarehouseForm({ ...warehouseForm, addressLine1: e.target.value })}
								className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent'
							/>
						</div>

						<div className='grid grid-cols-2 gap-3'>
							<div>
								<label className='block font-semibold text-gray-300 mb-1'>City</label>
								<input
									type='text'
									value={warehouseForm.city}
									onChange={(e) => setWarehouseForm({ ...warehouseForm, city: e.target.value })}
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent'
								/>
							</div>
							<div>
								<label className='block font-semibold text-gray-300 mb-1'>State</label>
								<select
									value={warehouseForm.state}
									onChange={(e) => setWarehouseForm({ ...warehouseForm, state: e.target.value })}
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent'
								>
									{INDIAN_STATES.map((st) => (
										<option key={st} value={st}>
											{st}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className='flex justify-end pt-2'>
							<button
								type='submit'
								disabled={isSavingWarehouse || warehouseLoading}
								className='px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-md transition-all disabled:opacity-40'
							>
								{isSavingWarehouse ? "Saving..." : "Save Warehouse Settings"}
							</button>
						</div>
					</form>
				</div>

				{/* Card 2: Real-time Shiprocket Courier Inspector */}
				<div className='bg-gray-900/80 border border-gray-800 rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between'>
					<div>
						<div className='flex items-center justify-between pb-4 border-b border-gray-800 mb-4'>
							<div className='flex items-center gap-2.5'>
								<div className='p-2 rounded-xl bg-blue-500/10 text-blue-400'>
									<Truck size={18} />
								</div>
								<div>
									<h3 className='text-sm font-bold text-white font-heading'>
										Shiprocket Courier Serviceability Inspector
									</h3>
									<p className='text-[11px] text-gray-400'>
										Query official Shiprocket courier availability directly for any destination PIN
									</p>
								</div>
							</div>
						</div>

						<form onSubmit={handleTestServiceability} className='space-y-3.5 text-xs'>
							<div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5'>
								<div>
									<label className='block font-semibold text-gray-300 mb-1'>Destination PIN *</label>
									<input
										type='text'
										required
										maxLength={6}
										value={testPincode}
										onChange={(e) => setTestPincode(e.target.value.replace(/\D/g, ""))}
										placeholder='144411'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-accent'
									/>
								</div>
								<div>
									<label className='block font-semibold text-gray-300 mb-1'>Payment Mode</label>
									<select
										value={testCod}
										onChange={(e) => setTestCod(Number(e.target.value))}
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent'
									>
										<option value={0}>Prepaid</option>
										<option value={1}>COD</option>
									</select>
								</div>
								<div>
									<label className='block font-semibold text-gray-300 mb-1'>Weight (kg)</label>
									<input
										type='number'
										step='0.1'
										min='0.1'
										value={testWeight}
										onChange={(e) => setTestWeight(e.target.value)}
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-accent'
									/>
								</div>
								<div>
									<label className='block font-semibold text-gray-300 mb-1'>Value (₹)</label>
									<input
										type='number'
										min='1'
										value={testDeclaredValue}
										onChange={(e) => setTestDeclaredValue(e.target.value)}
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-accent'
									/>
								</div>
							</div>

							<button
								type='submit'
								disabled={testLoading}
								className='w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-40'
							>
								{testLoading ? (
									<>
										<Loader2 size={14} className='animate-spin' />
										<span>Querying Shiprocket API...</span>
									</>
								) : (
									<>
										<Send size={14} />
										<span>Test Live Serviceability</span>
									</>
								)}
							</button>
						</form>

						{/* Inspector Results */}
						{testResult && (
							<div className='mt-4 p-3.5 rounded-2xl border text-xs space-y-2 bg-gray-950/60 border-gray-800'>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-2'>
										{testResult.serviceable ? (
											<span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20'>
												<CheckCircle size={14} /> Serviceable ({testResult.availableCouriersCount || 0} couriers)
											</span>
										) : testResult.isInconclusive ? (
											<span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20'>
												<AlertCircle size={14} /> Inconclusive / Provider Diagnostic
											</span>
										) : (
											<span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20'>
												<XCircle size={14} /> Unserviceable
											</span>
										)}
									</div>
									<span className='text-[11px] text-gray-500 font-mono'>
										Origin: {testResult.pickupPincode} → Dest: {testResult.destinationPincode}
									</span>
								</div>

								{testResult.message && (
									<p className='text-gray-300'>{testResult.message}</p>
								)}

								{/* Courier Options List */}
								{testResult.couriers && testResult.couriers.length > 0 && (
									<div className='pt-2 max-h-36 overflow-y-auto space-y-1.5 divide-y divide-gray-800/40'>
										{testResult.couriers.map((c, i) => (
											<div key={i} className='pt-1.5 flex items-center justify-between text-[11px]'>
												<div>
													<span className='font-semibold text-white'>{c.courierName}</span>
													<span className='text-gray-400 ml-2 font-mono'>₹{c.rate}</span>
												</div>
												<div className='flex items-center gap-2'>
													<span className='text-gray-400'>{c.estimatedDays}</span>
													{c.cod === 1 ? (
														<span className='text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded'>COD</span>
													) : (
														<span className='text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded'>Prepaid</span>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						)}
					</div>

					<div className='mt-4 pt-3 border-t border-gray-800/60 text-[11px] text-gray-400 flex items-center gap-1.5'>
						<ShieldAlert size={13} className='text-accent shrink-0' />
						<span>Shiprocket is the authoritative source of truth. Allowlist restrictions are not enforced independently.</span>
					</div>
				</div>
			</div>

			{/* Main Container */}
			<div className='bg-gray-900/80 border border-gray-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md'>
				{/* Header & Actions */}
				<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800'>
					<div>
						<h2 className='text-xl font-extrabold text-white font-heading'>
							Destination Policy & Merchant Restrictions
						</h2>
						<p className='text-xs text-gray-400 mt-1'>
							Shiprocket provides authoritative real-time courier serviceability. Locations below configure optional custom freight fees or explicit merchant business restrictions.
						</p>
					</div>

					<div className='flex items-center gap-2 flex-wrap'>
						<button
							onClick={downloadTemplate}
							type='button'
							className='inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 border border-gray-700 transition-colors'
							title='Download CSV Template'
						>
							<FileText size={14} /> Template
						</button>

						<button
							onClick={() => {
								setImportPreview(null);
								setImportFile(null);
								setIsImportModalOpen(true);
							}}
							type='button'
							className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-xs font-semibold text-blue-400 border border-blue-500/30 transition-colors'
						>
							<Upload size={14} /> Import CSV
						</button>

						<button
							onClick={exportCsv}
							type='button'
							className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-white border border-gray-700 transition-colors'
						>
							<Download size={14} /> Export CSV
						</button>

						<button
							onClick={handleOpenAdd}
							type='button'
							className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-md'
						>
							<Plus size={15} /> Add Location
						</button>
					</div>
				</div>

				{/* Search & Filter Bar */}
				<div className='py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-gray-800/60'>
					<div className='relative'>
						<Search className='absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500' size={14} />
						<input
							type='text'
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setCurrentPage(1);
							}}
							placeholder='Search by PIN code, city, district...'
							className='w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-accent'
						/>
					</div>

					<div>
						<select
							value={selectedState}
							onChange={(e) => {
								setSelectedState(e.target.value);
								setCurrentPage(1);
							}}
							className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-accent'
						>
							<option value='all'>All States & Union Territories</option>
							{INDIAN_STATES.map((st) => (
								<option key={st} value={st}>
									{st}
								</option>
							))}
						</select>
					</div>

					<div>
						<select
							value={activeFilter}
							onChange={(e) => {
								setActiveFilter(e.target.value);
								setCurrentPage(1);
							}}
							className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-accent'
						>
							<option value='all'>All Statuses</option>
							<option value='true'>Active Only</option>
							<option value='false'>Inactive Only</option>
						</select>
					</div>
				</div>

				{/* Locations Data Table */}
				<div className='overflow-x-auto mt-2'>
					<table className='w-full text-left text-xs'>
						<thead className='text-gray-400 uppercase bg-gray-950/60 border-b border-gray-800 text-[11px]'>
							<tr>
								<th className='py-3.5 px-4'>PIN Code</th>
								<th className='py-3.5 px-4'>City & Locality</th>
								<th className='py-3.5 px-4'>District & State</th>
								<th className='py-3.5 px-4'>Delivery Fee</th>
								<th className='py-3.5 px-4'>Est. Window</th>
								<th className='py-3.5 px-4'>Status</th>
								<th className='py-3.5 px-4 text-right'>Actions</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-gray-800/60'>
							{loading ? (
								<tr>
									<td colSpan={7} className='py-12 text-center text-gray-500'>
										Loading serviceable locations...
									</td>
								</tr>
							) : locations.length === 0 ? (
								<tr>
									<td colSpan={7} className='py-12 text-center text-gray-500'>
										No serviceable locations found matching criteria.
									</td>
								</tr>
							) : (
								locations.map((loc) => (
									<tr key={loc._id} className='hover:bg-gray-800/30 transition-colors'>
										<td className='py-3.5 px-4 font-mono font-bold text-white text-sm'>
											{loc.pincode}
										</td>
										<td className='py-3.5 px-4'>
											<span className='font-semibold text-white'>{loc.city}</span>
											{loc.locality && (
												<span className='block text-gray-400 text-[11px]'>{loc.locality}</span>
											)}
										</td>
										<td className='py-3.5 px-4 text-gray-300'>
											{loc.district}, <span className='text-gray-400'>{loc.state}</span>
										</td>
										<td className='py-3.5 px-4 font-mono'>
											{loc.deliveryFee === 0 ? (
												<span className='text-emerald-400 font-bold'>FREE</span>
											) : (
												<span className='text-white font-medium'>
													₹{loc.deliveryFee}
													{loc.freeDeliveryThreshold && (
														<span className='block text-[10px] text-gray-400 font-sans'>
															Free over ₹{loc.freeDeliveryThreshold}
														</span>
													)}
												</span>
											)}
										</td>
										<td className='py-3.5 px-4 text-gray-300 font-medium'>
											{loc.estimatedDeliveryDays || "2-4 days"}
										</td>
										<td className='py-3.5 px-4'>
											<button
												type='button'
												onClick={() => handleToggleActive(loc)}
												className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
													loc.isActive
														? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
														: "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
												}`}
											>
												{loc.isActive ? (
													<>
														<CheckCircle size={11} /> Active
													</>
												) : (
													<>
														<XCircle size={11} /> Inactive
													</>
												)}
											</button>
										</td>
										<td className='py-3.5 px-4 text-right'>
											<div className='flex items-center justify-end gap-2'>
												<button
													type='button'
													onClick={() => handleOpenEdit(loc)}
													className='p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800'
													title='Edit Location'
												>
													<Edit size={14} />
												</button>
												<button
													type='button'
													onClick={() => {
														if (
															window.confirm(
																`Delete serviceable location ${loc.pincode} (${loc.city})?`
															)
														) {
															deleteLocation(loc._id);
														}
													}}
													className='p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-gray-800'
													title='Delete Location'
												>
													<Trash2 size={14} />
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{pages > 1 && (
					<div className='pt-6 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400'>
						<span>
							Showing page {page} of {pages} ({total} total locations)
						</span>
						<div className='flex gap-1.5'>
							<button
								type='button'
								disabled={page <= 1}
								onClick={() => setCurrentPage((p) => p - 1)}
								className='px-3 py-1.5 rounded-lg bg-gray-800 text-white disabled:opacity-40'
							>
								Previous
							</button>
							<button
								type='button'
								disabled={page >= pages}
								onClick={() => setCurrentPage((p) => p + 1)}
								className='px-3 py-1.5 rounded-lg bg-gray-800 text-white disabled:opacity-40'
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Add / Edit Location Modal */}
			{isAddModalOpen && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in'>
					<div className='bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl'>
						<div className='flex items-center justify-between pb-4 border-b border-gray-800 mb-5'>
							<h3 className='text-base font-bold text-white font-heading'>
								{editingLocation ? "Edit Serviceable Location" : "Add Serviceable Delivery Location"}
							</h3>
							<button
								onClick={() => setIsAddModalOpen(false)}
								className='text-gray-400 hover:text-white text-sm'
							>
								✕
							</button>
						</div>

						<form onSubmit={handleSubmitForm} className='space-y-4 text-xs'>
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='block font-semibold text-gray-300 mb-1'>PIN Code (6 digits) *</label>
									<input
										type='text'
										required
										maxLength={6}
										value={formData.pincode}
										onChange={(e) =>
											setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })
										}
										placeholder='400053'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-accent'
									/>
								</div>

								<div>
									<label className='block font-semibold text-gray-300 mb-1'>City *</label>
									<input
										type='text'
										required
										value={formData.city}
										onChange={(e) => setFormData({ ...formData, city: e.target.value })}
										placeholder='Mumbai'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-accent'
									/>
								</div>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='block font-semibold text-gray-300 mb-1'>District *</label>
									<input
										type='text'
										required
										value={formData.district}
										onChange={(e) => setFormData({ ...formData, district: e.target.value })}
										placeholder='Mumbai Suburban'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-accent'
									/>
								</div>

								<div>
									<label className='block font-semibold text-gray-300 mb-1'>State *</label>
									<select
										value={formData.state}
										onChange={(e) => setFormData({ ...formData, state: e.target.value })}
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-accent'
									>
										{INDIAN_STATES.map((st) => (
											<option key={st} value={st}>
												{st}
											</option>
										))}
									</select>
								</div>
							</div>

							<div>
								<label className='block font-semibold text-gray-300 mb-1'>Locality (Optional)</label>
								<input
									type='text'
									value={formData.locality}
									onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
									placeholder='e.g. Andheri West / Lokhandwala'
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-accent'
								/>
							</div>

							<div className='grid grid-cols-3 gap-3'>
								<div>
									<label className='block font-semibold text-gray-300 mb-1'>Delivery Fee (₹)</label>
									<input
										type='number'
										min={0}
										value={formData.deliveryFee}
										onChange={(e) => setFormData({ ...formData, deliveryFee: Number(e.target.value) })}
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-accent'
									/>
								</div>

								<div>
									<label className='block font-semibold text-gray-300 mb-1'>Min Order (₹)</label>
									<input
										type='number'
										min={0}
										value={formData.minOrderValue}
										onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-accent'
									/>
								</div>

								<div>
									<label className='block font-semibold text-gray-300 mb-1'>Free Above (₹)</label>
									<input
										type='number'
										min={0}
										value={formData.freeDeliveryThreshold}
										onChange={(e) =>
											setFormData({ ...formData, freeDeliveryThreshold: Number(e.target.value) })
										}
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-accent'
									/>
								</div>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='block font-semibold text-gray-300 mb-1'>
										Estimated Delivery Window
									</label>
									<input
										type='text'
										value={formData.estimatedDeliveryDays}
										onChange={(e) => setFormData({ ...formData, estimatedDeliveryDays: e.target.value })}
										placeholder='e.g. 1-2 business days'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-accent'
									/>
								</div>

								<div>
									<label className='block font-semibold text-gray-300 mb-1'>Service Restrictions</label>
									<input
										type='text'
										value={formData.serviceRestrictions}
										onChange={(e) => setFormData({ ...formData, serviceRestrictions: e.target.value })}
										placeholder='e.g. No cash on delivery'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-accent'
									/>
								</div>
							</div>

							<div className='flex items-center gap-2 pt-2'>
								<input
									type='checkbox'
									id='loc_active'
									checked={formData.isActive}
									onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
									className='h-4 w-4 rounded bg-gray-950 border-gray-800 text-accent focus:ring-accent cursor-pointer'
								/>
								<label htmlFor='loc_active' className='text-gray-300 cursor-pointer font-semibold'>
									Activate this delivery location immediately
								</label>
							</div>

							<div className='flex items-center justify-end gap-3 pt-4 border-t border-gray-800'>
								<button
									type='button'
									onClick={() => setIsAddModalOpen(false)}
									className='px-4 py-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white font-semibold'
								>
									Cancel
								</button>
								<button
									type='submit'
									className='px-5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-md'
								>
									{editingLocation ? "Save Changes" : "Create Location"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* CSV Import Modal with Preview & Error Reporting */}
			{isImportModalOpen && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in'>
					<div className='bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl'>
						<div className='flex items-center justify-between pb-4 border-b border-gray-800 mb-5'>
							<div className='flex items-center gap-2'>
								<Upload className='text-blue-400' size={20} />
								<h3 className='text-base font-bold text-white font-heading'>
									Import Serviceable Locations via CSV
								</h3>
							</div>
							<button
								onClick={() => setIsImportModalOpen(false)}
								className='text-gray-400 hover:text-white text-sm'
							>
								✕
							</button>
						</div>

						<div className='space-y-4 text-xs'>
							<p className='text-gray-400 leading-relaxed'>
								Upload a CSV file containing approved serviceable delivery locations. The system validates
								6-digit PIN code format, detects duplicates, and previews errors before committing changes.
							</p>

							<div className='border-2 border-dashed border-gray-800 rounded-2xl p-6 text-center hover:border-gray-700 transition-colors bg-gray-950/40'>
								<input
									type='file'
									id='csv_file_input'
									accept='.csv,text/csv'
									onChange={(e) => {
										setImportFile(e.target.files?.[0] || null);
										setImportPreview(null);
									}}
									className='hidden'
								/>
								<label
									htmlFor='csv_file_input'
									className='cursor-pointer flex flex-col items-center justify-center space-y-2'
								>
									<FileText size={32} className='text-gray-500' />
									<span className='font-semibold text-white'>
										{importFile ? importFile.name : "Click to select CSV file"}
									</span>
									<span className='text-[11px] text-gray-500'>
										Supports .csv files up to 5MB (country, state, district, city, pincode, etc.)
									</span>
								</label>
							</div>

							{/* Preview Analysis Results */}
							{importPreview && (
								<div className='space-y-3 pt-2'>
									<div className='grid grid-cols-3 gap-3 text-center'>
										<div className='p-3 rounded-xl bg-gray-950 border border-gray-800'>
											<span className='text-gray-400 block text-[11px]'>Total Rows</span>
											<strong className='text-white text-base font-mono'>
												{importPreview.totalRows}
											</strong>
										</div>
										<div className='p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20'>
											<span className='text-emerald-400 block text-[11px]'>Valid Records</span>
											<strong className='text-emerald-400 text-base font-mono'>
												{importPreview.validRecordsCount}
											</strong>
										</div>
										<div className='p-3 rounded-xl bg-rose-500/10 border border-rose-500/20'>
											<span className='text-rose-400 block text-[11px]'>Validation Errors</span>
											<strong className='text-rose-400 text-base font-mono'>
												{importPreview.errorsCount}
											</strong>
										</div>
									</div>

									{/* Errors List */}
									{importPreview.errors?.length > 0 && (
										<div className='p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 max-h-40 overflow-y-auto space-y-1.5'>
											<p className='font-bold text-rose-300 flex items-center gap-1'>
												<AlertCircle size={14} /> Skipped Rows ({importPreview.errors.length}):
											</p>
											{importPreview.errors.map((err, idx) => (
												<p key={idx} className='text-[11px] text-rose-200 font-mono'>
													Row {err.row}: {err.reason}
												</p>
											))}
										</div>
									)}

									{/* Sample Valid Records Preview */}
									{importPreview.sampleValidRecords?.length > 0 && (
										<div className='border border-gray-800 rounded-xl overflow-hidden'>
											<p className='p-2 bg-gray-950 font-semibold text-gray-400 text-[11px]'>
												Preview Sample (First {importPreview.sampleValidRecords.length} records):
											</p>
											<div className='divide-y divide-gray-800/60 font-mono text-[11px] max-h-36 overflow-y-auto'>
												{importPreview.sampleValidRecords.map((r, i) => (
													<div key={i} className='p-2 flex justify-between text-gray-300'>
														<span>
															{r.pincode} • {r.city}, {r.state}
														</span>
														<span className='text-emerald-400 font-semibold'>
															Fee: ₹{r.deliveryFee}
														</span>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							)}

							<div className='flex items-center justify-between pt-4 border-t border-gray-800'>
								<button
									type='button'
									onClick={downloadTemplate}
									className='inline-flex items-center gap-1.5 text-accent hover:underline text-xs font-semibold'
								>
									<Download size={13} /> Download Template
								</button>

								<div className='flex items-center gap-2'>
									<button
										type='button'
										onClick={() => setIsImportModalOpen(false)}
										className='px-4 py-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white font-semibold'
									>
										Cancel
									</button>

									{!importPreview ? (
										<button
											type='button'
											disabled={!importFile || importing}
											onClick={handlePreviewCsv}
											className='px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-40'
										>
											{importing ? "Validating..." : "Validate & Preview"}
										</button>
									) : (
										<button
											type='button'
											disabled={importPreview.validRecordsCount === 0 || importing}
											onClick={handleApplyImport}
											className='px-5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-md disabled:opacity-40'
										>
											{importing ? "Committing..." : `Commit Import (${importPreview.validRecordsCount} Records)`}
										</button>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ServiceabilityManagement;
