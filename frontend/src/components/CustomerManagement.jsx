import { useState, useEffect } from "react";
import {
	Users,
	Search,
	Download,
	CheckCircle,
	XCircle,
	ShieldAlert,
	ShieldCheck,
	Eye,
	Clock,
	DollarSign,
	Package,
	MapPin,
	Calendar,
	Filter,
	X,
	AlertTriangle,
} from "lucide-react";
import { useCustomerStore } from "../stores/useCustomerStore";

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

const CustomerManagement = () => {
	const {
		customers,
		total,
		page,
		pages,
		loading,
		selectedCustomer,
		loadingDetail,
		fetchCustomers,
		fetchCustomerDetail,
		clearCustomerDetail,
		updateCustomerStatus,
		exportCsv,
	} = useCustomerStore();

	const [search, setSearch] = useState("");
	const [stateFilter, setStateFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [verificationFilter, setVerificationFilter] = useState("all");
	const [purchaseFilter, setPurchaseFilter] = useState("all");
	const [minSpend, setMinSpend] = useState("");
	const [maxSpend, setMaxSpend] = useState("");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [sortBy, setSortBy] = useState("newest");
	const [currentPage, setCurrentPage] = useState(1);
	const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

	useEffect(() => {
		fetchCustomers({
			search,
			state: stateFilter,
			status: statusFilter,
			verification: verificationFilter,
			hasPurchased: purchaseFilter,
			minSpend,
			maxSpend,
			dateFrom,
			dateTo,
			sort: sortBy,
			page: currentPage,
			limit: 15,
		});
	}, [
		fetchCustomers,
		search,
		stateFilter,
		statusFilter,
		verificationFilter,
		purchaseFilter,
		minSpend,
		maxSpend,
		dateFrom,
		dateTo,
		sortBy,
		currentPage,
	]);

	const handleStatusToggle = (customer) => {
		const newStatus = customer.accountStatus === "suspended" ? "active" : "suspended";
		const actionWord = newStatus === "suspended" ? "suspend" : "reactivate";
		if (window.confirm(`Are you sure you want to ${actionWord} customer "${customer.name}"?`)) {
			updateCustomerStatus(customer._id, newStatus);
		}
	};

	return (
		<div className='space-y-6 max-w-7xl mx-auto'>
			{/* Header & Export */}
			<div className='bg-gray-900/80 border border-gray-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md'>
				<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800'>
					<div>
						<h2 className='text-xl font-extrabold text-white font-heading'>Customer Administration</h2>
						<p className='text-xs text-gray-400 mt-1'>
							View verified patrons, monitor spending habits, audit delivery addresses, and manage account privileges.
						</p>
					</div>

					<div className='flex items-center gap-2'>
						<button
							onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
							type='button'
							className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
								showAdvancedFilters
									? "bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-950 font-bold"
									: "bg-gray-800 border-gray-700 text-gray-300 hover:text-white"
							}`}
						>
							<Filter size={14} /> {showAdvancedFilters ? "Hide Filters" : "Filters"}
						</button>

						<button
							onClick={exportCsv}
							type='button'
							className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-white border border-gray-700 transition-colors'
						>
							<Download size={14} /> Export Customers
						</button>
					</div>
				</div>

				{/* Primary Search Bar */}
				<div className='py-4 grid grid-cols-1 sm:grid-cols-4 gap-3 border-b border-gray-800/60'>
					<div className='relative sm:col-span-2'>
						<Search className='absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500' size={14} />
						<input
							type='text'
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setCurrentPage(1);
							}}
							placeholder='Search customer by name, email, phone, or customer ID...'
							className='w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-accent'
						/>
					</div>

					<div>
						<select
							value={purchaseFilter}
							onChange={(e) => {
								setPurchaseFilter(e.target.value);
								setCurrentPage(1);
							}}
							className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-accent'
						>
							<option value='all'>All Purchase History</option>
							<option value='yes'>Has Purchased (Orders &gt; 0)</option>
							<option value='no'>Never Purchased (0 Orders)</option>
						</select>
					</div>

					<div>
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
							className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-accent'
						>
							<option value='newest'>Sort: Newest First</option>
							<option value='spent_desc'>Sort: Highest Spend</option>
							<option value='orders_desc'>Sort: Most Orders</option>
							<option value='name_asc'>Sort: Name (A-Z)</option>
							<option value='oldest'>Sort: Oldest First</option>
						</select>
					</div>
				</div>

				{/* Advanced Filter Drawer */}
				{showAdvancedFilters && (
					<div className='py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-gray-800/60 text-xs animate-fade-in'>
						<div>
							<label className='block text-gray-400 font-semibold mb-1'>State / Union Territory</label>
							<select
								value={stateFilter}
								onChange={(e) => {
									setStateFilter(e.target.value);
									setCurrentPage(1);
								}}
								className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent'
							>
								<option value='all'>All States</option>
								{INDIAN_STATES.map((st) => (
									<option key={st} value={st}>
										{st}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className='block text-gray-400 font-semibold mb-1'>Verification Status</label>
							<select
								value={verificationFilter}
								onChange={(e) => {
									setVerificationFilter(e.target.value);
									setCurrentPage(1);
								}}
								className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent'
							>
								<option value='all'>All Verification</option>
								<option value='email_verified'>Email Verified</option>
								<option value='phone_verified'>Phone Verified</option>
								<option value='unverified'>Unverified Only</option>
							</select>
						</div>

						<div>
							<label className='block text-gray-400 font-semibold mb-1'>Account Status</label>
							<select
								value={statusFilter}
								onChange={(e) => {
									setStatusFilter(e.target.value);
									setCurrentPage(1);
								}}
								className='w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent'
							>
								<option value='all'>All Statuses</option>
								<option value='active'>Active</option>
								<option value='suspended'>Suspended</option>
								<option value='pending_verification'>Pending Verification</option>
							</select>
						</div>

						<div>
							<label className='block text-gray-400 font-semibold mb-1'>Spending Range (₹ INR)</label>
							<div className='flex gap-1.5'>
								<input
									type='number'
									placeholder='Min'
									value={minSpend}
									onChange={(e) => setMinSpend(e.target.value)}
									className='w-1/2 bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-2 text-white font-mono focus:outline-none focus:border-accent'
								/>
								<input
									type='number'
									placeholder='Max'
									value={maxSpend}
									onChange={(e) => setMaxSpend(e.target.value)}
									className='w-1/2 bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-2 text-white font-mono focus:outline-none focus:border-accent'
								/>
							</div>
						</div>
					</div>
				)}

				{/* Customer Table */}
				<div className='overflow-x-auto mt-2'>
					<table className='w-full text-left text-xs'>
						<thead className='text-gray-400 uppercase bg-gray-950/60 border-b border-gray-800 text-[11px]'>
							<tr>
								<th className='py-3.5 px-4'>Customer</th>
								<th className='py-3.5 px-4'>Email Status</th>
								<th className='py-3.5 px-4'>Phone Status</th>
								<th className='py-3.5 px-4'>State / Location</th>
								<th className='py-3.5 px-4'>Orders</th>
								<th className='py-3.5 px-4'>Total Spent</th>
								<th className='py-3.5 px-4'>Status</th>
								<th className='py-3.5 px-4 text-right'>Action</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-gray-800/60'>
							{loading ? (
								<tr>
									<td colSpan={8} className='py-12 text-center text-gray-500'>
										Loading customer directory...
									</td>
								</tr>
							) : customers.length === 0 ? (
								<tr>
									<td colSpan={8} className='py-12 text-center text-gray-500'>
										No customers found matching filter criteria.
									</td>
								</tr>
							) : (
								customers.map((c) => (
									<tr key={c._id} className='hover:bg-gray-800/30 transition-colors'>
										<td className='py-3.5 px-4'>
											<div className='font-semibold text-white text-sm'>{c.name}</div>
											<span className='font-mono text-[10px] text-gray-500'>
												ID: {c._id.toString().slice(-8)}
											</span>
										</td>

										<td className='py-3.5 px-4'>
											<div className='flex items-center gap-1.5'>
												{c.isEmailVerified ? (
													<span className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'>
														<CheckCircle size={10} /> Verified
													</span>
												) : (
													<span className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30'>
														Unverified
													</span>
												)}
											</div>
											<span className='text-[11px] text-gray-400 block mt-0.5'>{c.email}</span>
										</td>

										<td className='py-3.5 px-4'>
											{c.phone ? (
												<>
													<span
														className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
															c.isPhoneVerified
																? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
																: "bg-gray-800 text-gray-400 border-gray-700"
														}`}
													>
														{c.isPhoneVerified ? <CheckCircle size={10} /> : null}
														{c.isPhoneVerified ? "Verified" : "Unverified"}
													</span>
													<span className='text-[11px] text-gray-400 font-mono block mt-0.5'>
														{c.phone}
													</span>
												</>
											) : (
												<span className='text-gray-500 text-[11px]'>Not provided</span>
											)}
										</td>

										<td className='py-3.5 px-4 text-gray-300'>
											{c.customerState ? (
												<span>
													{c.customerCity ? `${c.customerCity}, ` : ""}
													<strong className='text-white'>{c.customerState}</strong>
												</span>
											) : (
												<span className='text-gray-500'>No address saved</span>
											)}
										</td>

										<td className='py-3.5 px-4 font-mono'>
											<span className='font-bold text-white'>{c.totalOrders ?? 0}</span>
											{c.successfulOrdersCount > 0 && (
												<span className='text-gray-400 text-[10px] block'>
													({c.successfulOrdersCount} paid)
												</span>
											)}
										</td>

										<td className='py-3.5 px-4 font-mono'>
											<span className='text-accent font-bold'>
												₹{Number(c.totalSpent || 0).toLocaleString("en-IN")}
											</span>
										</td>

										<td className='py-3.5 px-4'>
											<button
												type='button'
												onClick={() => handleStatusToggle(c)}
												className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
													c.accountStatus === "suspended"
														? "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
														: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
												}`}
											>
												{c.accountStatus === "suspended" ? (
													<>
														<ShieldAlert size={11} /> Suspended
													</>
												) : (
													<>
														<ShieldCheck size={11} /> Active
													</>
												)}
											</button>
										</td>

										<td className='py-3.5 px-4 text-right'>
											<button
												type='button'
												onClick={() => fetchCustomerDetail(c._id)}
												className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold border border-gray-700 transition-colors'
											>
												<Eye size={13} /> View
											</button>
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
							Showing page {page} of {pages} ({total} total customers)
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

			{/* Customer Detail Inspection Modal */}
			{selectedCustomer && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in'>
					<div className='bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl'>
						<div className='flex items-center justify-between pb-4 border-b border-gray-800 mb-5'>
							<div className='flex items-center gap-3'>
								<div className='w-10 h-10 rounded-2xl bg-accent-light text-accent flex items-center justify-center font-bold text-lg uppercase'>
									{selectedCustomer.user.name[0]}
								</div>
								<div>
									<h3 className='text-lg font-bold text-white font-heading'>
										{selectedCustomer.user.name}
									</h3>
									<span className='font-mono text-xs text-gray-400'>
										Customer ID: {selectedCustomer.user._id}
									</span>
								</div>
							</div>
							<button onClick={clearCustomerDetail} className='text-gray-400 hover:text-white text-sm'>
								✕
							</button>
						</div>

						{/* Top Metric Cards */}
						<div className='grid grid-cols-3 gap-3 mb-6 text-xs'>
							<div className='p-3.5 rounded-2xl bg-gray-950 border border-gray-800'>
								<span className='text-gray-400 block mb-0.5'>Total Orders Placed</span>
								<strong className='text-white text-lg font-mono'>
									{selectedCustomer.metrics.totalOrders}
								</strong>
							</div>
							<div className='p-3.5 rounded-2xl bg-gray-950 border border-gray-800'>
								<span className='text-gray-400 block mb-0.5'>Total Spending (INR)</span>
								<strong className='text-accent text-lg font-mono'>
									₹{Number(selectedCustomer.metrics.totalSpent || 0).toLocaleString("en-IN")}
								</strong>
							</div>
							<div className='p-3.5 rounded-2xl bg-gray-950 border border-gray-800'>
								<span className='text-gray-400 block mb-0.5'>Account Status</span>
								<strong
									className={`text-sm uppercase font-mono ${
										selectedCustomer.user.accountStatus === "suspended"
											? "text-rose-400"
											: "text-emerald-400"
									}`}
								>
									{selectedCustomer.user.accountStatus || "Active"}
								</strong>
							</div>
						</div>

						{/* Profile & Verification Details */}
						<div className='p-4 rounded-2xl bg-gray-950 border border-gray-800 mb-6 text-xs space-y-2'>
							<h4 className='font-bold text-white uppercase text-[11px] tracking-wider mb-2'>
								Verification & Contact
							</h4>
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<span className='text-gray-400 block'>Normalized Email:</span>
									<span className='text-white font-mono font-medium'>
										{selectedCustomer.user.email}
									</span>
									<span className='ml-2 text-[10px] text-emerald-400 font-bold'>
										{selectedCustomer.user.isEmailVerified ? "✓ Verified" : "✕ Unverified"}
									</span>
								</div>
								<div>
									<span className='text-gray-400 block'>Mobile Number:</span>
									<span className='text-white font-mono font-medium'>
										{selectedCustomer.user.phone || "Not provided"}
									</span>
									{selectedCustomer.user.phone && (
										<span className='ml-2 text-[10px] text-emerald-400 font-bold'>
											{selectedCustomer.user.isPhoneVerified ? "✓ Verified" : "✕ Unverified"}
										</span>
									)}
								</div>
								<div>
									<span className='text-gray-400 block'>Registered Date:</span>
									<span className='text-gray-300'>
										{new Date(selectedCustomer.user.createdAt).toLocaleDateString("en-IN", {
											year: "numeric",
											month: "long",
											day: "numeric",
										})}
									</span>
								</div>
								<div>
									<span className='text-gray-400 block'>Last Sign-in Activity:</span>
									<span className='text-gray-300'>
										{selectedCustomer.user.lastLoginAt
											? new Date(selectedCustomer.user.lastLoginAt).toLocaleString("en-IN")
											: "Never recorded"}
									</span>
								</div>
							</div>
						</div>

						{/* Saved Delivery Addresses */}
						<div className='mb-6'>
							<h4 className='font-bold text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5'>
								<MapPin size={14} className='text-accent' /> Saved Delivery Addresses (
								{selectedCustomer.addresses.length})
							</h4>
							{selectedCustomer.addresses.length === 0 ? (
								<p className='text-gray-500 text-xs italic'>No delivery addresses saved by customer.</p>
							) : (
								<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
									{selectedCustomer.addresses.map((a) => (
										<div
											key={a._id}
											className='p-3.5 rounded-2xl bg-gray-950 border border-gray-800 text-xs space-y-1'
										>
											<div className='flex items-center justify-between'>
												<span className='font-bold text-neutral-900 dark:text-white'>{a.fullName}</span>
												<span className='px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-gray-800 dark:text-gray-200'>
													{a.addressType}
												</span>
											</div>
											<p className='text-gray-400 leading-relaxed text-[11px]'>
												{a.houseFlat}, {a.street}, {a.city}, {a.state} -{" "}
												<strong className='text-white font-mono'>{a.pincode}</strong>
											</p>
											<span className='text-[10px] text-gray-500 block font-mono'>
												Tel: {a.phone}
											</span>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Order History */}
						<div>
							<h4 className='font-bold text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5'>
								<Package size={14} className='text-accent' /> Customer Order History (
								{selectedCustomer.orders.length})
							</h4>
							{selectedCustomer.orders.length === 0 ? (
								<p className='text-gray-500 text-xs italic'>Customer has not placed any orders yet.</p>
							) : (
								<div className='space-y-3'>
									{selectedCustomer.orders.map((order) => (
										<div
											key={order._id}
											className='p-4 rounded-2xl bg-gray-950 border border-gray-800 text-xs space-y-2'
										>
											<div className='flex items-center justify-between border-b border-gray-800 pb-2'>
												<div>
													<span className='font-mono font-bold text-white'>
														#{order._id.toString().slice(-8).toUpperCase()}
													</span>
													<span className='text-gray-500 ml-2'>
														{new Date(order.createdAt).toLocaleDateString("en-IN", {
															year: "numeric",
															month: "short",
															day: "numeric",
														})}
													</span>
												</div>
												<div className='flex items-center gap-2'>
													<span className='px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase'>
														{order.paymentStatus}
													</span>
													<strong className='font-mono text-accent'>
														₹{Number(order.totalAmount).toLocaleString("en-IN")}
													</strong>
												</div>
											</div>

											{/* Products in this order */}
											<div className='divide-y divide-gray-800/40 text-[11px]'>
												{order.products.map((item, idx) => (
													<div
														key={idx}
														className='py-1.5 flex items-center justify-between text-gray-300'
													>
														<span>
															{item.product?.name || "Product"}{" "}
															{item.selectedColor || item.selectedSize ? (
																<span className='text-gray-500'>
																	({[item.selectedColor, item.selectedSize].filter(Boolean).join(" • ")})
																</span>
															) : null}
															{" "}× {item.quantity}
														</span>
														<span className='font-mono text-white'>
															₹{Number(item.price * item.quantity).toLocaleString("en-IN")}
														</span>
													</div>
												))}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default CustomerManagement;
