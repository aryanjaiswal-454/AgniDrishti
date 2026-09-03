import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

export const config = {
  env: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT || "3001", 10),

  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : "http://localhost:5173",
    credentials: true,
  },

  jwt: {
    secret: process.env.JWT_SECRET || "agnidrishti_default_jwt_secret_change_in_production",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    cookieName: "agnidrishti_token",
    cookieMaxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  db: {
    url: process.env.DATABASE_URL,
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    database: process.env.POSTGRES_DB || "agnidrishti",
    user: process.env.POSTGRES_USER || "agnidrishti",
    password: process.env.POSTGRES_PASSWORD || "agnidrishti_dev",
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
  },

  firms: {
    apiKey: process.env.FIRMS_MAP_KEY || "",
    baseUrl: "https://firms.modaps.eosdis.nasa.gov/api/area/csv",
    sources: (process.env.FIRMS_SOURCE || "VIIRS_SNPP_NRT,MODIS_NRT").split(",").map((s) => s.trim()),
    // Default bounding box for India: 68,6,98,38 (W,S,E,N format used by FIRMS API)
    areaCoordinates: process.env.FIRMS_AREA_COORDINATES || "68,6,98,38",
    dayRange: parseInt(process.env.FIRMS_DAY_RANGE || "1", 10),
    cronSchedule: process.env.FIRMS_POLL_INTERVAL || "*/30 * * * *", // every 30 minutes
    timeoutMs: 30000,
  },

  osm: {
    overpassUrl: process.env.OSM_OVERPASS_URL || "https://overpass-api.de/api/interpreter",
    cronSchedule: process.env.OSM_SYNC_INTERVAL || "0 3 * * 0", // weekly Sunday 3 AM
    // Default bounding box for India in Overpass format: (south,west,north,east)
    areaBbox: process.env.OSM_AREA_BBOX || "6.5,68.0,37.5,97.5",
    chunkRows: parseInt(process.env.OSM_CHUNK_ROWS || "2", 10),
    chunkCols: parseInt(process.env.OSM_CHUNK_COLS || "3", 10),
    requestTimeoutMs: parseInt(process.env.OSM_REQUEST_TIMEOUT_MS || "60000", 10),
    chunkDelayMs: parseInt(process.env.OSM_CHUNK_DELAY_MS || "2000", 10),
  },

  queues: {
    firmsIngestion: "firms-ingestion-queue",
    osmSync: "osm-sync-queue",
    classification: "classification-queue",
  },

  classifier: {
    url: process.env.CLASSIFIER_URL || "http://localhost:8000",
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAuth: 20, // 20 requests per window for auth routes
    maxApi: 300, // 300 requests per window for general API
  },
};

export default config;

