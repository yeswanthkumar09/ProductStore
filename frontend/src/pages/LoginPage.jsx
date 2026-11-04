import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";

const LoginPage = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const redirectUrl = searchParams.get("redirect") || "/";

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(true);
	const [unverifiedEmail, setUnverifiedEmail] = useState(null);
	const [resending, setResending] = useState(false);

	const { login, resendVerification, loading, user } = useUserStore();

	useEffect(() => {
		if (user) {
			navigate(redirectUrl);
		}
	}, [user, navigate, redirectUrl]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setUnverifiedEmail(null);

		const res = await login(email.trim().toLowerCase(), password);
		if (res && res.requiresVerification) {
			setUnverifiedEmail(res.email);
		} else if (res && res.success) {
			navigate(redirectUrl);
		}
	};

	const handleResend = async () => {
		if (!unverifiedEmail) return;
		setResending(true);
		await resendVerification(unverifiedEmail);
		setResending(false);
	};

	return (
		<div className='min-h-[calc(100vh-4rem)] w-full bg-neutral-950 flex flex-col md:flex-row text-white'>
			{/* LEFT 50%: EDITORIAL FASHION CAMPAIGN (Matching Brand Visual Identity) */}
			<div className='relative w-full md:w-1/2 min-h-[320px] md:min-h-full flex flex-col justify-end overflow-hidden select-none bg-neutral-900'>
				<img
					src='https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1600&auto=format&fit=crop'
					alt='LuxeStore Campaign Runway'
					className='absolute inset-0 w-full h-full object-cover object-center filter brightness-90 contrast-105'
				/>
				<div className='absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent' />

				<div className='relative z-10 p-8 md:p-14 lg:p-16'>
					<span className='inline-block text-[10px] md:text-xs font-bold tracking-[0.25em] text-neutral-300 uppercase mb-3'>
						Haute Couture &bull; Fall / Winter Collection
					</span>
					<h1 className='text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-none'>
						WEAR WHAT&apos;S <span className='text-[#e05338]'>NEXT</span>
					</h1>
					<p className='mt-3 text-xs md:text-sm text-neutral-300 max-w-md font-normal leading-relaxed'>
						Private member access to limited drops, tailored silhouettes, and handcrafted luxury garments.
					</p>
				</div>
			</div>

			{/* RIGHT 50%: AUTHENTICATION PANEL */}
			<div className='w-full md:w-1/2 flex items-center justify-center p-6 sm:p-10 md:p-14 lg:p-20 bg-[#0d0d0f]'>
				<div className='w-full max-w-md bg-[#131316] border border-neutral-800/80 rounded-2xl p-7 sm:p-9 shadow-2xl relative'>
					{/* Brand Title */}
					<div className='text-center mb-8'>
						<Link to='/' className='inline-block group'>
							<span className='text-2xl sm:text-3xl font-black tracking-[0.25em] text-white uppercase group-hover:text-[#e05338] transition-colors'>
								LUXESTORE
							</span>
						</Link>
						<p className='text-[11px] font-semibold tracking-widest text-neutral-400 uppercase mt-1'>
							Haute Atelier &bull; Member Access
						</p>
					</div>

					{/* Unverified Account Notice */}
					{unverifiedEmail && (
						<div className='mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2'>
							<div className='flex items-center gap-2 font-bold'>
								<AlertCircle size={16} className='text-amber-400 shrink-0' />
								<span>Email Verification Required</span>
							</div>
							<p className='text-[11px] text-amber-200/90 leading-relaxed'>
								Please verify your email address (<strong className='text-white'>{unverifiedEmail}</strong>) before signing in. Check your inbox for the link.
							</p>
							<button
								type='button'
								onClick={handleResend}
								disabled={resending}
								className='inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-amber-600/40 hover:bg-amber-600/60 border border-amber-500/40 px-3 py-1.5 rounded-lg transition-colors'
							>
								{resending ? <Loader size={12} className='animate-spin' /> : null}
								<span>Resend Verification Link</span>
							</button>
						</div>
					)}

					{/* Sign In Form */}
					<form onSubmit={handleSubmit} className='space-y-5'>
						<div>
							<label className='block text-[11px] font-bold uppercase tracking-widest text-neutral-300 mb-2'>
								Email Address
							</label>
							<div className='relative'>
								<Mail size={16} className='absolute left-3.5 top-3.5 text-neutral-500' />
								<input
									type='email'
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder='patron@luxestore.in'
									required
									autoFocus
									className='w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors font-sans'
								/>
							</div>
						</div>

						<div>
							<div className='flex items-center justify-between mb-2'>
								<label className='block text-[11px] font-bold uppercase tracking-widest text-neutral-300'>
									Password
								</label>
								<Link
									to='/forgot-password'
									className='text-[11px] text-neutral-400 hover:text-white transition-colors underline font-semibold'
								>
									Forgot password?
								</Link>
							</div>
							<div className='relative'>
								<Lock size={16} className='absolute left-3.5 top-3.5 text-neutral-500' />
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder='&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;'
									required
									className='w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-10 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors font-sans'
								/>
								<button
									type='button'
									onClick={() => setShowPassword(!showPassword)}
									className='absolute right-3.5 top-3.5 text-neutral-400 hover:text-white transition-colors'
								>
									{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
								</button>
							</div>
						</div>

						{/* Remember Me Option */}
						<div className='flex items-center justify-between text-xs text-neutral-400 pt-1'>
							<label className='flex items-center gap-2 cursor-pointer select-none'>
								<input
									type='checkbox'
									checked={rememberMe}
									onChange={(e) => setRememberMe(e.target.checked)}
									className='w-3.5 h-3.5 rounded bg-neutral-900 border-neutral-700 text-white accent-white focus:ring-0 cursor-pointer'
								/>
								<span className='hover:text-neutral-200 transition-colors'>Remember this device</span>
							</label>
						</div>

						{/* Sign In CTA */}
						<button
							type='submit'
							disabled={loading || !email || !password}
							className='w-full mt-2 py-3.5 px-6 rounded-lg bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg'
						>
							{loading ? (
								<>
									<Loader className='animate-spin' size={16} />
									<span>AUTHENTICATING...</span>
								</>
							) : (
								<>
									<span>SIGN IN</span>
									<ArrowRight size={14} />
								</>
							)}
						</button>
					</form>

					{/* Sign Up Link */}
					<div className='text-center mt-6 pt-5 border-t border-neutral-800/80'>
						<p className='text-xs text-neutral-400'>
							New to LuxeStore?{" "}
							<Link
								to={`/signup${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
								className='text-white font-bold underline hover:text-[#e05338] transition-colors ml-1'
							>
								Create an Account
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
