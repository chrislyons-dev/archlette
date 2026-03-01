"""
MkDocs hooks — copy root docs into docs/ before each build.

These files are gitignored in docs/ (generated artifacts).
They are sourced from the repo root on every mkdocs serve/build.
"""

import os
import shutil


_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DOCS = os.path.join(_ROOT, "docs")

_FILES = [
    "CONTRIBUTING.md",
    "CHANGELOG.md",
    "THIRD-PARTY-NOTICES.md",
]


def on_pre_build(config):
    for filename in _FILES:
        src = os.path.join(_ROOT, filename)
        dst = os.path.join(_DOCS, filename)
        if os.path.exists(src):
            shutil.copy2(src, dst)
