import { parse } from "csv-parse/sync";
import { InstrumentType, DayNight } from "@agnidrishti/shared-types";
import logger from "../../utils/logger";

export interface NormalizedHotspotInput {
  latitude: number;
  longitude: number;
  acq_date: string; // YYYY-MM-DD
  acq_time: string; // HHMM
  satellite: string;
  instrument: InstrumentType;
  confidence: string;
  frp: number | null;
  bright_ti4: number | null; // Canonical brightness temperature
  brightness_temp: number | null; // Alias for canonical brightness
  daynight: DayNight;
  raw_payload: Record<string, any>;
}

export interface NormalizationResult {
  valid: NormalizedHotspotInput[];
  invalidCount: number;
  errors: string[];
}

/**
 * Normalizes latitude and longitude to 5 decimal places (~1.1m precision)
 * to absorb floating-point noise from repetitive satellite pulls.
 */
export function normalizeCoordinate(coord: number): number {
  return Math.round(coord * 100000) / 100000;
}

/**
 * Parse and normalize NASA FIRMS CSV payload into internal Hotspot schema.
 */
export function normalizeFirmsCsv(csvText: string, defaultInstrument?: InstrumentType): NormalizationResult {
  if (!csvText || !csvText.trim()) {
    return { valid: [], invalidCount: 0, errors: [] };
  }

  let records: Record<string, string>[];
  try {
    records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err: any) {
    logger.error(`CSV Parsing error: ${err.message}`);
    return { valid: [], invalidCount: 0, errors: [`CSV Parse Error: ${err.message}`] };
  }

  const valid: NormalizedHotspotInput[] = [];
  let invalidCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    try {
      const rawLat = parseFloat(row.latitude);
      const rawLon = parseFloat(row.longitude);

      if (isNaN(rawLat) || rawLat < -90 || rawLat > 90) {
        throw new Error(`Invalid latitude value: '${row.latitude}'`);
      }
      if (isNaN(rawLon) || rawLon < -180 || rawLon > 180) {
        throw new Error(`Invalid longitude value: '${row.longitude}'`);
      }

      const latitude = normalizeCoordinate(rawLat);
      const longitude = normalizeCoordinate(rawLon);

      // Acquisition date (YYYY-MM-DD)
      const acq_date = row.acq_date?.trim();
      if (!acq_date || !/^\d{4}-\d{2}-\d{2}$/.test(acq_date)) {
        throw new Error(`Invalid acq_date format: '${row.acq_date}'`);
      }

      // Acquisition time (HHMM - pad with leading zeros if needed)
      let acq_time = (row.acq_time || "").trim();
      if (acq_time.length > 0 && acq_time.length < 4) {
        acq_time = acq_time.padStart(4, "0");
      }
      if (!/^\d{4}$/.test(acq_time)) {
        throw new Error(`Invalid acq_time format: '${row.acq_time}'`);
      }

      // Instrument: VIIRS or MODIS
      let instrument: InstrumentType;
      const rawInstrument = (row.instrument || "").toUpperCase().trim();
      if (rawInstrument.includes("MODIS")) {
        instrument = "MODIS";
      } else if (rawInstrument.includes("VIIRS")) {
        instrument = "VIIRS";
      } else if (defaultInstrument) {
        instrument = defaultInstrument;
      } else if (row.bright_ti4 !== undefined) {
        instrument = "VIIRS";
      } else {
        instrument = "MODIS";
      }

      // Satellite identifier (e.g., 'N', '1', 'Terra', 'Aqua')
      const satellite = (row.satellite || "N").trim();

      // Confidence
      const confidence = (row.confidence || "nominal").trim();

      // FRP (Fire Radiative Power)
      let frp: number | null = null;
      if (row.frp !== undefined && row.frp !== "") {
        const parsedFrp = parseFloat(row.frp);
        if (!isNaN(parsedFrp)) {
          frp = Math.round(parsedFrp * 100) / 100;
        }
      }

      // Brightness Temperature: VIIRS (bright_ti4) or MODIS (brightness)
      let brightness_temp: number | null = null;
      const rawBrightness = row.bright_ti4 ?? row.brightness ?? row.bright_t31;
      if (rawBrightness !== undefined && rawBrightness !== "") {
        const parsedB = parseFloat(rawBrightness);
        if (!isNaN(parsedB)) {
          brightness_temp = Math.round(parsedB * 10) / 10;
        }
      }

      // Day/Night
      let daynight: DayNight = "D";
      const rawDayNight = (row.daynight || "").toUpperCase().trim();
      if (rawDayNight === "N") {
        daynight = "N";
      }

      valid.push({
        latitude,
        longitude,
        acq_date,
        acq_time,
        satellite,
        instrument,
        confidence,
        frp,
        bright_ti4: brightness_temp,
        brightness_temp,
        daynight,
        raw_payload: row,
      });
    } catch (err: any) {
      invalidCount++;
      if (errors.length < 10) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }
  }

  return { valid, invalidCount, errors };
}

