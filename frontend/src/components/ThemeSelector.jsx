import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "../stores/useThemeStore";

const ThemeSelector = () => {
	const { mode, toggleMode } = useThemeStore();

	const isDark = mode === "dark";

	return (
		<button
			type='button'
			onClick={toggleMode}
			title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
			aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
			className='p-1.5 rounded-full text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600'
		>
			{isDark ? (
				<Sun size={19} strokeWidth={1.8} className='text-neutral-300 hover:text-amber-400 transition-colors' />
			) : (
				<Moon size={19} strokeWidth={1.8} className='text-neutral-700 hover:text-black transition-colors' />
			)}
		</button>
	);
};

export default ThemeSelector;
