import React, { useState } from "react";
import { Download, Check, Copy, ExternalLink, ShieldCheck, Sparkles, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import BrandLogo from "../components/BrandLogo";

const BrandAssetsPage = () => {
	const [copiedField, setCopiedField] = useState(null);

	const handleCopy = (text, field) => {
		navigator.clipboard.writeText(text);
		setCopiedField(field);
		setTimeout(() => setCopiedField(null), 2000);
	};

	const assets = [
		{
			title: "Razorpay Official Logo (PNG)",
			desc: "Recommended for Razorpay Checkout & Merchant Dashboard. High-resolution lossless PNG format.",
			filename: "LuxeStore_Razorpay_Logo.png",
			url: "/LuxeStore_Razorpay_Logo.png",
			res: "1024 × 1024 px",
			size: "~1.0 MB",
			badge: "Recommended for Razorpay",
			badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
		},
		{
			title: "Standard Brand Logo (JPG)",
			desc: "Optimized for fast web delivery, email footers, and lightweight invoice receipts.",
			filename: "LuxeStore_Razorpay_Logo.jpg",
			url: "/LuxeStore_Razorpay_Logo.jpg",
			res: "1024 × 1024 px",
			size: "505 KB",
			badge: "Compact Web",
			badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
		},
		{
			title: "Vector Monogram Emblem (SVG)",
			desc: "Infinitely scalable vector source file for responsive logos, app icons, and print media.",
			filename: "LuxeStore_Logo.svg",
			url: "/LuxeStore_Logo.svg",
			res: "Vector Scalable",
			size: "1.2 KB",
			badge: "Source Vector",
			badgeColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40",
		},
	];

	return (
		<div className="max-w-6xl mx-auto px-4 py-12">
			{/* Page Header */}
			<motion.div
				className="text-center max-w-2xl mx-auto mb-12"
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<div className="flex justify-center mb-4">
					<BrandLogo size="xl" linkTo={null} />
				</div>
				<h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading tracking-tight mt-4">
					LuxeStore Brand Assets & Razorpay Kit
				</h1>
				<p className="text-gray-400 text-sm sm:text-base mt-2">
					Download the official brand assets formatted specifically for your payment gateways, checkout modals, and merchant profiles.
				</p>
			</motion.div>

			{/* Asset Download Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
				{assets.map((asset, index) => (
					<motion.div
						key={asset.filename}
						className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-xl hover:border-gray-700 transition-all shadow-xl group"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, delay: index * 0.1 }}
					>
						<div>
							<div className="flex items-center justify-between mb-4">
								<span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${asset.badgeColor}`}>
									{asset.badge}
								</span>
								<span className="text-xs text-gray-400 font-mono">{asset.size}</span>
							</div>

							<div className="relative aspect-square rounded-xl bg-gray-950/90 border border-gray-800/80 p-4 mb-4 flex items-center justify-center overflow-hidden group-hover:border-emerald-500/30 transition-colors">
								<img
									src={asset.url}
									alt={asset.title}
									className="max-h-full max-w-full object-contain rounded-lg drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
								/>
							</div>

							<h3 className="text-lg font-bold text-white mb-1">{asset.title}</h3>
							<p className="text-xs text-gray-400 leading-relaxed mb-4">{asset.desc}</p>
							<div className="text-xs text-gray-500 font-mono mb-4">Resolution: {asset.res}</div>
						</div>

						{/* 1-Click Direct Download Anchor */}
						<a
							href={asset.url}
							download={asset.filename}
							className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg glow-accent transition-all transform active:scale-95"
						>
							<Download size={18} />
							<span>Download {asset.filename.split(".").pop().toUpperCase()}</span>
						</a>
					</motion.div>
				))}
			</div>

			{/* Razorpay Quick Configuration Guide */}
			<motion.div
				className="bg-gray-900/70 border border-gray-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.3 }}
			>
				<div className="flex items-center gap-3 mb-6">
					<div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
						<ShieldCheck size={22} />
					</div>
					<div>
						<h2 className="text-xl font-bold text-white font-heading">Razorpay Dashboard Setup Instructions</h2>
						<p className="text-xs text-gray-400">Follow these quick steps to apply the logo to your Razorpay checkout popup and payment links</p>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
					{/* Steps */}
					<div className="space-y-4">
						<div className="flex items-start gap-3">
							<span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">1</span>
							<p className="text-gray-300">
								Click the <strong>Download PNG</strong> button above to save <code className="text-emerald-400 bg-gray-950 px-1.5 py-0.5 rounded font-mono text-xs">LuxeStore_Razorpay_Logo.png</code> to your computer.
							</p>
						</div>
						<div className="flex items-start gap-3">
							<span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">2</span>
							<p className="text-gray-300">
								Sign in to your{" "}
								<a
									href="https://dashboard.razorpay.com"
									target="_blank"
									rel="noopener noreferrer"
									className="text-emerald-400 underline hover:text-emerald-300 inline-flex items-center gap-1 font-semibold"
								>
									Razorpay Dashboard <ExternalLink size={12} />
								</a>
							</p>
						</div>
						<div className="flex items-start gap-3">
							<span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">3</span>
							<p className="text-gray-300">
								In the sidebar, navigate to <strong>Settings</strong> &gt; <strong>Account Settings</strong> &gt; <strong>Branding & Checkout Settings</strong>.
							</p>
						</div>
						<div className="flex items-start gap-3">
							<span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">4</span>
							<p className="text-gray-300">
								Click <strong>Upload Logo</strong>, select your downloaded PNG file, and click <strong>Save</strong>.
							</p>
						</div>
					</div>

					{/* Copyable Form Values */}
					<div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-5 space-y-4">
						<h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Copyable Details</h4>

						<div>
							<label className="text-xs text-gray-400 block mb-1">Brand Name</label>
							<div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-xs">
								<span>LuxeStore</span>
								<button
									onClick={() => handleCopy("LuxeStore", "name")}
									className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-xs"
								>
									{copiedField === "name" ? <Check size={14} /> : <Copy size={14} />}
									{copiedField === "name" ? "Copied" : "Copy"}
								</button>
							</div>
						</div>

						<div>
							<label className="text-xs text-gray-400 block mb-1">Brand Theme Color (Emerald Accent)</label>
							<div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-xs">
								<div className="flex items-center gap-2">
									<span className="w-3.5 h-3.5 rounded-full bg-[#10B981] inline-block"></span>
									<span>#10B981</span>
								</div>
								<button
									onClick={() => handleCopy("#10B981", "color1")}
									className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-xs"
								>
									{copiedField === "color1" ? <Check size={14} /> : <Copy size={14} />}
									{copiedField === "color1" ? "Copied" : "Copy"}
								</button>
							</div>
						</div>

						<div>
							<label className="text-xs text-gray-400 block mb-1">Gold Accent Color (Optional)</label>
							<div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-xs">
								<div className="flex items-center gap-2">
									<span className="w-3.5 h-3.5 rounded-full bg-[#E6AF2E] inline-block"></span>
									<span>#E6AF2E</span>
								</div>
								<button
									onClick={() => handleCopy("#E6AF2E", "color2")}
									className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-xs"
								>
									{copiedField === "color2" ? <Check size={14} /> : <Copy size={14} />}
									{copiedField === "color2" ? "Copied" : "Copy"}
								</button>
							</div>
						</div>
					</div>
				</div>
			</motion.div>
		</div>
	);
};

export default BrandAssetsPage;
