import { useState, useRef, useEffect } from "react";
import { ArrowUpDown, ChevronDown, Check } from "lucide-react";

const sortOptions = [
	{ id: "popular", label: "Popularity / Trending" },
	{ id: "bestseller", label: "Bestsellers" },
	{ id: "newest", label: "Newest Arrivals" },
	{ id: "price_asc", label: "Price: Low to High" },
	{ id: "price_desc", label: "Price: High to Low" },
	{ id: "rating", label: "Customer Rating" },
];

const CustomSortDropdown = ({ value = "newest", onChange }) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef(null);

	const selectedOption = sortOptions.find((o) => o.id === value) || sortOptions[2];

	// Click outside listener to close dropdown
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSelect = (id) => {
		onChange(id);
		setIsOpen(false);
	};

	return (
		<div className='relative inline-block text-left select-none' ref={dropdownRef}>
			{/* Trigger Button */}
			<button
				type='button'
				onClick={() => setIsOpen(!isOpen)}
				className='flex items-center gap-2 py-1.5 px-3 rounded-none bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 transition-colors text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 focus:outline-none'
				aria-haspopup='true'
				aria-expanded={isOpen}
			>
				<ArrowUpDown size={13} className='text-neutral-400' />
				<span className='text-neutral-400 font-semibold'>Sort:</span>
				<span>{selectedOption.label}</span>
				<ChevronDown
					size={14}
					className={`text-neutral-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>

			{/* Floating Menu styled consistently with luxury dark/light identity */}
			{isOpen && (
				<div className='absolute right-0 mt-1.5 w-56 rounded-md shadow-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150'>
					<div className='px-3 py-1.5 border-b border-neutral-100 dark:border-neutral-800/80'>
						<p className='text-[9px] font-extrabold uppercase tracking-widest text-neutral-400'>
							Sort Garments By
						</p>
					</div>

					<div className='py-1'>
						{sortOptions.map((opt) => {
							const isSelected = opt.id === value;
							return (
								<button
									key={opt.id}
									type='button'
									onClick={() => handleSelect(opt.id)}
									className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors ${
										isSelected
											? "bg-neutral-100 dark:bg-neutral-800 text-[#e05338]"
											: "text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white"
									}`}
								>
									<span>{opt.label}</span>
									{isSelected && <Check size={14} className='text-[#e05338]' />}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};

export default CustomSortDropdown;

