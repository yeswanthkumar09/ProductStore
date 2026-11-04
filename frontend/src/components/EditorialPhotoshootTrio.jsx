import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const photos = [
	{
		id: 1,
		title: "NOIR SHIRTS",
		subtitle: "Matte Black & Heavy Sateen",
		link: "/category/shirts",
		image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=85",
	},
	{
		id: 2,
		title: "BESPOKE EMBROIDERY",
		subtitle: "Hand-Crafted Collar Details",
		link: "/category/jackets",
		image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=85",
	},
	{
		id: 3,
		title: "PARISIAN TAILORING",
		subtitle: "Structured Silhouettes",
		link: "/category/suits",
		image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=85",
	},
];

const EditorialPhotoshootTrio = () => {
	return (
		<section className='w-full py-6 md:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'>
			<div className='grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4'>
				{photos.map((item) => (
					<Link
						key={item.id}
						to={item.link}
						className='group relative block aspect-[3/4] overflow-hidden bg-neutral-900 select-none'
					>
						<img
							src={item.image}
							alt={item.title}
							className='w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105'
							loading='lazy'
						/>
						{/* Editorial Vignette & Text Overlay */}
						<div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 sm:p-8 flex flex-col justify-end text-white'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-300 mb-1'>
										{item.subtitle}
									</p>
									<h3 className='text-lg sm:text-xl font-black font-heading uppercase tracking-wide text-white'>
										{item.title}
									</h3>
								</div>
								<div className='w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors'>
									<ArrowUpRight size={16} />
								</div>
							</div>
						</div>
					</Link>
				))}
			</div>
		</section>
	);
};

export default EditorialPhotoshootTrio;

