#!/usr/bin/env python3
"""Unit-test the LaTeX -> MathML translator bundled in the player.

Usage: check_math.py [PLAYER_APP_JS]   (default: assets/template/assets/app.js)

Slices assets/app.js from `esc` through the end of `md()` (translator + inline() + md(),
no DOM, no highlightLines) and runs a battery of cases through Node. Node is required.
Exit codes: 0 all passed, 1 a case failed, 2 node missing or app.js not found.
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_APP_JS = os.path.join(os.path.dirname(HERE), "assets", "template", "assets", "app.js")

START_MARK = "const esc = s =>"
END_MARK = "/* ───────────── syntax highlighting"

# [name, latex-flavoured input fed to inline()/md(), substring expected in the output,
#  or `False` meaning "must NOT contain <math" (the currency/plain-text safety net)]
CASES = [
    ("superscript", "$x^2$", "<msup>"),
    ("subscript", "$x_1$", "<msub>"),
    ("fraction", "$\\frac{1}{2}$", "<mfrac>"),
    ("display fraction", "$\\dfrac{1}{2}$", 'displaystyle="true"'),
    ("sqrt", "$\\sqrt{2}$", "<msqrt>"),
    ("nth root", "$\\sqrt[3]{x}$", "<mroot>"),
    ("sum with limits", "$\\sum_{i=1}^{n} i$", "<munderover>"),
    ("integral without limits", "$\\int_0^1 x\\,dx$", "<msubsup>"),
    ("product", "$\\prod_{k=1}^{n} k$", "<munderover>"),
    ("limit", "$\\lim_{x \\to 0} f(x)$", "<munder>"),
    ("left right parens", "$\\left(\\frac{a}{b}\\right)$", 'fence="true"'),
    ("binom", "$\\binom{n}{k}$", 'linethickness="0"'),
    ("pmatrix", "$\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix}$", "<mtable>"),
    ("cases", "$\\begin{cases}1&x>0\\\\0&x\\le 0\\end{cases}$", "<mtable>"),
    ("aligned", "$\\begin{aligned}x&=1\\\\y&=2\\end{aligned}$", "<mtable>"),
    ("text with spaces", "$\\text{for all } x$", "<mtext>for all </mtext>"),
    ("greek letters", "$\\alpha + \\beta = \\gamma$", "α"),
    ("uppercase greek", "$\\Delta x$", "Δ"),
    ("mathbb", "$\\mathbb{R}$", "ℝ"),
    ("mathcal", "$\\mathcal{F}$", "ℱ"),
    ("mathbf style", "$\\mathbf{v}$", "font-weight:bold"),
    ("mathrm upright", "$\\mathrm{d}x$", 'mathvariant="normal"'),
    ("accent hat", "$\\hat{x}$", "<mover"),
    ("accent vec", "$\\vec{v}$", "<mover"),
    ("underline", "$\\underline{x}$", "<munder"),
    ("prime", "$f'(x)$", "′"),
    ("decimal comma", "$2{,}0$", "<mn>2</mn>"),
    ("set membership", "$x \\in \\mathbb{N}$", "∈"),
    ("pmod", "$a \\equiv b \\pmod{n}$", "<mi>mod</mi>"),
    ("function name upright", "$\\sin x + \\cos x$", "<mi>sin</mi>"),
    ("thin space", "$\\int f(x)\\,dx$", "<mspace"),
    ("operatorname", "$\\operatorname{rank}(A)$", "<mi>rank</mi>"),
    ("double sub error", "$x_1_2$", "math-err"),
    ("unknown command error", "$\\notacommand{x}$", "math-err"),
    ("unbalanced brace error", "$\\frac{1}{2$", "math-err"),
    ("unmatched left error", "$\\left(x$", "math-err"),
    ("currency single dollar", "it costs $5 total", False),
    ("currency two amounts", "between $5 and $7", False),
    ("escaped dollar", "exactly \\$5 today", "$5"),
    ("escaped dollar not math", "exactly \\$5 today", False),
    ("code wins over math", "see `$x$` literally", "<code>"),
    ("code not math", "see `$x$` literally", False),
    ("bold still works", "**bold** $x$", "<strong>"),
    ("link still works", "[text](https://example.com) and $y$", "<a href="),
]

MD_DISPLAY_CASE = (
    "Intro line.\n\n$$\n\\sum_{i=1}^n i = \\frac{n(n+1)}{2}\n$$\n\nOutro line.",
    ["mathblock", "munderover"],
)


def extract_slice(app_js_src):
    start = app_js_src.index(START_MARK)
    end = app_js_src.index(END_MARK)
    if start < 0 or end < 0 or end <= start:
        sys.exit("could not find the esc()..md() slice in app.js — did the surrounding code move?")
    return app_js_src[start:end]


def build_harness(js_slice):
    lines = ["'use strict';", js_slice, "const results = [];"]
    for name, src, expect in CASES:
        if expect is False:
            body = "out.indexOf('<math') < 0"
        else:
            body = "out.indexOf(%r) >= 0" % expect
        lines.append(
            "results.push([%r, (function(){ const out = inline(%r); return %s; })()]);"
            % (name, src, body)
        )
    md_src, must_contain = MD_DISPLAY_CASE
    lines.append(
        "results.push(['md() display block', (function(){ const out = md(%r); "
        "return %s.every(s => out.indexOf(s) >= 0); })()]);" % (md_src, must_contain)
    )
    lines.append(
        "let fails = 0;"
        "for (const [name, ok] of results) { console.log((ok ? 'ok  ' : 'FAIL') + '  ' + name); if (!ok) fails++; }"
        "console.log(fails ? fails + ' of ' + results.length + ' cases FAILED' : 'all ' + results.length + ' cases passed');"
        "process.exit(fails ? 1 : 0);"
    )
    return "\n".join(lines)


def main():
    app_js_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_APP_JS
    if not os.path.isfile(app_js_path):
        sys.exit("no such file: %s" % app_js_path)
    try:
        subprocess.run(["node", "--version"], capture_output=True, check=True)
    except (OSError, subprocess.CalledProcessError):
        print("node is not available — install Node.js to run the math translator tests.", file=sys.stderr)
        sys.exit(2)
    with open(app_js_path, encoding="utf-8") as f:
        src = f.read()
    harness = build_harness(extract_slice(src))
    r = subprocess.run(["node", "-e", harness])
    sys.exit(r.returncode)


if __name__ == "__main__":
    main()
