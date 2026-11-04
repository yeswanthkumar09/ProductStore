import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, RefreshCw, CheckCircle2, ArrowRight } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";

const VerifyPendingPage = () => {
	const [searchParams] = useSearchParams();
	const email = searchParams.get("email") || "";

	const [cooldown, setCooldown] = useState(60);
	const [canResend, setCanResend] = useState(false);
	const [resending, setResending] = useState(false);
	const [resendSuccess, setResendSuccess] = useState(false);

	const { resendVerification } = useUserStore();

	useEffect(() => {
		let interval = null;
		if (cooldown > 0) {
			interval = setInterval(() => {
				setCooldown((prev) => prev - 1);
			}, 1000);
		} else {
			setCanResend(true);
		}
		return () => clearInterval(interval);
	}, [cooldown]);

	const handleResend = async () => {
		if (!email || !canResend) return;
		setResending(true);
		const res = await resendVerification(email);
		setResending(false);
		if (res && res.success) {
			setResendSuccess(true);
			setCooldown(60);
			setCanResend(false);
		}
	};

	return (
		<div className='min-h-[calc(100vh-4rem)] w-full bg-neutral-950 flex items-center justify-center p-6 text-white'>
			<div className='w-full max-w-lg bg-[#131316] border border-neutral-800 rounded-2xl p-8 sm:p-10 shadow-2xl text-center space-y-6'>
				<div className='w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400'>
					<Mail size={32} />
				</div>

				<div className='space-y-2'>
					<span className='text-[10px] font-bold tracking-[0.25em] text-neutral-400 uppercase'>
						Membership Verification
					</span>
					<h1 className='text-2xl sm:text-3xl font-black uppercase tracking-tight text-white'>
						CHECK YOUR INBOX
					</h1>
					<p className='text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-md mx-auto'>
						We have dispatched an activation link to:
					</p>
					<p className='text-sm sm:text-base font-mono font-bold text-white bg-neutral-900 border border-neutral-800 py-2.5 px-4 rounded-lg inline-block'>
						{email || "your registered email"}
					</p>
				</div>

				<div className='bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 text-xs text-neutral-400 text-left space-y-2'>
					<p className='font-semibold text-neutral-300'>Next steps:</p>
					<ol className='list-decimal list-inside space-y-1 text-neutral-400'>
						<li>Open the email sent from LuxeStore Atelier.</li>
						<li>Click the <strong>VERIFY EMAIL ADDRESS</strong> button.</li>
						<li>The link is active for <strong>15 minutes</strong>.</li>
					</ol>
				</div>

				{resendSuccess && (
					<div className='flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg'>
						<CheckCircle2 size={16} />
						<span>A fresh verification link has been dispatched to your email!</span>
					</div>
				)}

				<div className='pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs'>
					<button
						type='button'
						onClick={handleResend}
						disabled={!canResend || resending}
						className='w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed'
					>
						<RefreshCw size={14} className={resending ? "animate-spin" : ""} />
						<span>{canResend ? "Resend Verification Link" : `Resend in ${cooldown}s`}</span>
					</button>

					<Link
						to='/login'
						className='w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-white hover:bg-neutral-200 text-black font-extrabold transition-all'
					>
						<span>Proceed to Login</span>
						<ArrowRight size={14} />
					</Link>
				</div>
			</div>
		</div>
	);
};

export default VerifyPendingPage;

