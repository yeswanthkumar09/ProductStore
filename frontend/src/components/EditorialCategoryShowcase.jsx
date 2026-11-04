import { Link } from "react-router-dom";
import CategoryItem from "./CategoryItem";

const defaultCategoryList = [
	{
		name: "Shirts",
		slug: "shirts",
		imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80",
	},
	{
		name: "Overshirt",
		slug: "overshirt",
		imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80",
	},
	{
		name: "Sweatshirts",
		slug: "sweatshirts",
		imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80",
	},
	{
		name: "T-Shirts",
		slug: "t-shirts",
		imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80",
	},
	{
		name: "Trousers",
		slug: "trousers",
		imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=80",
	},
	{
		name: "Jeans",
		slug: "jeans",
		imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=80",
	},
	{
		name: "Jackets",
		slug: "jackets",
		imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80",
	},
	{
		name: "Shoes",
		slug: "shoes",
		imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80",
	},
];

const EditorialCategoryShowcase = ({ categories = [] }) => {
	const displayCats =
		categories && categories.length > 0
			? categories.filter((c) => !c.isArchived && c.isActive)
			: defaultCategoryList;

	return (
		<section className='w-full py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'>
			{/* Section Header Matching Screenshot 1 */}
			<div className='mb-8'>
				<div className='inline-block'>
					<h2 className='text-2xl sm:text-3xl font-light font-heading uppercase tracking-tight text-neutral-900 dark:text-neutral-100'>
						SHOP BY{" "}
						<span className='block font-black tracking-tight text-black dark:text-white mt-0.5'>
							CATEGORY
						</span>
					</h2>
					{/* Coral Underline Accent Bar (as seen in Screenshot 1) */}
					<div className='h-[3px] w-full bg-[#e05338] mt-2' />
				</div>
			</div>

			{/* Responsive Category Item Row/Grid (Matching Screenshot 1) */}
			<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4'>
				{displayCats.slice(0, 8).map((cat) => (
					<CategoryItem key={cat.slug || cat._id || cat.name} category={cat} />
				))}
			</div>

			{/* Subtle Underline Text Link "SHOP ALL" (Matching Screenshot 1) */}
			<div className='mt-8 text-left'>
				<Link
					to='/search'
					className='inline-block text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-white underline underline-offset-4 hover:opacity-75 transition-opacity'
				>
					SHOP ALL
				</Link>
			</div>
		</section>
	);
};

export default EditorialCategoryShowcase;

