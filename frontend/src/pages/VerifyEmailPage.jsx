import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, Loader, Mail } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";

const VerifyEmailPage = () => {
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token");
	const navigate = useNavigate();

	const [status, setStatus] = useState("loading"); // "loading" | "success" | "expired" | "invalid"
	const [errorMessage, setErrorMessage] = useState("");
	const [resendEmail, setResendEmail] = useState("");
	const [resendLoading, setResendLoading] = useState(false);
	const [resendSuccess, setResendSuccess] = useState(false);

	const { verifyEmailToken, resendVerification } = useUserStore();

	useEffect(() => {
		if (!token) {
			setStatus("invalid");
			setErrorMessage("No verification token was provided in the URL.");
			return;
		}

		let isMounted = true;
		const verify = async () => {
			const res = await verifyEmailToken(token);
			if (!isMounted) return;

			if (res && res.success) {
				setStatus("success");
				// Redirect to login after 3.5 seconds
				setTimeout(() => {
					navigate("/login");
				}, 3500);
			} else if (res && res.expired) {
				setStatus("expired");
				setErrorMessage(res.error || "This verification link has expired.");
				if (res.email) setResendEmail(res.email);
			} else {
				setStatus("invalid");
				setErrorMessage(res?.error || "This verification link is invalid or has already been used.");
			}
		};

		verify();

		return () => {
			isMounted = false;
		};
	}, [token, verifyEmailToken, navigate]);

	const handleResend = async (e) => {
		e.preventDefault();
		if (!resendEmail) return;
		setResendLoading(true);
		const res = await resendVerification(resendEmail.trim().toLowerCase());
		setResendLoading(false);
		if (res && res.success) {
			setResendSuccess(true);
		}
	};

	return (
		<div className='min-h-[calc(100vh-4rem)] w-full bg-neutral-950 flex items-center justify-center p-6 text-white'>
			<div className='w-full max-w-md bg-[#131316] border border-neutral-800 rounded-2xl p-8 sm:p-10 shadow-2xl text-center space-y-6'>
				{/* 1. LOADING STATE */}
				{status === "loading" && (
					<div className='py-8 space-y-4'>
						<Loader size={44} className='animate-spin text-white mx-auto' />
						<h2 className='text-lg font-bold uppercase tracking-wider text-white'>
							Verifying Email Address...
						</h2>
						<p className='text-xs text-neutral-400'>
							Validating cryptographic token with LuxeStore authentication servers.
						</p>
					</div>
				)}

				{/* 2. SUCCESS STATE */}
				{status === "success" && (
					<div className='space-y-5 animate-in fade-in duration-300'>
						<div className='w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400'>
							<CheckCircle2 size={36} />
						</div>

						<div className='space-y-2'>
							<span className='text-[10px] font-bold tracking-[0.25em] text-emerald-400 uppercase'>
								Verification Complete
							</span>
							<h1 className='text-2xl font-black uppercase tracking-tight text-white'>
								ACCOUNT ACTIVATED
							</h1>
							<p className='text-xs sm:text-sm text-neutral-400 leading-relaxed'>
								Your email address has been verified successfully. Your account is now active and granted full member privileges.
							</p>
						</div>

						<p className='text-xs text-neutral-500 italic'>
							Redirecting you to the sign-in portal...
						</p>

						<Link
							to='/login'
							className='w-full py-3.5 px-6 rounded-lg bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg'
						>
							<span>Sign In Now</span>
							<ArrowRight size={14} />
						</Link>
					</div>
				)}

				{/* 3. EXPIRED STATE */}
				{status === "expired" && (
					<div className='space-y-5 animate-in fade-in duration-300'>
						<div className='w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400'>
							<AlertTriangle size={36} />
						</div>

						<div className='space-y-2'>
							<span className='text-[10px] font-bold tracking-[0.25em] text-amber-400 uppercase'>
								Link Elapsed
							</span>
							<h1 className='text-2xl font-black uppercase tracking-tight text-white'>
								VERIFICATION EXPIRED
							</h1>
							<p className='text-xs sm:text-sm text-neutral-400 leading-relaxed'>
								{errorMessage || "Verification links expire after 15 minutes for your security."}
							</p>
						</div>

						{resendSuccess ? (
							<div className='p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs text-center space-y-1'>
								<p className='font-bold'>✓ Fresh Verification Link Dispatched!</p>
								<p className='text-[11px] text-emerald-200/80'>Please check your inbox and click the new link.</p>
							</div>
						) : (
							<form onSubmit={handleResend} className='space-y-3 pt-2 text-left'>
								<label className='block text-[11px] font-bold uppercase tracking-widest text-neutral-300'>
									Your Email Address
								</label>
								<div className='relative'>
									<Mail size={16} className='absolute left-3.5 top-3.5 text-neutral-500' />
									<input
										type='email'
										value={resendEmail}
										onChange={(e) => setResendEmail(e.target.value)}
										placeholder='patron@luxestore.in'
										required
										className='w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white'
									/>
								</div>
								<button
									type='submit'
									disabled={resendLoading || !resendEmail}
									className='w-full py-3 px-4 rounded-lg bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50'
								>
									{resendLoading ? <Loader size={14} className='animate-spin' /> : null}
									<span>Dispatch New Link</span>
								</button>
							</form>
						)}

						<div className='pt-2'>
							<Link to='/login' className='text-xs text-neutral-400 hover:text-white underline'>
								Return to Sign In
							</Link>
						</div>
					</div>
				)}

				{/* 4. INVALID STATE */}
				{status === "invalid" && (
					<div className='space-y-5 animate-in fade-in duration-300'>
						<div className='w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400'>
							<XCircle size={36} />
						</div>

						<div className='space-y-2'>
							<span className='text-[10px] font-bold tracking-[0.25em] text-rose-400 uppercase'>
								Invalid Token
							</span>
							<h1 className='text-2xl font-black uppercase tracking-tight text-white'>
								VERIFICATION FAILED
							</h1>
							<p className='text-xs sm:text-sm text-neutral-400 leading-relaxed'>
								{errorMessage || "The link you followed is invalid or has already been redeemed."}
							</p>
						</div>

						<div className='pt-2 flex flex-col gap-2'>
							<Link
								to='/login'
								className='w-full py-3 px-4 rounded-lg bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-widest transition-all'
							>
								Proceed to Sign In
							</Link>
							<Link
								to='/signup'
								className='w-full py-3 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-xs uppercase tracking-wider transition-all'
							>
								Create New Account
							</Link>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default VerifyEmailPage;

