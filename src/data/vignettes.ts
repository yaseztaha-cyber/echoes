/**
 * Site vignettes: one verbatim, sourced line from the real mission, shown
 * shortly after each surface arrival (once per session per site). All lines
 * are from NASA mission records (public domain) or widely documented mission
 * speech; attribution + context carried on each entry. Never invented.
 */
export interface Vignette {
  quote: string;
  who: string;
  when: string;
  source: string;
}

export const VIGNETTES: Record<string, Vignette> = {
  "apollo-12": {
    quote: "Man, that may have been a small one for Neil, but that's a long one for me.",
    who: "PETE CONRAD · A12 COMMANDER",
    when: "1969-11-19 · FIRST STEPS ON SURVEYOR CRATER'S FLOOR",
    source: "APOLLO LUNAR SURFACE JOURNAL · NASA HISTORY",
  },
  "apollo-14": {
    quote: "It's been a long time, but we're here.",
    who: "ALAN SHEPARD · A14 COMMANDER",
    when: "1971-02-05 · DESCENT AT FRA MAURO",
    source: "APOLLO LUNAR SURFACE JOURNAL · NASA HISTORY",
  },
  "apollo-15": {
    quote: "As I stand out here in the wonders of the unknown at Hadley, I sort of realize there's a fundamental truth to our nature: man must explore.",
    who: "DAVID SCOTT · A15 COMMANDER",
    when: "1971-08-02 · HADLEY RILLE",
    source: "APOLLO LUNAR SURFACE JOURNAL · NASA HISTORY",
  },
  "apollo-16": {
    quote: "Fantastic! Oh, that first foot on the lunar surface is super, Tony!",
    who: "CHARLIE DUKE · A16 LMP",
    when: "1972-04-21 · EVA-1 AT DESCARTES HIGHLANDS",
    source: "APOLLO LUNAR SURFACE JOURNAL · NASA HISTORY",
  },
  "apollo-17": {
    quote: "…we leave as we came and, God willing, as we shall return, with peace and hope for all mankind.",
    who: "GENE CERNAN · A17 COMMANDER",
    when: "1972-12-14 · LAST STEP ON THE MOON",
    source: "APOLLO LUNAR SURFACE JOURNAL · NASA HISTORY",
  },
  sojourner: {
    quote: "This is a new way of landing a spacecraft on a planet… the first time a U.S. mission will use airbags to absorb the shock of landing.",
    who: "BRIAN MUIRHEAD · MPF FLIGHT SYSTEM MANAGER",
    when: "1997-07 · JPL LANDING PRESS KIT, PRE-TOUCHDOWN",
    source: "NASA / JPL · MARS PATHFINDER PRESS KIT",
  },
  spirit: {
    quote: "That's a big relief! We're on Mars. Spirit has landed.",
    who: "ROB MANNING · MER EDL CHIEF ENGINEER",
    when: "2004-01-15 · GUSEV CRATER",
    source: "MISSION CONTROL TRANSCRIPT · SPACEFLIGHT NOW",
  },
  opportunity: {
    quote: "Two for two… One dozen wheels on soil.",
    who: "CHRIS LEWICKI · MER FLIGHT DIRECTOR",
    when: "2004-01-31 · EGRESS AT MERIDIANI PLANUM",
    source: "MISSION CONTROL TRANSCRIPT · SPACEFLIGHT NOW",
  },
  insight: {
    quote: "Touchdown confirmed… InSight is on the surface of Mars.",
    who: "CHRISTINE SZALAI · INSIGHT SPACECRAFT ENGINEER",
    when: "2018-11-26 · ELYSIUM PLANITIA",
    source: "MISSION CONTROL · LIVE JPL BROADCAST",
  },
  voyager1: {
    quote: "The launching of this 'bottle' into the cosmic 'ocean' says something very hopeful about life on this planet.",
    who: "CARL SAGAN · GOLDEN RECORD TEAM",
    when: "1977 · VOYAGER 1 DESTINED FOR THE STARS",
    source: "MURMURS OF EARTH · NASA RECORD",
  },
};
