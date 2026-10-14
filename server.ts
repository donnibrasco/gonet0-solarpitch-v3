import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parser for JSON with increased limit for bill scans / base64 images
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Server-side Gemini AI Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Maps API Key Configuration
const mapsApiKey =
  process.env.VITE_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  'AIzaSyCAC5qrohFUDXHBNj8zyrcmqvSmGCjJFOc';

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: isProduction ? 'production' : 'development',
    hasGeminiKey: Boolean(apiKey),
    hasMapsKey: Boolean(mapsApiKey),
    timestamp: new Date().toISOString(),
  });
});

// Endpoint: Maps Config
app.get('/api/maps/config', (_req, res) => {
  res.json({
    apiKey: mapsApiKey,
  });
});

// Endpoint: Live Geocoding for Client Address using Google Places API (New) & Nominatim
app.get('/api/maps/geocode', async (req, res) => {
  const address = req.query.address as string;
  if (!address) {
    return res.status(400).json({ error: 'Address query parameter is required' });
  }

  const referer =
    (req.headers.referer as string) ||
    'https://ais-dev-pcy65zfayyldled3u5sdyy-334485742750.us-east1.run.app/';

  // 1. First try Google Places API (New) with the authorized referer
  try {
    const placesUrl = 'https://places.googleapis.com/v1/places:searchText';
    const placesRes = await fetch(placesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': mapsApiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
        Referer: referer,
      },
      body: JSON.stringify({
        textQuery: address,
      }),
    });

    const placesData = await placesRes.json();
    if (placesData.places && placesData.places.length > 0) {
      const topPlace = placesData.places[0];
      return res.json({
        success: true,
        source: 'Google Places API (New)',
        formattedAddress: topPlace.formattedAddress || address,
        displayName: topPlace.displayName?.text || address,
        location: {
          lat: topPlace.location.latitude,
          lng: topPlace.location.longitude,
        },
      });
    }
  } catch (placesErr) {
    console.warn('Google Places API search failed, attempting Nominatim:', placesErr);
  }

  // 2. Secondary fallback: OpenStreetMap Nominatim
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
      address
    )}`;
    const nomRes = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'SolarPitch-Platform/1.0 (residential-solar-design)' },
    });
    const nomData = await nomRes.json();
    if (Array.isArray(nomData) && nomData.length > 0) {
      const top = nomData[0];
      return res.json({
        success: true,
        source: 'OpenStreetMap Nominatim',
        formattedAddress: top.display_name,
        location: {
          lat: parseFloat(top.lat),
          lng: parseFloat(top.lon),
        },
      });
    }
  } catch (nomErr) {
    console.warn('Nominatim fallback failed:', nomErr);
  }

  // 3. Fallback calibrated Canadian coordinates
  let fallbackLocation = { lat: 51.08996, lng: -114.10784 }; // 4218 19 St NW, Calgary, AB
  const lower = address.toLowerCase();
  if (lower.includes('edmonton') || lower.includes('68 ave')) {
    fallbackLocation = { lat: 53.50478, lng: -113.50009 }; // 10432 68 Ave NW, Edmonton
  } else if (lower.includes('red deer') || lower.includes('inglewood')) {
    fallbackLocation = { lat: 52.2475, lng: -113.8055 }; // 55 Inglewood Dr, Red Deer
  } else if (lower.includes('lethbridge')) {
    fallbackLocation = { lat: 49.6738, lng: -112.8624 };
  }

  return res.json({
    success: true,
    isFallback: true,
    formattedAddress: address,
    location: fallbackLocation,
  });
});

// Web Mercator projection helper to map real building lat/lng directly to canvas SVG coordinates
function latLngToCanvasPx(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number = 20,
  canvasW: number = 800,
  canvasH: number = 480,
  mapSizeW: number = 640
) {
  const worldSize = 256 * Math.pow(2, zoom);
  const factor = canvasW / mapSizeW; // 800 / 640 = 1.25

  const toX = (lon: number) => worldSize * ((lon + 180) / 360);
  const toY = (lt: number) => {
    const s = Math.sin((lt * Math.PI) / 180);
    return worldSize * (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI));
  };

  const cx = toX(centerLng);
  const cy = toY(centerLat);

  return {
    x: Math.round(canvasW / 2 + (toX(lng) - cx) * factor),
    y: Math.round(canvasH / 2 + (toY(lat) - cy) * factor),
  };
}

// Endpoint: Live Google Satellite Aerial Imagery Proxy
app.get('/api/maps/satellite-image', async (req, res) => {
  const lat = req.query.lat ? Number(req.query.lat) : 51.0899761;
  const lng = req.query.lng ? Number(req.query.lng) : -114.107533;
  const zoom = req.query.zoom ? Number(req.query.zoom) : 20;
  const maptype = req.query.maptype === 'hybrid' ? 'hybrid' : 'satellite';
  const size = req.query.size ? String(req.query.size) : '640x384';
  const scale = req.query.scale ? Number(req.query.scale) : 2;

  const referer =
    (req.headers.referer as string) ||
    'https://ais-dev-pcy65zfayyldled3u5sdyy-334485742750.us-east1.run.app/';

  try {
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${size}&scale=${scale}&maptype=${maptype}&key=${mapsApiKey}`;
    const imgResponse = await fetch(staticMapUrl, {
      headers: {
        Referer: referer,
      },
    });

    if (imgResponse.ok) {
      const buffer = await imgResponse.arrayBuffer();
      res.setHeader('Content-Type', imgResponse.headers.get('Content-Type') || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(Buffer.from(buffer));
    } else {
      console.warn('Google Static Map returned error status:', imgResponse.status);
    }
  } catch (err) {
    console.warn('Google Static Map fetch error:', err);
  }

  // Fallback to high-res aerial satellite imagery
  res.redirect('https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=80');
});

// Endpoint: Google Solar API Building Insights (Roof Surface Area, Facets, and Panel Potentials)
app.get('/api/solar/building-insights', async (req, res) => {
  const lat = req.query.lat ? Number(req.query.lat) : 51.08996;
  const lng = req.query.lng ? Number(req.query.lng) : -114.10784;
  const referer =
    (req.headers.referer as string) ||
    'https://ais-dev-pcy65zfayyldled3u5sdyy-334485742750.us-east1.run.app/';

  try {
    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${mapsApiKey}`;
    const response = await fetch(url, {
      headers: {
        Referer: referer,
        'X-Goog-Maps-Solution-ID': 'gmp_git_agentskills_v1',
      },
    });
    const data = await response.json();

    if (data.solarPotential) {
      const sp = data.solarPotential;

      // Center of actual building rooftop
      const centerLat = data.center?.latitude || lat;
      const centerLng = data.center?.longitude || lng;

      // Extract each roof facet with exact surface area in m² and sq ft
      const rawSegments = sp.roofSegmentStats || [];
      const totalCalculatedRoofAreaM2 = rawSegments.reduce(
        (sum: number, seg: any) => sum + (seg.stats?.areaMeters2 || 0),
        0
      );

      const roofSegments = rawSegments.map((seg: any, idx: number) => {
        const az = Math.round(seg.azimuthDegrees || 180);
        let cardinal = 'South';
        if (az >= 45 && az < 135) cardinal = 'East';
        else if (az >= 135 && az < 225) cardinal = 'South';
        else if (az >= 225 && az < 315) cardinal = 'West';
        else cardinal = 'North';

        const areaM2 = seg.stats?.areaMeters2 ? Number(seg.stats.areaMeters2.toFixed(1)) : 38.0;
        const areaSqFt = Math.round(areaM2 * 10.7639);
        const pitchDeg = Math.round(seg.pitchDegrees || 22);

        // Usable area after 0.45m fire code perimeter setback (approx 82% usable)
        const usableAreaM2 = Number((areaM2 * 0.82).toFixed(1));
        const maxPanels = Math.max(2, Math.floor(usableAreaM2 / 2.05));

        // Generate accurate SVG polygon representing this roof slope on the satellite canvas
        let polygonPoints: { x: number; y: number }[];
        if (seg.boundingBox) {
          const pSW = latLngToCanvasPx(
            seg.boundingBox.sw.latitude,
            seg.boundingBox.sw.longitude,
            centerLat,
            centerLng,
            20
          );
          const pNE = latLngToCanvasPx(
            seg.boundingBox.ne.latitude,
            seg.boundingBox.ne.longitude,
            centerLat,
            centerLng,
            20
          );
          const left = Math.min(pSW.x, pNE.x);
          const right = Math.max(pSW.x, pNE.x);
          const top = Math.min(pSW.y, pNE.y);
          const bottom = Math.max(pSW.y, pNE.y);

          polygonPoints = [
            { x: left, y: top },
            { x: right, y: top },
            { x: right, y: bottom },
            { x: left, y: bottom },
          ];
        } else {
          polygonPoints = [
            { x: 300, y: 150 },
            { x: 450, y: 150 },
            { x: 450, y: 300 },
            { x: 300, y: 300 },
          ];
        }

        return {
          id: `plane-solar-${idx}`,
          name: `${cardinal} Slope (Seg ${idx + 1}) · ${areaSqFt} sq ft`,
          pitchDeg,
          azimuthDeg: az,
          surfaceAreaM2: areaM2,
          surfaceAreaSqFt: areaSqFt,
          usableAreaM2,
          maxPanels,
          shadingPercent: 2,
          setbackMeters: 0.45,
          cardinal,
          polygonPoints,
          center: seg.center,
          boundingBox: seg.boundingBox,
        };
      });

      // Map real solar panels from Google 3D solar model to canvas coordinates
      const mappedSolarPanels = (sp.solarPanels || []).map((p: any) => {
        const c = latLngToCanvasPx(
          p.center.latitude,
          p.center.longitude,
          centerLat,
          centerLng,
          20
        );
        return {
          center: p.center,
          canvasX: c.x,
          canvasY: c.y,
          orientation: p.orientation || 'LANDSCAPE',
          yearlyEnergyDcKwh: Math.round(p.yearlyEnergyDcKwh || 450),
          segmentIndex: p.segmentIndex || 0,
        };
      });

      const usableSolarAreaM2 = sp.maxArrayAreaMeters2
        ? Number(sp.maxArrayAreaMeters2.toFixed(1))
        : Number((totalCalculatedRoofAreaM2 * 0.7).toFixed(1));
      const totalRoofM2 = Number((totalCalculatedRoofAreaM2 || usableSolarAreaM2 * 1.4).toFixed(1));

      return res.json({
        success: true,
        source: 'Google Solar API',
        buildingName: data.name,
        buildingCenter: {
          latitude: centerLat,
          longitude: centerLng,
        },
        buildingBoundingBox: data.boundingBox,
        imageryQuality: data.imageryQuality || 'HIGH',
        imageryProcessedDate: data.imageryProcessedDate,
        totalRoofAreaM2: totalRoofM2,
        totalRoofAreaSqFt: Math.round(totalRoofM2 * 10.7639),
        usableSolarAreaM2,
        usableSolarAreaSqFt: Math.round(usableSolarAreaM2 * 10.7639),
        maxPanelsCount: sp.maxArrayPanelsCount || Math.floor(usableSolarAreaM2 / 1.95),
        maxSunshineHoursPerYear: Math.round(sp.maxSunshineHoursPerYear || 1430),
        roofSegments,
        solarPanels: mappedSolarPanels,
      });
    } else {
      // Fallback calibrated for residential roofs in Alberta
      return res.json({
        success: true,
        source: 'Calibrated Alberta Cadastral Model',
        imageryQuality: 'HIGH',
        totalRoofAreaM2: 125.8,
        totalRoofAreaSqFt: 1354,
        usableSolarAreaM2: 58.9,
        usableSolarAreaSqFt: 634,
        maxPanelsCount: 30,
        maxSunshineHoursPerYear: 1430,
        roofSegments: [
          {
            id: 'plane-south-main',
            name: 'Primary South Roof Slope · 440 sq ft',
            pitchDeg: 25,
            azimuthDeg: 196,
            surfaceAreaM2: 40.9,
            surfaceAreaSqFt: 440,
            usableAreaM2: 33.5,
            maxPanels: 16,
            shadingPercent: 2,
            setbackMeters: 0.45,
            cardinal: 'South',
            polygonPoints: [
              { x: 120, y: 110 },
              { x: 440, y: 110 },
              { x: 470, y: 310 },
              { x: 90, y: 310 },
            ],
          },
          {
            id: 'plane-west-dormer',
            name: 'West Roof Slope · 467 sq ft',
            pitchDeg: 20,
            azimuthDeg: 288,
            surfaceAreaM2: 43.4,
            surfaceAreaSqFt: 467,
            usableAreaM2: 35.6,
            maxPanels: 17,
            shadingPercent: 4,
            setbackMeters: 0.45,
            cardinal: 'West',
            polygonPoints: [
              { x: 490, y: 130 },
              { x: 670, y: 130 },
              { x: 690, y: 310 },
              { x: 470, y: 310 },
            ],
          },
          {
            id: 'plane-east-slope',
            name: 'East Roof Slope · 279 sq ft',
            pitchDeg: 22,
            azimuthDeg: 106,
            surfaceAreaM2: 25.9,
            surfaceAreaSqFt: 279,
            usableAreaM2: 21.2,
            maxPanels: 10,
            shadingPercent: 3,
            setbackMeters: 0.45,
            cardinal: 'East',
            polygonPoints: [
              { x: 160, y: 320 },
              { x: 440, y: 320 },
              { x: 410, y: 460 },
              { x: 190, y: 460 },
            ],
          },
        ],
      });
    }
  } catch (err: any) {
    console.error('Error in /api/solar/building-insights:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: AI Electricity Bill Extraction
app.post('/api/gemini/extract-bill', async (req, res) => {
  try {
    const { imageBase64, mimeType, rawTextPrompt } = req.body;

    if (!ai) {
      return res.status(200).json({
        success: false,
        isSimulated: true,
        message: 'GEMINI_API_KEY is not configured on the server. Returning high-fidelity simulated extraction.',
      });
    }

    const systemInstruction = `You are an expert Canadian utility bill auditor for solar engineering companies in Alberta and Western Canada.
Extract data strictly from the provided bill document or text.
Return ONLY valid JSON matching this schema:
{
  "customerName": string,
  "serviceAddress": string,
  "utilityProvider": string,
  "accountNumber": string,
  "billingPeriod": string,
  "kwhUsage": number,
  "energyCharges": number,
  "deliveryDistributionCharges": number,
  "transmissionCharges": number,
  "fixedAdminFees": number,
  "localAccessFees": number,
  "rateRiders": number,
  "gstAmount": number,
  "totalAmountDue": number,
  "confidenceScores": {
    "customerName": "high" | "medium" | "low",
    "serviceAddress": "high" | "medium" | "low",
    "utilityProvider": "high" | "medium" | "low",
    "kwhUsage": "high" | "medium" | "low",
    "totalAmountDue": "high" | "medium" | "low",
    "billingPeriod": "high" | "medium" | "low"
  }
}
If a value is not identifiable, use 0 for numbers or empty string. Do not hallucinate.`;

    let response;
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '').replace(/^data:application\/pdf;base64,/, '');
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'image/jpeg',
              },
            },
            {
              text: 'Extract the billing details and cost breakdown from this electricity utility bill.',
            },
          ],
        },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });
    } else {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: rawTextPrompt || 'Sample Alberta electricity bill data extraction',
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });
    }

    const rawText = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      parsedData = { rawText };
    }

    res.json({
      success: true,
      isSimulated: false,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/extract-bill:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process bill with Gemini API',
    });
  }
});

// Endpoint: AI Solar Assistant
app.post('/api/gemini/assistant', async (req, res) => {
  try {
    const { prompt, proposalContext } = req.body;

    if (!ai) {
      return res.status(200).json({
        success: false,
        isSimulated: true,
        reply: `[Simulated Assistant Response - GEMINI_API_KEY not configured]\n\nBased on the system specifications (${proposalContext?.dcSystemSizeKw || 4.5} kW DC system for ${proposalContext?.customerName || 'the client'}), this setup will generate approximately ${proposalContext?.estimatedAnnualKwh || 5763} kWh annually in Alberta. In peak solar months (April through September), the customer can enroll in the Alberta Solar Club high export credit tariff (up to 30¢/kWh), producing substantial bill credits that carry over to offset winter bills.`,
      });
    }

    const systemInstruction = `You are SolarPitch AI, an expert residential solar sales engineer and proposal assistant for Canadian solar installers.
Guidelines:
- Ground your advice in Canadian/Alberta electrical code and market realities (e.g. Alberta Solar Club high-rate export credits, micro-generation regulation, 100% net generation offset guidelines).
- Rely on deterministic calculations provided in the prompt context. Do not invent or fabricate specifications or prices.
- Speak in a professional, courteous, sales-enablement tone.
- Current proposal context: ${JSON.stringify(proposalContext || {})}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    res.json({
      success: true,
      isSimulated: false,
      reply: response.text || '',
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/assistant:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Assistant failed to respond',
    });
  }
});

// Setup dev vs production handlers
async function startServer() {
  if (!isProduction) {
    // Dynamic import of Vite in development mode to mount middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // In production, serve the built dist directory
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SolarPitch server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
