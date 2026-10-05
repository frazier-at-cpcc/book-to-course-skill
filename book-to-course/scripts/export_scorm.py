#!/usr/bin/env python3
"""Export a built course as SCORM packages, one zip per chapter, for upload to an LMS (Moodle, Canvas,
Blackboard, Brightspace/D2L, Cornerstone, …).

Usage:  export_scorm.py COURSE_DIR [-o OUT_DIR] [--scorm 1.2|2004] [--chapters ID,ID…]

Reads   course/data.js (run build_course.py first) and the player from the skill's assets/template/
Writes  OUT_DIR/<NN>-<chapter-id>.zip  (default OUT_DIR: <course-dir>-scorm/ next to the course folder)

Each zip is one SCO: imsmanifest.xml + index.html + assets/ + course/data.js holding only that chapter's
lessons and glossary terms. Inside the LMS the player stores the learner's progress in cmi.suspend_data,
reports completion when every lesson of the chapter is finished, and reports the chapter test's best
score as the SCORM score (passed once the test is passed). serve.py, start.* and exercises/ are not
included: unit-test exercises still show their starter files, tests and command, but the learner runs
the tests on their own computer and marks the exercise as passed.

--scorm 1.2 (default) is accepted by practically every LMS; use 2004 when the LMS prefers it
(separate completion and success status, scaled score, progress measure, 64 KB of suspend data
instead of 4 KB).
"""
import argparse
import copy
import datetime
import json
import os
import re
import sys
import zipfile
from xml.sax.saxutils import escape, quoteattr

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(os.path.dirname(HERE), "assets", "template")
PLAYER_FILES = ["index.html", "assets/app.js", "assets/style.css"]
PREFIX = "window.COURSE = "

MANIFEST_12 = """<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier={ident} version="1.0"
    xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
    xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG-1">
    <organization identifier="ORG-1">
      <title>{title}</title>
      <item identifier="ITEM-1" identifierref="RES-1" isvisible="true">
        <title>{title}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES-1" type="webcontent" adlcp:scormtype="sco" href="index.html">
{files}
    </resource>
  </resources>
</manifest>
"""

MANIFEST_2004 = """<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier={ident} version="1.0"
    xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
    xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
    xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
    xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
    xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 3rd Edition</schemaversion>
  </metadata>
  <organizations default="ORG-1">
    <organization identifier="ORG-1">
      <title>{title}</title>
      <item identifier="ITEM-1" identifierref="RES-1" isvisible="true">
        <title>{title}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES-1" type="webcontent" adlcp:scormType="sco" href="index.html">
{files}
    </resource>
  </resources>
</manifest>
"""


def load_course(root):
    path = os.path.join(root, "course", "data.js")
    try:
        with open(path, encoding="utf-8") as f:
            js = f.read().strip()
    except OSError:
        sys.exit("course/data.js missing — run build_course.py first.")
    if not js.startswith(PREFIX):
        sys.exit("course/data.js has an unexpected format — rerun build_course.py.")
    return json.loads(js[len(PREFIX):].rstrip(";"))


def to_js(data):
    # same escaping as build_course.py, so the bundle can never close the <script> tag early
    return PREFIX + json.dumps(data, ensure_ascii=False).replace("</", "<\\/").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029") + ";\n"


def xml_id(s):
    s = re.sub(r"[^A-Za-z0-9_.-]+", "-", s).strip("-")
    return s if re.match(r"^[A-Za-z_]", s) else "c-" + s


def chapter_package(data, ci, version):
    """Course data reduced to chapter ci, with its original number kept for headings."""
    ch = dict(data["chapters"][ci], number=ci + 1)
    ids = set(ch["lessons"])
    meta = copy.deepcopy(data["meta"])
    label = data["ui"].get("chOf", "Chapter {0}").replace("{0}", str(ci + 1))
    meta.update(id="%s-%s" % (meta["id"], ch["id"]),          # separate browser storage per package
                course_title=meta.get("title", ""),
                subtitle="%s · %s" % (label, ch["title"]),
                description=ch.get("summary") or meta.get("description", ""),
                scorm={"version": version, "chapter": ch["id"]},
                exported_at=datetime.datetime.now().astimezone().isoformat(timespec="seconds"))
    out = {"meta": meta, "ui": data["ui"], "chapters": [ch],
           "lessons": {k: v for k, v in data["lessons"].items() if k in ids},
           "glossary": [g for g in data.get("glossary", []) if g.get("lesson") in ids]}
    title = "%s · %s: %s" % (data["meta"].get("title", ""), label, ch["title"])
    return out, title


def write_zip(path, data, title, version):
    js = to_js(data)
    names = PLAYER_FILES + ["course/data.js"]
    files = "\n".join("      <file href=%s/>" % quoteattr(n) for n in names)
    tpl = MANIFEST_2004 if version == "2004" else MANIFEST_12
    manifest = tpl.format(ident=quoteattr(xml_id(data["meta"]["id"])), title=escape(title), files=files)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("imsmanifest.xml", manifest)       # must sit at the root of the zip
        for rel in PLAYER_FILES:
            z.write(os.path.join(TEMPLATE, rel), rel)
        z.writestr("course/data.js", js)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("course_dir")
    ap.add_argument("-o", "--out-dir")
    ap.add_argument("--scorm", choices=["1.2", "2004"], default="1.2", help="SCORM version (default 1.2)")
    ap.add_argument("--chapters", help="comma-separated chapter ids to export (default: every built chapter)")
    a = ap.parse_args()
    root = os.path.abspath(a.course_dir)
    data = load_course(root)
    chapters = data.get("chapters") or []
    if not chapters:
        sys.exit("The course has no built chapters yet.")
    wanted = None
    if a.chapters:
        wanted = [c.strip() for c in a.chapters.split(",") if c.strip()]
        unknown = sorted(set(wanted) - {c["id"] for c in chapters})
        if unknown:
            sys.exit("Unknown chapter id(s): %s (built: %s)" % (", ".join(unknown), ", ".join(c["id"] for c in chapters)))
    out_dir = os.path.abspath(a.out_dir or root.rstrip(os.sep) + "-scorm")
    os.makedirs(out_dir, exist_ok=True)

    print("SCORM %s packages → %s" % (a.scorm, out_dir))
    for ci, ch in enumerate(chapters):
        if wanted is not None and ch["id"] not in wanted:
            continue
        pkg, title = chapter_package(data, ci, a.scorm)
        path = os.path.join(out_dir, "%02d-%s.zip" % (ci + 1, ch["id"]))
        write_zip(path, pkg, title, a.scorm)
        lessons = [pkg["lessons"][i] for i in ch["lessons"]]
        has_test = any(l.get("kind") == "test" for l in lessons)
        tests_ex = sum(1 for l in lessons for b in l["blocks"] if b.get("type") == "exercise" and b.get("mode") == "tests")
        notes = []
        if not has_test:
            notes.append("no chapter test, so no score is reported; completion only")
        if tests_ex:
            notes.append("%d unit-test exercise(s) are run by the learner locally inside an LMS" % tests_ex)
        size = os.path.getsize(path) // 1024
        print("  %-40s %3d lessons  %5d KB%s" % (os.path.basename(path), len(lessons), size,
                                               ("   (" + "; ".join(notes) + ")") if notes else ""))
        if a.scorm == "1.2" and len(json.dumps({"q": [b.get("id") for l in lessons for b in l["blocks"]]})) > 2500:
            print("    note: many interactive blocks; SCORM 1.2's 4 KB suspend_data may drop flashcard and per-question detail (completion and scores are kept). --scorm 2004 avoids this.")


if __name__ == "__main__":
    main()
