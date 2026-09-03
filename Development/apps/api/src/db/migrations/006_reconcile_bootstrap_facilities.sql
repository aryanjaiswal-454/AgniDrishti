-- Reconcile databases created by earlier seed-on-empty releases. Those
-- releases contained only eight fixtures, labelled them as OSM data, and did
-- not run the expanded curated bootstrap when facilities already existed.

UPDATE facilities
SET source = 'bootstrap', last_synced_at = NOW()
WHERE osm_id IN (
  'osm_way_10123456', 'osm_way_20987654', 'osm_way_30456789', 'osm_way_40112233',
  'osm_way_50998877', 'osm_way_60554433', 'osm_way_70223344', 'osm_way_80667788'
);

INSERT INTO facilities (osm_id, name, facility_type, geometry, state, district, source, last_synced_at)
VALUES
  ('bootstrap_facility_90112233', 'Bina Refinery', 'refinery', ST_SetSRID(ST_MakePoint(78.1551, 24.1848), 4326), 'Madhya Pradesh', 'Sagar', 'bootstrap', NOW()),
  ('bootstrap_facility_10022334', 'Panipat Refinery and Petrochemical Complex', 'refinery', ST_SetSRID(ST_MakePoint(76.9694, 29.3906), 4326), 'Haryana', 'Panipat', 'bootstrap', NOW()),
  ('bootstrap_facility_11033445', 'Kochi Refinery', 'refinery', ST_SetSRID(ST_MakePoint(76.2731, 9.9675), 4326), 'Kerala', 'Ernakulam', 'bootstrap', NOW()),
  ('bootstrap_facility_12044556', 'Paradip Refinery', 'refinery', ST_SetSRID(ST_MakePoint(86.6665, 20.3049), 4326), 'Odisha', 'Jagatsinghpur', 'bootstrap', NOW()),
  ('bootstrap_facility_13055667', 'Talcher Thermal Power Station', 'power_plant', ST_SetSRID(ST_MakePoint(85.2146, 20.9509), 4326), 'Odisha', 'Angul', 'bootstrap', NOW()),
  ('bootstrap_facility_14066778', 'Korba Super Thermal Power Plant', 'power_plant', ST_SetSRID(ST_MakePoint(82.6956, 22.3458), 4326), 'Chhattisgarh', 'Korba', 'bootstrap', NOW()),
  ('bootstrap_facility_15077889', 'Ramagundam Super Thermal Power Station', 'power_plant', ST_SetSRID(ST_MakePoint(79.4666, 18.7614), 4326), 'Telangana', 'Peddapalli', 'bootstrap', NOW()),
  ('bootstrap_facility_16088990', 'Rourkela Steel Plant', 'steel', ST_SetSRID(ST_MakePoint(84.8545, 22.2604), 4326), 'Odisha', 'Sundargarh', 'bootstrap', NOW()),
  ('bootstrap_facility_17099001', 'Visakhapatnam Steel Plant', 'steel', ST_SetSRID(ST_MakePoint(83.2098, 17.6816), 4326), 'Andhra Pradesh', 'Visakhapatnam', 'bootstrap', NOW()),
  ('bootstrap_facility_18100112', 'Kalinganagar Steel Complex', 'steel', ST_SetSRID(ST_MakePoint(86.1027, 20.9665), 4326), 'Odisha', 'Jajpur', 'bootstrap', NOW()),
  ('bootstrap_facility_19111223', 'Singrauli Coalfield', 'mining', ST_SetSRID(ST_MakePoint(82.4453, 24.1112), 4326), 'Madhya Pradesh', 'Singrauli', 'bootstrap', NOW()),
  ('bootstrap_facility_20122334', 'Neyveli Lignite Mine', 'mining', ST_SetSRID(ST_MakePoint(79.4861, 11.5469), 4326), 'Tamil Nadu', 'Cuddalore', 'bootstrap', NOW()),
  ('bootstrap_facility_21133445', 'Hazira LNG Terminal', 'lng_terminal', ST_SetSRID(ST_MakePoint(72.6475, 21.1209), 4326), 'Gujarat', 'Surat', 'bootstrap', NOW()),
  ('bootstrap_facility_22144556', 'Dhamra LNG Terminal', 'lng_terminal', ST_SetSRID(ST_MakePoint(86.9565, 20.8072), 4326), 'Odisha', 'Bhadrak', 'bootstrap', NOW()),
  ('bootstrap_facility_23155667', 'Mangalore Refinery and Petrochemicals', 'petrochemical', ST_SetSRID(ST_MakePoint(74.8661, 12.9695), 4326), 'Karnataka', 'Dakshina Kannada', 'bootstrap', NOW()),
  ('bootstrap_facility_24166778', 'Barauni Refinery', 'refinery', ST_SetSRID(ST_MakePoint(86.1259, 25.4187), 4326), 'Bihar', 'Begusarai', 'bootstrap', NOW())
ON CONFLICT (osm_id) DO UPDATE SET
  name = EXCLUDED.name,
  facility_type = EXCLUDED.facility_type,
  geometry = EXCLUDED.geometry,
  state = EXCLUDED.state,
  district = EXCLUDED.district,
  source = EXCLUDED.source,
  last_synced_at = NOW();
