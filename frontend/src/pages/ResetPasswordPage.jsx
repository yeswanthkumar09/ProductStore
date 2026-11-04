import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight, Loader, CheckCircle2, AlertTriangle } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";

const ResetPasswordPage = () => {
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token");

	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [validationError, setValidationError] = useState("");
	const [success, setSuccess] = useState(false);

	const { resetPassword, loading } = useUserStore();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setValidationError("");

		if (!token) {
			setValidationError("No recovery token found. Please use the link provided in your recovery email.");
			return;
		}

		if (newPassword.length < 6) {
			setValidationError("Password must be at least 6 characters long.");
			return;
		}

		if (newPassword !== confirmPassword) {
			setValidationError("Passwords do not match.");
			return;
		}

		const res = await resetPassword({ token, newPassword, confirmPassword });
		if (res && res.success) {
			setSuccess(true);
		}
	};

	if (!token) {
		return (
			<div className='min-h-[calc(100vh-4rem)] w-full bg-neutral-950 flex items-center justify-center p-6 text-white'>
				<div className='w-full max-w-md bg-[#131316] border border-neutral-800 rounded-2xl p-8 sm:p-10 shadow-2xl text-center space-y-5'>
					<div className='w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400'>
						<AlertTriangle size={32} />
					</div>
					<h2 className='text-xl font-bold uppercase tracking-wider text-white'>
						Missing Recovery Token
					</h2>
					<p className='text-xs text-neutral-400 leading-relaxed'>
						No recovery token was found in the URL. Please verify you clicked the full link sent to your email.
					</p>
					<Link
						to='/forgot-password'
						className='w-full py-3 px-4 rounded-lg bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-widest transition-all inline-block'
					>
						Request New Link
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-[calc(100vh-4rem)] w-full bg-neutral-950 flex items-center justify-center p-6 text-white'>
			<div className='w-full max-w-md bg-[#131316] border border-neutral-800 rounded-2xl p-8 sm:p-10 shadow-2xl text-center space-y-6'>
				<div className='space-y-2'>
					<span className='text-[10px] font-bold tracking-[0.25em] text-neutral-400 uppercase'>
						Security Center
					</span>
					<h1 className='text-2xl font-black uppercase tracking-tight text-white'>
						SET NEW PASSWORD
					</h1>
					<p className='text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto'>
						Choose a strong password with at least 6 characters.
					</p>
				</div>

				{success ? (
					<div className='space-y-5 animate-in fade-in duration-300'>
						<div className='w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400'>
							<CheckCircle2 size={36} />
						</div>

						<div className='space-y-1'>
							<h3 className='text-lg font-bold text-white uppercase'>Password Updated</h3>
							<p className='text-xs text-neutral-400'>
								Your credentials have been securely updated and previous sessions invalidated.
							</p>
						</div>

						<Link
							to='/login'
							className='w-full py-3.5 px-6 rounded-lg bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg'
						>
							<span>Sign In Now</span>
							<ArrowRight size={14} />
						</Link>
					</div>
				) : (
					<form onSubmit={handleSubmit} className='space-y-4 text-left'>
						{validationError && (
							<div className='p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs text-center'>
								{validationError}
							</div>
						)}

						<div>
							<label className='block text-[11px] font-bold uppercase tracking-widest text-neutral-300 mb-1.5'>
								New Password
							</label>
							<div className='relative'>
								<Lock size={16} className='absolute left-3.5 top-3.5 text-neutral-500' />
								<input
									type={showPassword ? "text" : "password"}
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									placeholder='At least 6 characters'
									required
									autoFocus
									minLength={6}
									className='w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors'
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

						<div>
							<label className='block text-[11px] font-bold uppercase tracking-widest text-neutral-300 mb-1.5'>
								Confirm New Password
							</label>
							<div className='relative'>
								<Lock size={16} className='absolute left-3.5 top-3.5 text-neutral-500' />
								<input
									type={showConfirmPassword ? "text" : "password"}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder='Repeat your new password'
									required
									minLength={6}
									className='w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors'
								/>
								<button
									type='button'
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									className='absolute right-3.5 top-3.5 text-neutral-400 hover:text-white transition-colors'
								>
									{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
								</button>
							</div>
						</div>

						<button
							type='submit'
							disabled={loading || !newPassword || !confirmPassword}
							className='w-full mt-2 py-3.5 px-6 rounded-lg bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg'
						>
							{loading ? (
								<>
									<Loader className='animate-spin' size={16} />
									<span>SAVING PASSWORD...</span>
								</>
							) : (
								<>
									<span>SET NEW PASSWORD</span>
									<ArrowRight size={14} />
								</>
							)}
						</button>

						<div className='text-center pt-2'>
							<Link to='/login' className='text-xs text-neutral-400 hover:text-white underline font-semibold'>
								Back to Sign In
							</Link>
						</div>
					</form>
				)}
			</div>
		</div>
	);
};

export default ResetPasswordPage;

