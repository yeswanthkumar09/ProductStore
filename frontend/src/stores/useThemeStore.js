import { create } from "zustand";

const getInitialMode = () => {
	try {
		if (typeof window !== "undefined" && window.localStorage) {
			const saved = localStorage.getItem("luxestore-mode");
			if (saved === "dark" || saved === "light") return saved;
		}
	} catch (e) {}
	return "dark"; // Default to signature LUXESTORE obsidian dark luxury aesthetic
};

export const useThemeStore = create((set, get) => ({
	mode: getInitialMode(),

	initTheme: () => {
		const { mode } = get();
		const root = document.documentElement;

		if (mode === "dark") {
			root.classList.add("dark");
			root.classList.remove("light");
		} else {
			root.classList.add("light");
			root.classList.remove("dark");
		}

		root.setAttribute("data-mode", mode);
		try {
			localStorage.removeItem("luxestore-theme"); // Remove obsolete multi-accent storage
		} catch (e) {}
	},

	toggleMode: () => {
		const newMode = get().mode === "dark" ? "light" : "dark";
		try {
			localStorage.setItem("luxestore-mode", newMode);
		} catch (e) {}
		set({ mode: newMode });
		get().initTheme();
	},

	setMode: (mode) => {
		try {
			localStorage.setItem("luxestore-mode", mode);
		} catch (e) {}
		set({ mode });
		get().initTheme();
	},
}));
