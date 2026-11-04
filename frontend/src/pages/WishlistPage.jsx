import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2, Plus } from "lucide-react";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";

const WishlistPage = () => {
	const { wishlist, fetchWishlist, toggleWishlist, loading } = useWishlistStore();
	const { addToCart } = useCartStore();
	const { user } = useUserStore();

	useEffect(() => {
		if (user) {
			fetchWishlist();
		}
	}, [user, fetchWishlist]);

	const handleAddToCart = (product) => {
		addToCart(product);
	};

	return (
		<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
			<div className='flex items-center justify-between pb-6 mb-8 border-b border-neutral-200 dark:border-neutral-800'>
				<div>
					<h1 className='text-2xl sm:text-3xl font-black uppercase tracking-wider text-neutral-950 dark:text-white font-heading'>
						My Wishlist
					</h1>
					<p className='text-xs uppercase tracking-widest text-neutral-500 mt-1'>
						{wishlist.length} {wishlist.length === 1 ? "Curated Piece" : "Curated Pieces"} Saved
					</p>
				</div>
				<Link
					to='/'
					className='text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white hover:underline'
				>
					Explore Catalog
				</Link>
			</div>

			{loading ? (
				<div className='py-24 text-center text-xs uppercase tracking-widest text-neutral-400'>
					Loading your saved pieces...
				</div>
			) : wishlist.length === 0 ? (
				<div className='text-center py-24 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8'>
					<Heart size={44} className='mx-auto text-neutral-300 dark:text-neutral-700 mb-4' />
					<h2 className='text-xl font-black uppercase tracking-tight text-neutral-950 dark:text-white mb-2 font-heading'>
						Your Wishlist is Empty
					</h2>
					<p className='text-neutral-500 text-xs uppercase tracking-wider max-w-md mx-auto mb-6'>
						Save your preferred silhouettes, outerwear, and accessories to revisit anytime.
					</p>
					<Link
						to='/'
						className='inline-flex items-center gap-2 px-8 py-3.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-widest transition-all'
					>
						<ShoppingBag size={16} /> Discover New In
					</Link>
				</div>
			) : (
				<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6'>
					{wishlist.map((item) => {
						const product = typeof item === "object" ? item : null;
						if (!product) return null;

						return (
							<div
								key={product._id}
								className='group flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 relative transition-all'
							>
								{/* Image with 3:4 aspect ratio */}
								<div className='relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-950 overflow-hidden'>
									<Link to={`/product/${product._id}`} className='block w-full h-full'>
										<img
											src={product.image}
											alt={product.name}
											className='w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105'
										/>
									</Link>
									<button
										onClick={() => toggleWishlist(product._id)}
										title='Remove from wishlist'
										className='absolute top-2.5 right-2.5 p-2 bg-white/90 dark:bg-neutral-900/90 text-neutral-600 hover:text-rose-600 shadow-sm transition-all'
									>
										<Trash2 size={14} />
									</button>
								</div>

								{/* Info */}
								<div className='p-3 sm:p-4 flex flex-col flex-1'>
									<span className='text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1'>
										{product.category}
									</span>
									<Link
										to={`/product/${product._id}`}
										className='text-xs font-bold text-neutral-950 dark:text-white uppercase tracking-tight line-clamp-1 hover:opacity-75 transition-opacity mb-1.5'
									>
										{product.name}
									</Link>
									<div className='text-sm font-black text-neutral-950 dark:text-white mb-3'>
										₹{Number(product.price).toLocaleString("en-IN")}
									</div>

									<button
										onClick={() => handleAddToCart(product)}
										className='mt-auto flex items-center justify-center gap-1.5 w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white text-[11px] font-black uppercase tracking-wider transition-all'
									>
										<Plus size={14} /> Add To Bag
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default WishlistPage;
