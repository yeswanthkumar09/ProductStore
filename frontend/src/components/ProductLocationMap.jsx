import { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import {
	MapPin,
	Navigation,
	Store,
	Warehouse,
	Clock,
	Phone,
	Search,
	Info,
	Compass,
	CheckCircle2,
} from "lucide-react";
import axios from "../lib/axios";

// Helper component to center map smoothly
function ChangeMapView({ center, zoom }) {
	const map = useMap();
	useEffect(() => {
		if (center && center[0] && center[1]) {
			map.setView(center, zoom, { animate: true });
		}
	}, [center, zoom, map]);
	return null;
}

// Custom DivIcons for Leaflet (avoids broken image asset path issues)
const createLuxuryIcon = (color = "#10b981", iconSvg = "store") => {
	return L.divIcon({
		className: "custom-luxury-pin",
		html: `
			<div style="
				position: relative;
				width: 38px;
				height: 38px;
				display: flex;
				align-items: center;
				justify-content: center;
				background: #0f172a;
				border: 2px solid ${color};
				border-radius: 50% 50% 50% 0;
				transform: rotate(-45deg);
				box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 10px ${color}66;
			">
				<div style="
					transform: rotate(45deg);
					display: flex;
					align-items: center;
					justify-content: center;
					color: ${color};
				">
					${
						iconSvg === "warehouse"
							? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12"/><path d="M6 14h12"/></svg>`
							: iconSvg === "destination"
							? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
							: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>`
					}
				</div>
			</div>
		`,
		iconSize: [38, 38],
		iconAnchor: [19, 38],
		popupAnchor: [0, -36],
	});
};

const storeIcon = createLuxuryIcon("#10b981", "store");
const warehouseIcon = createLuxuryIcon("#f59e0b", "warehouse");
const destinationIcon = createLuxuryIcon("#6366f1", "destination");

const ProductLocationMap = ({ destinationPincode = "", customerCity = "" }) => {
	const [stores, setStores] = useState([]);
	const [warehouseOrigin, setWarehouseOrigin] = useState(null);
	const [selectedLocation, setSelectedLocation] = useState(null);
	const [searchCity, setSearchCity] = useState("");
	const [loading, setLoading] = useState(true);

	// Route calculation state
	const [routeData, setRouteData] = useState(null);
	const [destCoords, setDestCoords] = useState(null);
	const [calculatingRoute, setCalculatingRoute] = useState(false);
	const [mapCenter, setMapCenter] = useState([22.5937, 78.9629]); // Geographic center of India
	const [mapZoom, setMapZoom] = useState(5);

	// Fetch verified store locations & warehouse dispatch origin
	useEffect(() => {
		const loadLocations = async () => {
			try {
				setLoading(true);
				const res = await axios.get("/shipping/pickup-locations");
				if (res.data?.success) {
					setStores(res.data.stores || []);
					setWarehouseOrigin(res.data.warehouseOrigin || null);
					if (res.data.warehouseOrigin) {
						setSelectedLocation(res.data.warehouseOrigin);
					}
				}
			} catch (err) {
				console.error("Failed to load store locations:", err);
			} finally {
				setLoading(false);
			}
		};
		loadLocations();
	}, []);

	// When destination PIN code or customer city is available, geocode destination and calculate road route
	useEffect(() => {
		if (!destinationPincode && !customerCity) return;

		const resolveRoute = async () => {
			try {
				setCalculatingRoute(true);
				// 1. Geocode destination
				const geoRes = await axios.post("/shipping/geocode", {
					pincode: destinationPincode,
					city: customerCity,
				});

				if (geoRes.data?.success && geoRes.data.latitude && geoRes.data.longitude) {
					const destinationPoint = {
						latitude: geoRes.data.latitude,
						longitude: geoRes.data.longitude,
						displayName: geoRes.data.displayName || `${customerCity} (${destinationPincode})`,
					};
					setDestCoords(destinationPoint);

					// 2. Calculate route from Central Warehouse
					const originPoint = warehouseOrigin
						? { latitude: warehouseOrigin.latitude, longitude: warehouseOrigin.longitude }
						: { latitude: 28.6448, longitude: 77.2167 };

					const routeRes = await axios.post("/shipping/route-estimate", {
						origin: originPoint,
						destination: destinationPoint,
					});

					if (routeRes.data?.success) {
						setRouteData(routeRes.data);
						// Recenter map midway between origin and destination
						const midLat = (originPoint.latitude + destinationPoint.latitude) / 2;
						const midLon = (originPoint.longitude + destinationPoint.longitude) / 2;
						setMapCenter([midLat, midLon]);
						setMapZoom(6);
					}
				}
			} catch (err) {
				console.warn("Route resolution error:", err);
			} finally {
				setCalculatingRoute(false);
			}
		};

		resolveRoute();
	}, [destinationPincode, customerCity, warehouseOrigin]);

	// Filter stores by search query
	const filteredStores = useMemo(() => {
		if (!searchCity.trim()) return stores;
		const query = searchCity.toLowerCase();
		return stores.filter(
			(s) =>
				s.city.toLowerCase().includes(query) ||
				s.name.toLowerCase().includes(query) ||
				s.state.toLowerCase().includes(query) ||
				s.pincode.includes(query)
		);
	}, [stores, searchCity]);

	const handleSelectLocation = (loc) => {
		setSelectedLocation(loc);
		setMapCenter([loc.latitude, loc.longitude]);
		setMapZoom(13);
	};

	const handleResetView = () => {
		setMapCenter([22.5937, 78.9629]);
		setMapZoom(5);
		setSelectedLocation(null);
	};

	return (
		<div className='bg-gray-900/60 border border-gray-800 rounded-3xl p-4 sm:p-6 backdrop-blur-xl shadow-2xl overflow-hidden'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-800'>
				<div className='flex items-center gap-3'>
					<div className='p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>
						<Compass size={22} />
					</div>
					<div>
						<h3 className='text-lg font-bold text-white flex items-center gap-2'>
							Interactive Boutique & Dispatch Map
						</h3>
						<p className='text-xs text-gray-400'>
							Verified physical stores, pickup boutiques, and central dispatch corridor
						</p>
					</div>
				</div>

				{/* Search & Reset */}
				<div className='flex items-center gap-2 w-full sm:w-auto'>
					<div className='relative flex-1 sm:w-64'>
						<Search size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500' />
						<input
							type='text'
							value={searchCity}
							onChange={(e) => setSearchCity(e.target.value)}
							placeholder='Filter by city or PIN...'
							className='w-full pl-9 pr-3 py-1.5 rounded-xl bg-gray-950/80 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors'
						/>
					</div>
					<button
						onClick={handleResetView}
						className='px-3 py-1.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition-colors'
					>
						All India
					</button>
				</div>
			</div>

			{/* Main Grid: Map & Details Sidebar */}
			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
				{/* Leaflet Interactive Map Container */}
				<div className='lg:col-span-2 relative h-[420px] rounded-2xl overflow-hidden border border-gray-800 shadow-inner z-0'>
					{loading ? (
						<div className='h-full flex items-center justify-center bg-gray-950 text-gray-400 text-sm'>
							Loading interactive map...
						</div>
					) : (
						<MapContainer
							center={mapCenter}
							zoom={mapZoom}
							scrollWheelZoom={false}
							className='h-full w-full'
							style={{ background: "#0b1120" }}
						>
							<ChangeMapView center={mapCenter} zoom={mapZoom} />

							{/* OpenStreetMap Dark CartoDB Tiles */}
							<TileLayer
								attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
								url='https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
							/>

							{/* Central Warehouse Origin Marker */}
							{warehouseOrigin && (
								<Marker
									position={[warehouseOrigin.latitude, warehouseOrigin.longitude]}
									icon={warehouseIcon}
									eventHandlers={{
										click: () => handleSelectLocation(warehouseOrigin),
									}}
								>
									<Popup className='custom-luxury-popup'>
										<div className='text-slate-900 p-1'>
											<div className='text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1'>
												<Warehouse size={12} /> Fulfillment Origin
											</div>
											<h4 className='font-bold text-sm text-slate-900 mt-0.5'>{warehouseOrigin.name}</h4>
											<p className='text-xs text-slate-600 mt-1'>{warehouseOrigin.address}, {warehouseOrigin.city}</p>
											<p className='text-[11px] text-slate-500 mt-1 flex items-center gap-1'>
												<Clock size={11} /> {warehouseOrigin.operatingHours}
											</p>
										</div>
									</Popup>
								</Marker>
							)}

							{/* Store Locations Markers */}
							{stores.map((store) => (
								<Marker
									key={store._id || store.code}
									position={[store.latitude, store.longitude]}
									icon={storeIcon}
									eventHandlers={{
										click: () => handleSelectLocation(store),
									}}
								>
									<Popup className='custom-luxury-popup'>
										<div className='text-slate-900 p-1'>
											<div className='text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1'>
												<Store size={12} /> Verified Boutique
											</div>
											<h4 className='font-bold text-sm text-slate-900 mt-0.5'>{store.name}</h4>
											<p className='text-xs text-slate-600 mt-1'>{store.address}, {store.city}</p>
											<p className='text-[11px] text-slate-500 mt-1 flex items-center gap-1'>
												<Clock size={11} /> {store.openingHours}
											</p>
											<p className='text-[11px] text-slate-500 mt-0.5 flex items-center gap-1'>
												<Phone size={11} /> {store.phone}
											</p>
										</div>
									</Popup>
								</Marker>
							))}

							{/* Customer Destination Marker */}
							{destCoords && (
								<Marker
									position={[destCoords.latitude, destCoords.longitude]}
									icon={destinationIcon}
								>
									<Popup className='custom-luxury-popup'>
										<div className='text-slate-900 p-1'>
											<div className='text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1'>
												<Navigation size={12} /> Delivery Destination
											</div>
											<h4 className='font-bold text-sm text-slate-900 mt-0.5'>{destCoords.displayName}</h4>
											<p className='text-xs text-slate-600 mt-1'>
												{destinationPincode ? `PIN Code: ${destinationPincode}` : "Selected Destination"}
											</p>
										</div>
									</Popup>
								</Marker>
							)}

							{/* Driving / Transit Polyline */}
							{routeData?.coordinates && (
								<Polyline
									positions={routeData.coordinates}
									pathOptions={{
										color: "#10b981",
										weight: 4,
										opacity: 0.8,
										dashArray: "8, 8",
									}}
								/>
							)}
						</MapContainer>
					)}

					{/* Route Summary Pill Overlay */}
					{routeData && (
						<div className='absolute bottom-4 left-4 right-4 bg-gray-950/90 border border-gray-800 rounded-2xl p-3 backdrop-blur-md z-[1000] flex flex-wrap items-center justify-between gap-3 shadow-2xl'>
							<div className='flex items-center gap-3'>
								<div className='p-2 rounded-xl bg-emerald-500/10 text-emerald-400'>
									<Navigation size={18} />
								</div>
								<div>
									<div className='text-xs font-semibold text-gray-300 flex items-center gap-1.5'>
										Dispatch Corridor: <span className='text-emerald-400 font-bold'>{routeData.distanceKm} km</span>
										<span className='text-gray-500'>•</span>
										<span>Est. Road Transit: ~{routeData.durationText}</span>
									</div>
									<p className='text-[10px] text-gray-500 mt-0.5'>
										Road transit estimation. Official courier timeline is verified via Shiprocket.
									</p>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Location Details Sidebar */}
				<div className='flex flex-col space-y-4'>
					{/* Selected Location Card */}
					{selectedLocation ? (
						<div className='p-5 bg-gray-950/80 rounded-2xl border border-emerald-500/30 shadow-lg'>
							<div className='flex items-center justify-between mb-2'>
								<span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>
									<CheckCircle2 size={12} /> Selected Location
								</span>
								<span className='text-[10px] font-mono text-gray-500'>
									{selectedLocation.code || "HUB-ORIGIN"}
								</span>
							</div>

							<h4 className='text-base font-bold text-white mb-1'>{selectedLocation.name}</h4>
							<p className='text-xs text-gray-400 leading-relaxed mb-4'>
								{selectedLocation.address}, {selectedLocation.city}, {selectedLocation.state} - {selectedLocation.pincode}
							</p>

							<div className='space-y-2 pt-3 border-t border-gray-900 text-xs text-gray-300'>
								<div className='flex items-center gap-2'>
									<Clock size={14} className='text-emerald-400 flex-shrink-0' />
									<span>{selectedLocation.operatingHours || "10:30 AM - 9:00 PM"}</span>
								</div>
								{selectedLocation.phone && (
									<div className='flex items-center gap-2'>
										<Phone size={14} className='text-emerald-400 flex-shrink-0' />
										<span>{selectedLocation.phone}</span>
									</div>
								)}
								{selectedLocation.pickupInstructions && (
									<div className='flex items-start gap-2 pt-1 text-[11px] text-gray-400 italic'>
										<Info size={14} className='text-emerald-400 flex-shrink-0 mt-0.5' />
										<span>{selectedLocation.pickupInstructions}</span>
									</div>
								)}
							</div>
						</div>
					) : (
						<div className='p-5 bg-gray-950/40 rounded-2xl border border-gray-800 text-center text-xs text-gray-500'>
							Click any marker on the map to view store details and pickup hours.
						</div>
					)}

					{/* Verified Store Locations List */}
					<div className='flex-1 max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar'>
						<span className='text-[11px] font-bold uppercase tracking-wider text-gray-400 px-1 block'>
							Available Boutiques ({filteredStores.length})
						</span>

						{filteredStores.map((store) => (
							<button
								key={store._id || store.code}
								onClick={() => handleSelectLocation(store)}
								className={`w-full text-left p-3 rounded-xl border transition-all ${
									selectedLocation?.code === store.code
										? "bg-emerald-500/10 border-emerald-500/50 text-white"
										: "bg-gray-950/40 border-gray-800/80 hover:border-gray-700 text-gray-300"
								}`}
							>
								<div className='flex items-center justify-between'>
									<span className='text-xs font-bold text-white truncate'>{store.name}</span>
									<span className='text-[10px] text-emerald-400 font-semibold'>{store.city}</span>
								</div>
								<p className='text-[11px] text-gray-400 truncate mt-0.5'>{store.address}</p>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProductLocationMap;
