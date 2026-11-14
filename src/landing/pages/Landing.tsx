import { Discoveries } from "../components/Discoveries";
import { FinalCta } from "../components/FinalCta";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { Journey } from "../components/Journey";
import { Machines } from "../components/Machines";
import { Missions } from "../components/Missions";
import { Nav } from "../components/Nav";
import { Worlds } from "../components/Worlds";

export default function Landing() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Worlds />
        <Missions />
        <div id="experience">
          <Machines />
          <Journey />
        </div>
        <Discoveries />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
