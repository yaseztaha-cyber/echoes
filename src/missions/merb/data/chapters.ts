import type { Chapter } from './types';

const D = 'documented' as const;
const R = 'reconstruction' as const;
const MARS_SILENCE = 'Silent. Opportunity carried no microphone — there is no recorded sound from Mars.';

/**
 * The single chapter registry. Autoplay, the interactive timeline and the inspector all read this.
 * Dates are mission-record dates; where a date has both a US and a UTC reading both are stated.
 */
export const CHAPTERS: Chapter[] = [
  {
    id: 'concept', number: 1, title: 'Two rovers, one question', dateLabel: '2000 — 2003', rulerLabel: '2000',
    sceneId: 'hall', duration: 22,
    narration: [
      { at: 1.5, dur: 6, text: 'NASA builds two identical field geologists: Spirit (MER-A) and Opportunity (MER-B).' },
      { at: 8, dur: 6.5, text: 'Their mission: read the history of water written in the rocks of Mars.' },
      { at: 15, dur: 6, text: 'Each is designed for a 90-sol prime mission — about three months.' },
    ],
    facts: [
      { label: 'Designation', value: 'MER-B · “Opportunity”', status: D },
      { label: 'Planned prime mission', value: '90 sols', status: D },
      { label: 'Wheels', value: '6 × rocker-bogie', status: D },
      { label: '3D model', value: 'Procedural reconstruction', status: R },
    ],
    milestones: [
      { date: '2000–2002', title: 'Mars Exploration Rover project', text: 'Two rovers are designed, built and tested at JPL for launch in the 2003 Mars window.' },
      { date: 'Feb 2003', title: 'Rover family photo', text: 'The assembly, test and launch operations team gathers around a flight-class rover.', mediaId: 'PIA04421' },
    ],
    discoveries: [],
    plates: [
      { mediaId: 'PIA04421', at: 2, dur: 7, motion: 'push', frame: 'right' },
      { mediaId: 'PIA04827', at: 9.5, dur: 5.5, motion: 'drift-left', frame: 'left' },
      { mediaId: 'PIA04824', at: 15.5, dur: 6, motion: 'push', frame: 'right' },
    ],
  },
  {
    id: 'launch', number: 2, title: 'Night launch', dateLabel: 'July 7, 2003', rulerLabel: '2003',
    sceneId: 'launch', duration: 46,
    narration: [
      { at: 1, dur: 6, text: 'Cape Canaveral, Launch Complex 17-B. A Delta II Heavy carries MER-B toward Mars.' },
      { at: 12, dur: 7, text: 'Liftoff: 11:18:15 p.m. EDT on July 7 — 03:18:15 UTC on July 8, 2003.' },
      { at: 39, dur: 6, text: 'Spirit had launched on June 10. The twin was on its way.' },
    ],
    facts: [
      { label: 'Launch', value: '11:18:15 p.m. EDT · 03:18:15 UTC Jul 8', status: D },
      { label: 'Vehicle', value: 'Delta II Heavy', status: D },
      { label: 'Pad', value: 'Cape Canaveral LC-17B', status: D },
      { label: 'Rocket model', value: 'Simplified reconstruction', status: R },
    ],
    milestones: [
      { date: 'Jun 10, 2003', title: 'Spirit launches', text: 'MER-A leaves the same pad four weeks earlier.' },
      { date: 'Jul 7, 2003', title: 'Opportunity launches', text: 'Lift-off at 11:18:15 p.m. EDT.', mediaId: 'KSC-03pd2092' },
    ],
    discoveries: [],
    plates: [
      { mediaId: 'KSC-03pp2102', at: 1, dur: 6.5, motion: 'push', frame: 'right' },
      { mediaId: 'vid-launch-tracker', at: 8, dur: 30, clip: [226, 256], frame: 'wide' },
      { mediaId: 'KSC-03pd2092', at: 38.5, dur: 7, motion: 'push', frame: 'left' },
    ],
  },
  {
    id: 'cruise', number: 3, title: 'Seven silent months', dateLabel: 'Jul 2003 — Jan 2004', rulerLabel: '',
    sceneId: 'cruise', duration: 24,
    narration: [
      { at: 2, dur: 7, text: 'For about six and a half months the spacecraft coasts between worlds.' },
      { at: 11, dur: 7, text: 'Cruise stage, aeroshell, lander and rover travel as one sealed machine.' },
    ],
    facts: [
      { label: 'Cruise duration', value: '≈ 6½ months', status: D },
      { label: 'Orbits & scale', value: 'Schematic — not to scale', status: R },
    ],
    milestones: [{ date: 'Jul 2003 – Jan 2004', title: 'Interplanetary cruise', text: 'Trajectory correction manoeuvres refine the path to Meridiani Planum.' }],
    discoveries: [],
    silenceNote: 'Silence — space carries no sound.',
    plates: [
      { mediaId: 'PIA04824', at: 3, dur: 8, motion: 'drift-right', frame: 'right' },
      { mediaId: 'PIA04823', at: 12.5, dur: 8, motion: 'push', frame: 'left' },
    ],
  },
  {
    id: 'approach', number: 4, title: 'Meridiani ahead', dateLabel: 'January 2004', rulerLabel: '',
    sceneId: 'approach', duration: 22,
    narration: [
      { at: 1.5, dur: 6, text: 'Orbiters have mapped gray hematite across Meridiani Planum — a mineral that often forms with water.' },
      { at: 9, dur: 6, text: 'The cruise stage separates. Mars is no longer a point of light.' },
      { at: 16, dur: 5, text: 'Arrival: January 25, 2004 (UTC).' },
    ],
    facts: [
      { label: 'Target', value: 'Meridiani Planum', status: D },
      { label: 'Arrival', value: 'Jan 25, 2004 (UTC)', status: D },
      { label: 'Planet & spacecraft', value: 'Stylised model', status: R },
    ],
    milestones: [{ date: 'Jan 2004', title: 'Landing-site hematite', text: 'Mars Global Surveyor TES mapping showed hematite at the Meridiani target.', mediaId: 'PIA05153' }],
    discoveries: [{ title: 'Why Meridiani?', text: 'Orbital spectroscopy detected crystalline gray hematite, a mineral commonly associated with water.', mediaId: 'PIA05153' }],
    silenceNote: 'Silence — space carries no sound.',
    plates: [
      { mediaId: 'PIA05153', at: 2, dur: 6.5, motion: 'push', frame: 'right' },
      { mediaId: 'PIA05251', at: 9, dur: 5.5, motion: 'drift-left', frame: 'left' },
      { mediaId: 'vid-mer-animation', at: 15.5, dur: 6, clip: [0, 6], frame: 'right' },
    ],
  },
  {
    id: 'edl', number: 5, title: 'Six minutes of terror', dateLabel: 'January 25, 2004 UTC', rulerLabel: '2004',
    sceneId: 'edl', duration: 46,
    narration: [
      { at: 2, dur: 7, text: 'Entry, descent and landing: the whole sequence lasts only minutes and cannot be steered from Earth.' },
      { at: 12, dur: 8, text: 'Heat shield. Parachute. Rockets. Then airbags — bouncing across the plain.' },
      { at: 32, dur: 8, text: 'Opportunity rolls to rest inside Eagle crater, a “hole in one”.' },
    ],
    facts: [
      { label: 'Landing date', value: 'Jan 25, 2004 UTC (Jan 24 US Pacific)', status: D },
      { label: 'Landing method', value: 'Aeroshell · parachute · rockets · airbags', status: D },
      { label: 'Landing site', value: 'Eagle crater, Meridiani Planum', status: D },
      { label: 'Sequence in 3D', value: 'Schematic reconstruction', status: R },
    ],
    milestones: [
      { date: 'Jan 25, 2004 UTC', title: 'Touchdown', text: 'Opportunity lands inside a small crater later named Eagle.' },
      { date: 'Apr 2017', title: 'Landing hardware seen from orbit', text: 'HiRISE images the bright lander platform at Eagle crater.', mediaId: 'PIA21494' },
    ],
    discoveries: [],
    silenceNote: 'Reconstructed sequence · no recording exists of the landing.',
    plates: [
      { mediaId: 'vid-mer-animation', at: 2, dur: 30, clip: [13, 43], frame: 'wide' },
      { mediaId: 'PIA05156', at: 33, dur: 6, motion: 'push', frame: 'right' },
      { mediaId: 'PIA21494', at: 39.5, dur: 6, motion: 'drift-left', frame: 'left' },
    ],
  },
  {
    id: 'first-views', number: 6, title: 'First views of Mars', dateLabel: 'January 2004', rulerLabel: '',
    sceneId: 'first-views', duration: 26,
    narration: [
      { at: 1.5, dur: 7, text: 'The rover stands up, unfolds its solar panels and raises its mast.' },
      { at: 10, dur: 7, text: 'Its cameras return the first panoramas of a flat, dark, rust-colored plain.' },
      { at: 18, dur: 6, text: 'Bedrock is exposed in the crater wall — within driving distance.' },
    ],
    facts: [
      { label: 'Camera suite', value: 'Pancam · Navcam · Hazcams · Microscopic Imager', status: D },
      { label: 'Surface', value: 'Dark sand, hematite “blueberries”, layered bedrock', status: D },
    ],
    milestones: [{ date: 'Jan 2004', title: 'Rover deployment', text: 'Mast raised, panels opened, first imaging campaign.' }],
    discoveries: [{ title: 'Outcrop in the crater wall', text: 'Layered bedrock — the first Martian bedrock ever seen up close — lay just meters from the landing platform.' }],
    silenceNote: MARS_SILENCE,
    plates: [
      { mediaId: 'vid-mer-animation', at: 1.5, dur: 9, clip: [96, 105], frame: 'right' },
      { mediaId: 'PIA05183', at: 11, dur: 5.5, motion: 'drift-left', frame: 'left' },
      { mediaId: 'PIA05158', at: 17, dur: 4.5, motion: 'push', frame: 'right' },
      { mediaId: 'PIA05171', at: 22, dur: 3.5, motion: 'still', frame: 'left' },
    ],
  },
  {
    id: 'eagle', number: 7, title: 'Eagle crater', dateLabel: 'Jan — Mar 2004', rulerLabel: '',
    sceneId: 'eagle', duration: 24,
    narration: [
      { at: 1.5, dur: 6, text: 'Inside Eagle — a crater only some twenty meters across — Opportunity begins its geology.' },
      { at: 9, dur: 6, text: 'The robotic arm places its instruments against the outcrop, one target at a time.' },
      { at: 17, dur: 6, text: 'After 57 sols the rover climbs out onto the plains.' },
    ],
    facts: [
      { label: 'Crater diameter', value: '≈ 22 m', status: D },
      { label: 'Arm instruments', value: 'APXS · Mössbauer · Microscopic Imager · RAT', status: D },
      { label: 'Terrain', value: 'Procedural reconstruction', status: R },
    ],
    milestones: [
      { date: 'Jan–Mar 2004', title: 'Outcrop investigation', text: 'Instruments examine layered rock named El Capitan and neighbours.' },
      { date: 'Apr 2004', title: 'Bounce rock', text: 'A volcanic rock on the plains beyond Eagle is examined.', mediaId: 'vid-bounce-rock' },
    ],
    discoveries: [],
    silenceNote: MARS_SILENCE,
    plates: [
      { mediaId: 'PIA05633', at: 2, dur: 7, motion: 'push', frame: 'right' },
      { mediaId: 'PIA05619', at: 9.5, dur: 6, motion: 'drift-left', frame: 'left' },
      { mediaId: 'vid-bounce-rock', at: 16, dur: 7.5, clip: [0, 7.5], frame: 'right' },
    ],
  },
  {
    id: 'water', number: 8, title: 'Evidence of ancient water', dateLabel: 'March 2004', rulerLabel: '',
    sceneId: 'water', duration: 30,
    narration: [
      { at: 1.5, dur: 8, text: 'The rocks hold ripples, crossbedding and salt-rich layers formed in flowing, standing water.' },
      { at: 13, dur: 7, text: 'Round gray spherules of hematite — “blueberries” — are embedded throughout.' },
      { at: 22, dur: 7, text: 'Conclusion, March 2004: Meridiani was once wet — perhaps a shallow salty sea.' },
    ],
    facts: [
      { label: 'Finding announced', value: 'Mar 2004 (sedimentary, water-formed rock)', status: D },
      { label: 'Spherule size', value: 'millimetre scale', status: D },
      { label: 'Spherule placement', value: 'Illustrative', status: R },
    ],
    milestones: [{ date: 'Mar 2004', title: 'Water-formed rock confirmed', text: 'NASA reports conclusive evidence that liquid water once soaked the Meridiani outcrop.', mediaId: 'vid-meridiani-water' }],
    discoveries: [
      { title: 'Sedimentary layers', text: 'Crossbedding and ripple structures show deposition by moving water.', mediaId: 'PIA05492' },
      { title: 'Hematite spherules', text: 'Concretions that grew in water-soaked rock; weathered out they litter the plain.', mediaId: 'PIA05563' },
    ],
    silenceNote: MARS_SILENCE,
    plates: [
      { mediaId: 'vid-meridiani-water', at: 1.5, dur: 12, clip: [0, 12], frame: 'right' },
      { mediaId: 'PIA05492', at: 14, dur: 4.5, motion: 'push', frame: 'left' },
      { mediaId: 'PIA05273', at: 19, dur: 4.5, motion: 'drift-right', frame: 'right' },
      { mediaId: 'PIA05563', at: 23.5, dur: 3.2, motion: 'still', frame: 'left' },
      { mediaId: 'PIA16139', at: 26.8, dur: 3, motion: 'still', frame: 'right' },
    ],
  },
  {
    id: 'endurance', number: 9, title: 'Endurance crater', dateLabel: 'May — Dec 2004', rulerLabel: '',
    sceneId: 'endurance', duration: 30,
    narration: [
      { at: 1.5, dur: 7, text: 'Primary mission complete — and Opportunity is still healthy.' },
      { at: 10, dur: 7, text: 'It descends into Endurance, a crater about 130 meters wide, to read deeper layers.' },
      { at: 19, dur: 8, text: 'Cliffs of stacked rock record a longer, wetter history than the surface alone.' },
    ],
    facts: [
      { label: 'Crater diameter', value: '≈ 130 m', status: D },
      { label: 'Phase', value: 'First extended mission', status: D },
      { label: 'Route & crater shape', value: 'Reconstruction', status: R },
    ],
    milestones: [
      { date: 'May 2004', title: 'Primary mission complete', text: 'Both rovers pass their 90-sol requirement.', mediaId: 'vid-primary-complete' },
      { date: 'Jun 2004', title: 'Layers inside Endurance', text: 'Rock layers exposed on the crater’s inner slope.', mediaId: 'PIA06263' },
    ],
    discoveries: [{ title: 'Stacked layers', text: 'Burns Cliff and the crater walls expose a thick vertical record of ancient environments.', mediaId: 'PIA08578' }],
    silenceNote: MARS_SILENCE,
    plates: [
      { mediaId: 'PIA06263', at: 2, dur: 6, motion: 'push', frame: 'right' },
      { mediaId: 'PIA08578', at: 8.5, dur: 6, motion: 'drift-left', frame: 'left' },
      { mediaId: 'PIA06739', at: 15, dur: 5, motion: 'push', frame: 'right' },
      { mediaId: 'vid-primary-complete', at: 20.5, dur: 9, clip: [0, 9], frame: 'left' },
    ],
  },
  {
    id: 'purgatory', number: 10, title: 'Purgatory Dune', dateLabel: '2005', rulerLabel: '2005',
    sceneId: 'purgatory', duration: 22,
    narration: [
      { at: 1.5, dur: 6, text: 'Crossing a field of ripples, the wheels break through the crust of soft sand.' },
      { at: 8.5, dur: 6, text: 'Opportunity is stuck. For about five weeks, engineers rehearse an escape on Earth.' },
      { at: 15.5, dur: 5.5, text: 'Slowly, the rover backs its way out.' },
    ],
    facts: [
      { label: 'Event', value: 'Embedded in Purgatory Dune, 2005', status: D },
      { label: 'Time stuck', value: 'about five weeks', status: D },
      { label: 'Wheel spin shown', value: 'Reconstruction', status: R },
    ],
    milestones: [{ date: 'Apr–Jun 2005', title: 'Stuck, then freed', text: 'The rover digs in to its wheel hubs and is driven out after careful testing.', mediaId: 'PIA07999' }],
    discoveries: [],
    silenceNote: MARS_SILENCE,
    plates: [
      { mediaId: 'PIA07372', at: 2, dur: 6, motion: 'push', frame: 'right' },
      { mediaId: 'PIA07999', at: 9, dur: 8, motion: 'drift-left', frame: 'left' },
    ],
  },
  {
    id: 'victoria', number: 11, title: 'Victoria crater', dateLabel: '2006 — 2008', rulerLabel: '2006',
    sceneId: 'victoria', duration: 30,
    narration: [
      { at: 1.5, dur: 7, text: 'A long drive across the plains brings the rover to the rim of Victoria, about 800 meters across.' },
      { at: 10, dur: 7, text: 'Scalloped walls and layered cliffs. Opportunity circles the crater, imaging each bay.' },
      { at: 19, dur: 9, text: 'In 2007 the rover descends a short way inside; in 2008 it climbs out and drives on.' },
    ],
    facts: [
      { label: 'Crater diameter', value: '≈ 800 m', status: D },
      { label: 'Years at Victoria', value: '2006 – 2008', status: D },
      { label: 'Crater model', value: 'Reconstruction', status: R },
    ],
    milestones: [
      { date: 'Sep 2006', title: 'First glimpse', text: 'Opportunity reaches the rim and looks into Victoria.', mediaId: 'PIA08763' },
      { date: 'Sep 2007', title: 'First dip into the crater', text: 'The rover enters the crater’s inner slope.', mediaId: 'PIA09924' },
    ],
    discoveries: [{ title: 'Cape Verde & Duck Bay', text: 'Rim promontories expose thick sequences of layered bedrock.' }],
    silenceNote: MARS_SILENCE,
    plates: [
      { mediaId: 'PIA08763', at: 2, dur: 6, motion: 'push', frame: 'right' },
      { mediaId: 'PIA08812', at: 8.5, dur: 6, motion: 'drift-left', frame: 'left' },
      { mediaId: 'PIA09924', at: 15, dur: 6, motion: 'push', frame: 'right' },
      { mediaId: 'PIA10077', at: 21.5, dur: 7, motion: 'drift-right', frame: 'left' },
    ],
  },
  {
    id: 'endeavour', number: 12, title: 'Endeavour arrival', dateLabel: 'August 9, 2011', rulerLabel: '2011',
    sceneId: 'endeavour', duration: 24,
    narration: [
      { at: 1.5, dur: 7, text: 'After nearly three years of driving, Opportunity reaches the rim of Endeavour crater.' },
      { at: 9.5, dur: 7, text: 'Endeavour is about 22 kilometers wide — and its rim exposes much older rock.' },
      { at: 17, dur: 6, text: 'The first goal on the rim: a low ridge named Spirit Point.' },
    ],
    facts: [
      { label: 'Arrival', value: 'Aug 9, 2011', status: D },
      { label: 'Endeavour diameter', value: '≈ 22 km', status: D },
      { label: 'First rim site', value: 'Spirit Point', status: D },
      { label: 'Terrain', value: 'Reconstruction', status: R },
    ],
    milestones: [{ date: 'Aug 9, 2011', title: 'Reaches Endeavour', text: 'A traverse of about 21 km from Victoria ends at Spirit Point.', mediaId: 'PIA14134' }],
    discoveries: [],
    silenceNote: MARS_SILENCE,
    plates: [
      { mediaId: 'PIA14504', at: 2, dur: 7, motion: 'push', frame: 'right' },
      { mediaId: 'PIA14134', at: 9.5, dur: 7, motion: 'drift-left', frame: 'left' },
      { mediaId: 'PIA16120', at: 17, dur: 6, motion: 'push', frame: 'right' },
    ],
  },
  {
    id: 'cape-york', number: 13, title: 'Cape York & Esperance', dateLabel: '2011 — 2013', rulerLabel: '',
    sceneId: 'cape-york', duration: 28,
    narration: [
      { at: 1.5, dur: 7, text: 'On Cape York, a bright vein called Homestake turns out to be gypsum — mineral deposited by water.' },
      { at: 10, dur: 8, text: 'In 2013 a pale rock named Esperance shows clay minerals, altered by less acidic water.' },
      { at: 19.5, dur: 7, text: 'Water that might have supported life as we know it.' },
    ],
    facts: [
      { label: 'Homestake vein', value: 'Calcium-sulfate (gypsum)', status: D },
      { label: 'Esperance', value: 'Clay-rich rock, 2013', status: D },
      { label: 'Positions on ridge', value: 'Illustrative', status: R },
    ],
    milestones: [
      { date: 'Dec 2011', title: 'Homestake vein', text: 'A bright vein on Cape York identified as gypsum.', mediaId: 'PIA15035' },
      { date: 'May 2013', title: 'Esperance', text: 'A rock altered by water gentler than acid brines.', mediaId: 'PIA17074' },
    ],
    discoveries: [
      { title: 'Gypsum vein', text: 'Fracture-filling mineral deposited by liquid water flowing through the rock.', mediaId: 'PIA15033' },
      { title: 'Clay minerals', text: 'Esperance indicates wetter, more neutral conditions than the acidic Meridiani plains.', mediaId: 'PIA17074' },
    ],
    silenceNote: MARS_SILENCE,
    plates: [
      { mediaId: 'PIA15033', at: 2, dur: 6, motion: 'push', frame: 'right' },
      { mediaId: 'PIA15035', at: 8.5, dur: 5.5, motion: 'still', frame: 'left' },
      { mediaId: 'PIA17073', at: 14.5, dur: 5.5, motion: 'drift-left', frame: 'right' },
      { mediaId: 'PIA17074', at: 20.5, dur: 6.5, motion: 'push', frame: 'left' },
    ],
  },
  {
    id: 'marathon', number: 14, title: 'A marathon on Mars', dateLabel: 'March 24, 2015', rulerLabel: '2015',
    sceneId: 'marathon', duration: 24,
    narration: [
      { at: 1.5, dur: 7, text: 'A rover designed for a few hundred meters passes 42.195 kilometers: marathon distance.' },
      { at: 10, dur: 7, text: 'March 24, 2015 — eleven years after landing.' },
      { at: 17.5, dur: 5.5, text: 'Ahead: Marathon Valley.' },
    ],
    facts: [
      { label: 'Cumulative driving', value: '42.195 km (26.2 mi)', status: D },
      { label: 'Date', value: 'Mar 24, 2015', status: D },
      { label: 'Shown route', value: 'Schematic', status: R },
    ],
    milestones: [{ date: 'Mar 24, 2015', title: 'Marathon distance', text: 'Odometry surpasses a marathon.', mediaId: 'PIA19154' }],
    discoveries: [],
    silenceNote: MARS_SILENCE,
    plates: [
      { mediaId: 'PIA19154', at: 2, dur: 8.5, motion: 'push', frame: 'right' },
      { mediaId: 'PIA19155', at: 11.5, dur: 8.5, motion: 'drift-left', frame: 'left' },
    ],
  },
  {
    id: 'valleys', number: 15, title: 'Marathon & Perseverance Valleys', dateLabel: '2015 — 2017', rulerLabel: '',
    sceneId: 'valleys', duration: 28,
    narration: [
      { at: 1.5, dur: 7, text: 'In Marathon Valley, orbital data pointed to clay minerals on the slopes — and Opportunity went to look.' },
      { at: 10, dur: 8, text: 'In 2017 it entered Perseverance Valley, a channel descending the inner rim of Endeavour.' },
      { at: 19.5, dur: 7, text: 'Was it carved by water, wind, or flowing debris? The rover gathered evidence.' },
    ],
    facts: [
      { label: 'Marathon Valley', value: 'Clay-bearing outcrops, 2015–16', status: D },
      { label: 'Perseverance Valley', value: 'Entered 2017', status: D },
      { label: 'Valley shape', value: 'Reconstruction', status: R },
    ],
    milestones: [
      { date: '2016', title: 'Marathon Valley panorama', text: 'The valley opens northeast across the floor of Endeavour.', mediaId: 'PIA20749' },
      { date: '2017', title: 'Perseverance Valley', text: 'A channel on the inner slope of the western rim.', mediaId: 'PIA22074' },
    ],
    discoveries: [{ title: 'How was the valley made?', text: 'Its origin remained debated — water, wind or granular flow — when the mission ended.' }],
    silenceNote: MARS_SILENCE,
    plates: [
      { mediaId: 'PIA20749', at: 2, dur: 8, motion: 'drift-left', frame: 'wide' },
      { mediaId: 'PIA21495', at: 11, dur: 7, motion: 'push', frame: 'right' },
      { mediaId: 'PIA22074', at: 19, dur: 8, motion: 'drift-right', frame: 'left' },
    ],
  },
  {
    id: 'dust-storm', number: 16, title: 'The storm', dateLabel: '2018', rulerLabel: '2018',
    sceneId: 'dust-storm', duration: 26,
    narration: [
      { at: 1.5, dur: 7, text: 'In late May 2018 a dust storm erupts in the southern hemisphere and grows into a global event.' },
      { at: 10, dur: 7, text: 'Sunlight dims across Perseverance Valley. Opportunity’s solar arrays starve.' },
      { at: 18, dur: 6.5, text: 'Rover enters low-power mode to survive.' },
    ],
    facts: [
      { label: 'Storm', value: 'Global, 2018', status: D },
      { label: 'Sky opacity (tau) on Jun 10', value: '≈ 10.8', status: D },
      { label: 'Sky & dust rendering', value: 'Reconstruction', status: R },
    ],
    milestones: [{ date: 'Jun 2018', title: 'Dust darkens the sky', text: 'Opportunity’s sunlight falls to a small fraction of normal.', mediaId: 'PIA22329' }],
    discoveries: [],
    silenceNote: MARS_SILENCE,
    plates: [
      { mediaId: 'PIA22329', at: 3, dur: 8.5, motion: 'push', frame: 'right' },
      { mediaId: 'PIA22521', at: 12.5, dur: 9, motion: 'drift-left', frame: 'left' },
    ],
  },
  {
    id: 'final-signal', number: 17, title: 'The last message', dateLabel: 'June 10, 2018', rulerLabel: '',
    sceneId: 'final-signal', duration: 32,
    narration: [
      { at: 2, dur: 8, text: 'Sol 5111. A noisy, incomplete image is the last data Opportunity sends to Earth.' },
      { at: 12, dur: 9, text: 'Before the storm, it had assembled a final panorama of Perseverance Valley.' },
      { at: 23, dur: 8, text: 'Then: silence from Mars.' },
    ],
    facts: [
      { label: 'Last communication', value: 'Jun 10, 2018 · sol 5111', status: D },
      { label: 'Final panorama', value: 'May 13 – Jun 10, 2018', status: D },
      { label: 'Evening scene', value: 'Reconstruction', status: R },
    ],
    milestones: [{ date: 'Jun 10, 2018', title: 'Last image', text: 'The final, partial frame received from Opportunity.', mediaId: 'PIA22929' }],
    discoveries: [],
    silenceNote: MARS_SILENCE,
    plates: [
      { mediaId: 'PIA22929', at: 4, dur: 9, motion: 'push', frame: 'right' },
      { mediaId: 'PIA22908', at: 14, dur: 14, motion: 'drift-left', frame: 'wide' },
    ],
  },
  {
    id: 'conclusion', number: 18, title: 'Mission complete', dateLabel: 'February 13, 2019', rulerLabel: '2019',
    sceneId: 'conclusion', duration: 30,
    narration: [
      { at: 2, dur: 8, text: 'After more than a thousand recovery commands, no signal returns.' },
      { at: 11, dur: 9, text: 'On February 13, 2019 NASA declares the Opportunity mission complete.' },
      { at: 21, dur: 8, text: 'A 90-sol mission became 5,111 sols and 45.16 kilometers of driving. It remains on Mars.' },
    ],
    facts: [
      { label: 'Mission declared complete', value: 'Feb 13, 2019', status: D },
      { label: 'Planned vs actual', value: '90 sols → 5,111 sols', status: D },
      { label: 'Total driving', value: '45.16 km (28.06 mi)', status: D },
      { label: 'Rover location', value: 'Perseverance Valley, Endeavour crater', status: D },
    ],
    milestones: [{ date: 'Feb 13, 2019', title: 'End of mission', text: 'NASA concludes the mission after sustained attempts to contact the rover.', mediaId: 'PIA23178' }],
    discoveries: [],
    silenceNote: MARS_SILENCE,
    plates: [
      { mediaId: 'PIA22549', at: 3, dur: 9, motion: 'push', frame: 'right' },
      { mediaId: 'PIA23178', at: 13, dur: 14, motion: 'drift-left', frame: 'left' },
    ],
  },
];

export const chapterById = (id: string) => CHAPTERS.find((c) => c.id === id);
export const TOTAL_DURATION = CHAPTERS.reduce((a, c) => a + c.duration, 0);
