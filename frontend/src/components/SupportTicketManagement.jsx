import { useState, useEffect } from "react";
import { MessageSquare, CheckCircle2, Clock, AlertCircle, Send, X, Loader, Search, Filter } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const SupportTicketManagement = () => {
	const [tickets, setTickets] = useState([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState("all");
	const [search, setSearch] = useState("");
	const [selectedTicket, setSelectedTicket] = useState(null);
	const [replyMessage, setReplyMessage] = useState("");
	const [submittingReply, setSubmittingReply] = useState(false);

	const loadTickets = async () => {
		setLoading(true);
		try {
			const res = await axios.get(
				`/support-tickets/admin/all?status=${statusFilter}&search=${encodeURIComponent(search)}`
			);
			setTickets(res.data?.tickets || []);
		} catch (err) {
			console.error("Error loading tickets:", err);
			toast.error("Failed to load support tickets.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadTickets();
	}, [statusFilter]);

	const handleStatusUpdate = async (ticketId, newStatus) => {
		try {
			const res = await axios.patch(`/support-tickets/admin/${ticketId}/status`, { status: newStatus });
			toast.success(`Ticket marked as ${newStatus.replace("_", " ").toUpperCase()}`);
			if (selectedTicket && selectedTicket._id === ticketId) {
				setSelectedTicket(res.data.ticket);
			}
			loadTickets();
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to update status.");
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
			toast.success("Concierge reply dispatched to patron.");
			loadTickets();
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to send reply.");
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
		<div className='bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl'>
			<div className='flex flex-wrap items-center justify-between pb-6 border-b border-neutral-800 gap-4 mb-6'>
				<div>
					<div className='flex items-center gap-2'>
						<MessageSquare size={20} className='text-[#e05338]' />
						<h2 className='text-xl font-bold uppercase tracking-wide font-heading'>
							Customer Care &amp; Support Tickets
						</h2>
					</div>
					<p className='text-xs text-neutral-400 mt-1'>
						Review customer inquiries, order disputes, sizing questions, and dispatch concierge answers.
					</p>
				</div>

				<div className='flex items-center gap-2'>
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className='bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white focus:outline-none'
					>
						<option value='all'>All Statuses</option>
						<option value='open'>Open</option>
						<option value='in_progress'>In Progress</option>
						<option value='resolved'>Resolved</option>
						<option value='closed'>Closed</option>
					</select>
				</div>
			</div>

			{loading ? (
				<div className='py-16 text-center text-neutral-500'>
					<Loader className='animate-spin mx-auto mb-2 text-[#e05338]' size={24} />
					<p className='text-xs font-bold uppercase tracking-wider'>Loading Patron Tickets...</p>
				</div>
			) : tickets.length === 0 ? (
				<div className='py-16 text-center text-neutral-500'>
					<CheckCircle2 size={36} className='mx-auto mb-2 text-emerald-500' />
					<p className='text-sm font-bold uppercase tracking-wider'>All Inquiries Clear</p>
					<p className='text-xs text-neutral-400 mt-1'>No support tickets matching this filter.</p>
				</div>
			) : (
				<div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
					{/* Ticket List (Left Column) */}
					<div className='lg:col-span-5 space-y-3 max-h-[600px] overflow-y-auto pr-2'>
						{tickets.map((t) => {
							const isSelected = selectedTicket?._id === t._id;
							return (
								<div
									key={t._id}
									onClick={() => setSelectedTicket(t)}
									className={`p-4 rounded-xl border transition-all cursor-pointer ${
										isSelected
											? "bg-neutral-800 border-[#e05338] shadow-lg"
											: "bg-neutral-950/60 border-neutral-800 hover:border-neutral-700"
									}`}
								>
									<div className='flex items-center justify-between mb-1.5'>
										<span className='font-mono text-xs text-neutral-400 font-bold'>
											#{t.ticketNumber}
										</span>
										{getStatusBadge(t.status)}
									</div>
									<h4 className='text-sm font-bold text-white line-clamp-1'>{t.subject}</h4>
									<div className='flex items-center justify-between text-[11px] text-neutral-400 mt-2'>
										<span>{t.userName} ({t.userEmail})</span>
										<span>{new Date(t.updatedAt).toLocaleDateString()}</span>
									</div>
								</div>
							);
						})}
					</div>

					{/* Conversation Detail & Reply (Right Column) */}
					<div className='lg:col-span-7 bg-neutral-950/80 border border-neutral-800 rounded-xl p-6 flex flex-col min-h-[500px]'>
						{selectedTicket ? (
							<>
								<div className='flex flex-wrap items-center justify-between pb-4 border-b border-neutral-800 gap-2 mb-4'>
									<div>
										<div className='flex items-center gap-2'>
											<h3 className='text-base font-bold text-white'>{selectedTicket.subject}</h3>
											{getStatusBadge(selectedTicket.status)}
										</div>
										<p className='text-xs text-neutral-400 mt-0.5'>
											Patron: {selectedTicket.userName} &bull; {selectedTicket.userEmail}
											{selectedTicket.orderNumber && ` • Order: #${selectedTicket.orderNumber}`}
										</p>
									</div>

									{/* Status Change Selector */}
									<select
										value={selectedTicket.status}
										onChange={(e) => handleStatusUpdate(selectedTicket._id, e.target.value)}
										className='bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white focus:outline-none'
									>
										<option value='open'>Mark Open</option>
										<option value='in_progress'>Mark In Progress</option>
										<option value='resolved'>Mark Resolved</option>
										<option value='closed'>Mark Closed</option>
									</select>
								</div>

								{/* Message Thread */}
								<div className='flex-1 space-y-3 overflow-y-auto max-h-[360px] pr-2 mb-4'>
									{selectedTicket.messages.map((m, idx) => {
										const isSupport = m.sender === "support";
										return (
											<div
												key={idx}
												className={`flex flex-col ${isSupport ? "items-end" : "items-start"}`}
											>
												<div
													className={`max-w-md rounded-2xl p-3.5 text-xs leading-relaxed ${
														isSupport
															? "bg-[#e05338] text-white rounded-br-none"
															: "bg-neutral-800 text-neutral-100 rounded-bl-none"
													}`}
												>
													<p className='text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1'>
														{m.senderName} ({m.sender})
													</p>
													<p className='whitespace-pre-line'>{m.message}</p>
												</div>
												<span className='text-[9px] text-neutral-500 mt-0.5 px-1 font-mono'>
													{new Date(m.createdAt).toLocaleString()}
												</span>
											</div>
										);
									})}
								</div>

								{/* Admin Reply Box */}
								<form onSubmit={handleSendReply} className='flex gap-2 pt-3 border-t border-neutral-800'>
									<input
										type='text'
										value={replyMessage}
										onChange={(e) => setReplyMessage(e.target.value)}
										placeholder='Write concierge response to customer...'
										required
										className='flex-1 px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-white'
									/>
									<button
										type='submit'
										disabled={submittingReply || !replyMessage.trim()}
										className='px-4 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-neutral-200 transition-colors disabled:opacity-50'
									>
										{submittingReply ? <Loader className='animate-spin' size={13} /> : <Send size={13} />}
										<span>Reply</span>
									</button>
								</form>
							</>
						) : (
							<div className='flex-1 flex flex-col items-center justify-center text-neutral-500'>
								<MessageSquare size={36} className='opacity-40 mb-2' />
								<p className='text-xs font-bold uppercase tracking-wider'>
									Select a ticket to review conversation
								</p>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default SupportTicketManagement;

