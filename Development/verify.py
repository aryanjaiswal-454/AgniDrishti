import sys
from pathlib import Path

repo_root = Path("C:/Users/Lenovo/Downloads/AgniDrishti")
dev_root = repo_root / "Development"
classifier_dir = dev_root / "apps" / "classifier"

sys.path.insert(0, str(classifier_dir))

def print_result(name, result, context=""):
    status = "PASS" if result else "FAIL"
    print(f"{status} | {name}" + (f" ({context})" if context else ""))

try:
    import main
    track_b_path = main.TRACK_B_CONTRACT_PATH
    print_result("A. Track B contract path exists", track_b_path.exists(), str(track_b_path))
except Exception as e:
    print_result("A. Track B contract path exists", False, str(e))

try:
    import track_a_integration
    wc_dir = track_a_integration.WORLDCOVER_DIR
    wc_exists = wc_dir.exists() and wc_dir.is_dir()
    print_result("B. WorldCover directory exists", wc_exists, str(wc_dir))
    
    tifs = list(wc_dir.glob("*.tif")) if wc_exists else []
    print_result("C. At least one expected .tif file is found", len(tifs) > 0, f"Found {len(tifs)}")
except Exception as e:
    print_result("B. WorldCover directory exists", False, str(e))
    print_result("C. At least one expected .tif file is found", False, str(e))

try:
    model_path = repo_root / "data" / "sample" / "models" / "track_a_ml_v1_0.joblib"
    print_result("D. Track A model exists", model_path.exists(), str(model_path))
except Exception as e:
    print_result("D. Track A model exists", False, str(e))

try:
    from fastapi import FastAPI
    import track_b_integration
    import merge_logic
    print_result("E. Python imports for the classifier succeed", True)
except Exception as e:
    print_result("E. Python imports for the classifier succeed", False, str(e))

try:
    from track_a_integration import classify_track_a, TRACK_A_AVAILABLE
    print_result("F. Classifier can import the completed Track A handoff", TRACK_A_AVAILABLE and classify_track_a is not None)
except Exception as e:
    print_result("F. Classifier can import the completed Track A handoff", False, repr(e))

try:
    if main.TRACK_B_CONTRACT_PATH.exists():
        print_result("G. The classifier test can now locate Track B", True, "main module path resolved properly")
    else:
        print_result("G. The classifier test can now locate Track B", False)
except Exception as e:
    print_result("G. The classifier test can now locate Track B", False, str(e))
