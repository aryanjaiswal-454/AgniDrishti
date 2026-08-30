import sys
from pathlib import Path

repo_root = Path("C:/Users/Lenovo/Downloads/AgniDrishti")
dev_root = repo_root / "Development"
classifier_dir = dev_root / "apps" / "classifier"

try:
    with open(classifier_dir / "main.py", "r", encoding="utf-8") as f:
        code = f.read()
    
    # Execute the specific path resolution code from main.py in a dummy context
    dummy_locals = {"__file__": str(classifier_dir / "main.py"), "os": __import__("os"), "Path": Path}
    for line in code.split('\n'):
        if line.startswith('_default_track_b ='):
            exec(line, dummy_locals)
            print("Evaluated _default_track_b:", dummy_locals["_default_track_b"])
            print("PASS | A. Track B contract path exists:", dummy_locals["_default_track_b"].exists())
            break
except Exception as e:
    print("FAIL | A.", str(e))
