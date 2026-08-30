# Track B — Phase B1 facility matching

Run:

```powershell
python track_b/b1/track_b_b1_facility_matching.py --radius-m 5000
```

Outputs:

- `data/sample/processed/track_b_b1_facilities.geojson`: cleaned OSM facilities with stable `osm_{element_type}_{element_id}` identifiers, names, standardized types, and raw OSM tags.
- `data/sample/processed/track_b_b1_facility_matches.csv`: every FIRMS row plus `facility_id`, `facility_type`, `distance_to_facility_m`, match radius, and match flag.
- `data/sample/validation/track_b_b1_validation.json`: row-coverage, facility-category, CRS, and match-count validation.

Distances are calculated in a local azimuthal-equidistant CRS centred on the Thoothukudi pilot. The default radius is 5,000 m; detections outside it retain their hotspot row but have null facility ID/type/distance. OSM ways and relations are represented by the Overpass `center`, so distance is to the mapped feature centre rather than its polygon boundary.
