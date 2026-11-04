import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import VerifyPendingPage from "./pages/VerifyPendingPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminPage from "./pages/AdminPage";
import CategoryPage from "./pages/CategoryPage";
import CartPage from "./pages/CartPage";
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage";
import PurchaseCancelPage from "./pages/PurchaseCancelPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import SearchPage from "./pages/SearchPage";
import WishlistPage from "./pages/WishlistPage";
import RecentlyViewedPage from "./pages/RecentlyViewedPage";
import ProfilePage from "./pages/ProfilePage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import NotFoundPage from "./pages/NotFoundPage";
import SalePage from "./pages/SalePage";
import BrandAssetsPage from "./pages/BrandAssetsPage";
import AddressesPage from "./pages/AddressesPage";
import PolicyPage from "./pages/PolicyPage";
import HelpCenterPage from "./pages/HelpCenterPage";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoadingSpinner from "./components/LoadingSpinner";
import ScrollToTop from "./components/ScrollToTop";
import BackToTopButton from "./components/BackToTopButton";
import PageTransition from "./components/PageTransition";
import { useUserStore } from "./stores/useUserStore";
import { useCartStore } from "./stores/useCartStore";
import { useWishlistStore } from "./stores/useWishlistStore";
import { useThemeStore } from "./stores/useThemeStore";

function App() {
	const location = useLocation();
	const { user, checkAuth, checkingAuth } = useUserStore();
	const { getCartItems } = useCartStore();
	const { fetchWishlist } = useWishlistStore();
	const { initTheme, mode } = useThemeStore();

	useEffect(() => {
		initTheme();
	}, [initTheme]);

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	useEffect(() => {
		if (checkingAuth) return;
		if (user) {
			getCartItems();
			fetchWishlist();
		} else {
			useWishlistStore.getState().clearWishlist();
			try {
				const guestCart = JSON.parse(localStorage.getItem("luxestore_guest_cart") || "[]");
				useCartStore.setState({ cart: guestCart });
				useCartStore.getState().calculateTotals();
			} catch (e) {}
		}
	}, [getCartItems, fetchWishlist, user, checkingAuth]);

	if (checkingAuth) return <LoadingSpinner />;

	return (
		<div
			className={`min-h-screen relative flex flex-col justify-between transition-colors duration-200 ${
				mode === "dark" ? "bg-neutral-950 text-neutral-100" : "bg-white text-neutral-900"
			}`}
		>
			<div className='relative z-10 flex flex-col min-h-screen'>
				<ScrollToTop />
				<Navbar />

				<main className='flex-1 pt-14 md:pt-16'>
					<Routes location={location} key={location.pathname}>
						<Route path='/' element={<PageTransition><HomePage /></PageTransition>} />
						<Route path='/signup' element={!user ? <PageTransition><SignUpPage /></PageTransition> : <Navigate to='/' />} />
						<Route
							path='/login'
							element={!user ? <PageTransition><LoginPage /></PageTransition> : <Navigate to={new URLSearchParams(window.location.search).get("redirect") || "/"} />}
						/>
						<Route path='/verify-pending' element={<PageTransition><VerifyPendingPage /></PageTransition>} />
						<Route path='/verify-email' element={<PageTransition><VerifyEmailPage /></PageTransition>} />
						<Route path='/forgot-password' element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
						<Route path='/reset-password' element={<PageTransition><ResetPasswordPage /></PageTransition>} />
						<Route
							path='/secret-dashboard'
							element={user?.role === "admin" ? <PageTransition><AdminPage /></PageTransition> : <Navigate to='/login' />}
						/>
						<Route path='/category/:category' element={<PageTransition><CategoryPage /></PageTransition>} />
						<Route path='/product/:id' element={<PageTransition><ProductDetailPage /></PageTransition>} />
						<Route path='/sales' element={<PageTransition><SalePage /></PageTransition>} />
						<Route path='/sales/:id' element={<PageTransition><SalePage /></PageTransition>} />
						<Route path='/recently-viewed' element={<PageTransition><RecentlyViewedPage /></PageTransition>} />
						<Route path='/search' element={<PageTransition><SearchPage /></PageTransition>} />
						<Route path='/wishlist' element={user ? <PageTransition><WishlistPage /></PageTransition> : <Navigate to='/login' />} />
						<Route path='/profile' element={<PageTransition><ProfilePage /></PageTransition>} />
						<Route path='/addresses' element={user ? <PageTransition><AddressesPage /></PageTransition> : <Navigate to='/login' />} />
						<Route path='/orders' element={user ? <PageTransition><OrderHistoryPage /></PageTransition> : <Navigate to='/login' />} />
						<Route path='/orders/:id' element={user ? <PageTransition><OrderDetailPage /></PageTransition> : <Navigate to='/login' />} />
						<Route path='/cart' element={<PageTransition><CartPage /></PageTransition>} />
						<Route
							path='/purchase-success'
							element={user ? <PageTransition><PurchaseSuccessPage /></PageTransition> : <Navigate to='/login' />}
						/>
						<Route
							path='/purchase-cancel'
							element={user ? <PageTransition><PurchaseCancelPage /></PageTransition> : <Navigate to='/login' />}
						/>
						<Route path='/brand-assets' element={<PageTransition><BrandAssetsPage /></PageTransition>} />
						<Route path='/about' element={<PageTransition><PolicyPage /></PageTransition>} />
						<Route path='/faq' element={<PageTransition><HelpCenterPage /></PageTransition>} />
						<Route path='/help' element={<PageTransition><HelpCenterPage /></PageTransition>} />
						<Route path='/support' element={<PageTransition><HelpCenterPage /></PageTransition>} />
						<Route path='/contact' element={<PageTransition><PolicyPage /></PageTransition>} />
						<Route path='/policy/:slug' element={<PageTransition><PolicyPage /></PageTransition>} />
						<Route path='*' element={<PageTransition><NotFoundPage /></PageTransition>} />
					</Routes>
				</main>

				<Footer />
				<BackToTopButton />
			</div>

			<Toaster
				position='top-center'
				toastOptions={{
					style: {
						background: mode === "light" ? "#ffffff" : "#111827",
						color: mode === "light" ? "#0f172a" : "#fff",
						border: mode === "light" ? "1px solid #e2e8f0" : "1px solid #374151",
						borderRadius: "0.75rem",
						fontSize: "0.875rem",
					},
					success: {
						iconTheme: {
							primary: mode === "light" ? "#111827" : "#ffffff",
							secondary: mode === "light" ? "#ffffff" : "#111827",
						},
					},
				}}
			/>
		</div>
	);
}

export default App;
