#!/usr/bin/env python3
"""Check that every programming exercise is fair: tests FAIL on the starter files and PASS on the reference solution.

Usage:  verify_exercises.py COURSE_DIR [--only DIR_NAME ...] [--keep]

For each exercises/<dir>/exercise.json:
  1. copy the exercise to a temp folder WITHOUT _solution/ and run the test command → must fail (exit ≠ 0)
  2. overlay the files from _solution/ and run again → must pass (exit 0)
A broken test or an unsolvable exercise is much worse for a learner than a missing one, so run this before delivering.
Exit code 1 if anything is wrong. Exercises whose toolchain isn't installed are reported as SKIPPED (not verified!).
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile


def run(cmd, cwd, timeout):
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1", CI="1")
    try:
        p = subprocess.run(cmd, cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=timeout, stdin=subprocess.DEVNULL)
        return p.returncode, p.stdout.decode("utf-8", "replace")
    except subprocess.TimeoutExpired:
        return -1, "TIMEOUT after %ss" % timeout


def tail(s, n=25):
    return "\n".join("      " + l for l in s.strip().splitlines()[-n:])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("course_dir")
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--keep", action="store_true", help="keep temp folders for inspection")
    a = ap.parse_args()
    ex_root = os.path.join(os.path.abspath(a.course_dir), "exercises")
    if not os.path.isdir(ex_root):
        print("No exercises/ folder — nothing to verify.")
        return
    names = sorted(d for d in os.listdir(ex_root) if os.path.exists(os.path.join(ex_root, d, "exercise.json")))
    if a.only:
        names = [n for n in names if n in a.only]
    bad = skipped = ok = 0
    for n in names:
        src = os.path.join(ex_root, n)
        cfg = json.load(open(os.path.join(src, "exercise.json"), encoding="utf-8"))
        cmd, timeout = cfg["command"], min(int(cfg.get("timeout", 60)), 300)
        if shutil.which(cmd[0]) is None:
            print("SKIP  %-22s toolchain '%s' not installed — NOT verified" % (n, cmd[0]))
            skipped += 1
            continue
        sol = os.path.join(src, "_solution")
        if not os.path.isdir(sol):
            print("FAIL  %-22s no _solution/ folder" % n)
            bad += 1
            continue
        tmp = tempfile.mkdtemp(prefix="ex-%s-" % n)
        work = os.path.join(tmp, n)
        shutil.copytree(src, work, ignore=shutil.ignore_patterns("_solution", "__pycache__", "node_modules"))
        code, out = run(cmd, work, timeout)
        problems = []
        if code == 0:
            problems.append("tests already PASS on the starter files — the exercise is trivially solved or the tests are too weak")
            problems.append(tail(out, 8))
        elif code == 127 or any(m in out.lower() for m in ("no tests to run", "collected 0 items", "no module named", "command not found", "ran 0 tests", "no test files")):
            problems.append("starter run did not execute real tests:\n" + tail(out, 8))
        starter_out = out
        for base, _, fs in os.walk(sol):
            for fn in fs:
                rel = os.path.relpath(os.path.join(base, fn), sol)
                dst = os.path.join(work, rel)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copyfile(os.path.join(base, fn), dst)
        code2, out2 = run(cmd, work, timeout)
        if code2 != 0:
            problems.append("tests FAIL on the reference solution (exit %s):\n%s" % (code2, tail(out2)))
        if problems:
            bad += 1
            print("FAIL  %-22s" % n)
            for p in problems:
                print("    - " + p)
        else:
            ok += 1
            first_fail = [l for l in starter_out.splitlines() if "FAIL" in l or "Error" in l or "error" in l][:1]
            print("OK    %-22s fails on starter, passes on solution%s" % (n, ("   (starter: %s)" % first_fail[0].strip()[:70]) if first_fail else ""))
        if not a.keep:
            shutil.rmtree(tmp, ignore_errors=True)
    print("\n%d ok, %d failed, %d skipped" % (ok, bad, skipped))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
