#!/usr/bin/env python3
"""Track where the course build stands, so work can stop and resume (even in a new conversation).

Usage:
  course_state.py DIR status                       overview + notes + next chapter (run this first when resuming)
  course_state.py DIR next                         prints the id of the next chapter to write, or DONE
  course_state.py DIR set CH_ID STATUS [--note T]  STATUS: pending | in_progress | done | skipped
  course_state.py DIR note "text"                  remember a decision (terminology, style, running example…) for later batches
  course_state.py DIR log "text"                   append to the history

State lives in DIR/.build/state.json.
"""
import argparse
import datetime
import json
import os
import sys

STATUSES = ("pending", "in_progress", "done", "skipped")


def now():
    return datetime.datetime.now().astimezone().isoformat(timespec="seconds")


def load(d):
    p = os.path.join(d, ".build", "state.json")
    if not os.path.exists(p):
        sys.exit("No .build/state.json in %s — not a course folder (run init_course.py first)." % d)
    return p, json.load(open(p, encoding="utf-8"))


def save(p, s):
    s["updated"] = now()
    tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(s, f, ensure_ascii=False, indent=2)
    os.replace(tmp, p)


def next_chapter(s):
    for c in s["chapters"]:
        if c["status"] == "in_progress":
            return c
    for c in s["chapters"]:
        if c["status"] == "pending":
            return c
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("dir")
    ap.add_argument("cmd", choices=["status", "next", "set", "note", "log"])
    ap.add_argument("args", nargs="*")
    ap.add_argument("--note")
    a = ap.parse_args()
    p, s = load(a.dir)

    if a.cmd == "status":
        b = s["book"]
        print("Book: %s — %s [%s, %s]   course language: %s" % (b.get("title"), b.get("author") or "?", b.get("format"), b.get("language"), s.get("ui_lang")))
        tw = sum(c["words"] for c in s["chapters"] if c["status"] != "skipped")
        dw = sum(c["words"] for c in s["chapters"] if c["status"] == "done")
        print("Progress: %d/%d chapters done (%d%% of source words)\n" % (sum(c["status"] == "done" for c in s["chapters"]), sum(c["status"] != "skipped" for c in s["chapters"]), round(100 * dw / tw) if tw else 0))
        for c in s["chapters"]:
            mark = {"done": "✔", "in_progress": "…", "pending": " ", "skipped": "–"}[c["status"]]
            print(" [%s] %-8s %-11s %6dw  lessons:%-2s  %s%s" % (mark, c["id"], c["status"], c["words"], c.get("lessons_built", 0), c["title"][:60], ("   // " + c["note"]) if c.get("note") else ""))
        if s["notes"]:
            print("\nNotes to keep consistent across batches:")
            for n in s["notes"]:
                print("  •", n)
        print("\nLast log entries:")
        for e in s["log"][-5:]:
            print("  %s  %s" % (e["at"], e["msg"]))
        nxt = next_chapter(s)
        print("\nNEXT:", ("%s — %s (%s)" % (nxt["id"], nxt["title"], nxt["status"])) if nxt else "DONE — all chapters written. Run build_course.py and verify_exercises.py, then deliver.")
    elif a.cmd == "next":
        nxt = next_chapter(s)
        print(nxt["id"] if nxt else "DONE")
    elif a.cmd == "set":
        if len(a.args) != 2 or a.args[1] not in STATUSES:
            sys.exit("usage: set CH_ID {%s} [--note T]" % "|".join(STATUSES))
        ch = next((c for c in s["chapters"] if c["id"] == a.args[0]), None)
        if not ch:
            sys.exit("unknown chapter id %s" % a.args[0])
        ch["status"] = a.args[1]
        if a.note is not None:
            ch["note"] = a.note
        s["log"].append({"at": now(), "msg": "%s → %s%s" % (ch["id"], ch["status"], (" (" + a.note + ")") if a.note else "")})
        save(p, s)
        print("%s → %s" % (ch["id"], ch["status"]))
    elif a.cmd in ("note", "log"):
        text = " ".join(a.args).strip()
        if not text:
            sys.exit("give some text")
        (s["notes"] if a.cmd == "note" else s["log"]).append(text if a.cmd == "note" else {"at": now(), "msg": text})
        save(p, s)
        print("saved")


if __name__ == "__main__":
    main()
