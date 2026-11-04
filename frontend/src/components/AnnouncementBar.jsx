import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAnnouncementStore } from "../stores/useAnnouncementStore";
import { ChevronRight, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

const defaultAnnouncements = [
	{
		text: "FREE SHIPPING OVER ₹1,999",
		highlightText: "FREE SHIPPING",
		link: "/search",
		type: "shipping",
	},
	{
		text: "USE CODE WELCOME10 FOR 10% OFF",
		highlightText: "WELCOME10",
		link: "/search",
		type: "coupon",
		couponCode: "WELCOME10",
	},
	{
		text: "7-DAY EFFORTLESS RETURNS",
		highlightText: "7-DAY",
		link: "/profile",
		type: "policy",
	},
];

const AnnouncementBar = () => {
	const { announcements, fetchActiveAnnouncements } = useAnnouncementStore();
	const [currentIndex, setCurrentIndex] = useState(0);
	const [copied, setCopied] = useState(false);
	const [fade, setFade] = useState(true);

	useEffect(() => {
		fetchActiveAnnouncements();
	}, [fetchActiveAnnouncements]);

	const items = announcements && announcements.length > 0 ? announcements : defaultAnnouncements;

	useEffect(() => {
		if (items.length <= 1) return;

		const timer = setInterval(() => {
			setFade(false);
			setTimeout(() => {
				setCurrentIndex((prev) => (prev + 1) % items.length);
				setFade(true);
			}, 300);
		}, 4500);

		return () => clearInterval(timer);
	}, [items.length]);

	const currentItem = items[currentIndex % items.length] || items[0] || {};

	if (!currentItem || !currentItem.text) return null;

	const handleCopyCoupon = (e, code) => {
		e.preventDefault();
		e.stopPropagation();
		if (!code) return;
		navigator.clipboard.writeText(code);
		setCopied(true);
		toast.success(`Coupon "${code}" copied to clipboard!`);
		setTimeout(() => setCopied(false), 2500);
	};

	return (
		<div className='relative w-full bg-neutral-950 text-white border-0 outline-none select-none overflow-hidden z-50 h-8 flex items-center justify-center text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase'>
			<div
				className={`transition-opacity duration-300 px-4 text-center flex items-center justify-center gap-2 max-w-7xl mx-auto ${
					fade ? "opacity-100" : "opacity-0"
				}`}
			>
				{currentItem.link ? (
					<Link
						to={currentItem.link}
						className='inline-flex items-center gap-1.5 hover:text-neutral-300 transition-colors cursor-pointer group'
					>
						<span>{currentItem.text}</span>
						<ChevronRight
							size={12}
							className='opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all'
						/>
					</Link>
				) : (
					<span>{currentItem.text}</span>
				)}

				{currentItem.type === "coupon" && currentItem.couponCode && (
					<button
						type='button'
						onClick={(e) => handleCopyCoupon(e, currentItem.couponCode)}
						className='inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[9px] tracking-normal font-mono normal-case transition-colors text-neutral-300'
						title={`Copy coupon ${currentItem.couponCode}`}
					>
						{copied ? <Check size={10} className='text-emerald-400' /> : <Copy size={10} />}
						<span>{copied ? "COPIED" : "COPY"}</span>
					</button>
				)}
			</div>
		</div>
	);
};

export default AnnouncementBar;

