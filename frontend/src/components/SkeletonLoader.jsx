const SkeletonLoader = ({ type = "card", count = 4 }) => {
	if (type === "card") {
		return (
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
				{Array.from({ length: count }).map((_, i) => (
					<div
						key={i}
						className='rounded-xl border border-gray-800 bg-gray-800/40 p-4 animate-pulse backdrop-blur-sm'
					>
						<div className='w-full h-52 bg-gray-700/60 rounded-lg mb-4' />
						<div className='h-4 bg-gray-700/60 rounded w-3/4 mb-2' />
						<div className='h-4 bg-gray-700/60 rounded w-1/2 mb-4' />
						<div className='flex justify-between items-center pt-2 border-t border-gray-800'>
							<div className='h-6 bg-gray-700/60 rounded w-1/3' />
							<div className='h-9 bg-emerald-700/40 rounded-lg w-24' />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (type === "detail") {
		return (
			<div className='grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse'>
				<div className='h-96 bg-gray-800/60 rounded-2xl' />
				<div className='space-y-4'>
					<div className='h-8 bg-gray-800/60 rounded w-3/4' />
					<div className='h-5 bg-gray-800/60 rounded w-1/4' />
					<div className='h-10 bg-gray-800/60 rounded w-1/3' />
					<div className='h-24 bg-gray-800/60 rounded w-full' />
					<div className='h-12 bg-gray-800/60 rounded w-full' />
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-3 animate-pulse'>
			<div className='h-6 bg-gray-800/60 rounded w-3/4' />
			<div className='h-6 bg-gray-800/60 rounded w-1/2' />
		</div>
	);
};

export default SkeletonLoader;
