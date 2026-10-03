#!/usr/bin/env python3
"""Zip a course folder so it can be downloaded, moved, or continued in a later conversation.

Usage:  pack_course.py COURSE_DIR [-o OUT.zip] [--share] [--with-progress]

Default package = everything needed to learn AND to continue building (includes .build/ with state and extracted text),
but NOT progress/ — unzipping a newer package over an old folder must never overwrite the learner's progress.
  --share          learner-only package: leaves out .build/ (smaller, no source text of the book)
  --with-progress  include progress/progress.json (e.g. moving the course to another computer)
"""
import argparse
import os
import sys
import zipfile


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("course_dir")
    ap.add_argument("-o", "--output")
    ap.add_argument("--share", action="store_true")
    ap.add_argument("--with-progress", action="store_true")
    a = ap.parse_args()
    root = os.path.abspath(a.course_dir)
    if not os.path.exists(os.path.join(root, "course", "data.js")):
        sys.exit("course/data.js missing — run build_course.py first.")
    name = os.path.basename(root.rstrip(os.sep))
    out = a.output or os.path.join(os.path.dirname(root), name + (".learner" if a.share else "") + ".zip")
    n = 0
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for base, dirs, files in os.walk(root):
            rel_base = os.path.relpath(base, root)
            dirs[:] = [d for d in dirs if d not in ("__pycache__", "node_modules", ".git") and not (d == ".build" and a.share and rel_base == ".")
                       and not (d == "progress" and not a.with_progress and rel_base == ".")]
            for fn in files:
                if fn in (".DS_Store",) or fn.endswith((".pyc", ".tmp")):
                    continue
                full = os.path.join(base, fn)
                if os.path.abspath(full) == os.path.abspath(out):
                    continue
                z.write(full, os.path.join(name, os.path.relpath(full, root)))
                n += 1
    print("Packed %d files → %s (%d KB)" % (n, out, os.path.getsize(out) // 1024))


if __name__ == "__main__":
    main()
