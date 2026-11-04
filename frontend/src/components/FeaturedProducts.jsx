import { useEffect, useState } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";

const FeaturedProducts = ({ featuredProducts }) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(4);

	const { addToCart } = useCartStore();

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 640) setItemsPerPage(1);
			else if (window.innerWidth < 1024) setItemsPerPage(2);
			else if (window.innerWidth < 1280) setItemsPerPage(3);
			else setItemsPerPage(4);
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const nextSlide = () => {
		setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, featuredProducts.length - itemsPerPage));
	};

	const prevSlide = () => {
		setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
	};

	const isStartDisabled = currentIndex === 0;
	const isEndDisabled = currentIndex >= featuredProducts.length - itemsPerPage;

	return (
		<div className='py-8'>
			<div className='text-center mb-8'>
				<h2 className='text-3xl sm:text-4xl font-extrabold text-white font-heading tracking-tight'>
					Featured <span className='text-accent'>Highlights</span>
				</h2>
				<p className='text-gray-400 text-sm mt-2'>
					Editor&apos;s curated picks and top rated essentials
				</p>
			</div>

			<div className='relative'>
				<div className='overflow-hidden rounded-2xl'>
					<div
						className='flex transition-transform duration-500 ease-out'
						style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)` }}
					>
						{featuredProducts?.map((product) => (
							<div
								key={product._id}
								className='w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-3'
							>
								<div className='group bg-gray-900/70 backdrop-blur-md rounded-2xl overflow-hidden border border-gray-800 transition-all duration-300 hover:border-accent hover:shadow-2xl flex flex-col h-full'>
									<Link
										to={`/product/${product._id}`}
										className='relative block h-56 overflow-hidden bg-gray-950'
									>
										<img
											src={product.image}
											alt={product.name}
											className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-108'
										/>
										<div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]'>
											<span className='flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 text-gray-950 text-xs font-bold'>
												<Eye size={14} /> Quick View
											</span>
										</div>
									</Link>

									<div className='p-5 flex flex-col flex-1'>
										<span className='text-xs font-semibold text-accent uppercase tracking-wider mb-1'>
											{product.category}
										</span>
										<Link
											to={`/product/${product._id}`}
											className='text-base font-semibold text-white group-hover:text-accent transition-colors line-clamp-1 mb-2 font-heading'
										>
											{product.name}
										</Link>
										<div className='text-xl font-bold text-white mb-4'>
											₹{Number(product.price).toLocaleString("en-IN")}
										</div>
										<button
											onClick={() => addToCart(product)}
											className='mt-auto w-full bg-black text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm'
										>
											<ShoppingCart size={16} /> Add to Cart
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{featuredProducts.length > itemsPerPage && (
					<>
						<button
							onClick={prevSlide}
							disabled={isStartDisabled}
							aria-label='Previous slide'
							className={`absolute top-1/2 -left-4 -translate-y-1/2 p-2.5 rounded-full transition-all shadow-xl z-20 ${
								isStartDisabled
									? "bg-gray-800 text-gray-600 cursor-not-allowed opacity-50"
									: "bg-black text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-95"
							}`}
						>
							<ChevronLeft size={20} />
						</button>

						<button
							onClick={nextSlide}
							disabled={isEndDisabled}
							aria-label='Next slide'
							className={`absolute top-1/2 -right-4 -translate-y-1/2 p-2.5 rounded-full transition-all shadow-xl z-20 ${
								isEndDisabled
									? "bg-gray-800 text-gray-600 cursor-not-allowed opacity-50"
									: "bg-black text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-95"
							}`}
						>
							<ChevronRight size={20} />
						</button>
					</>
				)}
			</div>
		</div>
	);
};

export default FeaturedProducts;
