import React from "react";
import { Link } from "react-router-dom";

/**
 * LuxeStore Brand Logo Component
 * Combines an iconic geometric 'LS' crown monogram with ultra-luxury typography.
 * Supports customizable size variants, theme accents, and hover sheen effects.
 */
export const BrandMark = ({ size = 36, className = "" }) => {
	const id = React.useId();
	const gradId = `luxe-gold-${id.replace(/:/g, "")}`;
	const glowId = `luxe-glow-${id.replace(/:/g, "")}`;

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 100 100"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={`inline-block transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1 ${className}`}
		>
			<defs>
				{/* Liquid Champagne Gold to Emerald Gradient */}
				<linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#F5D061" />
					<stop offset="35%" stopColor="#E6AF2E" />
					<stop offset="70%" stopColor="#10B981" />
					<stop offset="100%" stopColor="#059669" />
				</linearGradient>

				{/* Radial Glow Filter */}
				<filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
					<feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#10B981" floodOpacity="0.35" />
				</filter>
			</defs>

			{/* Background Emblem Shield / Rounded Octagon */}
			<rect
				x="4"
				y="4"
				width="92"
				height="92"
				rx="22"
				fill="#0B0F17"
				stroke={`url(#${gradId})`}
				strokeWidth="2.5"
				filter={`url(#${glowId})`}
			/>

			{/* Diamond Facet Crown Motif */}
			<g transform="translate(0, -2)">
				<polygon
					points="50,15 62,24 50,32 38,24"
					fill={`url(#${gradId})`}
					opacity="0.95"
				/>
				<polygon
					points="50,15 38,24 33,20"
					fill="#F5D061"
					opacity="0.8"
				/>
				<polygon
					points="50,15 62,24 67,20"
					fill="#059669"
					opacity="0.8"
				/>
				<line x1="38" y1="24" x2="62" y2="24" stroke="#0B0F17" strokeWidth="1.2" />
				<line x1="50" y1="15" x2="50" y2="32" stroke="#0B0F17" strokeWidth="1.2" />
			</g>

			{/* Interlocking 'L' and 'S' Luxury Monogram */}
			{/* Stylized 'L' stem and base */}
			<path
				d="M32 34 H40 V66 H66 V74 H32 Z"
				fill={`url(#${gradId})`}
			/>

			{/* Stylized Intertwined 'S' ribbon */}
			<path
				d="M65 42 C65 37 59 34 51 34 C43 34 39 37 39 41 C39 48 67 48 67 60 C67 68 59 74 48 74 C38 74 34 68 34 64 L41 62 C41 65 44 68 49 68 C55 68 60 65 60 60 C60 54 32 53 32 41 C32 32 40 28 50 28 C61 28 66 34 66 41 Z"
				fill="#FFFFFF"
				opacity="0.92"
				style={{ mixBlendMode: "overlay" }}
			/>

			{/* Sparkle Accent */}
			<circle cx="68" cy="28" r="2" fill="#F5D061">
				<animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" repeatCount="indefinite" />
			</circle>
		</svg>
	);
};

export const BrandLogo = ({
	size = "md",
	withText = true,
	variant = "editorial", // "editorial" | "classic"
	className = "",
	linkTo = "/",
}) => {
	const sizeMap = {
		sm: { mark: 24, text: "text-lg", sub: "text-[8px]" },
		md: { mark: 32, text: "text-xl sm:text-2xl", sub: "text-[9px]" },
		lg: { mark: 40, text: "text-2xl sm:text-3xl", sub: "text-[10px]" },
		xl: { mark: 56, text: "text-4xl", sub: "text-xs" },
	};

	const config = sizeMap[size] || sizeMap.md;

	let content;

	if (variant === "editorial") {
		content = (
			<div className={`flex flex-col items-center justify-center select-none group ${className}`}>
				<span className={`font-heading ${config.text} font-black tracking-[0.28em] uppercase text-neutral-950 dark:text-white transition-opacity duration-200 group-hover:opacity-75`}>
					LUXESTORE
				</span>
				<span className='text-[8px] font-semibold tracking-[0.35em] uppercase text-neutral-400 dark:text-neutral-500 -mt-0.5 hidden sm:block'>
					STUDIO
				</span>
			</div>
		);
	} else {
		content = (
			<div className={`flex items-center gap-2.5 group cursor-pointer select-none ${className}`}>
				<BrandMark size={config.mark} />
				{withText && (
					<div className="flex flex-col leading-none">
						<div className="flex items-center">
							<span className={`font-heading ${config.text} font-black text-neutral-900 dark:text-white tracking-widest uppercase transition-colors`}>
								LUXE
							</span>
							<span className={`font-heading ${config.text} font-light text-neutral-600 dark:text-neutral-300 tracking-wider uppercase transition-colors`}>
								STORE
							</span>
						</div>
						<span className={`${config.sub} font-semibold uppercase tracking-[0.28em] text-neutral-400 transition-colors`}>
							Haute E-Commerce
						</span>
					</div>
				)}
			</div>
		);
	}

	if (linkTo) {
		return (
			<Link to={linkTo} className="inline-block focus:outline-none focus-visible:ring-1 focus-visible:ring-black">
				{content}
			</Link>
		);
	}

	return content;
};

export default BrandLogo;
