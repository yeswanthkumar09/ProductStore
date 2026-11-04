import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
	HelpCircle,
	Search,
	MessageSquare,
	ChevronDown,
	ChevronUp,
	Send,
	Package,
	Clock,
	CheckCircle2,
	AlertCircle,
	X,
	Plus,
	Loader,
	Sparkles,
} from "lucide-react";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";
import { useOrderStore } from "../stores/useOrderStore";
import toast from "react-hot-toast";

const defaultFaqs = [
	{
		category: "Orders & Tracking",
		question: "How do I track my order in real time?",
		answer:
			"Once your order is dispatched, you will receive an SMS and email notification with your live Shiprocket Airway Bill (AWB) tracking number. You can also view live status updates anytime under My Orders in your account.",
	},
	{
		category: "Orders & Tracking",
		question: "Can I cancel or modify an order after placing it?",
		answer:
			"You may cancel your order at zero cost anytime before it enters transit. If you paid via Razorpay, your refund is instantly reversed to your original payment source. Once dispatched with our courier partner, you may initiate an easy return upon delivery.",
	},
	{
		category: "Shipping & Delivery",
		question: "What are your shipping rates and estimated delivery timelines?",
		answer:
			"We offer complimentary express delivery across India on orders over ₹1,999. Orders below ₹1,999 incur a flat courier fee of ₹99. Most metropolitan deliveries arrive within 2 to 4 business days.",
	},
	{
		category: "Returns & Exchanges",
		question: "What is your return and exchange policy?",
		answer:
			"We offer an effortless 7-day doorstep return and exchange window. Items must be unworn, in original condition with brand tags attached.",
	},
	{
		category: "Sizing & Fit",
		question: "How do I determine my correct size across international systems?",
		answer:
			"Each garment features a dedicated Size Guide modal next to the size selection buttons on the product page. You can toggle between centimetres and inches, compare Indian, US, UK, and EU conversions, and follow our step-by-step measuring guide.",
	},
	{
		category: "Payments & Security",
		question: "Which payment methods are accepted?",
		answer:
			"We accept UPI (Google Pay, PhonePe, Paytm), all major credit and debit cards (Visa, Mastercard, RuPay, Amex), net banking across 50+ banks, and Cash on Delivery (COD) for eligible pincodes.",
	},
];

const HelpCenterPage = () => {
	const [searchParams] = useSearchParams();
	const initialTicketId = searchParams.get("ticket");

	const { user } = useUserStore();
	const { orders, fetchOrders } = useOrderStore();

	const [activeTab, setActiveTab] = useState("faq"); // "faq" | "tickets"
	const [searchQuery, setSearchQuery] = useState("");
	const [openFaqIndex, setOpenFaqIndex] = useState(null);

	// Support Tickets State
	const [tickets, setTickets] = useState([]);
	const [loadingTickets, setLoadingTickets] = useState(false);
	const [selectedTicket, setSelectedTicket] = useState(null);
	const [replyMessage, setReplyMessage] = useState("");
	const [submittingReply, setSubmittingReply] = useState(false);

	// Create Ticket Modal State
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [newTicket, setNewTicket] = useState({
		subject: "",
		category: "Order Issue",
		orderId: "",
		priority: "medium",
		message: "",
	});
	const [submittingTicket, setSubmittingTicket] = useState(false);

	useEffect(() => {
		if (user) {
			fetchOrders();
			loadUserTickets();
		}
	}, [user]);

	const loadUserTickets = async () => {
		if (!user) return;
		setLoadingTickets(true);
		try {
			const res = await axios.get("/support-tickets/my");
			setTickets(res.data || []);
			if (initialTicketId) {
				const match = (res.data || []).find((t) => t._id === initialTicketId);
				if (match) {
					setSelectedTicket(match);
					setActiveTab("tickets");
				}
			}
		} catch (err) {
			console.error("Error loading tickets:", err);
		} finally {
			setLoadingTickets(false);
		}
	};

	const filteredFaqs = defaultFaqs.filter(
		(faq) =>
			faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
			faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
			faq.category.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const handleCreateTicketSubmit = async (e) => {
		e.preventDefault();
		if (!newTicket.subject.trim() || !newTicket.message.trim()) {
			toast.error("Subject and message are required.");
			return;
		}

		setSubmittingTicket(true);
		try {
			const res = await axios.post("/support-tickets", newTicket);
			toast.success("Support ticket created. A concierge will respond shortly.");
			setIsCreateModalOpen(false);
			setNewTicket({
				subject: "",
				category: "Order Issue",
				orderId: "",
				priority: "medium",
				message: "",
			});
			await loadUserTickets();
			setSelectedTicket(res.data.ticket);
			setActiveTab("tickets");
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to create ticket.");
		} finally {
			setSubmittingTicket(false);
		}
	};

	const handleSendReply = async (e) => {
		e.preventDefault();
		if (!replyMessage.trim() || !selectedTicket) return;

		setSubmittingReply(true);
		try {
			const res = await axios.post(`/support-tickets/${selectedTicket._id}/messages`, {
				message: replyMessage.trim(),
			});
			setSelectedTicket(res.data.ticket);
			setReplyMessage("");
			loadUserTickets();
			toast.success("Reply submitted.");
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to send message.");
		} finally {
			setSubmittingReply(false);
		}
	};

	const getStatusBadge = (status) => {
		switch (status) {
			case "open":
				return <span className='px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20'>Open</span>;
			case "in_progress":
				return <span className='px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20'>In Progress</span>;
			case "resolved":
				return <span className='px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>Resolved</span>;
			case "closed":
				return <span className='px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'>Closed</span>;
			default:
				return null;
		}
	};

	return (
		<div className='min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors'>
			<div className='max-w-5xl mx-auto'>
				{/* HERO SECTION */}
				<div className='text-center mb-10'>
					<span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 mb-3'>
						<Sparkles size={12} className='text-[#e05338]' /> Concierge &amp; Customer Care
					</span>
					<h1 className='text-3xl sm:text-4xl font-black uppercase tracking-tight'>
						How Can We <span className='text-[#e05338]'>Assist You?</span>
					</h1>
					<p className='mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto'>
						Search our luxury garment care guides, delivery policies, or submit a direct ticket to our fashion concierge.
					</p>

					{/* SEARCH BAR */}
					<div className='mt-6 max-w-xl mx-auto relative'>
						<Search size={18} className='absolute left-4 top-3.5 text-neutral-400' />
						<input
							type='text'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder='Search orders, refunds, sizing, shipments...'
							className='w-full pl-11 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-all shadow-sm'
						/>
					</div>
				</div>

				{/* NAVIGATION TABS */}
				<div className='flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 mb-8 pb-3'>
					<div className='flex gap-6'>
						<button
							type='button'
							onClick={() => setActiveTab("faq")}
							className={`text-xs font-bold uppercase tracking-wider pb-3 -mb-3 transition-colors relative ${
								activeTab === "faq"
									? "text-neutral-900 dark:text-white"
									: "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
							}`}
						>
							Frequently Asked Questions
							{activeTab === "faq" && (
								<span className='absolute bottom-0 left-0 right-0 h-0.5 bg-[#e05338]' />
							)}
						</button>
						<button
							type='button'
							onClick={() => setActiveTab("tickets")}
							className={`text-xs font-bold uppercase tracking-wider pb-3 -mb-3 transition-colors relative flex items-center gap-1.5 ${
								activeTab === "tickets"
									? "text-neutral-900 dark:text-white"
									: "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
							}`}
						>
							My Support Tickets
							{tickets.length > 0 && (
								<span className='bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full text-[9px] font-bold px-1.5 py-0.2'>
									{tickets.length}
								</span>
							)}
							{activeTab === "tickets" && (
								<span className='absolute bottom-0 left-0 right-0 h-0.5 bg-[#e05338]' />
							)}
						</button>
					</div>

					<button
						type='button'
						onClick={() => {
							if (!user) {
								toast.error("Please sign in to submit a support ticket.");
								return;
							}
							setIsCreateModalOpen(true);
						}}
						className='inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-extrabold uppercase tracking-wider hover:opacity-90 transition-opacity'
					>
						<Plus size={14} />
						<span>New Ticket</span>
					</button>
				</div>

				{/* ======================================================== */}
				{/* TAB 1: FAQ ACCORDION                                     */}
				{/* ======================================================== */}
				{activeTab === "faq" && (
					<div className='space-y-4'>
						{filteredFaqs.length === 0 ? (
							<div className='text-center py-12 text-neutral-500'>
								<HelpCircle size={36} className='mx-auto mb-2 opacity-40' />
								<p className='text-sm'>No matching answers found for &ldquo;{searchQuery}&rdquo;.</p>
								<button
									type='button'
									onClick={() => setIsCreateModalOpen(true)}
									className='mt-3 text-xs font-bold text-[#e05338] underline'
								>
									Submit a ticket to ask our team
								</button>
							</div>
						) : (
							filteredFaqs.map((faq, index) => {
								const isOpen = openFaqIndex === index;
								return (
									<div
										key={index}
										className='border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden transition-colors'
									>
										<button
											type='button'
											onClick={() => setOpenFaqIndex(isOpen ? null : index)}
											className='w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors'
										>
											<div className='pr-4'>
												<span className='text-[10px] font-bold uppercase tracking-widest text-[#e05338] block mb-1'>
													{faq.category}
												</span>
												<h3 className='text-sm sm:text-base font-bold text-neutral-900 dark:text-white'>
													{faq.question}
												</h3>
											</div>
											<div className='text-neutral-400'>
												{isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
											</div>
										</button>
										{isOpen && (
											<div className='px-4 sm:px-5 pb-5 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60 pt-3'>
												{faq.answer}
											</div>
										)}
									</div>
								);
							})
						)}
					</div>
				)}

				{/* ======================================================== */}
				{/* TAB 2: MY SUPPORT TICKETS                                */}
				{/* ======================================================== */}
				{activeTab === "tickets" && (
					<div>
						{!user ? (
							<div className='text-center py-16 bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800'>
								<MessageSquare size={40} className='mx-auto mb-3 text-neutral-400' />
								<h3 className='text-base font-bold uppercase tracking-wider mb-2'>
									Sign in to View Support Tickets
								</h3>
								<p className='text-xs text-neutral-500 max-w-sm mx-auto mb-5'>
									Access personalized assistance, live ticket replies, and track communications with our concierge.
								</p>
								<Link
									to='/login?redirect=/help'
									className='px-6 py-2.5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-extrabold text-xs uppercase tracking-wider'
								>
									Sign In
								</Link>
							</div>
						) : loadingTickets ? (
							<div className='py-12 text-center text-neutral-500'>
								<Loader className='animate-spin mx-auto mb-2' size={24} />
								<p className='text-xs font-bold uppercase tracking-wider'>Loading Your Tickets...</p>
							</div>
						) : tickets.length === 0 ? (
							<div className='text-center py-14 bg-neutral-50 dark:bg-neutral-900/30 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8'>
								<CheckCircle2 size={36} className='mx-auto mb-2 text-emerald-500' />
								<h3 className='text-sm font-bold uppercase tracking-wider mb-1'>No Open Inquiries</h3>
								<p className='text-xs text-neutral-500 mb-4'>
									You do not have any active support tickets at this time.
								</p>
								<button
									type='button'
									onClick={() => setIsCreateModalOpen(true)}
									className='px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider'
								>
									Create a Support Ticket
								</button>
							</div>
						) : selectedTicket ? (
							/* TICKET DETAIL & REPLIES CONVERSATION VIEW */
							<div className='border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-white dark:bg-neutral-900/40 shadow-sm'>
								<div className='flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-6'>
									<div>
										<button
											type='button'
											onClick={() => setSelectedTicket(null)}
											className='text-xs font-bold text-[#e05338] underline mb-1 flex items-center gap-1'
										>
											&larr; Back to all tickets
										</button>
										<div className='flex items-center gap-3'>
											<h2 className='text-lg font-bold text-neutral-900 dark:text-white'>
												{selectedTicket.subject}
											</h2>
											{getStatusBadge(selectedTicket.status)}
										</div>
										<p className='text-xs text-neutral-500 mt-0.5'>
											Ticket #{selectedTicket.ticketNumber} &bull; Category: {selectedTicket.category}
											{selectedTicket.orderNumber && (
												<span className='ml-2 font-mono'>&bull; Order: {selectedTicket.orderNumber}</span>
											)}
										</p>
									</div>
								</div>

								{/* MESSAGE THREAD */}
								<div className='space-y-4 mb-6 max-h-[420px] overflow-y-auto pr-2'>
									{selectedTicket.messages.map((m, idx) => {
										const isMe = m.sender === "customer";
										return (
											<div
												key={idx}
												className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
											>
												<div
													className={`max-w-lg rounded-2xl p-4 text-sm leading-relaxed ${
														isMe
															? "bg-[#e05338] text-white rounded-br-none"
															: "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-none"
													}`}
												>
													<p className='text-[10px] font-bold uppercase tracking-wider opacity-75 mb-1'>
														{m.senderName}
													</p>
													<p className='whitespace-pre-line'>{m.message}</p>
												</div>
												<span className='text-[10px] text-neutral-400 mt-1 px-1 font-mono'>
													{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
												</span>
											</div>
										);
									})}
								</div>

								{/* REPLY INPUT */}
								{selectedTicket.status !== "closed" ? (
									<form onSubmit={handleSendReply} className='flex gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800'>
										<input
											type='text'
											value={replyMessage}
											onChange={(e) => setReplyMessage(e.target.value)}
											placeholder='Type your response to the concierge...'
											required
											className='flex-1 px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white'
										/>
										<button
											type='submit'
											disabled={submittingReply || !replyMessage.trim()}
											className='px-5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50'
										>
											{submittingReply ? <Loader className='animate-spin' size={14} /> : <Send size={14} />}
											<span>Send</span>
										</button>
									</form>
								) : (
									<p className='text-xs text-center text-neutral-500 pt-4 border-t border-neutral-200 dark:border-neutral-800'>
										This ticket has been resolved and closed.
									</p>
								)}
							</div>
						) : (
							/* TICKET LIST CARDS */
							<div className='space-y-3'>
								{tickets.map((t) => (
									<div
										key={t._id}
										onClick={() => setSelectedTicket(t)}
										className='p-4 sm:p-5 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-neutral-400 dark:hover:border-neutral-700 cursor-pointer transition-all bg-white dark:bg-neutral-900/40 flex items-center justify-between'
									>
										<div>
											<div className='flex items-center gap-2 mb-1'>
												<span className='font-mono text-xs font-bold text-neutral-400'>
													#{t.ticketNumber}
												</span>
												{getStatusBadge(t.status)}
											</div>
											<h4 className='text-sm sm:text-base font-bold text-neutral-900 dark:text-white'>
												{t.subject}
											</h4>
											<p className='text-xs text-neutral-500 mt-0.5 line-clamp-1'>
												{t.messages[t.messages.length - 1]?.message || "No messages"}
											</p>
										</div>
										<div className='text-right'>
											<span className='text-[10px] text-neutral-400 block'>
												{new Date(t.updatedAt).toLocaleDateString()}
											</span>
											<span className='text-xs font-bold text-[#e05338] underline mt-1 block'>
												View Thread &rarr;
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* ======================================================== */}
				{/* MODAL: CREATE SUPPORT TICKET                             */}
				{/* ======================================================== */}
				{isCreateModalOpen && (
					<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in'>
						<div className='w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95'>
							<div className='flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-5'>
								<h3 className='text-base font-bold uppercase tracking-wider'>
									Submit Support Ticket
								</h3>
								<button
									type='button'
									onClick={() => setIsCreateModalOpen(false)}
									className='p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400'
								>
									<X size={18} />
								</button>
							</div>

							<form onSubmit={handleCreateTicketSubmit} className='space-y-4'>
								<div>
									<label className='block text-xs font-bold uppercase tracking-wider mb-1'>
										Category
									</label>
									<select
										value={newTicket.category}
										onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
										className='w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-bold uppercase tracking-wider focus:outline-none'
									>
										<option value='Order Issue'>Order Issue</option>
										<option value='Delivery & Shipping'>Delivery &amp; Shipping</option>
										<option value='Return & Refund'>Return &amp; Refund</option>
										<option value='Size & Fit'>Size &amp; Fit</option>
										<option value='Payment & Billing'>Payment &amp; Billing</option>
										<option value='Account & Login'>Account &amp; Login</option>
										<option value='Product Inquiry'>Product Inquiry</option>
									</select>
								</div>

								{/* Optional Order Picker */}
								{orders && orders.length > 0 && (
									<div>
										<label className='block text-xs font-bold uppercase tracking-wider mb-1'>
											Related Order (Optional)
										</label>
										<select
											value={newTicket.orderId}
											onChange={(e) => setNewTicket({ ...newTicket, orderId: e.target.value })}
											className='w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-medium focus:outline-none'
										>
											<option value=''>None</option>
											{orders.map((o) => (
												<option key={o._id} value={o._id}>
													#{o.orderNumber || o._id.slice(-8).toUpperCase()} &bull; ₹{o.totalAmount} (
													{new Date(o.createdAt).toLocaleDateString()})
												</option>
											))}
										</select>
									</div>
								)}

								<div>
									<label className='block text-xs font-bold uppercase tracking-wider mb-1'>
										Subject
									</label>
									<input
										type='text'
										required
										value={newTicket.subject}
										onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
										placeholder='Brief summary of your inquiry'
										className='w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none'
									/>
								</div>

								<div>
									<label className='block text-xs font-bold uppercase tracking-wider mb-1'>
										Message / Details
									</label>
									<textarea
										rows={4}
										required
										value={newTicket.message}
										onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
										placeholder='Please describe the issue or question in detail...'
										className='w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none resize-none'
									/>
								</div>

								<div className='flex justify-end gap-3 pt-3'>
									<button
										type='button'
										onClick={() => setIsCreateModalOpen(false)}
										className='px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-200'
									>
										Cancel
									</button>
									<button
										type='submit'
										disabled={submittingTicket}
										className='px-5 py-2 rounded-lg bg-[#e05338] hover:bg-[#d04328] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5'
									>
										{submittingTicket ? <Loader className='animate-spin' size={14} /> : <Send size={14} />}
										<span>Submit Ticket</span>
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default HelpCenterPage;

