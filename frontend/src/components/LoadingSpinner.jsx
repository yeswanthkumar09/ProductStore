const LoadingSpinner = ({ text = "Loading..." }) => {
	return (
		<div className='flex flex-col items-center justify-center min-h-[60vh] p-8 select-none animate-in fade-in duration-300'>
			<div className='relative flex flex-col items-center justify-center'>
				{/* Bespoke Hand with Statement Ring Line-Art Vector */}
				<svg
					width='120'
					height='140'
					viewBox='0 0 120 140'
					fill='none'
					xmlns='http://www.w3.org/2000/svg'
					className='text-neutral-900 dark:text-neutral-100 transition-transform duration-700 ease-in-out'
				>
					{/* Hand silhouette outline */}
					<path
						d='M35 55L45 20C46 16 50 15 53 19L62 38M62 38L65 24C66.5 20 71 21 73 25L80 50M80 50L83 34C84.5 30 89 31 90 35L97 60M97 60L100 48C101 44 105 45 106 49L108 78C108 92 98 106 82 112L62 118C50 114 42 104 38 92L32 68C31 63 34 58 39 57L52 64'
						stroke='currentColor'
						strokeWidth='3.2'
						strokeLinecap='round'
						strokeLinejoin='round'
						className='opacity-90'
					/>

					{/* Palm crease detail line */}
					<path
						d='M52 68C58 78 68 85 80 88'
						stroke='currentColor'
						strokeWidth='2.2'
						strokeLinecap='round'
						className='opacity-60'
					/>

					{/* Solid Black Statement Ring on the finger with subtle breathing animation */}
					<ellipse
						cx='55'
						cy='58'
						rx='14'
						ry='14'
						className='fill-neutral-950 dark:fill-white animate-pulse'
					/>
					<circle
						cx='55'
						cy='58'
						r='11'
						className='fill-black dark:fill-neutral-900'
					/>
					<circle
						cx='55'
						cy='58'
						r='8'
						className='fill-neutral-950 dark:fill-white animate-ping opacity-25'
					/>
				</svg>

				{/* "Loading..." text matching the reference image */}
				<p className='mt-6 text-sm md:text-base font-serif italic text-neutral-800 dark:text-neutral-200 tracking-wide'>
					{text}
				</p>
			</div>
		</div>
	);
};

export default LoadingSpinner;
