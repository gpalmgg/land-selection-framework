"""Small helpers shared by the runner, the suites and the tools."""
import importlib.util
import json
from pathlib import Path

E2E = Path(__file__).resolve().parent.parent


def load_path(name, path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def load_tool(name):
    return load_path("lsf_tool_%s" % name, E2E / "tools" / ("%s.py" % name))


def read_json(path, default=None):
    try:
        return json.loads(Path(path).read_text("utf-8"))
    except Exception:
        return default


def write_json(path, obj):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, indent=2, sort_keys=False, default=str) + "\n", "utf-8")
