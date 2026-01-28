import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function ContactMap() {
  const position = [14.6239625, 121.0090736];

  return (
    <MapContainer
      center={position}
      zoom={15}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>RMTY Designs</Popup>
      </Marker>
    </MapContainer>
  );
}
