import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";

const SignUpPage = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const redirectUrl = searchParams.get("redirect") || "/";

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const { signup, loading, user } = useUserStore();

	useEffect(() => {
		if (user) {
			navigate(redirectUrl);
		}
	}, [user, navigate, redirectUrl]);

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (password !== confirmPassword) {
			toast.error("Passwords do not match. Please verify both password fields.");
			return;
		}

		if (password.length < 6) {
			toast.error("Password must be at least 6 characters long.");
			return;
		}

		const res = await signup({
			name: name.trim(),
			email: email.trim().toLowerCase(),
			password,
			confirmPassword,
		});

		if (res && res.success) {
			navigate(`/verify-pending?email=${encodeURIComponent(email.trim().toLowerCase())}`);
		}
	};

	return (
		<div className='min-h-[calc(100vh-4rem)] w-full bg-neutral-950 flex flex-col md:flex-row text-white'>
			{/* LEFT 50%: EDITORIAL CAMPAIGN PHOTO */}
			<div className='relative w-full md:w-1/2 min-h-[300px] md:min-h-full flex flex-col justify-end overflow-hidden select-none bg-neutral-900'>
				<img
					src='https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop'
					alt='LuxeStore Runway Collection'
					className='absolute inset-0 w-full h-full object-cover object-center filter brightness-90 contrast-105'
				/>
				<div className='absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent' />

				<div className='relative z-10 p-8 md:p-14 lg:p-16'>
					<span className='inline-block text-[10px] md:text-xs font-bold tracking-[0.25em] text-neutral-300 uppercase mb-3'>
						Private Atelier Membership
					</span>
					<h1 className='text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-none'>
						DEFINE YOUR <span className='text-[#e05338]'>SIGNATURE</span>
					</h1>
					<p className='mt-3 text-xs md:text-sm text-neutral-300 max-w-md font-normal leading-relaxed'>
						Join LuxeStore for early drops, curated private capsules, express priority dispatch, and concierge support.
					</p>
				</div>
			</div>

			{/* RIGHT 50%: REGISTRATION FORM */}
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
							Create Your Patron Account
						</p>
					</div>

					<form onSubmit={handleSubmit} className='space-y-4'>
						<div>
							<label className='block text-[11px] font-bold uppercase tracking-widest text-neutral-300 mb-1.5'>
								Full Name
							</label>
							<div className='relative'>
								<User size={16} className='absolute left-3.5 top-3.5 text-neutral-500' />
								<input
									type='text'
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder='Alexander Wright'
									required
									autoFocus
									className='w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors'
								/>
							</div>
						</div>

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
									className='w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors'
								/>
							</div>
						</div>

						<div>
							<label className='block text-[11px] font-bold uppercase tracking-widest text-neutral-300 mb-1.5'>
								Password
							</label>
							<div className='relative'>
								<Lock size={16} className='absolute left-3.5 top-3.5 text-neutral-500' />
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder='At least 6 characters'
									required
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
								Confirm Password
							</label>
							<div className='relative'>
								<Lock size={16} className='absolute left-3.5 top-3.5 text-neutral-500' />
								<input
									type={showConfirmPassword ? "text" : "password"}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder='Repeat your password'
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

						{/* Submit CTA */}
						<button
							type='submit'
							disabled={loading}
							className='w-full mt-3 py-3.5 px-6 rounded-lg bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg'
						>
							{loading ? (
								<>
									<Loader className='animate-spin' size={16} />
									<span>CREATING ACCOUNT...</span>
								</>
							) : (
								<>
									<span>CREATE ACCOUNT</span>
									<ArrowRight size={14} />
								</>
							)}
						</button>
					</form>

					<div className='text-center mt-6 pt-4 border-t border-neutral-800/80'>
						<p className='text-xs text-neutral-400'>
							Already have an account?{" "}
							<Link
								to={`/login${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
								className='text-white font-bold underline hover:text-[#e05338] transition-colors ml-1'
							>
								Sign In
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SignUpPage;
