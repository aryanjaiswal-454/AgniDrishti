-- Re-evaluate historic facility associations after facility imports.
-- Only facilities within the 5 km Track B association threshold are linked;
-- events farther away remain unlinked so natural events are not mislabelled.
WITH nearest_facility AS (
  SELECT
    ce.id AS classified_event_id,
    nearest.id AS facility_id,
    nearest.distance_m
  FROM classified_events ce
  JOIN hotspots h ON h.id = ce.hotspot_id
  CROSS JOIN LATERAL (
    SELECT
      f.id,
      ST_Distance(f.geometry::geography, h.geometry::geography) AS distance_m
    FROM facilities f
    ORDER BY ST_Distance(f.geometry::geography, h.geometry::geography), f.id
    LIMIT 1
  ) nearest
)
UPDATE classified_events ce
SET
  facility_id = CASE WHEN nearest.distance_m <= 5000 THEN nearest.facility_id ELSE NULL END,
  distance_to_facility_m = CASE WHEN nearest.distance_m <= 5000 THEN nearest.distance_m ELSE NULL END
FROM nearest_facility nearest
WHERE ce.id = nearest.classified_event_id
  AND (
    ce.facility_id IS DISTINCT FROM CASE WHEN nearest.distance_m <= 5000 THEN nearest.facility_id ELSE NULL END
    OR ce.distance_to_facility_m IS DISTINCT FROM CASE WHEN nearest.distance_m <= 5000 THEN nearest.distance_m ELSE NULL END
  );
