import { useState, useEffect } from 'react';

export interface NetworkInfo {
  ip: string;
  isp: string;
  city: string;
  region: string;
  country: string;
  loc: string;
  testServer: {
    name: string;
    location: string;
    distance: number; // in km
    urls: Record<string, string>;
  } | null;
}

export const useNetworkInfo = (selectedServer?: string) => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't run on server
    if (typeof window === 'undefined') {
      return;
    }
    
    // Split the network info fetching to improve user experience
    const fetchIPAndLocation = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch IP address
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (!ipResponse.ok) {
          throw new Error('Failed to fetch IP address');
        }
        const ipData = await ipResponse.json();
        const ipAddress = ipData.ip;

        // Try multiple IP information services
        let geoData;
        
        // First try ipinfo.io (fallback)
        try {
          const infoResponse = await fetch(`https://ipinfo.io/${ipAddress}/json`);
          if (infoResponse.ok) {
            geoData = await infoResponse.json();
            
            // Format for consistency with our expected fields
            geoData.regionName = geoData.region;
            geoData.lat = geoData.loc ? geoData.loc.split(',')[0] : "0";
            geoData.lon = geoData.loc ? geoData.loc.split(',')[1] : "0";
          } else {
            throw new Error('ipinfo.io service failed');
          }
        } catch (error) {
          console.warn('First IP info service failed, trying alternative:', error);
          
          // Try ip-api.com (with HTTPS)
          try {
            const geoResponse = await fetch(`https://ipapi.co/${ipAddress}/json`);
            if (geoResponse.ok) {
              geoData = await geoResponse.json();
              // Format fields for consistency
              geoData.regionName = geoData.region_name || geoData.region;
              geoData.lat = geoData.latitude || "0";
              geoData.lon = geoData.longitude || "0";
              geoData.loc = `${geoData.lat},${geoData.lon}`;
            } else {
              throw new Error('ipapi.co service failed');
            }
          } catch (e) {
            // If both fail, create minimal fallback data
            console.warn('All IP info services failed, using fallback:', e);
            geoData = {
              ip: ipAddress,
              isp: "Unknown ISP",
              city: "Unknown",
              regionName: "Unknown",
              country: "Unknown",
              lat: "0",
              lon: "0",
              loc: "0,0"
            };
          }
        }

        // Format ISP name to remove AS numbers
        const formatISP = (isp: string): string => {
          return isp.replace(/^AS\d+\s+/i, '').trim();
        };

        // Set basic network info immediately
        setNetworkInfo({
          ip: ipAddress,
          isp: formatISP(geoData.isp || geoData.org || 'Unknown'),
          city: geoData.city || 'Unknown',
          region: geoData.regionName || geoData.region || 'Unknown',
          country: geoData.country || 'Unknown',
          loc: geoData.loc || `${geoData.lat},${geoData.lon}`,
          testServer: null, // Will be populated later
        });
        
        // Reduce loading state once we have basic info
        setLoading(false);
        
        // Now fetch the server info separately
        fetchTestServerInfo(ipAddress, geoData);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Error fetching network info:', err);
        setLoading(false);
      }
    };
    
    const fetchTestServerInfo = async (ipAddress: string, geoData: any) => {
      if (selectedServer) return; // Skip if a server is manually selected
      
      try {
        // Fetch nearest M-Lab server
        const response = await fetchWithRetry('https://locate.measurementlab.net/v2/nearest/ndt/ndt7');
        if (response.ok) {
          const serverData = await response.json();
          
          if (serverData.results && serverData.results.length > 0) {
            const server = serverData.results[0];
            
            // Extract server hostname and try to parse location info from it
            const serverHostname = server.machine || '';
            console.log("Server hostname:", serverHostname);
            
            // Parse hostname for location hints
            let locationCode = '';
            const hostnameMatch = serverHostname.match(/mlab\d+-([a-z]{3}\d+)/i);
            if (hostnameMatch && hostnameMatch[1]) {
              locationCode = hostnameMatch[1].substring(0, 3).toLowerCase();
              console.log("Extracted location code from hostname:", locationCode);
            }
            
            // User coordinates
            const userLat = typeof geoData.lat === 'string' ? parseFloat(geoData.lat) : geoData.lat;
            const userLon = typeof geoData.lon === 'string' ? parseFloat(geoData.lon) : geoData.lon;
            
            // Get server coordinates
            let serverLat, serverLon;
            let coordinateSource = "unknown";
            
            // Try location code mapping first
            if (locationCode && mlabLocationCodes[locationCode]) {
              [serverLat, serverLon] = mlabLocationCodes[locationCode];
              coordinateSource = "m-lab code";
            }
            // Try exact location match next
            else if (server.location?.city && server.location?.country) {
              const exactLocation = `${server.location.city}, ${server.location.country}`.toLowerCase();
              if (directLocationMapping[exactLocation]) {
                [serverLat, serverLon] = directLocationMapping[exactLocation];
                coordinateSource = "direct mapping";
              } 
              // Try city database
              else {
                const cityCoords = getCityCoordinates(server.location.city, server.location.country);
                if (cityCoords.found) {
                  serverLat = cityCoords.lat;
                  serverLon = cityCoords.lon;
                  coordinateSource = "city database";
                } else {
                  // Fallback to country
                  const countryCoords = getCountryCoordinates(server.location.country);
                  serverLat = countryCoords.lat;
                  serverLon = countryCoords.lon;
                  coordinateSource = "country database";
                }
              }
            } else {
              // Default fallback
              serverLat = 25;
              serverLon = -40;
              coordinateSource = "default";
            }
            
            console.log("User coordinates:", userLat, userLon);
            console.log("Server coordinates:", serverLat, serverLon, `(source: ${coordinateSource})`);
            
            // Calculate distance
            let distance = simpleDistance(userLat, userLon, serverLat, serverLon);
            console.log("Simple distance calculation:", distance, "km");
            
            // Alternative calculation if needed
            if (isNaN(distance) || distance > 20000 || distance < 1) {
              distance = calculateDistance(userLat, userLon, serverLat, serverLon);
              console.log("Fallback distance calculation:", distance, "km");
            }
            
            console.log("Final calculated distance:", distance, "km");
            
            // Create test server object
            const testServer = {
              name: server.machine || 'Unknown',
              location: `${server.location?.city || 'Unknown'}, ${server.location?.country || 'Unknown'}`,
              distance: Math.round(distance),
              urls: server.urls || {},
            };
            
            // Update network info with test server data
            setNetworkInfo(prev => {
              if (!prev) return null;
              return {
                ...prev,
                testServer
              };
            });
          }
        }
      } catch (serverError) {
        console.warn('Could not fetch M-Lab servers:', serverError);
        // Continue without test server info - the UI will show a message
      }
    };

    fetchIPAndLocation();
  }, [selectedServer]);

  return { networkInfo, loading, error };
};

// Add these helper functions:
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, options: RequestInit = {}, maxRetries = 3) => {
  let retries = 0;
  let backoffTime = 2000; // Start with 2 second delay
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // Rate limited - backoff and retry
        console.log(`Rate limited (429). Retrying in ${backoffTime/1000} seconds...`);
        await delay(backoffTime);
        backoffTime *= 2; // Exponential backoff
        retries++;
      } else {
        return response; // Return successful response
      }
    } catch (error) {
      // For network errors, also retry
      console.error("Network error during fetch:", error);
      await delay(backoffTime);
      backoffTime *= 2;
      retries++;
    }
  }
  
  // If we've exhausted retries, throw an error
  throw new Error("API is rate limited. Please try again later.");
};

// Direct mapping of M-Lab location codes to exact coordinates
// These are specifically for M-Lab servers based on their location codes
const mlabLocationCodes: Record<string, [number, number]> = {
  // India locations
  'maa': [13.0827, 80.2707], // Chennai (Madras)
  'del': [28.5562, 77.1000], // Delhi
  'bom': [19.0896, 72.8656], // Mumbai
  
  // US locations
  'lga': [40.7769, -73.8740], // New York LaGuardia
  'jfk': [40.6413, -73.7781], // New York JFK
  'lax': [33.9416, -118.4085], // Los Angeles
  'ord': [41.9742, -87.9073], // Chicago O'Hare
  'sfo': [37.6213, -122.3790], // San Francisco
  'dfw': [32.8998, -97.0403], // Dallas Fort Worth
  'sea': [47.4502, -122.3088], // Seattle
  'iad': [38.9531, -77.4565], // Washington Dulles
  'atl': [33.6407, -84.4277], // Atlanta
  'den': [39.8561, -104.6737], // Denver
  'mia': [25.7959, -80.2871], // Miami
  
  // Europe locations
  'lhr': [51.4700, -0.4543], // London Heathrow
  'cdg': [49.0097, 2.5479], // Paris Charles de Gaulle
  'fra': [50.0379, 8.5622], // Frankfurt
  'ams': [52.3105, 4.7683], // Amsterdam
  
  // Asia Pacific
  'hnd': [35.5494, 139.7798], // Tokyo Haneda
  'syd': [-33.9399, 151.1753], // Sydney
  'sin': [1.3644, 103.9915], // Singapore
  'hkg': [22.3080, 113.9185], // Hong Kong
  
  // Other
  'dxb': [25.2532, 55.3657], // Dubai
  'gru': [-23.4357, -46.4731], // São Paulo
  'yyz': [43.6777, -79.6248], // Toronto
  'mex': [19.4363, -99.0721], // Mexico City
  'mad': [40.4983, -3.5676], // Madrid
  'cpt': [-33.9648, 18.6017], // Cape Town
  'jnb': [-26.1367, 28.2412], // Johannesburg
};

// Direct mapping for specific locations
const directLocationMapping: Record<string, [number, number]> = {
  "chennai, india": [13.0827, 80.2707],
  "delhi, india": [28.5562, 77.1000],
  "mumbai, india": [19.0896, 72.8656],
  "new york, united states": [40.7128, -74.0060],
  "los angeles, united states": [34.0522, -118.2437],
  "london, united kingdom": [51.5074, -0.1278],
  "paris, france": [48.8566, 2.3522],
  "tokyo, japan": [35.6762, 139.6503],
  "sydney, australia": [-33.8688, 151.2093],
  "singapore, singapore": [1.3521, 103.8198],
};

// Simple, fast distance calculation using the Haversine formula
function simpleDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return 0;
  }
  
  // Convert to radians
  const toRad = (x: number) => x * Math.PI / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Function to get more precise city coordinates
function getCityCoordinates(city?: string, country?: string): { lat: number, lon: number, found: boolean } {
  if (!city) return { lat: 0, lon: 0, found: false };
  
  const cityKey = `${city.toLowerCase()}${country ? '_' + country.toLowerCase() : ''}`;
  
  // Extended city database with more precise coordinates
  const cityCoordinates: Record<string, [number, number]> = {
    // North America
    'new york_us': [40.7128, -74.0060],
    'los angeles_us': [34.0522, -118.2437],
    'chicago_us': [41.8781, -87.6298],
    'houston_us': [29.7604, -95.3698],
    'phoenix_us': [33.4484, -112.0740],
    'philadelphia_us': [39.9526, -75.1652],
    'san antonio_us': [29.4241, -98.4936],
    'san diego_us': [32.7157, -117.1611],
    'dallas_us': [32.7767, -96.7970],
    'san jose_us': [37.3382, -121.8863],
    'austin_us': [30.2672, -97.7431],
    'seattle_us': [47.6062, -122.3321],
    'san francisco_us': [37.7749, -122.4194],
    'denver_us': [39.7392, -104.9903],
    'toronto_ca': [43.6532, -79.3832],
    'montreal_ca': [45.5017, -73.5673],
    'vancouver_ca': [49.2827, -123.1207],
    'mexico city_mx': [19.4326, -99.1332],
    
    // Europe
    'london_gb': [51.5074, -0.1278],
    'paris_fr': [48.8566, 2.3522],
    'berlin_de': [52.5200, 13.4050],
    'madrid_es': [40.4168, -3.7038],
    'rome_it': [41.9028, 12.4964],
    'amsterdam_nl': [52.3676, 4.9041],
    'vienna_at': [48.2082, 16.3738],
    'brussels_be': [50.8503, 4.3517],
    'stockholm_se': [59.3293, 18.0686],
    'frankfurt_de': [50.1109, 8.6821],
    'munich_de': [48.1351, 11.5820],
    'milan_it': [45.4642, 9.1900],
    'warsaw_pl': [52.2297, 21.0122],
    'zurich_ch': [47.3769, 8.5417],
    'lisbon_pt': [38.7223, -9.1393],
    'dublin_ie': [53.3498, -6.2603],
    
    // Asia
    'tokyo_jp': [35.6762, 139.6503],
    'delhi_in': [28.6139, 77.2090],
    'shanghai_cn': [31.2304, 121.4737],
    'mumbai_in': [19.0760, 72.8777],
    'beijing_cn': [39.9042, 116.4074],
    'osaka_jp': [34.6937, 135.5023],
    'seoul_kr': [37.5665, 126.9780],
    'singapore_sg': [1.3521, 103.8198],
    'hong kong_hk': [22.3193, 114.1694],
    'bangkok_th': [13.7563, 100.5018],
    'taipei_tw': [25.0330, 121.5654],
    'kuala lumpur_my': [3.1390, 101.6869],
    'jakarta_id': [6.2088, 106.8456],
    
    // Australia/Oceania
    'sydney_au': [-33.8688, 151.2093],
    'melbourne_au': [-37.8136, 144.9631],
    'brisbane_au': [-27.4698, 153.0251],
    'perth_au': [-31.9505, 115.8605],
    'auckland_nz': [-36.8509, 174.7645],
    
    // Africa
    'cairo_eg': [30.0444, 31.2357],
    'lagos_ng': [6.5244, 3.3792],
    'johannesburg_za': [-26.2041, 28.0473],
    'cape town_za': [-33.9249, 18.4241],
    
    // South America
    'são paulo_br': [-23.5505, -46.6333],
    'rio de janeiro_br': [-22.9068, -43.1729],
    'buenos aires_ar': [-34.6037, -58.3816],
    'bogotá_co': [4.7110, -74.0721],
    'santiago_cl': [-33.4489, -70.6693],
    'lima_pe': [-12.0464, -77.0428],
    // Add more cities as needed
  };
  
  // First try exact match with country
  if (cityCoordinates[cityKey]) {
    const [lat, lon] = cityCoordinates[cityKey];
    return { lat, lon, found: true };
  }
  
  // Then try just the city name
  const cityOnlyKey = city.toLowerCase();
  for (const key in cityCoordinates) {
    if (key.startsWith(cityOnlyKey + '_')) {
      const [lat, lon] = cityCoordinates[key];
      return { lat, lon, found: true };
    }
  }
  
  return { lat: 0, lon: 0, found: false };
}

// Function to get country coordinates
function getCountryCoordinates(country?: string): { lat: number, lon: number } {
  if (!country) return { lat: 0, lon: 0 };
  
  const countryLower = country.toLowerCase();
  
  // Extended country database with more precise central coordinates
  const countryCoordinates: Record<string, [number, number]> = {
    'united states': [39.8283, -98.5795],
    'us': [39.8283, -98.5795],
    'usa': [39.8283, -98.5795],
    'canada': [56.1304, -106.3468],
    'mexico': [23.6345, -102.5528],
    'united kingdom': [55.3781, -3.4360],
    'uk': [55.3781, -3.4360],
    'great britain': [55.3781, -3.4360],
    'england': [52.3555, -1.1743],
    'france': [46.2276, 2.2137],
    'germany': [51.1657, 10.4515],
    'italy': [41.8719, 12.5674],
    'spain': [40.4637, -3.7492],
    'portugal': [39.3999, -8.2245],
    'ireland': [53.1424, -7.6921],
    'netherlands': [52.1326, 5.2913],
    'belgium': [50.5039, 4.4699],
    'switzerland': [46.8182, 8.2275],
    'austria': [47.5162, 14.5501],
    'sweden': [60.1282, 18.6435],
    'norway': [60.4720, 8.4689],
    'denmark': [56.2639, 9.5018],
    'finland': [61.9241, 25.7482],
    'poland': [51.9194, 19.1451],
    'russia': [61.5240, 105.3188],
    'ukraine': [48.3794, 31.1656],
    'turkey': [38.9637, 35.2433],
    'greece': [39.0742, 21.8243],
    'india': [20.5937, 78.9629],
    'china': [35.8617, 104.1954],
    'japan': [36.2048, 138.2529],
    'south korea': [35.9078, 127.7669],
    'korea': [35.9078, 127.7669],
    'australia': [-25.2744, 133.7751],
    'new zealand': [-40.9006, 174.8860],
    'brazil': [-14.2350, -51.9253],
    'argentina': [-38.4161, -63.6167],
    'chile': [-35.6751, -71.5430],
    'colombia': [4.5709, -74.2973],
    'peru': [-9.1900, -75.0152],
    'south africa': [-30.5595, 22.9375],
    'egypt': [26.8206, 30.8025],
    'nigeria': [9.0820, 8.6753],
    'kenya': [-0.0236, 37.9062],
    'singapore': [1.3521, 103.8198],
    'malaysia': [4.2105, 101.9758],
    'indonesia': [-0.7893, 113.9213],
    'thailand': [15.8700, 100.9925],
    'vietnam': [14.0583, 108.2772],
    'philippines': [12.8797, 121.7740],
    'saudi arabia': [23.8859, 45.0792],
    'uae': [23.4241, 53.8478],
    'united arab emirates': [23.4241, 53.8478],
    'israel': [31.0461, 34.8516],
    // Add more countries as needed
  };
  
  if (countryCoordinates[countryLower]) {
    const [lat, lon] = countryCoordinates[countryLower];
    return { lat, lon };
  }
  
  // Return default (mid-Atlantic) if country not found
  return { lat: 25.0, lon: -40.0 };
}

// More accurate distance calculation using Haversine (same as simpleDistance, kept for clarity)
// This is the primary calculation used when simpleDistance yields odd results.
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return 0; // Return 0 or handle error appropriately
  }
  
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180; // Convert degrees to radians
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const distance = R * c; // Distance in km
  return distance;
}
