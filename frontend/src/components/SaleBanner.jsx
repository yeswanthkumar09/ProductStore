import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, ArrowRight, Clock } from "lucide-react";
import axios from "../lib/axios";

const SaleBanner = () => {
	const [activeSale, setActiveSale] = useState(null);
	const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

	useEffect(() => {
		const fetchActiveSale = async () => {
			try {
				const res = await axios.get("/sales/active");
				if (Array.isArray(res.data) && res.data.length > 0) {
					setActiveSale(res.data[0]);
				}
			} catch (err) {
				console.error("Error fetching active sales:", err);
			}
		};
		fetchActiveSale();
	}, []);

	// Countdown Timer
	useEffect(() => {
		if (!activeSale?.endDate) return;

		const calculateTime = () => {
			const difference = new Date(activeSale.endDate) - new Date();
			if (difference <= 0) {
				setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
				return;
			}
			const days = Math.floor(difference / (1000 * 60 * 60 * 24));
			const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
			const minutes = Math.floor((difference / 1000 / 60) % 60);
			const seconds = Math.floor((difference / 1000) % 60);
			setTimeLeft({ days, hours, minutes, seconds });
		};

		calculateTime();
		const interval = setInterval(calculateTime, 1000);
		return () => clearInterval(interval);
	}, [activeSale]);

	if (!activeSale) return null;

	return (
		<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8'>
			<div className='relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-600/30 via-rose-600/20 to-purple-900/30 border border-amber-500/30 p-6 sm:p-10 shadow-2xl backdrop-blur-md flex flex-col lg:flex-row items-center justify-between gap-8'>
				{/* Background Glow */}
				<div className='absolute -right-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none' />

				{/* Left: Info & Headline */}
				<div className='text-center lg:text-left max-w-xl'>
					<div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-3'>
						<Flame size={14} className='animate-bounce text-amber-400' />
						<span>{activeSale.badgeText || "SPECIAL PROMOTION"}</span>
					</div>
					<h3 className='text-2xl sm:text-4xl font-black text-white font-heading tracking-tight leading-snug'>
						{activeSale.name}
					</h3>
					<p className='text-sm sm:text-base text-gray-300 mt-2 leading-relaxed'>
						{activeSale.description || `Save up to ${activeSale.discountValue}% on our most coveted seasonal collections.`}
					</p>
				</div>

				{/* Right: Live Countdown + Action Button */}
				<div className='flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-6'>
					{/* Countdown Units */}
					<div className='flex items-center gap-2 text-center'>
						<div className='bg-gray-950/80 border border-amber-500/30 rounded-2xl p-3 min-w-[62px] shadow-lg'>
							<span className='block text-xl sm:text-2xl font-black text-amber-300 font-mono'>
								{String(timeLeft.days).padStart(2, "0")}
							</span>
							<span className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>
								Days
							</span>
						</div>
						<span className='text-xl font-bold text-amber-400'>:</span>
						<div className='bg-gray-950/80 border border-amber-500/30 rounded-2xl p-3 min-w-[62px] shadow-lg'>
							<span className='block text-xl sm:text-2xl font-black text-amber-300 font-mono'>
								{String(timeLeft.hours).padStart(2, "0")}
							</span>
							<span className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>
								Hours
							</span>
						</div>
						<span className='text-xl font-bold text-amber-400'>:</span>
						<div className='bg-gray-950/80 border border-amber-500/30 rounded-2xl p-3 min-w-[62px] shadow-lg'>
							<span className='block text-xl sm:text-2xl font-black text-amber-300 font-mono'>
								{String(timeLeft.minutes).padStart(2, "0")}
							</span>
							<span className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>
								Mins
							</span>
						</div>
						<span className='text-xl font-bold text-amber-400'>:</span>
						<div className='bg-gray-950/80 border border-amber-500/30 rounded-2xl p-3 min-w-[62px] shadow-lg'>
							<span className='block text-xl sm:text-2xl font-black text-amber-300 font-mono'>
								{String(timeLeft.seconds).padStart(2, "0")}
							</span>
							<span className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>
								Secs
							</span>
						</div>
					</div>

					{/* CTA Button */}
					<Link
						to={`/sales/${activeSale._id}`}
						className='flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl hover:-translate-y-0.5 glow-amber flex-shrink-0'
					>
						<span>Shop Sale</span>
						<ArrowRight size={16} />
					</Link>
				</div>
			</div>
		</div>
	);
};

export default SaleBanner;
