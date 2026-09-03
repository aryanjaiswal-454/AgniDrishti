-- Migration to wipe the static data seeded originally for demo purposes.
-- Targeting specific static data (acq_date = '2026-08-28').

DELETE FROM alerts 
WHERE classified_event_id IN (
  SELECT id FROM classified_events 
  WHERE hotspot_id IN (
    SELECT id FROM hotspots WHERE acq_date = '2026-08-28'
  )
);

DELETE FROM feedback
WHERE classified_event_id IN (
  SELECT id FROM classified_events 
  WHERE hotspot_id IN (
    SELECT id FROM hotspots WHERE acq_date = '2026-08-28'
  )
);

DELETE FROM classified_events 
WHERE hotspot_id IN (
  SELECT id FROM hotspots WHERE acq_date = '2026-08-28'
);

DELETE FROM hotspots WHERE acq_date = '2026-08-28';
