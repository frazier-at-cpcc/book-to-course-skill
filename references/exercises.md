# Programming exercises that are checked by unit tests

Contents
- How it works for the learner
- Designing a good exercise
- Folder layout and exercise.json
- Pattern for programs that read input / print output
- Recipes per language (Go, Python, JavaScript, others)
- Verifying (mandatory)
- Self-check exercises (no tests)

## How it works for the learner
The lesson shows: goal, **what the program must do** (`behavior`), **input → expected output examples**, the starter files and
the tests (readable), the folder to work in (`exercises/<dir>/`) and the terminal command. The learner edits the starter files in
their own editor, runs the command (or presses "▶ Run tests" when the course is started through `start.sh`/`start.bat`) and
reads the failing assertions until everything passes. Hints and a reference solution are available in the page. The result
(passed / failing) is stored in `progress/progress.json`.

## Designing a good exercise
1. **One skill per exercise**, the one the lesson just taught. A beginner exercise is 3–15 lines of code. Difficulty `easy` (one concept, 5 min), `medium` (combines two, 10–15 min), `hard` (the chapter mini-project, 20–30 min).
2. **Specify behavior precisely** in `behavior`: signature or program contract, inputs, outputs, edge cases (empty input, negatives, ties). Tests must not check anything the text didn't promise.
3. **Examples in the page = examples in the tests** (at least the first two), so the learner can predict results.
4. **Starter code compiles and runs** but fails the tests (stubs return zero values, with a `TODO` comment). Compile errors on the starter scare beginners and hide the real failure message. Leave helpful comments and the function signature; do not leave the solution's structure out of reach.
5. **Failure messages teach**: write assertions as "for input X the program returned A but should return B" (in the course language). Name test cases descriptively ("liczby ujemne", "pusta lista").
6. **Test the behavior, not the implementation**: any correct solution must pass (e.g. don't require a specific loop style). Include 3–6 cases: typical, boundary, empty/zero, negative, tricky.
7. **Deterministic and offline**: no network, no randomness, no current time, no files outside the exercise folder, no dependency on environment variables, finishes in well under a second.
8. **No external packages**: use only the language's standard test tooling so the learner installs nothing extra beyond the language itself.
9. **Progression**: the first exercise of a chapter is a near-copy of a worked example; the last is a mini-project assembled from the chapter, possibly in several test groups so partial progress is visible.
10. Programs the book builds (CLI tools, small apps): split into a testable function plus a thin `main`, see below. The learner still runs the real program manually; the page shows the expected output.

## Folder layout and exercise.json
```
exercises/ch03-swap/
  exercise.json          ← config (not shown to learner, read by the page builder and serve.py)
  go.mod                 ← starter files (whatever the language needs)
  swap.go
  swap_test.go           ← tests (shown in the page; "tests" in exercise.json)
  _solution/
    swap.go              ← reference solution: files here OVERLAY the starter files
```
```json
{ "title": "Swap", "language": "go",
  "command": ["go", "test", "-count=1", "./..."],
  "timeout": 60,
  "starter": ["go.mod", "swap.go"],
  "tests": ["swap_test.go"] }
```
- `command` is a list (no shell). It runs with the exercise folder as working directory. Exit code 0 = passed.
- `starter` / `tests` list files relative to the folder (if `starter` is omitted, every other file except README is used).
- `_solution/` is excluded from the learner-visible starter files and from test discovery; it is shown only when they press "Show solution".
- In the lesson: `"exercise_dir": "ch03-swap"` (the folder name).
- Folder names: `<chapter>-<short-name>`, lowercase, no spaces.

## Pattern for programs that read input and print output
The learner's program should do something observable ("reads two numbers, prints their product"), but tests can't easily drive
a real terminal. Make the logic a function that takes an input reader/string and an output writer/returns a string; `main` only
connects it to stdin/stdout. Tests call that function with prepared input and compare the output text. The lesson's `examples` then
show the same input → output pairs, and the learner can also run the real program by hand.

Go:
```go
// Run reads two integers from in and writes their product and a newline to out.
func Run(in io.Reader, out io.Writer) { /* TODO */ }
func main() { Run(os.Stdin, os.Stdout) }
```
test: `var out bytes.Buffer; Run(strings.NewReader("3 4\n"), &out); if out.String() != "12\n" { t.Errorf(...) }`

Python: `def run(text): ...` returns the output string (or takes `input_fn`/`print_fn` parameters); `if __name__ == "__main__": print(run(sys.stdin.read()))`.
JavaScript: `module.exports = function run(inputText) { … return outputText; }` plus a small `if (require.main === module)` block that reads stdin.

Say in `behavior` exactly what is read and printed (format, trailing newline, separators).

## Recipes per language

**Go** (needs Go; works offline with the standard library)
- `go.mod` (`module ch03swap` + `go 1.21`), `*.go` starter, `*_test.go`; command `["go","test","-count=1","./..."]` (`-count=1` disables the cache). Use `package main` for both starter and test when the exercise has a `main`; `_solution` is ignored by `./...` because the folder starts with `_`.
- Table-driven tests with `t.Run(c.name, …)` give readable failures. Starter stubs: `return 0`, `return ""`, `return nil`.
- Make sure the starter has no unused imports/variables (compile error). Run `gofmt` over files.

**Python** (use `unittest`, not pytest — pytest isn't installed by default)
- `greet.py` starter with `raise NotImplementedError` (or `pass` + `return None`), `test_greet.py` with `unittest.TestCase`; command `["python3","-m","unittest","-v"]`. On Windows the learner may need `python` instead of `python3`; the page shows the command and the course README mentions it.
- Use `self.assertEqual(actual, expected, msg)` with a helpful message.

**JavaScript / Node** (Node ≥ 18): `sum.js` with `module.exports`, `sum.test.js` using `node:test` + `node:assert`; command `["node","--test","sum.test.js"]`.

**Other languages**: pick the standard test runner with zero dependencies — Rust `cargo test --offline`, Java single-file with a plain `main` that exits non-zero on failure, C/C++ a `test.c` compiled by `["sh","-c","cc -o t test.c sol.c && ./t"]` (shell commands are acceptable here because the command is fixed by you, never by the browser). SQL: run through Python `sqlite3` in a unittest. If no automated check is practical, use a self-check exercise.

## Verifying (mandatory)
```bash
python3 scripts/verify_exercises.py <course-dir>
```
For every exercise it copies the folder without `_solution`, runs `command` (must **fail**), overlays `_solution/` and runs again
(must **pass**). It catches: tests that already pass on the starter, tests that fail on your own solution, typos in file names,
compile errors, missing toolchain (reported as SKIPPED — then the exercise is unverified; say so in the final message and try
to avoid shipping unverified exercises). Fix every FAIL before delivering. Re-run after any edit to tests or solutions.
Also try one *alternative correct solution* mentally against the tests — if the tests would reject it, loosen them.

## Self-check exercises (no tests)
For books/chapters where automatic checking is not practical (design questions, writing, shell sessions, GUI steps, math):
omit `exercise_dir` and give `examples` (input → expected output or result), a `checklist` of observable conditions
("the program prints `12` for `3 4`"), `hints`, and a `solution` (+ `solution_explain`). The learner marks it done themselves.
Prefer test-checked exercises for code whenever the toolchain is available.
