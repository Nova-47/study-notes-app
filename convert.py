#!/usr/bin/env python3
"""Convert data/<key>.json into data/<key>.js (window.QUIZ_DATA["<key>"] = {...};)
so the app works via file:// without needing a local server."""
import json
import sys
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
SUBJECT_KEYS = ["ai", "computer_network", "embedded", "info_security", "programming_language", "soft_engineering"]
FINAL_KEYS = [f"final_{k}" for k in SUBJECT_KEYS]
SUMMARY_KEYS = [f"summary_{k}" for k in ["ai", "computer_network"]]
KEYS = SUBJECT_KEYS + FINAL_KEYS + SUMMARY_KEYS

def convert(key):
    json_path = DATA_DIR / f"{key}.json"
    js_path = DATA_DIR / f"{key}.js"
    if not json_path.exists():
        print(f"skip {key}: no json yet")
        return False
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)
    is_summary = key.startswith("summary_")
    global_var = "SUMMARY_DATA" if is_summary else "QUIZ_DATA"
    data_key = key[len("summary_"):] if is_summary else key
    js_content = (
        f"window.{global_var} = window.{global_var} || {{}};\n"
        f"window.{global_var}[{json.dumps(data_key)}] = "
        + json.dumps(data, ensure_ascii=False, indent=None)
        + ";\n"
    )
    js_path.write_text(js_content, encoding="utf-8")
    if is_summary:
        print(f"{key}: chapters={len(data.get('chapters', []))}")
    else:
        n_ox = sum(len(c.get("ox", [])) for c in data.get("chapters", []))
        n_mcq = sum(len(c.get("mcq", [])) for c in data.get("chapters", []))
        n_short = sum(len(c.get("short", [])) for c in data.get("chapters", []))
        print(f"{key}: chapters={len(data.get('chapters', []))} ox={n_ox} mcq={n_mcq} short={n_short}")
    return True

if __name__ == "__main__":
    targets = sys.argv[1:] or KEYS
    for k in targets:
        convert(k)
