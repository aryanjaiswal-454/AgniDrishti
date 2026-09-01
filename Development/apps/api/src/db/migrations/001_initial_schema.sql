-- ============================================================================
-- AgniDrishti  — Initial Database Schema Migration
-- ============================================================================
-- Fully aligned with DataSpecification_FireVigil & Architecture documents.
-- PostgreSQL 16 + PostGIS extension, SRID 4326.

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ----------------------------------------------------------------------------
-- Enumerations
-- ----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'analyst', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE facility_type AS ENUM (
        'refinery',
        'petrochemical',
        'power_plant',
        'steel',
        'mining',
        'lng_terminal',
        'other_industrial'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE instrument_type AS ENUM ('MODIS', 'VIIRS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE day_night AS ENUM ('D', 'N');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE primary_class AS ENUM ('industrial', 'natural');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sub_class AS ENUM (
        'industrial_fire',
        'gas_flare',
        'agricultural_burning',
        'mining_activity',
        'forest_fire',
        'other_natural',
        'unclassified'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE land_cover_type AS ENUM (
        'forest',
        'cropland',
        'built_up',
        'bare',
        'grassland'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_severity AS ENUM ('high', 'medium', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_status AS ENUM (
        'new',
        'acknowledged',
        'resolved',
        'false_positive'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 1. users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. facilities (Industrial infrastructure layer from OSM / registries)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    osm_id TEXT NOT NULL UNIQUE,
    name TEXT,
    facility_type facility_type NOT NULL,
    geometry GEOMETRY(Geometry, 4326) NOT NULL,
    state TEXT,
    district TEXT,
    source TEXT NOT NULL DEFAULT 'osm',
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. hotspots (Raw NASA FIRMS ingestion table)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hotspots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geometry GEOMETRY(Point, 4326) NOT NULL,
    acq_date DATE NOT NULL,
    acq_time TEXT NOT NULL,
    satellite TEXT NOT NULL,
    instrument instrument_type NOT NULL,
    confidence TEXT NOT NULL,
    frp NUMERIC,
    bright_ti4 NUMERIC,
    daynight day_night NOT NULL,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_hotspots_dedup UNIQUE (latitude, longitude, acq_date, acq_time, instrument, satellite)
);

-- ----------------------------------------------------------------------------
-- 4. classified_events (Inference output linking hotspot to facility & AI classes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classified_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotspot_id UUID NOT NULL REFERENCES hotspots(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    primary_class primary_class NOT NULL,
    sub_class sub_class NOT NULL,
    land_cover_type land_cover_type,
    distance_to_facility_m NUMERIC,
    recurrence_count_90d INTEGER DEFAULT 0,
    z_score_frp NUMERIC,
    confidence_score NUMERIC(4, 3) NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    model_version TEXT NOT NULL,
    is_anomalous BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. facility_baselines (Rolling statistical baselines per facility)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facility_baselines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL UNIQUE REFERENCES facilities(id) ON DELETE CASCADE,
    avg_daily_detections NUMERIC NOT NULL DEFAULT 0,
    avg_frp NUMERIC NOT NULL DEFAULT 0,
    std_dev_frp NUMERIC NOT NULL DEFAULT 0,
    window_start DATE NOT NULL,
    window_end DATE NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. alerts (Real-time push notifications for high-priority/anomalous events)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classified_event_id UUID NOT NULL REFERENCES classified_events(id) ON DELETE CASCADE,
    severity alert_severity NOT NULL,
    status alert_status NOT NULL DEFAULT 'new',
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- 7. feedback (Human-in-the-loop analyst feedback for model retraining)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classified_event_id UUID NOT NULL REFERENCES classified_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    corrected_label TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Spatial Indexes (GiST)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_facilities_geometry ON facilities USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_hotspots_geometry ON hotspots USING GIST (geometry);

-- ----------------------------------------------------------------------------
-- Standard B-Tree Indexes for High-Frequency Query Paths
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_facilities_type ON facilities(facility_type);
CREATE INDEX IF NOT EXISTS idx_facilities_state_district ON facilities(state, district);

CREATE INDEX IF NOT EXISTS idx_hotspots_acq_date ON hotspots(acq_date);
CREATE INDEX IF NOT EXISTS idx_hotspots_satellite_instrument ON hotspots(satellite, instrument);
CREATE INDEX IF NOT EXISTS idx_hotspots_ingested_at ON hotspots(ingested_at);

CREATE INDEX IF NOT EXISTS idx_classified_events_hotspot_id ON classified_events(hotspot_id);
CREATE INDEX IF NOT EXISTS idx_classified_events_facility_id ON classified_events(facility_id);
CREATE INDEX IF NOT EXISTS idx_classified_events_primary_class ON classified_events(primary_class);
CREATE INDEX IF NOT EXISTS idx_classified_events_sub_class ON classified_events(sub_class);
CREATE INDEX IF NOT EXISTS idx_classified_events_is_anomalous ON classified_events(is_anomalous);
CREATE INDEX IF NOT EXISTS idx_classified_events_created_at ON classified_events(created_at);

CREATE INDEX IF NOT EXISTS idx_alerts_severity_status ON alerts(severity, status);
CREATE INDEX IF NOT EXISTS idx_alerts_sent_at ON alerts(sent_at);

CREATE INDEX IF NOT EXISTS idx_feedback_event_id ON feedback(classified_event_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- ----------------------------------------------------------------------------
-- Hotspot Point Geometry Synchronization Trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_hotspot_geometry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geometry := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hotspots_set_geometry ON hotspots;
CREATE TRIGGER trg_hotspots_set_geometry
BEFORE INSERT OR UPDATE OF latitude, longitude ON hotspots
FOR EACH ROW
EXECUTE FUNCTION set_hotspot_geometry();
