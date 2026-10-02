import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Grey Box မဖြစ်အောင် Map Size ကို Auto-Fix လုပ်ပေးသည့် Helper Component
function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);
  return null;
}

const PropertyMap = ({ properties = [], onSelectProperty }) => {
  const defaultPosition = [16.8409, 96.1735];

  const createCustomIcon = (property) => {
    const isRent = property.listing_type === "Rent";
    const labelText = isRent ? "အငှား" : "အရောင်း";

    return L.divIcon({
      className: "custom-property-marker",
      html: `
        <div style="
          display: flex;
          align-items: center;
          background-color: ${isRent ? "#2563eb" : "#059669"};
          color: white;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: bold;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25);
          border: 2px solid white;
          white-space: nowrap;
          cursor: pointer;
          transform: translate(-50%, -100%);
        ">
          <span style="margin-right: 4px;">${isRent ? "🏠" : "🏷️"}</span>
          <span>${labelText}</span>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  };

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 relative z-0">
      <MapContainer
        center={defaultPosition}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <MapResizeFix />

        {/* 🛰️ Satellite View (Esri World Imagery TileLayer) */}
        <TileLayer
          attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        {properties.map((property) =>
          property.lat && property.lng ? (
            <Marker
              key={property.id}
              position={[property.lat, property.lng]}
              icon={createCustomIcon(property)}
            >
              <Popup>
                {/* 🔍 Popup Box အတွင်းရှိ မည်သည့်နေရာကိုမဆို နှိပ်ပါက Detail Modal ပွင့်စေရန် */}
                <div
                  onClick={() => {
                    if (onSelectProperty) {
                      onSelectProperty(property);
                    }
                  }}
                  className="p-1.5 space-y-1.5 min-w-[170px] cursor-pointer hover:bg-slate-50 rounded-lg transition"
                >
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 rounded font-semibold ${
                      property.listing_type === "Rent"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {property.listing_type === "Rent"
                      ? "🏠 အငှား (Rent)"
                      : "🏷 အရောင်း (Sale)"}
                  </span>
                  <h3 className="font-bold text-sm text-slate-800 line-clamp-1">
                    {property.title}
                  </h3>
                  <p className="text-xs font-bold text-emerald-600">
                    {property.price} သိန်း{" "}
                    {property.listing_type === "Rent" ? "/ လ" : ""}
                  </p>

                  {/* ခလုတ်ပုံစံဖြင့် ပြသထားသော စာသား */}
                  <div className="w-full mt-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg text-center transition shadow-sm">
                    👀 အသေးစိတ်ကြည့်ရန်
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null,
        )}
      </MapContainer>
    </div>
  );
};

const styles = `
.leaflet-div-icon {
  background: transparent;
  border: none;
}
`;

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default PropertyMap;
