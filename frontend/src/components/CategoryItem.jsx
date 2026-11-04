import { Link } from "react-router-dom";

const CategoryItem = ({ category }) => {
	const linkPath = category.slug
		? `/category/${category.slug}`
		: category.href
		? category.href.startsWith("/category")
			? category.href
			: `/category${category.href.startsWith("/") ? "" : "/"}${category.href}`
		: "#";

	return (
		<Link
			to={linkPath}
			className='group flex flex-col items-center justify-between p-3 sm:p-4 rounded-sm bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-all select-none'
		>
			<h4 className='text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 mb-4 group-hover:opacity-75 transition-opacity text-center'>
				{category.name}
			</h4>
			<div className='w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 flex items-center justify-center overflow-hidden'>
				<img
					src={category.imageUrl || "/jeans.jpg"}
					alt={category.name}
					className='max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105'
					loading='lazy'
				/>
			</div>
		</Link>
	);
};

export default CategoryItem;
