import {
	BarChart,
	PlusCircle,
	ShoppingBasket,
	Layers,
	MessageSquare,
	Tag,
	Flame,
	Bell,
	Users,
	MapPin,
	PackageCheck,
	Sliders,
	Megaphone,
	Layout,
	Ruler,
	HelpCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import AnalyticsTab from "../components/AnalyticsTab";
import CreateProductForm from "../components/CreateProductForm";
import ProductsList from "../components/ProductsList";
import CategoryManagement from "../components/CategoryManagement";
import ReviewManagement from "../components/ReviewManagement";
import CouponManagement from "../components/CouponManagement";
import SaleManagement from "../components/SaleManagement";
import CampaignBroadcast from "../components/CampaignBroadcast";
import CustomerManagement from "../components/CustomerManagement";
import ServiceabilityManagement from "../components/ServiceabilityManagement";
import OrderManagement from "../components/OrderManagement";
import CampaignSlideManagement from "../components/CampaignSlideManagement";
import AnnouncementManagement from "../components/AnnouncementManagement";
import RestockSubscriptionManagement from "../components/RestockSubscriptionManagement";
import CmsManagement from "../components/CmsManagement";
import SizeChartManagement from "../components/SizeChartManagement";
import SupportTicketManagement from "../components/SupportTicketManagement";
import { useProductStore } from "../stores/useProductStore";

const tabs = [
	{ id: "orders", label: "Orders & Refunds", icon: PackageCheck },
	{ id: "support_tickets", label: "Support Tickets", icon: HelpCircle },
	{ id: "products", label: "Products", icon: ShoppingBasket },
	{ id: "create", label: "Add Product", icon: PlusCircle },
	{ id: "size_charts", label: "Size Guides", icon: Ruler },
	{ id: "restock", label: "Restock Alerts", icon: Bell },
	{ id: "cms", label: "Website CMS", icon: Layout },
	{ id: "slides", label: "Hero Slides", icon: Sliders },
	{ id: "announcements", label: "Top Bar", icon: Megaphone },
	{ id: "categories", label: "Categories", icon: Layers },
	{ id: "customers", label: "Customers", icon: Users },
	{ id: "serviceability", label: "Delivery Locations", icon: MapPin },
	{ id: "coupons", label: "Coupons", icon: Tag },
	{ id: "sales", label: "Sales & Campaigns", icon: Flame },
	{ id: "broadcast", label: "Broadcasts", icon: Megaphone },
	{ id: "reviews", label: "Reviews Moderation", icon: MessageSquare },
	{ id: "analytics", label: "Analytics", icon: BarChart },
];

const AdminPage = () => {
	const [activeTab, setActiveTab] = useState("products");
	const { fetchAllProducts } = useProductStore();

	useEffect(() => {
		fetchAllProducts();
	}, [fetchAllProducts]);

	return (
		<div className='min-h-screen relative overflow-hidden'>
			<div className='relative z-10 container mx-auto px-4 py-12'>
				<motion.div
					className='text-center mb-8'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
				>
					<h1 className='text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight font-heading'>
						Admin Control Panel
					</h1>
					<p className='text-sm text-neutral-600 dark:text-neutral-400 mt-2 max-w-xl mx-auto'>
						Manage product catalog, serviceable delivery locations, customer directory, coupons, promotional sales, and broadcast notifications.
					</p>
				</motion.div>

				<div className='flex flex-wrap justify-center gap-2 mb-8'>
					{tabs.map((tab) => {
						const isActive = activeTab === tab.id;
						return (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`admin-nav-tab flex items-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out border select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 ${
									isActive
										? "admin-tab-active bg-black text-white border-black hover:bg-neutral-800 hover:border-neutral-700 dark:bg-white dark:text-neutral-950 dark:border-white dark:hover:bg-neutral-200 shadow-md font-bold"
										: "admin-tab-inactive bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-200 hover:text-black hover:border-neutral-400 hover:shadow-sm dark:bg-neutral-900/80 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white dark:hover:border-neutral-700"
								}`}
								aria-selected={isActive}
								role='tab'
							>
								<tab.icon className='mr-2 h-4 w-4 shrink-0 transition-colors duration-200' />
								<span>{tab.label}</span>
							</button>
						);
					})}
				</div>

				<div className='transition-all duration-300'>
					{activeTab === "orders" && <OrderManagement />}
					{activeTab === "support_tickets" && <SupportTicketManagement />}
					{activeTab === "products" && <ProductsList />}
					{activeTab === "create" && <CreateProductForm onCreated={() => setActiveTab("products")} />}
					{activeTab === "size_charts" && <SizeChartManagement />}
					{activeTab === "restock" && <RestockSubscriptionManagement />}
					{activeTab === "cms" && <CmsManagement />}
					{activeTab === "slides" && <CampaignSlideManagement />}
					{activeTab === "announcements" && <AnnouncementManagement />}
					{activeTab === "categories" && <CategoryManagement />}
					{activeTab === "customers" && <CustomerManagement />}
					{activeTab === "serviceability" && <ServiceabilityManagement />}
					{activeTab === "coupons" && <CouponManagement />}
					{activeTab === "sales" && <SaleManagement />}
					{activeTab === "broadcast" && <CampaignBroadcast />}
					{activeTab === "reviews" && <ReviewManagement />}
					{activeTab === "analytics" && <AnalyticsTab />}
				</div>
			</div>
		</div>
	);
};

export default AdminPage;
