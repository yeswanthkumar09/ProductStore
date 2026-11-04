import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import BrandLogo from "./BrandLogo";
import axios from "../lib/axios";
import { useCmsStore } from "../stores/useCmsStore";

const Footer = () => {
	const { publishedSections, fetchPublishedSections } = useCmsStore();
	const [email, setEmail] = useState("");
	const [subscribing, setSubscribing] = useState(false);

	useEffect(() => {
		fetchPublishedSections();
	}, [fetchPublishedSections]);

	const cmsData = publishedSections?.footer_content?.data || {};

	const handleNewsletterSubmit = async (e) => {
		e.preventDefault();
		if (!email || !email.trim()) return;

		setSubscribing(true);
		try {
			const res = await axios.post("/newsletter/subscribe", { email: email.trim().toLowerCase() });
			toast.success(res.data?.message || "Welcome to the sanctuary.");
			setEmail("");
		} catch (error) {
			const msg = error.response?.data?.message || "Unable to join newsletter at this time.";
			toast.error(msg);
		} finally {
			setSubscribing(false);
		}
	};

	return (
		<footer className='border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 select-none'>
			{/* Main Editorial Footer Columns */}
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-5 gap-10 sm:gap-12'>
				{/* Brand Column */}
				<div className='md:col-span-2 space-y-4'>
					<BrandLogo size='lg' variant='editorial' linkTo='/' />
					<p className='text-xs text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed mt-4'>
						{cmsData.brandDescription ||
							"Modern tailoring and essential silhouettes crafted for discerning tastemakers. Pure virgin wools, raw Japanese selvedge, and Italian calfskin."}
					</p>

					{/* Newsletter Box */}
					<div className='pt-4 max-w-md'>
						<p className='text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-950 dark:text-white mb-2'>
							{cmsData.newsletterHeading || "SUBSCRIBE TO PRIVATE DROPS"}
						</p>
						<form onSubmit={handleNewsletterSubmit} className='flex'>
							<input
								type='email'
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder='Enter your email'
								disabled={subscribing}
								className='flex-1 px-3.5 py-2.5 text-xs bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-black dark:focus:border-white disabled:opacity-50'
							/>
							<button
								type='submit'
								disabled={subscribing || !email.trim()}
								className='px-5 py-2.5 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity shrink-0 disabled:opacity-50'
							>
								{subscribing ? "JOINING..." : "JOIN"}
							</button>
						</form>
					</div>
				</div>

				{/* Column 1: Collections */}
				<div>
					<h4 className='text-xs font-bold uppercase tracking-[0.2em] text-neutral-950 dark:text-white mb-4'>
						COLLECTIONS
					</h4>
					<ul className='space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400'>
						<li>
							<Link to='/category/shirts' className='hover:text-black dark:hover:text-white transition-colors'>
								Shirts & Overshirts
							</Link>
						</li>
						<li>
							<Link to='/category/t-shirts' className='hover:text-black dark:hover:text-white transition-colors'>
								Organic Heavyweight Tees
							</Link>
						</li>
						<li>
							<Link to='/category/jeans' className='hover:text-black dark:hover:text-white transition-colors'>
								Raw Selvedge Denim
							</Link>
						</li>
						<li>
							<Link to='/category/jackets' className='hover:text-black dark:hover:text-white transition-colors'>
								Lambskin & Bombers
							</Link>
						</li>
						<li>
							<Link to='/category/suits' className='hover:text-black dark:hover:text-white transition-colors'>
								Tailored Suits & Blazers
							</Link>
						</li>
						<li>
							<Link to='/category/shoes' className='hover:text-black dark:hover:text-white transition-colors'>
								Italian Calfskin Shoes
							</Link>
						</li>
					</ul>
				</div>

				{/* Column 2: Customer Care */}
				<div>
					<h4 className='text-xs font-bold uppercase tracking-[0.2em] text-neutral-950 dark:text-white mb-4'>
						CUSTOMER CARE
					</h4>
					<ul className='space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400'>
						<li>
							<Link to='/orders' className='hover:text-black dark:hover:text-white transition-colors'>
								Track Your Delivery
							</Link>
						</li>
						<li>
							<Link to='/policy/shipping' className='hover:text-black dark:hover:text-white transition-colors'>
								Shipping Logistics
							</Link>
						</li>
						<li>
							<Link to='/policy/returns' className='hover:text-black dark:hover:text-white transition-colors'>
								Returns & Exchanges
							</Link>
						</li>
						<li>
							<Link to='/faq' className='hover:text-black dark:hover:text-white transition-colors'>
								FAQ & Inquiries
							</Link>
						</li>
						<li>
							<Link to='/contact' className='hover:text-black dark:hover:text-white transition-colors'>
								Client Concierge
							</Link>
						</li>
					</ul>
				</div>

				{/* Column 3: The Maison */}
				<div>
					<h4 className='text-xs font-bold uppercase tracking-[0.2em] text-neutral-950 dark:text-white mb-4'>
						THE MAISON
					</h4>
					<ul className='space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400'>
						<li>
							<Link to='/about' className='hover:text-black dark:hover:text-white transition-colors'>
								About The Atelier
							</Link>
						</li>
						<li>
							<Link to='/policy/privacy' className='hover:text-black dark:hover:text-white transition-colors'>
								Privacy Policy
							</Link>
						</li>
						<li>
							<Link to='/policy/terms' className='hover:text-black dark:hover:text-white transition-colors'>
								Terms & Conditions
							</Link>
						</li>
						<li>
							<Link to='/brand-assets' className='hover:text-black dark:hover:text-white transition-colors'>
								Brand Identity Assets
							</Link>
						</li>
					</ul>
				</div>
			</div>

			{/* Bottom Legal & Copyright Bar */}
			<div className='border-t border-neutral-200 dark:border-neutral-800 py-6 px-4 sm:px-6 lg:px-8'>
				<div className='max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500'>
					<p>{cmsData.copyright || "© 2026 LUXESTORE STUDIO. ALL RIGHTS RESERVED."}</p>
					<div className='flex items-center gap-6 uppercase tracking-wider'>
						<Link to='/policy/privacy' className='hover:text-black dark:hover:text-white'>Privacy Policy</Link>
						<Link to='/policy/terms' className='hover:text-black dark:hover:text-white'>Terms of Sale</Link>
						<Link to='/policy/shipping' className='hover:text-black dark:hover:text-white'>Courier Coverage</Link>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
