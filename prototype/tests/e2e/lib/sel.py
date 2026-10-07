"""Load selectors/<component>.py by file path (the selectors/ directory is deliberately NOT a package)."""
import importlib.util
from pathlib import Path

_DIR = Path(__file__).resolve().parent.parent / "selectors"


def load(component="home"):
    path = _DIR / ("%s.py" % component)
    spec = importlib.util.spec_from_file_location("lsf_selectors_%s" % component, str(path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def home():
    return load("home")
