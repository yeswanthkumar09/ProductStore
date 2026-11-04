import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Automatically scrolls window smoothly to top on every route navigation.
 */
const ScrollToTop = () => {
	const { pathname } = useLocation();

	useEffect(() => {
		window.scrollTo({
			top: 0,
			left: 0,
			behavior: "smooth",
		});
	}, [pathname]);

	return null;
};

export default ScrollToTop;

