"""
Test the classifier service basic functionality.
"""

import sys
from pathlib import Path

# Add apps/classifier to path
sys.path.insert(0, str(Path(__file__).parent))

from track_b_integration import load_track_b_results, get_track_b_result
from merge_logic import merge_track_results


def test_track_b_loading():
    """Test loading Track B results."""
    print("Testing Track B result loading...")

    # Path to Track B contract file
    track_b_path = Path(__file__).parents[2] / "data" / "sample" / "processed" / "track_b_b4_contract_ready.jsonl"

    if not track_b_path.exists():
        print(f"❌ Track B file not found: {track_b_path}")
        return False

    results = load_track_b_results(track_b_path)

    if not results:
        print("❌ No Track B results loaded")
        return False

    print(f"✅ Loaded {len(results)} Track B results")

    # Test lookup
    first_hotspot_id = list(results.keys())[0]
    result = get_track_b_result(first_hotspot_id, track_b_path)

    if result:
        print(f"✅ Successfully retrieved result for {first_hotspot_id}")
        print(f"   - sub_class: {result.get('sub_class')}")
        print(f"   - facility_id: {result.get('facility_id')}")
        print(f"   - is_anomalous: {result.get('is_anomalous')}")
        return True
    else:
        print(f"❌ Failed to retrieve result for {first_hotspot_id}")
        return False


def test_merge_logic():
    """Test merge logic."""
    print("\nTesting merge logic...")

    # Mock Track A result
    track_a_result = {
        "hotspot_id": "test_001",
        "latitude": 8.86,
        "longitude": 78.15,
        "primary_class": "natural",
        "sub_class": "forest_fire",
        "land_cover_type": "forest",
        "facility_id": None,
        "distance_to_facility_m": None,
        "recurrence_count_90d": None,
        "z_score_frp": None,
        "is_anomalous": None,
        "confidence_score": 0.85,
        "model_version": "track_a_ml_v1.0"
    }

    # Mock Track B result
    track_b_result = {
        "hotspot_id": "test_001",
        "latitude": 8.86,
        "longitude": 78.15,
        "primary_class": None,
        "sub_class": None,
        "land_cover_type": None,
        "facility_id": None,
        "distance_to_facility_m": None,
        "recurrence_count_90d": 0,
        "z_score_frp": None,
        "is_anomalous": False,
        "confidence_score": None,
        "model_version": "track_b_b3_rules_v1_rule_based"
    }

    merged = merge_track_results(
        hotspot_id="test_001",
        latitude=8.86,
        longitude=78.15,
        track_a_result=track_a_result,
        track_b_result=track_b_result
    )

    print(f"✅ Merged result:")
    print(f"   - primary_class: {merged.get('primary_class')}")
    print(f"   - sub_class: {merged.get('sub_class')}")
    print(f"   - land_cover_type: {merged.get('land_cover_type')}")
    print(f"   - model_version: {merged.get('model_version')}")

    return True


if __name__ == "__main__":
    print("=" * 60)
    print("AgniDrishti Classifier Service - Basic Tests")
    print("=" * 60)

    success = True

    try:
        success = test_track_b_loading() and success
        success = test_merge_logic() and success
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        success = False

    print("\n" + "=" * 60)
    if success:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed")
    print("=" * 60)

    sys.exit(0 if success else 1)
