/** Expected copy and content of the locations directory (/lp), Scenario 1. */
export const DIRECTORY_COPY = {
  heading: 'Locations',
  title: 'Our Auction Sites | Ritchie Bros. Auctioneers',
  intro: 'offers over 60 permanent auction sites and local yards',
  satelliteNote: 'Satellite sites are represented by an asterisk.*',
  representativesPrompt: 'Search for representatives',
} as const;

export const DIRECTORY_EXPECTATIONS = {
  firstCountries: ['United States', 'Canada'],
  requiredCountries: ['United States', 'Canada', 'Australia', 'United Kingdom', 'Netherlands', 'UAE'],
  unitedStates: {
    country: 'United States',
    minSites: 20,
    requiredSites: ['Phoenix', 'Salt Lake City', 'Houston', 'Las Vegas', 'Atlanta'],
  },
  canada: {
    country: 'Canada',
    minSites: 10,
    requiredSites: ['Edmonton', 'Montreal', 'Toronto', 'Regina', 'Saskatoon'],
  },
  knownSatelliteSites: ['San Antonio', 'Calgary, AB'],
  knownPermanentSites: ['Phoenix', 'Edmonton'],
} as const;
