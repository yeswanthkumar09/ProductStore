import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShoppingBag, MapPin, ChevronRight } from "lucide-react";
import SavedAddressManager from "../components/SavedAddressManager";

const AddressesPage = () => {
	const [searchParams] = useSearchParams();
	const redirectUrl = searchParams.get("redirect");
	const isFromCheckout = redirectUrl === "/cart";

	return (
		<div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>
			{/* Breadcrumbs Navigation */}
			<nav className='flex items-center gap-2 text-xs text-gray-400 mb-6'>
				<Link to='/' className='hover:text-white transition-colors'>
					Home
				</Link>
				<ChevronRight size={12} />
				<Link to='/profile' className='hover:text-white transition-colors'>
					Account
				</Link>
				<ChevronRight size={12} />
				<span className='text-accent font-semibold'>Saved Addresses</span>
			</nav>

			{/* Checkout Flow Callout Banner */}
			{isFromCheckout && (
				<div className='mb-8 p-4 rounded-2xl bg-gradient-to-r from-accent/20 via-emerald-500/10 to-transparent border border-accent/30 flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-accent/5 animate-fade-in'>
					<div className='flex items-center gap-3'>
						<div className='p-2.5 rounded-xl bg-accent text-white shadow-md'>
							<ShoppingBag size={20} />
						</div>
						<div>
							<h4 className='text-sm font-bold text-white font-heading'>
								Managing Addresses for Checkout
							</h4>
							<p className='text-xs text-gray-300'>
								Add or update your delivery destinations here. Your selections are instantly available on the checkout page.
							</p>
						</div>
					</div>

					<Link
						to='/cart'
						className='inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold transition-all shadow-md'
					>
						<ArrowLeft size={14} />
						<span>Return to Cart & Complete Order</span>
					</Link>
				</div>
			)}

			{/* Standalone Address Book Section */}
			<div className='space-y-6'>
				<SavedAddressManager />
			</div>
		</div>
	);
};

export default AddressesPage;
