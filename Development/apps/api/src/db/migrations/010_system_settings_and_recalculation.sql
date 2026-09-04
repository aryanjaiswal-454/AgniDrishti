-- Globally managed analyst policy. The singleton row is deliberately stored
-- in Postgres so every API instance and worker uses the same thresholds.
CREATE TABLE IF NOT EXISTS system_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    critical_frp_threshold NUMERIC NOT NULL DEFAULT 150 CHECK (critical_frp_threshold >= 0),
    anomaly_z_score_threshold NUMERIC NOT NULL DEFAULT 3 CHECK (anomaly_z_score_threshold >= 0),
    default_map_baselayer TEXT NOT NULL DEFAULT 'satellite'
        CHECK (default_map_baselayer IN ('dark', 'satellite', 'osm_tactical')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO system_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
