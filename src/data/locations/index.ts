/** Named geological landmarks, with published coordinates. lon = degrees east. */
export interface Landmark {
  id: string;
  world: "mars" | "moon";
  name: string;
  lat: number;
  lon: number;
  note: string;
}

export const LANDMARKS: Landmark[] = [
  { id: "olympus", world: "mars", name: "OLYMPUS MONS", lat: 18.65, lon: 226.2, note: "Largest known volcano in the solar system" },
  { id: "valles", world: "mars", name: "VALLES MARINERIS", lat: -14, lon: 301, note: "Canyon system more than 4,000 km long" },
  { id: "hellas", world: "mars", name: "HELLAS PLANITIA", lat: -42.4, lon: 70.5, note: "Giant impact basin" },
  { id: "elysium", world: "mars", name: "ELYSIUM MONS", lat: 25.02, lon: 147.21, note: "Volcano in the Elysium region" },
  { id: "imbrium", world: "moon", name: "MARE IMBRIUM", lat: 32.8, lon: -15.6, note: "Large impact basin filled with basalt" },
  { id: "tranq", world: "moon", name: "MARE TRANQUILLITATIS", lat: 8.5, lon: 31.4, note: "Basaltic plain" },
  { id: "tycho", world: "moon", name: "TYCHO", lat: -43.3, lon: -11.4, note: "Young crater with bright rays" },
  { id: "copernicus", world: "moon", name: "COPERNICUS", lat: 9.62, lon: -20.08, note: "Prominent impact crater" },
];
