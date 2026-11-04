import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "leaflet/dist/leaflet.css";

import { BrowserRouter } from "react-router-dom";
import { useThemeStore } from "./stores/useThemeStore";

// Synchronously initialize default theme (Dark Mode) before React initial paint
useThemeStore.getState().initTheme();

class RootErrorBoundary extends Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		console.error("[CRITICAL RENDER ERROR]", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className='min-h-screen bg-neutral-900 text-neutral-100 p-8 flex flex-col items-center justify-center font-sans'>
					<div className='max-w-xl w-full bg-neutral-950 p-6 rounded-lg border border-neutral-800 shadow-2xl'>
						<div className='flex items-center gap-2 text-rose-500 font-bold text-lg mb-3'>
							<span>⚠️</span>
							<span>LuxeStore Studio — Render Exception</span>
						</div>
						<p className='text-sm text-neutral-300 mb-4'>
							{this.state.error?.message || "An unexpected error occurred while rendering the interface."}
						</p>
						<pre className='p-3 bg-neutral-900 text-neutral-400 text-xs rounded overflow-auto max-h-48 border border-neutral-800 font-mono'>
							{this.state.error?.stack}
						</pre>
						<div className='mt-6 flex justify-end gap-3'>
							<button
								type='button'
								onClick={() => {
									localStorage.clear();
									window.location.href = "/";
								}}
								className='px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded text-white'
							>
								Clear Cache & Reload
							</button>
							<button
								type='button'
								onClick={() => window.location.reload()}
								className='px-4 py-2 bg-white text-black text-xs font-bold rounded hover:opacity-90'
							>
								Reload Page
							</button>
						</div>
					</div>
				</div>
			);
		}
		return this.props.children;
	}
}

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<RootErrorBoundary>
			<BrowserRouter>
				<App />
			</BrowserRouter>
		</RootErrorBoundary>
	</StrictMode>
);
