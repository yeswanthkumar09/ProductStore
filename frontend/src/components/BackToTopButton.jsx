import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

const BackToTopButton = () => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const toggleVisibility = () => {
			if (window.scrollY > 350) {
				setIsVisible(true);
			} else {
				setIsVisible(false);
			}
		};

		window.addEventListener("scroll", toggleVisibility, { passive: true });
		return () => window.removeEventListener("scroll", toggleVisibility);
	}, []);

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	if (!isVisible) return null;

	return (
		<button
			type='button'
			onClick={scrollToTop}
			aria-label='Scroll to top of page'
			title='Back to top'
			className='fixed bottom-8 right-6 sm:bottom-10 sm:right-10 z-40 w-11 h-11 sm:w-12 sm:h-12 bg-[#e05338] hover:bg-[#d04328] active:scale-95 text-white rounded-md shadow-lg flex items-center justify-center transition-all duration-300 animate-in fade-in zoom-in-95 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e05338]'
		>
			<ArrowUp
				size={22}
				strokeWidth={2.5}
				className='text-white group-hover:-translate-y-0.5 transition-transform duration-200'
			/>
		</button>
	);
};

export default BackToTopButton;

