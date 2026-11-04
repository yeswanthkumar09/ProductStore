import { useMemo } from "react";
import { Check } from "lucide-react";

/**
 * Extracts distinct color definitions with their associated thumbnail image from
 * product variants and product.colors.
 */
export const extractProductColors = (product) => {
	if (!product || typeof product !== "object") return [];

	const colorMap = new Map();

	// 1. First priority: Variants with specific photography
	if (Array.isArray(product.variants) && product.variants.length > 0) {
		product.variants.forEach((v) => {
			const colorName = v.color?.name?.trim();
			if (colorName) {
				const key = colorName.toLowerCase();
				const variantImage = v.images?.[0] || v.color?.image || null;
				if (!colorMap.has(key)) {
					colorMap.set(key, {
						name: colorName,
						hex: v.color?.hex || "#171717",
						image: variantImage,
					});
				} else if (variantImage && !colorMap.get(key).image) {
					colorMap.get(key).image = variantImage;
				}
			}
		});
	}

	// 2. Second priority: product.colors definitions
	if (Array.isArray(product.colors) && product.colors.length > 0) {
		product.colors.forEach((c) => {
			if (!c || !c.name) return;
			const colorName = c.name.trim();
			const key = colorName.toLowerCase();
			if (!colorMap.has(key)) {
				colorMap.set(key, {
					name: colorName,
					hex: c.hex || "#171717",
					image: c.image || null,
				});
			} else if (c.image && !colorMap.get(key).image) {
				colorMap.get(key).image = c.image;
			}
		});
	}

	const list = Array.from(colorMap.values());

	// 3. Fallback: If only 1 color exists and no image was assigned, check primary product image
	if (list.length === 1 && !list[0].image && product.image) {
		list[0].image = product.image;
	}

	return list;
};

const ProductColorSelector = ({
	colors,
	product,
	selectedColor,
	onSelectColor,
	showLabel = true,
	labelPrefix = "Selected Color",
	size = "md", // "xs" | "sm" | "md"
	className = "",
}) => {
	const availableColors = useMemo(() => {
		if (Array.isArray(colors) && colors.length > 0) {
			return colors;
		}
		if (product) {
			return extractProductColors(product);
		}
		return [];
	}, [colors, product]);

	if (!availableColors || availableColors.length === 0) {
		return null;
	}

	// Sizing classes matching Reference 1 (w-12 h-14 sm:w-14 sm:h-16)
	const sizeClasses = {
		xs: "w-5 h-6.5 text-[9px]",
		sm: "w-9 h-11 text-[10px]",
		md: "w-12 h-14 sm:w-14 sm:h-16 text-xs",
	}[size] || "w-12 h-14 sm:w-14 sm:h-16 text-xs";

	return (
		<div className={`space-y-2 select-none ${className}`}>
			{/* Color Label & Selected Name */}
			{showLabel && (
				<div className='flex items-center justify-between text-xs font-bold uppercase tracking-wider'>
					<span className='text-neutral-500 dark:text-neutral-400'>
						{labelPrefix} •{" "}
						<strong className='text-neutral-950 dark:text-white font-extrabold'>
							{selectedColor?.name || availableColors[0]?.name || "Choose"}
						</strong>
					</span>
				</div>
			)}

			{/* Thumbnail Group */}
			<div
				role='radiogroup'
				aria-label={labelPrefix}
				className='flex flex-wrap items-center gap-2.5'
			>
				{availableColors.map((color, idx) => {
					const isSelected =
						selectedColor?.name?.toLowerCase() === color.name?.toLowerCase() ||
						(!selectedColor && idx === 0);

					return (
						<button
							key={color.name || idx}
							type='button'
							role='radio'
							aria-checked={isSelected}
							aria-label={`Select color ${color.name}`}
							tabIndex={0}
							onClick={() => onSelectColor && onSelectColor(color)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									onSelectColor && onSelectColor(color);
								}
							}}
							title={color.name}
							className={`relative border transition-all duration-200 overflow-hidden shrink-0 group ${sizeClasses} ${
								isSelected
									? "border-neutral-950 dark:border-white ring-1 ring-neutral-950 dark:ring-white shadow-md scale-[1.02]"
									: "border-neutral-300 dark:border-neutral-800 opacity-70 hover:opacity-100 hover:border-neutral-500 dark:hover:border-neutral-600"
							}`}
						>
							{color.image ? (
								<img
									src={color.image}
									alt={`${color.name} variant`}
									className='w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105'
									loading='lazy'
								/>
							) : (
								/* Neutral swatch fallback when no color image is available */
								<div
									className='w-full h-full flex items-center justify-center'
									style={{ backgroundColor: color.hex || "#262626" }}
								>
									{isSelected && (
										<Check
											size={size === "xs" ? 10 : 13}
											className='text-white drop-shadow'
										/>
									)}
								</div>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default ProductColorSelector;

