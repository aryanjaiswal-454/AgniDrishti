-- Backfill only historical classified events that predate the live Track B
-- calculation. Prefer a 90-day local hotspot history; when it has no spread,
-- fall back to the facility baseline captured during seeding/operations.
-- The WHERE clause makes this migration idempotent and preserves existing
-- model results.
WITH backfill AS (
  SELECT
    ce.id,
    history.recurrence_count,
    CASE
      WHEN history.std_dev_frp > 0
        THEN (h.frp - history.avg_frp) / history.std_dev_frp
      WHEN fb.std_dev_frp > 0
        THEN (h.frp - fb.avg_frp) / fb.std_dev_frp
      WHEN COALESCE(history.avg_frp, fb.avg_frp) > 0
           AND h.frp > COALESCE(history.avg_frp, fb.avg_frp) * 1.5
        THEN 3.0
      ELSE NULL
    END AS z_score_frp
  FROM classified_events ce
  JOIN hotspots h ON h.id = ce.hotspot_id
  LEFT JOIN facility_baselines fb ON fb.facility_id = ce.facility_id
  LEFT JOIN LATERAL (
    SELECT
      COUNT(historical.id)::INTEGER AS recurrence_count,
      AVG(historical.frp)::NUMERIC AS avg_frp,
      STDDEV_POP(historical.frp)::NUMERIC AS std_dev_frp
    FROM hotspots historical
    WHERE historical.frp IS NOT NULL
      AND historical.id <> h.id
      AND ST_DWithin(historical.geometry::geography, h.geometry::geography, 5000)
      AND historical.acq_date >= h.acq_date - INTERVAL '90 days'
      AND historical.acq_date <= h.acq_date
  ) history ON TRUE
  WHERE ce.facility_id IS NOT NULL
    AND ce.z_score_frp IS NULL
    AND h.frp IS NOT NULL
)
UPDATE classified_events ce
SET
  recurrence_count_90d = backfill.recurrence_count,
  z_score_frp = backfill.z_score_frp
FROM backfill
WHERE ce.id = backfill.id
  AND backfill.z_score_frp IS NOT NULL;
