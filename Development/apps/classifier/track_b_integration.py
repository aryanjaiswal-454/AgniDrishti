"""
Track B Integration Module

Dynamically looks up facilities via Postgres and computes Anomaly Z-Score.
"""

import os
import logging
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import math

logger = logging.getLogger(__name__)

DB_URL = os.getenv("DATABASE_URL", "postgresql://agnidrishti:agnidrishti_dev@localhost:5432/agnidrishti")

def get_track_b_result(hotspot_id: str, jsonl_path=None) -> Optional[Dict[str, Any]]:
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get the hotspot
        cur.execute("SELECT frp, geom FROM hotspots WHERE id = %s", (hotspot_id,))
        hotspot_row = cur.fetchone()
        if not hotspot_row:
            cur.close()
            conn.close()
            return None
            
        frp = float(hotspot_row['frp']) if hotspot_row['frp'] is not None else 0.0
        geom = hotspot_row['geom']
        
        # 1. Facility match within 5km
        cur.execute("""
            SELECT id, name, facility_type, ST_Distance(geom::geography, %s::geography) as dist
            FROM osm_facilities
            WHERE ST_DWithin(geom::geography, %s::geography, 5000)
            ORDER BY dist ASC LIMIT 1
        """, (geom, geom))
        
        facility = cur.fetchone()
        
        # 2. 90-day historical z-score for the same facility or area!
        if facility:
            cur.execute("""
                SELECT frp
                FROM hotspots 
                WHERE ST_DWithin(geom::geography, %s::geography, 5000)
                AND acq_date >= NOW() - INTERVAL '90 days'
                AND id != %s
            """, (geom, hotspot_id))
            
            history = cur.fetchall()
            frps = [float(r['frp']) for r in history if r['frp'] is not None]
            
            recurrence_count = len(frps)
            z_score = None
            is_anomalous = False
            
            if recurrence_count > 0:
                mean = sum(frps) / recurrence_count
                variance = sum((x - mean) ** 2 for x in frps) / recurrence_count
                std_dev = math.sqrt(variance) if variance > 0 else 0
                
                if std_dev > 0:
                    z_score = (frp - mean) / std_dev
                    is_anomalous = bool(z_score > 3.0)
                elif frp > mean * 1.5:
                    is_anomalous = True
                    z_score = 3.0
                    
            sub_class = "industrial_fire" if is_anomalous else "gas_flare"
            
            result = {
                "hotspot_id": hotspot_id,
                "facility_id": facility['id'],
                "distance_to_facility_m": float(facility['dist']),
                "sub_class": sub_class,
                "is_anomalous": is_anomalous,
                "z_score_frp": z_score,
                "recurrence_count_90d": recurrence_count,
                "confidence_score": 0.95,
                "model_version": "v1.0.0-trackB-live"
            }
        else:
            # No facility match
            result = None
            
        cur.close()
        conn.close()
        return result
        
    except Exception as e:
        logger.error(f"Track B live computation failed: {e}", exc_info=True)
        return None
