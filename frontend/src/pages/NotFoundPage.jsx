import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

const NotFoundPage = () => {
	return (
		<div className='min-h-[70vh] flex flex-col items-center justify-center text-center px-4'>
			<div className='relative mb-6'>
				<span className='text-9xl font-black text-gray-800/60 font-heading select-none'>
					404
				</span>
				<div className='absolute inset-0 flex items-center justify-center'>
					<span className='text-2xl font-bold text-emerald-400 uppercase tracking-widest'>
						Page Not Found
					</span>
				</div>
			</div>

			<p className='text-gray-400 max-w-md text-sm mb-8'>
				The page you are looking for might have been moved, renamed, or is temporarily unavailable.
			</p>

			<div className='flex items-center gap-4'>
				<button
					onClick={() => window.history.back()}
					className='flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm transition-all'
				>
					<ArrowLeft size={16} /> Go Back
				</button>
				<Link
					to='/'
					className='flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-950/40'
				>
					<Home size={16} /> Return Home
				</Link>
			</div>
		</div>
	);
};

export default NotFoundPage;
