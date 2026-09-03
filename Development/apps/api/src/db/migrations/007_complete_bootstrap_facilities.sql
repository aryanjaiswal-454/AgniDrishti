-- Some early production databases contained only four of the original eight
-- curated fixtures. Migration 006 relabels fixtures that exist, but cannot
-- restore rows that were removed by an earlier cleanup. Ensure the complete
-- 24-record bootstrap registry is present before bulk OSM records are added.

INSERT INTO facilities (osm_id, name, facility_type, geometry, state, district, source, last_synced_at)
VALUES
  ('osm_way_10123456', 'Jamnagar Refinery Complex (Reliance)', 'refinery', ST_SetSRID(ST_MakePoint(69.8519, 22.3556), 4326), 'Gujarat', 'Jamnagar', 'bootstrap', NOW()),
  ('osm_way_20987654', 'Mathura Oil Refinery (IOCL)', 'refinery', ST_SetSRID(ST_MakePoint(77.6972, 27.4239), 4326), 'Uttar Pradesh', 'Mathura', 'bootstrap', NOW()),
  ('osm_way_30456789', 'Vindhyachal Super Thermal Power Station (NTPC)', 'power_plant', ST_SetSRID(ST_MakePoint(82.6644, 24.0984), 4326), 'Madhya Pradesh', 'Singrauli', 'bootstrap', NOW()),
  ('osm_way_40112233', 'Bokaro Steel Plant (SAIL)', 'steel', ST_SetSRID(ST_MakePoint(86.1511, 23.6693), 4326), 'Jharkhand', 'Bokaro', 'bootstrap', NOW()),
  ('osm_way_50998877', 'Bhilai Steel Plant (SAIL)', 'steel', ST_SetSRID(ST_MakePoint(81.3838, 21.1938), 4326), 'Chhattisgarh', 'Durg', 'bootstrap', NOW()),
  ('osm_way_60554433', 'Dahej LNG Terminal (Petronet LNG)', 'lng_terminal', ST_SetSRID(ST_MakePoint(72.5447, 21.7032), 4326), 'Gujarat', 'Bharuch', 'bootstrap', NOW()),
  ('osm_way_70223344', 'Jharia Open Cast Coal Mining Area', 'mining', ST_SetSRID(ST_MakePoint(86.4172, 23.7439), 4326), 'Jharkhand', 'Dhanbad', 'bootstrap', NOW()),
  ('osm_way_80667788', 'Haldia Petrochemicals Complex', 'petrochemical', ST_SetSRID(ST_MakePoint(88.0863, 22.0624), 4326), 'West Bengal', 'Purba Medinipur', 'bootstrap', NOW())
ON CONFLICT (osm_id) DO UPDATE SET
  name = EXCLUDED.name,
  facility_type = EXCLUDED.facility_type,
  geometry = EXCLUDED.geometry,
  state = EXCLUDED.state,
  district = EXCLUDED.district,
  source = 'bootstrap',
  last_synced_at = NOW();
