import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import {
	Package,
	Truck,
	CheckCircle,
	Clock,
	Copy,
	Check,
	AlertCircle,
	Navigation,
	Warehouse,
	MapPin,
	RefreshCw,
	ShieldCheck,
} from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

function ChangeTrackingMapView({ bounds }) {
	const map = useMap();
	useEffect(() => {
		if (bounds && bounds.length >= 2) {
			try {
				map.fitBounds(bounds, { padding: [40, 40], animate: true });
			} catch (e) {
				// ignore
			}
		}
	}, [bounds, map]);
	return null;
}

const createPin = (color, type) => {
	return L.divIcon({
		className: "tracking-pin",
		html: `
			<div style="
				position: relative;
				width: 36px;
				height: 36px;
				background: #0f172a;
				border: 2px solid ${color};
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				box-shadow: 0 0 12px ${color}88;
			">
				<div style="color: ${color}; display: flex; align-items: center; justify-content: center;">
					${
						type === "warehouse"
							? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/></svg>`
							: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
					}
				</div>
			</div>
		`,
		iconSize: [36, 36],
		iconAnchor: [18, 18],
		popupAnchor: [0, -18],
	});
};

const hubIcon = createPin("#f59e0b", "warehouse");
const destIcon = createPin("#10b981", "destination");

const ShipmentTrackingModal = ({ orderId, isOpen, onClose }) => {
	const [tracking, setTracking] = useState(null);
	const [destCoords, setDestCoords] = useState(null);
	const [loading, setLoading] = useState(true);
	const [copied, setCopied] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	const fetchTracking = async (showToast = false) => {
		if (!orderId) return;
		try {
			if (showToast) setRefreshing(true);
			else setLoading(true);

			const res = await axios.get(`/shipping/track/${orderId}`);
			if (res.data?.success) {
				setTracking(res.data);

				// Geocode destination address if pincode exists
				const destPincode = res.data.shippingAddress?.pincode;
				const destCity = res.data.shippingAddress?.city;

				if (destPincode || destCity) {
					try {
						const geoRes = await axios.post("/shipping/geocode", {
							pincode: destPincode,
							city: destCity,
						});
						if (geoRes.data?.success && geoRes.data.latitude && geoRes.data.longitude) {
							setDestCoords({
								latitude: geoRes.data.latitude,
								longitude: geoRes.data.longitude,
								displayName: geoRes.data.displayName || `${destCity} (${destPincode})`,
							});
						}
					} catch (geoErr) {
						console.warn("Geocoding failed for tracking map:", geoErr);
					}
				}

				if (showToast) toast.success("Tracking data updated.");
			}
		} catch (err) {
			console.error("Failed to fetch tracking data:", err);
			toast.error("Unable to load latest tracking data.");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		if (isOpen && orderId) {
			fetchTracking();
		}
	}, [isOpen, orderId]);

	if (!isOpen) return null;

	const handleCopyAwb = (awb) => {
		if (!awb) return;
		navigator.clipboard.writeText(awb);
		setCopied(true);
		toast.success("AWB / Tracking number copied!");
		setTimeout(() => setCopied(false), 2000);
	};

	const origin = tracking?.originCoords || { latitude: 28.6448, longitude: 77.2167 };
	const destination = destCoords || { latitude: 19.076, longitude: 72.8777 };

	const mapBounds = [
		[origin.latitude, origin.longitude],
		[destination.latitude, destination.longitude],
	];

	const routePoints = [
		[origin.latitude, origin.longitude],
		[(origin.latitude + destination.latitude) / 2, (origin.longitude + destination.longitude) / 2],
		[destination.latitude, destination.longitude],
	];

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in'>
			<div className='bg-gray-900 border border-gray-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden'>
				{/* Modal Header */}
				<div className='p-6 border-b border-gray-800 flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<div className='p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>
							<Truck size={22} />
						</div>
						<div>
							<h3 className='text-lg font-bold text-white flex items-center gap-2'>
								Live Courier & Milestone Tracking
							</h3>
							<p className='text-xs text-gray-400'>
								Authoritative Shiprocket courier milestones and transit route overview
							</p>
						</div>
					</div>

					<div className='flex items-center gap-2'>
						<button
							onClick={() => fetchTracking(true)}
							disabled={refreshing}
							className='p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-50'
							title='Refresh tracking status'
						>
							<RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
						</button>
						<button
							onClick={onClose}
							className='px-3.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-colors'
						>
							Close
						</button>
					</div>
				</div>

				{/* Modal Body */}
				<div className='p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar'>
					{loading ? (
						<div className='py-20 text-center text-gray-400 text-sm'>
							Connecting to logistics tracking network...
						</div>
					) : tracking ? (
						<>
							{/* Quick Info Bar */}
							<div className='grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-gray-950/70 border border-gray-800/80'>
								<div>
									<span className='text-[10px] font-bold uppercase tracking-wider text-gray-500'>
										Courier Partner
									</span>
									<p className='text-xs font-bold text-white mt-0.5 truncate'>
										{tracking.courierName || "Express Logistics"}
									</p>
								</div>

								<div>
									<span className='text-[10px] font-bold uppercase tracking-wider text-gray-500'>
										Tracking / AWB
									</span>
									<div className='flex items-center gap-1.5 mt-0.5'>
										<span className='text-xs font-mono font-bold text-emerald-400 truncate'>
											{tracking.awbCode}
										</span>
										<button
											onClick={() => handleCopyAwb(tracking.awbCode)}
											className='text-gray-400 hover:text-white p-0.5'
										>
											{copied ? <Check size={12} className='text-emerald-400' /> : <Copy size={12} />}
										</button>
									</div>
								</div>

								<div>
									<span className='text-[10px] font-bold uppercase tracking-wider text-gray-500'>
										Current Status
									</span>
									<div className='mt-0.5'>
										<span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>
											<CheckCircle size={10} /> {tracking.shipmentStatus}
										</span>
									</div>
								</div>

								<div>
									<span className='text-[10px] font-bold uppercase tracking-wider text-gray-500'>
										Estimated Delivery
									</span>
									<p className='text-xs font-bold text-amber-400 mt-0.5'>
										{tracking.estimatedDeliveryDays}
									</p>
								</div>
							</div>

							{/* Interactive Leaflet Tracking Map */}
							<div className='relative h-64 sm:h-72 rounded-2xl overflow-hidden border border-gray-800 shadow-inner z-0'>
								<MapContainer
									center={[22.5937, 78.9629]}
									zoom={5}
									scrollWheelZoom={false}
									className='h-full w-full'
									style={{ background: "#0b1120" }}
								>
									<ChangeTrackingMapView bounds={mapBounds} />

									<TileLayer
										attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
										url='https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
									/>

									{/* Origin Warehouse Marker */}
									<Marker position={[origin.latitude, origin.longitude]} icon={hubIcon}>
										<Popup className='custom-luxury-popup'>
											<div className='text-slate-900 p-1'>
												<span className='text-[10px] font-bold uppercase text-amber-600 flex items-center gap-1'>
													<Warehouse size={12} /> Dispatch Origin
												</span>
												<h4 className='font-bold text-xs mt-0.5'>{origin.locationName || "Central Logistics Hub"}</h4>
											</div>
										</Popup>
									</Marker>

									{/* Destination Marker */}
									<Marker position={[destination.latitude, destination.longitude]} icon={destIcon}>
										<Popup className='custom-luxury-popup'>
											<div className='text-slate-900 p-1'>
												<span className='text-[10px] font-bold uppercase text-emerald-600 flex items-center gap-1'>
													<Navigation size={12} /> Delivery Destination
												</span>
												<h4 className='font-bold text-xs mt-0.5'>
													{tracking.shippingAddress?.city} ({tracking.shippingAddress?.pincode})
												</h4>
											</div>
										</Popup>
									</Marker>

									{/* Transit Corridor Polyline */}
									<Polyline
										positions={routePoints}
										pathOptions={{
											color: "#10b981",
											weight: 3.5,
											opacity: 0.8,
											dashArray: "6, 6",
										}}
									/>
								</MapContainer>

								{/* Disclose Policy on Map */}
								<div className='absolute bottom-2 left-2 right-2 bg-gray-950/85 border border-gray-800/80 rounded-xl px-3 py-1.5 backdrop-blur-md z-[1000] text-[10px] text-gray-400 flex items-center justify-between'>
									<span>Showing confirmed logistics corridor between fulfillment hub and destination.</span>
									<span className='text-gray-500'>
										Last Updated: {new Date(tracking.lastUpdate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
									</span>
								</div>
							</div>

							{/* Confirmed Milestone Timeline */}
							<div className='space-y-3 pt-2'>
								<h4 className='text-xs font-bold uppercase tracking-wider text-gray-400'>
									Confirmed Milestone Events ({tracking.milestones?.length || 0})
								</h4>

								<div className='relative pl-6 border-l border-emerald-500/30 space-y-4'>
									{tracking.milestones?.map((m, idx) => (
										<div key={idx} className='relative group'>
											{/* Dot */}
											<div className='absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-gray-900 shadow-sm shadow-emerald-500/50' />

											<div className='flex flex-wrap items-baseline justify-between gap-2'>
												<span className='text-xs font-bold text-white uppercase tracking-wider'>
													{m.status || m.activity}
												</span>
												<span className='text-[11px] text-gray-500 font-mono'>
													{new Date(m.date).toLocaleString("en-IN", {
														month: "short",
														day: "numeric",
														hour: "2-digit",
														minute: "2-digit",
													})}
												</span>
											</div>

											<p className='text-xs text-gray-300 mt-0.5 leading-relaxed'>{m.activity}</p>
											{m.location && (
												<span className='inline-flex items-center gap-1 text-[11px] text-emerald-400/90 mt-1'>
													<MapPin size={11} /> {m.location}
												</span>
											)}
										</div>
									))}
								</div>
							</div>
						</>
					) : (
						<div className='py-12 text-center text-gray-400 text-xs'>
							No tracking information available for this order yet.
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ShipmentTrackingModal;
