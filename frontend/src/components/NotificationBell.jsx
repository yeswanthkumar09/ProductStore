import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
	Bell,
	CheckCheck,
	Flame,
	Tag,
	PackageCheck,
	Sparkles,
	Info,
	ExternalLink,
	ShieldAlert,
	Lock,
	Truck,
	AlertCircle,
} from "lucide-react";
import { useNotificationStore } from "../stores/useNotificationStore";
import { useUserStore } from "../stores/useUserStore";

const formatTimeAgo = (dateStr) => {
	const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
	if (seconds < 60) return "Just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};

const getNotificationIcon = (type) => {
	switch (type) {
		case "sale":
			return <Flame size={15} className='text-amber-400' />;
		case "coupon":
			return <Tag size={15} className='text-emerald-400' />;
		case "order":
		case "order_confirmed":
			return <PackageCheck size={15} className='text-sky-400' />;
		case "shipping":
		case "delivery_update":
			return <Truck size={15} className='text-blue-400' />;
		case "login_alert":
			return <ShieldAlert size={15} className='text-amber-400' />;
		case "password_change":
			return <Lock size={15} className='text-rose-400' />;
		case "payment_failed":
			return <AlertCircle size={15} className='text-rose-500' />;
		case "welcome":
		case "new_arrival":
			return <Sparkles size={15} className='text-purple-400' />;
		default:
			return <Info size={15} className='text-accent' />;
	}
};

const NotificationBell = () => {
	const { user } = useUserStore();
	const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } =
		useNotificationStore();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef(null);
	const navigate = useNavigate();

	// Fetch notifications on mount and set periodic polling every 45s
	useEffect(() => {
		if (user) {
			fetchNotifications();
			const interval = setInterval(fetchNotifications, 45000);
			return () => clearInterval(interval);
		}
	}, [user, fetchNotifications]);

	// Close when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};
		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen]);

	if (!user) return null;

	const handleItemClick = (notification) => {
		if (!notification.isRead) {
			markAsRead(notification._id);
		}
		setIsOpen(false);
		if (notification.link) {
			navigate(notification.link);
		}
	};

	return (
		<div className='relative' ref={dropdownRef}>
			{/* Bell Trigger Button */}
			<button
				type='button'
				onClick={() => setIsOpen((prev) => !prev)}
				className='relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/80 transition-all focus:outline-none'
				title='Notifications'
			>
				<Bell size={20} />
				{unreadCount > 0 && (
					<span className='absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-rose-500 rounded-full shadow-lg ring-2 ring-gray-950 animate-pulse'>
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</button>

			{/* Dropdown Panel */}
			{isOpen && (
				<div className='absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-gray-800 shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2'>
					{/* Header */}
					<div className='px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-gray-950/60'>
						<div className='flex items-center gap-2'>
							<h3 className='text-sm font-bold text-white'>Notifications</h3>
							{unreadCount > 0 && (
								<span className='px-2 py-0.5 text-[10px] font-extrabold bg-amber-500 text-black rounded-full'>
									{unreadCount} new
								</span>
							)}
						</div>
						{unreadCount > 0 && (
							<button
								onClick={markAllAsRead}
								className='flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline'
							>
								<CheckCheck size={13} /> Mark all read
							</button>
						)}
					</div>

					{/* Notifications List */}
					<div className='max-h-96 overflow-y-auto divide-y divide-gray-800/60'>
						{notifications.length === 0 ? (
							<div className='p-8 text-center text-gray-400'>
								<Bell size={28} className='mx-auto mb-2 text-gray-600' />
								<p className='text-xs font-semibold'>All caught up!</p>
								<p className='text-[11px] text-gray-500 mt-0.5'>
									No new announcements or order updates right now.
								</p>
							</div>
						) : (
							notifications.map((notif) => (
								<div
									key={notif._id}
									onClick={() => handleItemClick(notif)}
									className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
										notif.isRead
											? "hover:bg-gray-800/40 opacity-75"
											: "bg-accent/5 hover:bg-accent/10 opacity-100"
									}`}
								>
									{/* Type Icon Pill */}
									<div className='w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5 border border-gray-700/60'>
										{getNotificationIcon(notif.type)}
									</div>

									{/* Content */}
									<div className='flex-1 min-w-0'>
										<div className='flex items-center justify-between gap-1 mb-0.5'>
											<span className='text-xs font-bold text-white truncate'>
												{notif.title}
											</span>
											<span className='text-[10px] text-gray-500 flex-shrink-0'>
												{formatTimeAgo(notif.createdAt)}
											</span>
										</div>
										<p className='text-[11px] text-gray-400 line-clamp-2 leading-relaxed'>
											{notif.message}
										</p>
									</div>

									{/* Unread dot indicator */}
									{!notif.isRead && (
										<span className='w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-2' />
									)}
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default NotificationBell;
