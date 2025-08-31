#!/usr/bin/env node

// Australian Location to Jurisdiction Mapping System
// Comprehensive mapping of Australian cities, suburbs, and regions to jurisdictions

export class LocationMapper {
  constructor() {
    this.cityToState = new Map();
    this.cityToCouncil = new Map();
    this.initializeMappings();
  }

  initializeMappings() {
    // Major Australian cities and surrounding areas
    const locations = [
      // New South Wales
      { city: 'Sydney', state: 'nsw', council: 'City of Sydney', region: 'Greater Sydney' },
      { city: 'Newcastle', state: 'nsw', council: 'City of Newcastle', region: 'Hunter Valley' },
      { city: 'Wollongong', state: 'nsw', council: 'Wollongong City Council', region: 'Illawarra' },
      { city: 'Penrith', state: 'nsw', council: 'Penrith City Council', region: 'Greater Sydney' },
      { city: 'Blacktown', state: 'nsw', council: 'Blacktown City Council', region: 'Greater Sydney' },
      { city: 'Liverpool', state: 'nsw', council: 'Liverpool City Council', region: 'Greater Sydney' },
      { city: 'Parramatta', state: 'nsw', council: 'City of Parramatta', region: 'Greater Sydney' },
      { city: 'Campbelltown', state: 'nsw', council: 'Campbelltown City Council', region: 'Greater Sydney' },
      { city: 'Gosford', state: 'nsw', council: 'Central Coast Council', region: 'Central Coast' },
      { city: 'Wyong', state: 'nsw', council: 'Central Coast Council', region: 'Central Coast' },
      
      // Victoria
      { city: 'Melbourne', state: 'vic', council: 'City of Melbourne', region: 'Greater Melbourne' },
      { city: 'Geelong', state: 'vic', council: 'City of Greater Geelong', region: 'Geelong' },
      { city: 'Ballarat', state: 'vic', council: 'City of Ballarat', region: 'Central Highlands' },
      { city: 'Bendigo', state: 'vic', council: 'City of Greater Bendigo', region: 'Loddon Mallee' },
      { city: 'Frankston', state: 'vic', council: 'Frankston City Council', region: 'Greater Melbourne' },
      { city: 'Monash', state: 'vic', council: 'Monash City Council', region: 'Greater Melbourne' },
      { city: 'Casey', state: 'vic', council: 'City of Casey', region: 'Greater Melbourne' },
      { city: 'Knox', state: 'vic', council: 'Knox City Council', region: 'Greater Melbourne' },
      { city: 'Whittlesea', state: 'vic', council: 'City of Whittlesea', region: 'Greater Melbourne' },
      { city: 'Moreland', state: 'vic', council: 'Moreland City Council', region: 'Greater Melbourne' },
      
      // Queensland  
      { city: 'Brisbane', state: 'qld', council: 'Brisbane City Council', region: 'South East Queensland' },
      { city: 'Gold Coast', state: 'qld', council: 'City of Gold Coast', region: 'South East Queensland' },
      { city: 'Townsville', state: 'qld', council: 'Townsville City Council', region: 'North Queensland' },
      { city: 'Cairns', state: 'qld', council: 'Cairns Regional Council', region: 'Far North Queensland' },
      { city: 'Toowoomba', state: 'qld', council: 'Toowoomba Regional Council', region: 'Darling Downs' },
      { city: 'Rockhampton', state: 'qld', council: 'Rockhampton Regional Council', region: 'Central Queensland' },
      { city: 'Mackay', state: 'qld', council: 'Mackay Regional Council', region: 'Central Queensland' },
      { city: 'Bundaberg', state: 'qld', council: 'Bundaberg Regional Council', region: 'Wide Bay' },
      { city: 'Hervey Bay', state: 'qld', council: 'Fraser Coast Regional Council', region: 'Wide Bay' },
      { city: 'Sunshine Coast', state: 'qld', council: 'Sunshine Coast Council', region: 'South East Queensland' },
      { city: 'Maroochydore', state: 'qld', council: 'Sunshine Coast Council', region: 'South East Queensland' },
      { city: 'Bli Bli', state: 'qld', council: 'Sunshine Coast Council', region: 'South East Queensland' },
      { city: 'Logan', state: 'qld', council: 'Logan City Council', region: 'South East Queensland' },
      { city: 'Ipswich', state: 'qld', council: 'Ipswich City Council', region: 'South East Queensland' },
      { city: 'Redland', state: 'qld', council: 'Redland City Council', region: 'South East Queensland' },
      
      // Western Australia
      { city: 'Perth', state: 'wa', council: 'City of Perth', region: 'Greater Perth' },
      { city: 'Fremantle', state: 'wa', council: 'City of Fremantle', region: 'Greater Perth' },
      { city: 'Joondalup', state: 'wa', council: 'City of Joondalup', region: 'Greater Perth' },
      { city: 'Stirling', state: 'wa', council: 'City of Stirling', region: 'Greater Perth' },
      { city: 'Swan', state: 'wa', council: 'City of Swan', region: 'Greater Perth' },
      { city: 'Wanneroo', state: 'wa', council: 'City of Wanneroo', region: 'Greater Perth' },
      { city: 'Rockingham', state: 'wa', council: 'City of Rockingham', region: 'Greater Perth' },
      { city: 'Mandurah', state: 'wa', council: 'City of Mandurah', region: 'Peel' },
      { city: 'Bunbury', state: 'wa', council: 'City of Bunbury', region: 'South West' },
      { city: 'Geraldton', state: 'wa', council: 'City of Greater Geraldton', region: 'Mid West' },
      
      // South Australia  
      { city: 'Adelaide', state: 'sa', council: 'City of Adelaide', region: 'Greater Adelaide' },
      { city: 'Salisbury', state: 'sa', council: 'City of Salisbury', region: 'Greater Adelaide' },
      { city: 'Playford', state: 'sa', council: 'City of Playford', region: 'Greater Adelaide' },
      { city: 'Tea Tree Gully', state: 'sa', council: 'City of Tea Tree Gully', region: 'Greater Adelaide' },
      { city: 'Port Adelaide Enfield', state: 'sa', council: 'City of Port Adelaide Enfield', region: 'Greater Adelaide' },
      { city: 'Marion', state: 'sa', council: 'City of Marion', region: 'Greater Adelaide' },
      { city: 'Onkaparinga', state: 'sa', council: 'City of Onkaparinga', region: 'Greater Adelaide' },
      { city: 'Mount Gambier', state: 'sa', council: 'City of Mount Gambier', region: 'Limestone Coast' },
      { city: 'Whyalla', state: 'sa', council: 'City of Whyalla', region: 'Eyre Peninsula' },
      
      // Tasmania
      { city: 'Hobart', state: 'tas', council: 'City of Hobart', region: 'Greater Hobart' },
      { city: 'Launceston', state: 'tas', council: 'City of Launceston', region: 'Tamar Valley' },
      { city: 'Devonport', state: 'tas', council: 'Devonport City Council', region: 'North West' },
      { city: 'Burnie', state: 'tas', council: 'City of Burnie', region: 'North West' },
      { city: 'Clarence', state: 'tas', council: 'Clarence City Council', region: 'Greater Hobart' },
      { city: 'Glenorchy', state: 'tas', council: 'City of Glenorchy', region: 'Greater Hobart' },
      
      // Northern Territory
      { city: 'Darwin', state: 'nt', council: 'City of Darwin', region: 'Top End' },
      { city: 'Palmerston', state: 'nt', council: 'City of Palmerston', region: 'Top End' },
      { city: 'Alice Springs', state: 'nt', council: 'Alice Springs Town Council', region: 'Central Australia' },
      { city: 'Katherine', state: 'nt', council: 'Katherine Town Council', region: 'Katherine' },
      
      // Australian Capital Territory
      { city: 'Canberra', state: 'act', council: 'ACT Government', region: 'Australian Capital Territory' },
    ];

    // Populate mapping dictionaries
    for (const location of locations) {
      const cityKey = location.city.toLowerCase();
      
      this.cityToState.set(cityKey, {
        city: location.city,
        state: location.state,
        council: location.council,
        region: location.region,
        stateFullName: this.getStateFullName(location.state)
      });
      
      this.cityToCouncil.set(cityKey, location.council);
    }

    // Add common search aliases
    this.addAliases();
  }

  addAliases() {
    // Add common aliases and abbreviations
    const aliases = [
      { alias: 'syd', canonical: 'sydney' },
      { alias: 'melb', canonical: 'melbourne' },
      { alias: 'bris', canonical: 'brisbane' },
      { alias: 'adl', canonical: 'adelaide' },
      { alias: 'perth city', canonical: 'perth' },
      { alias: 'gold coast city', canonical: 'gold coast' },
      { alias: 'sunshine coast', canonical: 'maroochydore' },
      { alias: 'cbr', canonical: 'canberra' },
      { alias: 'darwin city', canonical: 'darwin' },
      { alias: 'hobart city', canonical: 'hobart' },
      
      // Regional variations
      { alias: 'newcastle nsw', canonical: 'newcastle' },
      { alias: 'wollongong nsw', canonical: 'wollongong' },
      { alias: 'geelong vic', canonical: 'geelong' },
      { alias: 'ballarat vic', canonical: 'ballarat' },
      { alias: 'bendigo vic', canonical: 'bendigo' },
      { alias: 'cairns qld', canonical: 'cairns' },
      { alias: 'townsville qld', canonical: 'townsville' },
      { alias: 'toowoomba qld', canonical: 'toowoomba' },
    ];

    for (const alias of aliases) {
      if (this.cityToState.has(alias.canonical)) {
        this.cityToState.set(alias.alias, this.cityToState.get(alias.canonical));
      }
    }
  }

  getStateFullName(stateCode) {
    const stateNames = {
      'nsw': 'New South Wales',
      'vic': 'Victoria', 
      'qld': 'Queensland',
      'wa': 'Western Australia',
      'sa': 'South Australia',
      'tas': 'Tasmania',
      'nt': 'Northern Territory',
      'act': 'Australian Capital Territory'
    };
    return stateNames[stateCode] || stateCode.toUpperCase();
  }

  // Parse location string and return jurisdiction information
  parseLocation(locationString) {
    if (!locationString) return null;
    
    const location = locationString.toLowerCase().trim();
    
    // Direct city match
    if (this.cityToState.has(location)) {
      return this.cityToState.get(location);
    }

    // Search for city names within the location string
    for (const [cityKey, locationData] of this.cityToState.entries()) {
      if (location.includes(cityKey)) {
        return locationData;
      }
    }

    // Search by state name or abbreviation
    const stateMatches = {
      'new south wales': 'nsw', 'nsw': 'nsw',
      'victoria': 'vic', 'vic': 'vic',
      'queensland': 'qld', 'qld': 'qld', 
      'western australia': 'wa', 'wa': 'wa',
      'south australia': 'sa', 'sa': 'sa',
      'tasmania': 'tas', 'tas': 'tas',
      'northern territory': 'nt', 'nt': 'nt',
      'australian capital territory': 'act', 'act': 'act', 'canberra': 'act'
    };

    for (const [stateName, stateCode] of Object.entries(stateMatches)) {
      if (location.includes(stateName)) {
        return {
          city: null,
          state: stateCode,
          council: null,
          region: null,
          stateFullName: this.getStateFullName(stateCode),
          isStateOnly: true
        };
      }
    }

    return null;
  }

  // Get all cities for a state (for autocomplete)
  getCitiesForState(stateCode) {
    const cities = [];
    for (const [cityKey, locationData] of this.cityToState.entries()) {
      if (locationData.state === stateCode) {
        cities.push(locationData);
      }
    }
    return cities.sort((a, b) => a.city.localeCompare(b.city));
  }

  // Get all available states
  getAllStates() {
    const states = new Set();
    for (const locationData of this.cityToState.values()) {
      states.add(locationData.state);
    }
    return Array.from(states).map(state => ({
      code: state,
      name: this.getStateFullName(state)
    })).sort((a, b) => a.name.localeCompare(b.name));
  }

  // Search for locations by partial match (for autocomplete)
  searchLocations(query, limit = 10) {
    if (!query || query.length < 2) return [];
    
    const searchTerm = query.toLowerCase();
    const results = [];

    for (const [cityKey, locationData] of this.cityToState.entries()) {
      if (cityKey.startsWith(searchTerm) || 
          locationData.city.toLowerCase().includes(searchTerm) ||
          locationData.stateFullName.toLowerCase().includes(searchTerm)) {
        results.push({
          ...locationData,
          displayName: `${locationData.city}, ${locationData.stateFullName}`,
          matchType: cityKey.startsWith(searchTerm) ? 'prefix' : 'contains'
        });
      }
    }

    // Sort by match quality and alphabetically
    return results
      .sort((a, b) => {
        if (a.matchType !== b.matchType) {
          return a.matchType === 'prefix' ? -1 : 1;
        }
        return a.displayName.localeCompare(b.displayName);
      })
      .slice(0, limit);
  }

  // Enhanced location parsing that handles various input formats
  parseLocationAdvanced(locationString) {
    const basicResult = this.parseLocation(locationString);
    if (basicResult) return basicResult;

    // Try to extract postcode and map to state
    const postcodeMatch = locationString.match(/\b(\d{4})\b/);
    if (postcodeMatch) {
      const postcode = postcodeMatch[1];
      const stateFromPostcode = this.getStateFromPostcode(postcode);
      if (stateFromPostcode) {
        return {
          city: null,
          state: stateFromPostcode,
          council: null,
          region: null,
          stateFullName: this.getStateFullName(stateFromPostcode),
          isStateOnly: true,
          fromPostcode: postcode
        };
      }
    }

    return null;
  }

  // Basic postcode to state mapping (simplified)
  getStateFromPostcode(postcode) {
    const code = parseInt(postcode);
    if (code >= 1000 && code <= 2999) return 'nsw';
    if (code >= 3000 && code <= 3999) return 'vic';
    if (code >= 4000 && code <= 4999) return 'qld';
    if (code >= 5000 && code <= 5999) return 'sa';
    if (code >= 6000 && code <= 6999) return 'wa';
    if (code >= 7000 && code <= 7999) return 'tas';
    if (code >= 800 && code <= 999) return 'nt';
    if (code >= 200 && code <= 299) return 'act';
    return null;
  }
}

// Export singleton instance
export const locationMapper = new LocationMapper();