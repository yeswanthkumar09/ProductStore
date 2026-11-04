import { useState, useEffect } from "react";
import {
	MapPin,
	Plus,
	CheckCircle,
	AlertTriangle,
	Edit2,
	Trash2,
	Home,
	Briefcase,
	Tag,
	Star,
	Truck,
	Phone,
	X,
} from "lucide-react";
import { useAddressStore } from "../stores/useAddressStore";

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

const SavedAddressManager = () => {
	const {
		addresses,
		fetchAddresses,
		createAddress,
		updateAddress,
		deleteAddress,
		setDefaultAddress,
		checkPincode,
		clearServiceabilityResult,
		serviceabilityChecking,
		serviceabilityResult,
		loading,
	} = useAddressStore();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingAddress, setEditingAddress] = useState(null);
	const [formData, setFormData] = useState({
		fullName: "",
		phone: "",
		houseFlat: "",
		street: "",
		landmark: "",
		locality: "",
		city: "",
		district: "",
		state: "Delhi",
		pincode: "",
		addressType: "Home",
		deliveryInstructions: "",
		isDefault: false,
	});

	useEffect(() => {
		fetchAddresses();
	}, [fetchAddresses]);

	// Real-time serviceability verification when 6-digit PIN code is typed
	useEffect(() => {
		if (!isModalOpen) return;
		clearServiceabilityResult();

		if (formData.pincode && formData.pincode.length === 6) {
			const timer = setTimeout(async () => {
				await checkPincode(formData.pincode);
			}, 600);
			return () => clearTimeout(timer);
		}
	}, [formData.pincode, isModalOpen, checkPincode, clearServiceabilityResult]);

	const handleOpenAddModal = () => {
		setEditingAddress(null);
		clearServiceabilityResult();
		setFormData({
			fullName: "",
			phone: "",
			houseFlat: "",
			street: "",
			landmark: "",
			locality: "",
			city: "",
			district: "",
			state: "Delhi",
			pincode: "",
			addressType: "Home",
			deliveryInstructions: "",
			isDefault: addresses.length === 0,
		});
		setIsModalOpen(true);
	};

	const handleOpenEditModal = (addr) => {
		setEditingAddress(addr);
		clearServiceabilityResult();
		setFormData({
			fullName: addr.fullName || "",
			phone: addr.phone || "",
			houseFlat: addr.houseFlat || "",
			street: addr.street || "",
			landmark: addr.landmark || "",
			locality: addr.locality || "",
			city: addr.city || "",
			district: addr.district || "",
			state: addr.state || "Delhi",
			pincode: addr.pincode || "",
			addressType: addr.addressType || "Home",
			deliveryInstructions: addr.deliveryInstructions || "",
			isDefault: addr.isDefault || false,
		});
		setIsModalOpen(true);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			if (editingAddress) {
				await updateAddress(editingAddress._id, formData);
			} else {
				await createAddress(formData);
			}
			setIsModalOpen(false);
		} catch (err) {
			// Toast handled in store
		}
	};

	return (
		<div className='space-y-6'>
			{/* Top Bar */}
			<div className='flex flex-wrap items-center justify-between gap-4 p-5 bg-gray-900/60 border border-gray-800 rounded-3xl backdrop-blur-md'>
				<div>
					<h3 className='text-lg font-bold text-white flex items-center gap-2 font-heading'>
						<MapPin size={20} className='text-accent' /> My Saved Delivery Addresses
					</h3>
					<p className='text-xs text-gray-400 mt-0.5'>
						Save and manage multiple delivery addresses for seamless checkout
					</p>
				</div>

				<button
					id='add-new-address-btn'
					type='button'
					onClick={handleOpenAddModal}
					className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold transition-all shadow-md'
				>
					<Plus size={16} /> Add New Address
				</button>
			</div>

			{/* Address Grid */}
			{loading && addresses.length === 0 ? (
				<div className='py-12 text-center text-gray-400 text-sm'>Loading your address book...</div>
			) : addresses.length === 0 ? (
				<div className='p-12 text-center bg-gray-900/40 border border-dashed border-gray-800 rounded-3xl'>
					<MapPin size={40} className='mx-auto text-gray-600 mb-3' />
					<h4 className='text-base font-bold text-white mb-1'>No Addresses Saved Yet</h4>
					<p className='text-xs text-gray-400 max-w-sm mx-auto mb-5'>
						Save your home, office, and other locations here so you can select them effortlessly during checkout.
					</p>
					<button
						type='button'
						onClick={handleOpenAddModal}
						className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold shadow-md'
					>
						<Plus size={16} /> Add First Address
					</button>
				</div>
			) : (
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					{addresses.map((addr) => (
						<div
							key={addr._id}
							className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
								addr.isDefault
									? "bg-gray-900/80 border-accent/50 shadow-lg shadow-accent/5"
									: "bg-gray-900/40 border-gray-800/80 hover:border-gray-700"
							}`}
						>
							<div>
								{/* Card Header */}
								<div className='flex items-center justify-between gap-2 mb-3'>
									<div className='flex items-center gap-2'>
										<span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-white border border-gray-700'>
											{addr.addressType === "Home" ? (
												<Home size={12} className='text-accent' />
											) : addr.addressType === "Work" ? (
												<Briefcase size={12} className='text-amber-400' />
											) : (
												<Tag size={12} className='text-indigo-400' />
											)}
											{addr.addressType}
										</span>

										{addr.isDefault && (
											<span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20'>
												<Star size={10} fill='currentColor' /> Default
											</span>
										)}
									</div>

									{/* Action Icons */}
									<div className='flex items-center gap-1'>
										<button
											type='button'
											onClick={() => handleOpenEditModal(addr)}
											title='Edit address'
											className='p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors'
										>
											<Edit2 size={14} />
										</button>
										<button
											type='button'
											onClick={() => {
												if (window.confirm("Delete this saved address?")) {
													deleteAddress(addr._id);
												}
											}}
											title='Delete address'
											className='p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-gray-800 transition-colors'
										>
											<Trash2 size={14} />
										</button>
									</div>
								</div>

								{/* Details */}
								<h4 className='text-sm font-bold text-white mb-1'>{addr.fullName}</h4>
								<p className='text-xs text-gray-400 flex items-center gap-1.5 mb-2'>
									<Phone size={12} className='text-gray-500' /> {addr.phone}
								</p>

								<p className='text-xs text-gray-300 leading-relaxed'>
									{addr.houseFlat}, {addr.street}
									{addr.landmark && `, near ${addr.landmark}`}
									{addr.locality && `, ${addr.locality}`}
								</p>
								<p className='text-xs text-gray-400 mt-0.5 font-medium'>
									{addr.city}, {addr.state} - <span className='font-mono font-bold text-white'>{addr.pincode}</span>
								</p>

								{addr.deliveryInstructions && (
									<p className='text-[11px] text-gray-500 italic mt-2 bg-gray-950/40 p-2 rounded-lg border border-gray-900'>
										Note: {addr.deliveryInstructions}
									</p>
								)}
							</div>

							{/* Card Footer: Serviceability & Default action */}
							<div className='pt-4 mt-4 border-t border-gray-800/60 flex items-center justify-between gap-2 text-xs'>
								<div>
									{addr.isServiceable ? (
										<span className='inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20'>
											<CheckCircle size={11} /> Serviceable via {addr.courierName || "Express Courier"}
										</span>
									) : addr.isInconclusive ? (
										<span className='inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20'>
											<AlertTriangle size={11} /> Verification Pending
										</span>
									) : (
										<span className='inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20'>
											<AlertTriangle size={11} /> Unserviceable
										</span>
									)}
								</div>

								{!addr.isDefault && (
									<button
										type='button'
										onClick={() => setDefaultAddress(addr._id)}
										className='text-xs text-gray-400 hover:text-accent font-semibold transition-colors'
									>
										Set as Default
									</button>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Add / Edit Address Modal */}
			{isModalOpen && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in'>
					<div className='bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl'>
						<div className='flex items-center justify-between pb-4 border-b border-gray-800 mb-5'>
							<h3 className='text-lg font-bold text-white font-heading'>
								{editingAddress ? "Edit Saved Address" : "Save New Delivery Address"}
							</h3>
							<button
								onClick={() => setIsModalOpen(false)}
								className='p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors'
							>
								<X size={18} />
							</button>
						</div>

						<form
							onSubmit={handleSubmit}
							autoComplete='off'
							autoCorrect='off'
							spellCheck='false'
							className='space-y-4'
						>
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>
										Recipient Full Name *
									</label>
									<input
										type='text'
										required
										autoComplete='off'
										autoCorrect='off'
										spellCheck='false'
										data-lpignore='true'
										value={formData.fullName}
										onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
										placeholder='e.g. Yash Agathamudi'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-accent'
									/>
								</div>

								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>
										Mobile Number with Country Code *
									</label>
									<input
										type='tel'
										required
										autoComplete='off'
										autoCorrect='off'
										spellCheck='false'
										data-lpignore='true'
										value={formData.phone}
										onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
										placeholder='+91 98765 43210'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-accent font-mono'
									/>
								</div>
							</div>

							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>
										House / Flat / Block No. *
									</label>
									<input
										type='text'
										required
										autoComplete='off'
										autoCorrect='off'
										spellCheck='false'
										data-lpignore='true'
										value={formData.houseFlat}
										onChange={(e) => setFormData({ ...formData, houseFlat: e.target.value })}
										placeholder='e.g. Villa 14, Royal Palm Estate'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-accent'
									/>
								</div>

								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>
										Street / Road / Area *
									</label>
									<input
										type='text'
										required
										autoComplete='off'
										autoCorrect='off'
										spellCheck='false'
										data-lpignore='true'
										value={formData.street}
										onChange={(e) => setFormData({ ...formData, street: e.target.value })}
										placeholder='e.g. Golf Course Road'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-accent'
									/>
								</div>
							</div>

							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>
										Landmark (Optional)
									</label>
									<input
										type='text'
										autoComplete='off'
										autoCorrect='off'
										spellCheck='false'
										data-lpignore='true'
										value={formData.landmark}
										onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
										placeholder='e.g. Near Cyber Hub'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-accent'
									/>
								</div>

								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>
										Area / Locality
									</label>
									<input
										type='text'
										autoComplete='off'
										autoCorrect='off'
										spellCheck='false'
										data-lpignore='true'
										value={formData.locality}
										onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
										placeholder='e.g. DLF Phase 5'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-accent'
									/>
								</div>
							</div>

							<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>
										PIN Code (6 digits) *
									</label>
									<input
										type='text'
										required
										maxLength={6}
										autoComplete='off'
										autoCorrect='off'
										spellCheck='false'
										data-lpignore='true'
										value={formData.pincode}
										onChange={(e) =>
											setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })
										}
										placeholder='110001'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-accent font-mono'
									/>
								</div>

								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>City *</label>
									<input
										type='text'
										required
										autoComplete='off'
										autoCorrect='off'
										spellCheck='false'
										data-lpignore='true'
										value={formData.city}
										onChange={(e) => setFormData({ ...formData, city: e.target.value })}
										placeholder='New Delhi'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-accent'
									/>
								</div>

								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>
										State / UT *
									</label>
									<select
										value={formData.state}
										onChange={(e) => setFormData({ ...formData, state: e.target.value })}
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-accent'
									>
										{INDIAN_STATES.map((st) => (
											<option key={st} value={st}>
												{st}
											</option>
										))}
									</select>
								</div>
							</div>

							{/* Live Serviceability Feedback in modal */}
							{serviceabilityChecking && (
								<div className='p-3 rounded-xl bg-gray-950/70 border border-gray-800 text-xs text-accent flex items-center gap-2 animate-pulse'>
									<Truck size={14} />
									<span>Verifying courier availability via Shiprocket...</span>
								</div>
							)}
							{!serviceabilityChecking && serviceabilityResult && formData.pincode.length === 6 && (
								<div
									className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
										serviceabilityResult.serviceable
											? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
											: "bg-rose-500/10 border-rose-500/30 text-rose-300"
									}`}
								>
									{serviceabilityResult.serviceable ? (
										<CheckCircle size={15} className='text-emerald-400 shrink-0' />
									) : (
										<AlertTriangle size={15} className='text-rose-400 shrink-0' />
									)}
									<span>
										{serviceabilityResult.serviceable
											? `Delivery available for this PIN code (${serviceabilityResult.courierCount || 1} courier partner${serviceabilityResult.courierCount > 1 ? "s" : ""}).`
											: serviceabilityResult.message || "Delivery currently unavailable for this PIN."}
									</span>
								</div>
							)}

							<div>
								<label className='block text-xs font-semibold text-gray-300 mb-1'>
									Delivery Instructions (Optional)
								</label>
								<input
									type='text'
									autoComplete='off'
									autoCorrect='off'
									spellCheck='false'
									data-lpignore='true'
									value={formData.deliveryInstructions}
									onChange={(e) => setFormData({ ...formData, deliveryInstructions: e.target.value })}
									placeholder='e.g. Ring bell, leave with concierge'
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-accent'
								/>
							</div>

							{/* Address Label Selector */}
							<div>
								<label className='block text-xs font-semibold text-gray-300 mb-1.5'>
									Address Type Label
								</label>
								<div className='flex gap-3'>
									{["Home", "Work", "Other"].map((label) => (
										<button
											type='button'
											key={label}
											onClick={() => setFormData({ ...formData, addressType: label })}
											className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
												formData.addressType === label
													? "bg-accent border-accent text-white"
													: "bg-gray-950 border-gray-800 text-gray-400 hover:text-white"
											}`}
										>
											{label === "Home" ? (
												<Home size={13} />
											) : label === "Work" ? (
												<Briefcase size={13} />
											) : (
												<Tag size={13} />
											)}
											{label}
										</button>
									))}
								</div>
							</div>

							<div className='flex items-center gap-2 pt-1'>
								<input
									type='checkbox'
									id='addr_is_default'
									checked={formData.isDefault}
									onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
									className='h-4 w-4 rounded bg-gray-950 border-gray-800 text-accent focus:ring-accent cursor-pointer'
								/>
								<label htmlFor='addr_is_default' className='text-xs text-gray-300 cursor-pointer'>
									Set as primary default address for orders
								</label>
							</div>

							<div className='flex items-center justify-end gap-3 pt-4 border-t border-gray-800'>
								<button
									type='button'
									onClick={() => setIsModalOpen(false)}
									className='px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-gray-800'
								>
									Cancel
								</button>
								<button
									id='save-address-submit-btn'
									type='submit'
									className='px-5 py-2.5 rounded-xl text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-md'
								>
									{editingAddress ? "Save Changes" : "Save Address"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default SavedAddressManager;
