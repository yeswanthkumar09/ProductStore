import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import { motion } from "framer-motion";
import { ShoppingCart, LogIn, MapPin } from "lucide-react";
import CartItem from "../components/CartItem";
import OrderSummary from "../components/OrderSummary";
import GiftCouponCard from "../components/GiftCouponCard";
import CheckoutAddressPicker from "../components/CheckoutAddressPicker";

const CartPage = () => {
	const { cart } = useCartStore();
	const { user } = useUserStore();

	return (
		<div className='py-8 md:py-12'>
			<div className='mx-auto max-w-screen-xl px-4 2xl:px-0'>
				<div className='mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8'>
					<motion.div
						className='mx-auto w-full flex-none lg:max-w-2xl xl:max-w-3xl space-y-6'
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						{cart.length === 0 ? (
							<EmptyCartUI />
						) : (
							<>
								<div className='space-y-4'>
									<h2 className='text-xl font-bold text-white font-heading'>
										Shopping Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
									</h2>
									{cart.map((item) => (
										<CartItem key={item.cartItemId || item._id} item={item} />
									))}
								</div>

								{/* Streamlined Checkout Address Selector with Live Verification */}
								{user ? (
									<CheckoutAddressPicker />
								) : (
									<div className='bg-gray-900/60 border border-gray-800 rounded-3xl p-6 text-center backdrop-blur-md shadow-xl space-y-3'>
										<div className='w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto text-accent'>
											<MapPin size={24} />
										</div>
										<h3 className='text-base font-bold text-white font-heading'>
											Delivery Address & Courier Verification
										</h3>
										<p className='text-xs text-gray-400 max-w-md mx-auto'>
											Please log in or create an account to select your delivery destination, check live courier availability, and complete your purchase.
										</p>
										<div className='pt-2'>
											<Link
												to='/login?redirect=/cart'
												className='inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold transition-all shadow-md'
											>
												<LogIn size={15} />
												<span>Log In to Checkout</span>
											</Link>
										</div>
									</div>
								)}
							</>
						)}
					</motion.div>

					{cart.length > 0 && (
						<motion.div
							className='mx-auto mt-6 max-w-4xl flex-1 space-y-6 lg:mt-0 lg:w-full'
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5, delay: 0.4 }}
						>
							<OrderSummary />
							<GiftCouponCard />
						</motion.div>
					)}
				</div>
			</div>
		</div>
	);
};
export default CartPage;

const EmptyCartUI = () => (
	<motion.div
		className='flex flex-col items-center justify-center space-y-4 py-16'
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5 }}
	>
		<ShoppingCart className='h-24 w-24 text-gray-500' />
		<h3 className='text-2xl font-bold text-neutral-900 dark:text-white font-heading'>Your cart is empty</h3>
		<p className='text-gray-400 text-sm'>Looks like you haven&apos;t added any luxury items to your cart yet.</p>
		<Link
			className='mt-4 rounded-xl bg-black text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 px-6 py-3 text-sm font-bold transition-all shadow-md'
			to='/'
		>
			Start Shopping
		</Link>
	</motion.div>
);
