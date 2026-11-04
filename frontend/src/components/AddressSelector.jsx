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
	ShieldCheck,
	Truck,
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

const AddressSelector = ({ onSelectAddress, selectedAddressId }) => {
	const {
		addresses,
		selectedAddress,
		fetchAddresses,
		selectAddress,
		createAddress,
		updateAddress,
		deleteAddress,
		setDefaultAddress,
		checkPincode,
		clearServiceabilityResult,
		serviceabilityChecking,
		serviceabilityResult,
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
		state: "Maharashtra",
		pincode: "",
		addressType: "Home",
		deliveryInstructions: "",
		isDefault: false,
	});

	useEffect(() => {
		fetchAddresses();
	}, [fetchAddresses]);

	useEffect(() => {
		if (selectedAddress && onSelectAddress) {
			onSelectAddress(selectedAddress);
		}
	}, [selectedAddress, onSelectAddress]);

	// Real-time serviceability verification when PIN code is completed (without overwriting user fields)
	useEffect(() => {
		if (!isModalOpen) return;

		clearServiceabilityResult();

		if (!formData.pincode || formData.pincode.length < 6) {
			return;
		}

		if (formData.pincode.length === 6) {
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
			state: "Maharashtra",
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
			state: addr.state || "Maharashtra",
			pincode: addr.pincode || "",
			addressType: addr.addressType || "Home",
			deliveryInstructions: addr.deliveryInstructions || "",
			isDefault: addr.isDefault || false,
		});
		setIsModalOpen(true);
	};

	const handlePincodeBlur = async () => {
		if (formData.pincode && /^\d{6}$/.test(formData.pincode.trim())) {
			await checkPincode(formData.pincode.trim());
		}
	};

	const handleSubmitAddress = async (e) => {
		e.preventDefault();
		try {
			if (editingAddress) {
				await updateAddress(editingAddress._id, formData);
			} else {
				await createAddress(formData);
			}
			setIsModalOpen(false);
		} catch (err) {
			// error handled in store toast
		}
	};

	return (
		<div className='bg-gray-900/60 border border-gray-800 rounded-2xl p-5 backdrop-blur-md'>
			<div className='flex items-center justify-between pb-4 border-b border-gray-800 mb-4'>
				<div className='flex items-center gap-2'>
					<MapPin className='text-accent' size={20} />
					<h3 className='text-base font-bold text-white font-heading'>Delivery Address</h3>
				</div>
				<button
					onClick={handleOpenAddModal}
					type='button'
					className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-white border border-gray-700 transition-colors'
				>
					<Plus size={14} /> Add New Address
				</button>
			</div>

			{/* Address List */}
			{addresses.length === 0 ? (
				<div className='py-8 text-center bg-gray-950/40 border border-dashed border-gray-800 rounded-xl p-4'>
					<MapPin className='mx-auto text-gray-600 mb-2' size={32} />
					<p className='text-sm text-gray-300 font-medium'>No delivery addresses saved</p>
					<p className='text-xs text-gray-500 mt-1 max-w-sm mx-auto'>
						Please provide a recipient address to verify delivery serviceability and proceed with checkout.
					</p>
					<button
						onClick={handleOpenAddModal}
						type='button'
						className='mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold shadow-md'
					>
						<Plus size={14} /> Add Delivery Address
					</button>
				</div>
			) : (
				<div className='space-y-3'>
					{addresses.map((addr) => {
						const isSelected = selectedAddress?._id === addr._id;
						return (
							<div
								key={addr._id}
								onClick={() => selectAddress(addr)}
								className={`cursor-pointer rounded-xl p-4 border transition-all ${
									isSelected
										? "bg-accent-light/30 border-accent shadow-md shadow-emerald-950/20"
										: "bg-gray-950/50 border-gray-800 hover:border-gray-700"
								}`}
							>
								<div className='flex items-start justify-between gap-3'>
									<div className='flex items-start gap-3'>
										<div className='pt-0.5'>
											<input
												type='radio'
												name='selected_address'
												checked={isSelected}
												onChange={() => selectAddress(addr)}
												className='h-4 w-4 text-accent border-gray-700 focus:ring-accent bg-gray-900 cursor-pointer'
											/>
										</div>
										<div className='space-y-1 text-xs'>
											<div className='flex items-center gap-2 flex-wrap'>
												<span className='font-bold text-sm text-neutral-900 dark:text-white'>{addr.fullName}</span>
												<span className='text-neutral-600 dark:text-gray-400 font-mono'>({addr.phone})</span>

												{/* Address Label */}
												<span className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'>
													{addr.addressType === "Work" ? (
														<Briefcase size={10} />
													) : addr.addressType === "Home" ? (
														<Home size={10} />
													) : (
														<Tag size={10} />
													)}
													{addr.addressType}
												</span>

												{addr.isDefault && (
													<span className='px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20'>
														Default
													</span>
												)}
											</div>

											<p className='text-gray-300 leading-relaxed'>
												{addr.houseFlat}, {addr.street}
												{addr.landmark ? `, Near ${addr.landmark}` : ""}
												{addr.locality ? `, ${addr.locality}` : ""}, {addr.city},{" "}
												{addr.district ? `${addr.district}, ` : ""}
												{addr.state} - <strong className='text-white font-mono'>{addr.pincode}</strong>
											</p>

											{addr.deliveryInstructions && (
												<p className='text-[11px] text-gray-400 italic'>
													Instructions: &ldquo;{addr.deliveryInstructions}&rdquo;
												</p>
											)}

											{/* Serviceability Badge */}
											<div className='pt-1.5 flex items-center gap-3 flex-wrap'>
												{addr.isServiceable ? (
													<span className='inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20'>
														<CheckCircle size={13} />
														Delivery is available for this PIN code.
														{addr.courierName && (
															<span className='text-gray-300 font-normal'>
																via {addr.courierName}
															</span>
														)}
														{addr.estimatedDeliveryDays && (
															<span className='text-gray-400 font-normal'>
																• {addr.estimatedDeliveryDays}
															</span>
														)}
													</span>
												) : addr.isInconclusive ? (
													<span className='inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20'>
														<AlertTriangle size={13} />
														Unable to verify delivery availability. Please try again.
													</span>
												) : (
													<span className='inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20'>
														<AlertTriangle size={13} />
														{addr.serviceabilityMessage || "Delivery is currently unavailable for this PIN code."}
													</span>
												)}
											</div>
										</div>
									</div>

									<div className='flex items-center gap-1'>
										<button
											type='button'
											onClick={(e) => {
												e.stopPropagation();
												handleOpenEditModal(addr);
											}}
											title='Edit address'
											className='p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors'
										>
											<Edit2 size={14} />
										</button>
										<button
											type='button'
											onClick={(e) => {
												e.stopPropagation();
												if (window.confirm("Remove this saved address?")) {
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
							</div>
						);
					})}
				</div>
			)}

			{/* Address Add / Edit Modal */}
			{isModalOpen && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in'>
					<div className='bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl'>
						<div className='flex items-center justify-between pb-4 border-b border-gray-800 mb-5'>
							<h3 className='text-lg font-bold text-white font-heading'>
								{editingAddress ? "Edit Delivery Address" : "Add New Delivery Address"}
							</h3>
							<button
								onClick={() => setIsModalOpen(false)}
								className='text-gray-400 hover:text-white text-sm font-semibold'
							>
								✕
							</button>
						</div>

						<form
							onSubmit={handleSubmitAddress}
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
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-accent'
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
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-accent font-mono'
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
										placeholder='e.g. Flat 402, Royal Palms'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-accent'
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
										placeholder='e.g. Linking Road, Bandra West'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-accent'
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
										placeholder='e.g. Opposite Metro Station'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-accent'
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
										placeholder='e.g. Bandra'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-accent'
									/>
								</div>
							</div>

							<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>
										PIN Code (6 digits) *
									</label>
									<div className='relative'>
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
											onBlur={handlePincodeBlur}
											placeholder='400053'
											className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-accent font-mono'
										/>
									</div>
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
										placeholder='Mumbai'
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-accent'
									/>
								</div>

								<div>
									<label className='block text-xs font-semibold text-gray-300 mb-1'>
										State / UT *
									</label>
									<select
										value={formData.state}
										onChange={(e) => setFormData({ ...formData, state: e.target.value })}
										className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-accent'
									>
										{INDIAN_STATES.map((st) => (
											<option key={st} value={st}>
												{st}
											</option>
										))}
									</select>
								</div>
							</div>

							{/* Live Serviceability Feedback */}
							{serviceabilityChecking && (
								<div className='p-3 rounded-xl bg-gray-950/70 border border-gray-800 text-xs text-accent flex items-center gap-2 animate-pulse'>
									<Truck size={15} className='shrink-0 text-accent' />
									<span>Checking real-time delivery availability...</span>
								</div>
							)}
							{!serviceabilityChecking && serviceabilityResult && formData.pincode.length === 6 && (
								<div
									className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
										serviceabilityResult.serviceable
											? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
											: serviceabilityResult.isInconclusive
											? "bg-amber-500/10 border-amber-500/30 text-amber-300"
											: "bg-rose-500/10 border-rose-500/30 text-rose-300"
									}`}
								>
									<div className='flex items-center gap-2'>
										{serviceabilityResult.serviceable ? (
											<>
												<CheckCircle size={16} className='text-emerald-400 shrink-0' />
												<div>
													<span className='font-semibold'>Delivery is available for this PIN code.</span>
													{serviceabilityResult.courierName && (
														<span className='text-emerald-200'> via {serviceabilityResult.courierName}</span>
													)}
													{serviceabilityResult.estimatedDays && (
														<span className='text-gray-400 ml-1'>
															(Est. {serviceabilityResult.estimatedDays}{" "}
															{typeof serviceabilityResult.estimatedDays === "number" ? "days" : ""})
														</span>
													)}
													{serviceabilityResult.isCodAvailable === false && (
														<span className='block text-[11px] text-amber-300 font-medium mt-0.5'>
															Prepaid delivery only • COD is unavailable for this PIN
														</span>
													)}
												</div>
											</>
										) : serviceabilityResult.isInconclusive ? (
											<>
												<AlertTriangle size={16} className='text-amber-400 shrink-0' />
												<span>Unable to verify delivery availability. Please try again.</span>
											</>
										) : (
											<>
												<AlertTriangle size={16} className='text-rose-400 shrink-0' />
												<span>{serviceabilityResult.message || "Delivery is currently unavailable for this PIN code."}</span>
											</>
										)}
									</div>

									{serviceabilityResult.isInconclusive && (
										<button
											type='button'
											onClick={() => checkPincode(formData.pincode)}
											className='px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-[11px] shrink-0'
										>
											Retry
										</button>
									)}
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
									placeholder='e.g. Ring doorbell, leave package with society security'
									className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-accent'
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
													? "bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-950 font-bold"
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

							<div className='flex items-center gap-2 pt-2'>
								<input
									type='checkbox'
									id='is_default'
									checked={formData.isDefault}
									onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
									className='h-4 w-4 rounded bg-gray-950 border-gray-800 text-accent focus:ring-accent cursor-pointer'
								/>
								<label htmlFor='is_default' className='text-xs text-gray-300 cursor-pointer'>
									Make this my default delivery address
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
									type='submit'
									className='px-5 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-md'
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

export default AddressSelector;
