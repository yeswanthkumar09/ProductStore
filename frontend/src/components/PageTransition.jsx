/**
 * Page transition wrapper providing smooth entrance animations
 * without blocking or freezing layout rendering.
 */
const PageTransition = ({ children }) => {
	return (
		<div className='w-full min-h-[calc(100vh-8rem)] transition-opacity duration-200 opacity-100'>
			{children}
		</div>
	);
};

export default PageTransition;
