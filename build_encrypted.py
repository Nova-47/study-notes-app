#!/usr/bin/env python3
"""Bundle all data/*.json into one JSON blob and encrypt it with AES-256-GCM
(password-derived key via PBKDF2-SHA256), matching the Web Crypto API params
used by app.js's password-gate decryption. Output: data/bundle.enc.js
"""
import json
import os
import base64
import sys
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

DATA_DIR = Path(__file__).parent / "data"
SUBJECT_KEYS = ["ai", "computer_network", "embedded", "info_security", "programming_language", "soft_engineering"]
FINAL_KEYS = [f"final_{k}" for k in SUBJECT_KEYS]
SUMMARY_KEYS = SUBJECT_KEYS

PBKDF2_ITERATIONS = 200_000

def load(key, default=None):
    p = DATA_DIR / f"{key}.json"
    if not p.exists():
        return default
    with open(p, encoding="utf-8") as f:
        return json.load(f)

def build_bundle():
    quiz = {}
    for k in SUBJECT_KEYS + FINAL_KEYS:
        quiz[k] = load(k, {"subjectKey": k, "subjectName": k, "chapters": []})
    summary = {}
    for k in SUMMARY_KEYS:
        summary[k] = load(f"summary_{k}", {"subjectKey": k, "subjectName": k, "chapters": []})
    return {"quiz": quiz, "summary": summary}

def encrypt(password: str, plaintext: bytes):
    salt = os.urandom(16)
    iv = os.urandom(12)
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=PBKDF2_ITERATIONS)
    key = kdf.derive(password.encode("utf-8"))
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(iv, plaintext, None)  # tag appended automatically
    return salt, iv, ciphertext

def main():
    if len(sys.argv) < 2:
        print("usage: build_encrypted.py <password>")
        sys.exit(1)
    password = sys.argv[1]

    bundle = build_bundle()
    plaintext = json.dumps(bundle, ensure_ascii=False).encode("utf-8")
    salt, iv, ciphertext = encrypt(password, plaintext)

    out = {
        "salt": base64.b64encode(salt).decode(),
        "iv": base64.b64encode(iv).decode(),
        "cipher": base64.b64encode(ciphertext).decode(),
        "iterations": PBKDF2_ITERATIONS,
    }
    js = "window.ENCRYPTED_BUNDLE = " + json.dumps(out) + ";\n"
    out_path = DATA_DIR / "bundle.enc.js"
    out_path.write_text(js, encoding="utf-8")
    print(f"wrote {out_path} ({out_path.stat().st_size} bytes), plaintext was {len(plaintext)} bytes")

if __name__ == "__main__":
    main()
