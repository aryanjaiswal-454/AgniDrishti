-- OSM contains many valid industrial geometries without a `name` tag.
-- Give them stable, searchable display names without overwriting real names.
UPDATE facilities
SET name = CONCAT(
  'OSM ',
  CASE facility_type
    WHEN 'refinery' THEN 'Refinery'
    WHEN 'power_plant' THEN 'Thermal Power Plant'
    WHEN 'steel' THEN 'Steel Facility'
    WHEN 'mining' THEN 'Mining Site'
    WHEN 'lng_terminal' THEN 'LNG Terminal'
    WHEN 'petrochemical' THEN 'Petrochemical Facility'
    ELSE 'Industrial Facility'
  END,
  ' (', osm_id, ')'
)
WHERE source = 'osm_bulk'
  AND (name IS NULL OR BTRIM(name) = '');
