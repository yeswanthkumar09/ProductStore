import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, Loader, CheckCircle2, KeyRound } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";

const ForgotPasswordPage = () => {
	const [email, setEmail] = useState("");
	const [submitted, setSubmitted] = useState(false);

	const { forgotPassword, loading } = useUserStore();

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!email.trim()) return;

		const res = await forgotPassword(email.trim().toLowerCase());
		if (res && res.success) {
			setSubmitted(true);
		}
	};

	return (
		<div className='min-h-[calc(100vh-4rem)] w-full bg-neutral-950 flex items-center justify-center p-6 text-white'>
			<div className='w-full max-w-md bg-[#131316] border border-neutral-800 rounded-2xl p-8 sm:p-10 shadow-2xl text-center space-y-6'>
				<div className='w-16 h-16 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center mx-auto text-white'>
					<KeyRound size={28} />
				</div>

				<div className='space-y-2'>
					<span className='text-[10px] font-bold tracking-[0.25em] text-neutral-400 uppercase'>
						Patron Security
					</span>
					<h1 className='text-2xl font-black uppercase tracking-tight text-white'>
						RECOVER PASSWORD
					</h1>
					<p className='text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto'>
						Enter the email address tied to your LuxeStore account to receive recovery instructions.
					</p>
				</div>

				{submitted ? (
					<div className='space-y-5 animate-in fade-in duration-300'>
						<div className='p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs text-center space-y-2'>
							<CheckCircle2 size={24} className='mx-auto text-emerald-400' />
							<p className='font-bold text-sm text-white'>Instructions Dispatched</p>
							<p className='text-[11px] text-emerald-200/90 leading-relaxed'>
								If an account with that email address exists, a secure password-reset link valid for 30 minutes has been sent to <span className='font-mono font-bold text-white'>{email}</span>.
							</p>
						</div>

						<p className='text-xs text-neutral-500'>
							Check your spam or junk folder if you do not receive the email within 2 minutes.
						</p>

						<div className='pt-2'>
							<Link
								to='/login'
								className='w-full py-3 px-4 rounded-lg bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-widest transition-all inline-block'
							>
								Return to Sign In
							</Link>
						</div>
					</div>
				) : (
					<form onSubmit={handleSubmit} className='space-y-4 text-left'>
						<div>
							<label className='block text-[11px] font-bold uppercase tracking-widest text-neutral-300 mb-1.5'>
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
									className='w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors'
								/>
							</div>
						</div>

						<button
							type='submit'
							disabled={loading || !email}
							className='w-full mt-2 py-3.5 px-6 rounded-lg bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg'
						>
							{loading ? (
								<>
									<Loader className='animate-spin' size={16} />
									<span>DISPATCHING LINK...</span>
								</>
							) : (
								<>
									<span>DISPATCH RESET LINK</span>
									<ArrowRight size={14} />
								</>
							)}
						</button>

						<div className='text-center pt-3'>
							<Link
								to='/login'
								className='text-xs text-neutral-400 hover:text-white underline font-semibold transition-colors'
							>
								Remembered your password? Sign In
							</Link>
						</div>
					</form>
				)}
			</div>
		</div>
	);
};

export default ForgotPasswordPage;

