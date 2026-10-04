#!/usr/bin/env python3
"""Extract a book into per-chapter Markdown files plus a manifest.

Usage:  extract_book.py INPUT OUTDIR [--chunk-pages 25] [--only CHAPTER]

INPUT may be .epub, .pdf, .html/.htm/.xhtml, .docx, .md/.markdown or .txt.
Standard library only; PDFs use `pdftotext` (poppler) when present, else `pypdf`.

--only CHAPTER limits the output to a single chapter — handy to try a course (or a new
feature) on one chapter before committing to the whole book. CHAPTER may be its 1-based
number (3), its id once extracted (ch03), or a case-insensitive substring of its title; a
number/id always wins over a title match. The resulting OUTDIR/manifest.json then has just
that one chapter (keeping its real chapter number, e.g. ch05, not renumbered to ch01), so
init_course.py scaffolds a course scoped to it. Use a fresh OUTDIR, not one that already
holds a full extraction — like a plain run, --only clears OUTDIR/chapters/*.md first.

Writes:
  OUTDIR/manifest.json         title, author, language, chapters (id, title, file, words, kind, headings)
  OUTDIR/outline.md            human-readable table of contents with word counts
  OUTDIR/chapters/<id>-<slug>.md

Exit codes: 0 ok, 2 PDF has no text layer (needs OCR), 1 other failure.
"""
import argparse
import json
import os
import posixpath
import re
import shutil
import subprocess
import sys
import unicodedata
import zipfile
from html.parser import HTMLParser
from xml.etree import ElementTree as ET

FRONT_RE = re.compile(
    r"^(cover|ok[łl]adka|title\s*page|strona\s+tytu[łl]owa|copyright|contents|table\s+of\s+contents|spis\s+tre[śs]ci|toc|"
    r"about\s+the\s+(author|book)|o\s+autorze|acknowledg\w*|podzi[ęe]kowania|colophon|kolofon|dedication|dedykacja|"
    r"also\s+by|praise\s+for|index|skorowidz|bibliograph\w*|bibliografia|notes?$|przypisy|list\s+of\s+(figures|tables)|about\s+this\s+book)\b",
    re.I)
PL_WORDS = set("się oraz jest nie że to jak który dla przez nad pod aby może można tym tego które są czy lub już też być był była było jego jej ich nasz wszystko będzie gdy tylko także więc ale albo jako przy dane".split())
EN_WORDS = set("the and is are of to in that for with as on this be by from or an it not can which will have has you your when then also more".split())


# ───────────────────────── HTML → Markdown ─────────────────────────
class MD(HTMLParser):
    SKIP = {"script", "style", "head", "title", "svg", "nav", "noscript"}
    BLOCK = {"p", "div", "section", "article", "header", "footer", "aside", "figure", "figcaption", "dd", "dt", "dl", "center", "main", "tr_"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.buf = [], []
        self.skip = 0
        self.pre = 0
        self.pre_buf, self.pre_lang = [], ""
        self.prefix = ""
        self.lists = []  # [type, counter]
        self.quote = 0
        self.cells, self.in_cell = [], False
        self.heading = 0

    def _emit(self, prefix=None):
        text = "".join(self.buf)
        self.buf = []
        text = re.sub(r"[ \t\r\n ]+", " ", text).strip()
        if not text:
            return
        pre = self.prefix if prefix is None else prefix
        self.prefix = ""
        if self.quote and not pre.startswith("#"):
            pre = "> " + pre
        self.parts.append(pre + text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in self.SKIP:
            self.skip += 1
            return
        if self.skip:
            return
        if self.pre:
            if tag == "br":
                self.pre_buf.append("\n")
            if tag in ("code", "span") and not self.pre_lang:
                self.pre_lang = self._lang(a)
            return
        if re.fullmatch(r"h[1-6]", tag):
            self._emit()
            self.heading = int(tag[1])
        elif tag == "pre":
            self._emit()
            self.pre, self.pre_buf, self.pre_lang = 1, [], self._lang(a)
        elif tag in self.BLOCK or tag == "p":
            self._emit()
        elif tag in ("ul", "ol"):
            self._emit()
            self.lists.append([tag, 0])
        elif tag == "li":
            self._emit()
            if self.lists:
                self.lists[-1][1] += 1
                bullet = "- " if self.lists[-1][0] == "ul" else "%d. " % self.lists[-1][1]
                self.prefix = "  " * (len(self.lists) - 1) + bullet
            else:
                self.prefix = "- "
        elif tag == "blockquote":
            self._emit()
            self.quote += 1
        elif tag in ("strong", "b"):
            self.buf.append("**")
        elif tag in ("em", "i"):
            self.buf.append("*")
        elif tag == "code":
            self.buf.append("`")
        elif tag == "br":
            self.buf.append(" ")
        elif tag == "img":
            alt = (a.get("alt") or "").strip()
            self.buf.append("[img: %s]" % alt if alt else "[img]")
        elif tag == "tr":
            self._emit()
            self.cells = []
        elif tag in ("td", "th"):
            self.buf = []
            self.in_cell = True

    def handle_endtag(self, tag):
        if tag in self.SKIP:
            self.skip = max(0, self.skip - 1)
            return
        if self.skip:
            return
        if self.pre:
            if tag == "pre":
                code = "".join(self.pre_buf).strip("\n")
                self.pre = 0
                if code.strip():
                    self.parts.append("```%s\n%s\n```" % (self.pre_lang, code))
            return
        if re.fullmatch(r"h[1-6]", tag):
            self._emit("#" * int(tag[1]) + " ")
            self.heading = 0
        elif tag in self.BLOCK or tag == "p" or tag == "li":
            self._emit()
        elif tag in ("ul", "ol"):
            self._emit()
            if self.lists:
                self.lists.pop()
        elif tag == "blockquote":
            self._emit()
            self.quote = max(0, self.quote - 1)
        elif tag in ("strong", "b"):
            self.buf.append("**")
        elif tag in ("em", "i"):
            self.buf.append("*")
        elif tag == "code":
            self.buf.append("`")
        elif tag in ("td", "th"):
            text = re.sub(r"\s+", " ", "".join(self.buf)).strip()
            self.buf = []
            self.cells.append(text.replace("|", "\\|"))
            self.in_cell = False
        elif tag == "tr":
            if self.cells:
                self.parts.append("| " + " | ".join(self.cells) + " |")
            self.cells = []

    def handle_data(self, data):
        if self.skip:
            return
        if self.pre:
            self.pre_buf.append(data)
        else:
            self.buf.append(data)

    @staticmethod
    def _lang(a):
        cls = a.get("class") or ""
        m = re.search(r"(?:language|lang|brush|code)[-:_ ]([A-Za-z0-9+#]+)", cls)
        return m.group(1).lower() if m else ""

    def result(self):
        self._emit()
        text = "\n\n".join(self.parts)
        text = re.sub(r"\*\*\s*\*\*", "", text)
        return re.sub(r"\n{3,}", "\n\n", text).strip() + "\n"


def html_to_md(html):
    p = MD()
    p.feed(html)
    p.close()
    return p.result()


# ───────────────────────── helpers ─────────────────────────
def slugify(s, n=48):
    s = s.replace("ł", "l").replace("Ł", "L")
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return (s[:n].strip("-")) or "chapter"


def words(text):
    return len(re.findall(r"\w+", text, re.UNICODE))


def guess_language(text):
    toks = re.findall(r"[^\W\d_]+", text[:60000].lower(), re.UNICODE)
    pl = sum(1 for t in toks if t in PL_WORDS) + 3 * sum(1 for t in toks if re.search(r"[ąćęłńóśźż]", t))
    en = sum(1 for t in toks if t in EN_WORDS)
    return "pl" if pl > en * 0.6 else "en"


def first_heading(md):
    m = re.search(r"^(#{1,6})\s+(.+)$", md, re.M)
    return (len(m.group(1)), m.group(2).strip()) if m else (0, "")


def headings(md, maxlevel=3):
    out, in_code = [], False
    for line in md.splitlines():
        if line.startswith("```"):
            in_code = not in_code
        m = None if in_code else re.match(r"^(#{1,%d})\s+(.+)$" % maxlevel, line)
        if m:
            out.append({"level": len(m.group(1)), "title": m.group(2).strip()})
    return out


def classify(title, idx, total):
    return "front" if FRONT_RE.match(title.strip().lower()) else "chapter"


# ───────────────────────── format readers ─────────────────────────
def _local(tag):
    return tag.rsplit("}", 1)[-1]


def read_epub(path):
    z = zipfile.ZipFile(path)
    cont = ET.fromstring(z.read("META-INF/container.xml"))
    rootfile = next(e.get("full-path") for e in cont.iter() if _local(e.tag) == "rootfile")
    opf = ET.fromstring(z.read(rootfile))
    base = posixpath.dirname(rootfile)
    meta = {"title": "", "author": "", "language": ""}
    manifest, spine = {}, []
    for e in opf.iter():
        n = _local(e.tag)
        if n == "title" and not meta["title"]:
            meta["title"] = (e.text or "").strip()
        elif n == "creator" and not meta["author"]:
            meta["author"] = (e.text or "").strip()
        elif n == "language" and not meta["language"]:
            meta["language"] = (e.text or "").strip()[:2].lower()
        elif n == "item":
            manifest[e.get("id")] = (e.get("href"), e.get("media-type") or "", e.get("properties") or "")
        elif n == "itemref":
            spine.append(e.get("idref"))

    def full(href):
        return posixpath.normpath(posixpath.join(base, href.split("#")[0])) if href else ""

    # Table of contents: EPUB3 nav or NCX; keep the shallowest entries as chapter starts.
    toc = []  # (depth, title, file)
    nav_id = next((i for i, (_, _, pr) in manifest.items() if "nav" in pr.split()), None)
    ncx_id = next((i for i, (_, mt, _) in manifest.items() if "ncx" in mt), None)
    try:
        if nav_id:
            toc = _parse_nav(z.read(full(manifest[nav_id][0])).decode("utf-8", "replace"), posixpath.dirname(full(manifest[nav_id][0])))
        if not toc and ncx_id:
            toc = _parse_ncx(z.read(full(manifest[ncx_id][0])), posixpath.dirname(full(manifest[ncx_id][0])))
    except (KeyError, ET.ParseError):
        toc = []
    top = {}
    if toc:
        mind = min(d for d, _, _ in toc)
        for d, title, f in toc:
            if d == mind and f not in top:
                top[f] = title

    chapters = []
    for idref in spine:
        if idref not in manifest:
            continue
        href, mt, _ = manifest[idref]
        if "html" not in mt and "xml" not in mt:
            continue
        f = full(href)
        try:
            md = html_to_md(z.read(f).decode("utf-8", "replace"))
        except KeyError:
            continue
        if not md.strip():
            continue
        lvl, head = first_heading(md)
        starts = (f in top) if top else (0 < lvl <= 2)
        if starts or not chapters:
            title = top.get(f) or head or posixpath.basename(f)
            chapters.append({"title": title, "text": md})
        else:
            chapters[-1]["text"] += "\n" + md
    return meta, chapters


def _parse_nav(html, basedir):
    class N(HTMLParser):
        def __init__(s):
            super().__init__()
            s.depth, s.items, s.href, s.txt, s.in_nav = 0, [], None, [], False

        def handle_starttag(s, tag, attrs):
            a = dict(attrs)
            if tag == "nav" and "toc" in (a.get("epub:type", "") + a.get("role", "")):
                s.in_nav = True
            if not s.in_nav:
                return
            if tag == "ol":
                s.depth += 1
            if tag == "a":
                s.href, s.txt = a.get("href"), []

        def handle_endtag(s, tag):
            if tag == "nav":
                s.in_nav = False
            if not s.in_nav:
                return
            if tag == "ol":
                s.depth -= 1
            if tag == "a" and s.href:
                title = re.sub(r"\s+", " ", "".join(s.txt)).strip()
                s.items.append((s.depth, title, posixpath.normpath(posixpath.join(basedir, s.href.split("#")[0]))))
                s.href = None

        def handle_data(s, d):
            if s.href:
                s.txt.append(d)
    n = N()
    n.feed(html)
    return n.items


def _parse_ncx(data, basedir):
    root = ET.fromstring(data)
    items = []

    def walk(el, depth):
        for c in el:
            if _local(c.tag) == "navPoint":
                label = next((t.text for t in c.iter() if _local(t.tag) == "text"), "") or ""
                src = next((x.get("src") for x in c if _local(x.tag) == "content"), "")
                items.append((depth, label.strip(), posixpath.normpath(posixpath.join(basedir, src.split("#")[0]))))
                walk(c, depth + 1)
    nm = next((e for e in root.iter() if _local(e.tag) == "navMap"), root)
    walk(nm, 0)
    return items


def split_md(md, level):
    """Split Markdown into chapters at headings of the given level."""
    chapters, cur, in_code = [], None, False
    pat = re.compile(r"^#{%d}\s+(.+)$" % level)
    pre = []
    for line in md.splitlines():
        if line.startswith("```"):
            in_code = not in_code
        m = None if in_code else pat.match(line)
        if m:
            if cur:
                chapters.append(cur)
            cur = {"title": m.group(1).strip(), "text": line + "\n"}
        elif cur:
            cur["text"] += line + "\n"
        else:
            pre.append(line)
    if cur:
        chapters.append(cur)
    if pre and "".join(pre).strip():
        chapters.insert(0, {"title": "Wstęp / Preface", "text": "\n".join(pre) + "\n"})
    return chapters


def split_by_headings(md):
    counts = {l: len(re.findall(r"^#{%d}\s" % l, md, re.M)) for l in (1, 2, 3)}
    for l in (1, 2, 3):
        if counts[l] >= 2:
            return split_md(md, l)
    return [{"title": first_heading(md)[1] or "Text", "text": md}]


def read_html(path):
    raw = open(path, "rb").read().decode("utf-8", "replace")
    t = re.search(r"<title[^>]*>(.*?)</title>", raw, re.S | re.I)
    md = html_to_md(raw)
    return {"title": re.sub(r"\s+", " ", t.group(1)).strip() if t else "", "author": "", "language": ""}, split_by_headings(md)


def read_text(path):
    raw = open(path, "rb").read().decode("utf-8", "replace")
    if not path.lower().endswith((".md", ".markdown")):
        raw = re.sub(r"^((?:chapter|rozdzia[łl]|cz[ęe][śs][ćc]|part|cap[íi]tulo|chapitre|capitolo|kapitel)\s+(?:\d+|[ivxlc]+)\b.*)$", r"# \1", raw, flags=re.I | re.M)
    return {"title": first_heading(raw)[1], "author": "", "language": ""}, split_by_headings(raw)


def read_docx(path):
    z = zipfile.ZipFile(path)
    W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    names = {}
    if "word/styles.xml" in z.namelist():
        for s in ET.fromstring(z.read("word/styles.xml")).iter(W + "style"):
            nm = s.find(W + "name")
            names[s.get(W + "styleId")] = (nm.get(W + "val") if nm is not None else "").lower()
    body = ET.fromstring(z.read("word/document.xml")).find(W + "body")

    def ptext(p):
        out = []
        for e in p.iter():
            if e.tag == W + "t":
                out.append(e.text or "")
            elif e.tag == W + "tab":
                out.append("\t")
            elif e.tag == W + "br":
                out.append("\n")
        return "".join(out)

    def mono(p):
        fonts = [r.get(W + "ascii", "") for r in p.iter(W + "rFonts")]
        return bool(fonts) and all(re.search(r"mono|consolas|courier|code", f, re.I) for f in fonts)

    parts, code = [], []

    def flush():
        if code:
            parts.append("```\n" + "\n".join(code) + "\n```")
            code.clear()
    for el in body:
        if el.tag == W + "p":
            st = el.find(W + "pPr/" + W + "pStyle")
            sname = names.get(st.get(W + "val"), "") if st is not None else ""
            text = ptext(el)
            if re.search(r"code|kod|source|preformatted", sname) or (text.strip() and mono(el)):
                code.append(text)
                continue
            flush()
            if not text.strip():
                continue
            m = re.search(r"(?:heading|nag[łl]ówek|nagwek)\s*(\d)", sname)
            if m:
                parts.append("#" * min(int(m.group(1)), 6) + " " + text.strip())
            elif sname == "title":
                parts.append("# " + text.strip())
            elif el.find(W + "pPr/" + W + "numPr") is not None or "list" in sname:
                parts.append("- " + text.strip())
            else:
                parts.append(text.strip())
        elif el.tag == W + "tbl":
            flush()
            for tr in el.iter(W + "tr"):
                cells = ["".join(ptext(p) for p in tc.iter(W + "p")).strip() for tc in tr.iter(W + "tc")]
                parts.append("| " + " | ".join(cells) + " |")
    flush()
    md = "\n\n".join(parts) + "\n"
    return {"title": first_heading(md)[1], "author": "", "language": ""}, split_by_headings(md)


# ───────────────────────── PDF ─────────────────────────
def pdf_pages(path):
    if shutil.which("pdftotext"):
        r = subprocess.run(["pdftotext", "-layout", path, "-"], capture_output=True)
        if r.returncode == 0:
            pages = r.stdout.decode("utf-8", "replace").split("\f")
            if pages and not pages[-1].strip():
                pages.pop()
            return pages
    try:
        from pypdf import PdfReader
    except ImportError:
        sys.exit("Need `pdftotext` (poppler-utils) or the `pypdf` package to read PDFs.")
    return [(p.extract_text() or "") for p in PdfReader(path).pages]


def pdf_outline(path):
    try:
        from pypdf import PdfReader
        r = PdfReader(path)
        items = []

        def walk(o, depth):
            for it in o:
                if isinstance(it, list):
                    walk(it, depth + 1)
                else:
                    try:
                        items.append((depth, str(it.title).strip(), r.get_destination_page_number(it)))
                    except Exception:
                        pass
        walk(r.outline, 0)
        meta = r.metadata or {}
        return items, {"title": str(meta.get("/Title") or "").strip(), "author": str(meta.get("/Author") or "").strip()}
    except Exception:
        return [], {"title": "", "author": ""}


CODE_START = re.compile(r"^\s*(//|/\*|\*/|#include|#!|package\s+\w+|import\s+[\"(\w]|from\s+\w+\s+import|func\s|def\s|class\s|return\b|fmt\.|print\(|var\s|const\s|type\s+\w+\s+(struct|interface)|\}|\{|\$ |>>> )")


def _codey(line, base):
    s = line.rstrip()
    if not s.strip():
        return None  # blank
    indent = len(s) - len(s.lstrip())
    if indent - base >= 3:
        return True
    if CODE_START.match(s):
        return True
    return s.endswith(("{", "};", ");", ") {")) or " := " in s


def reflow_page(text):
    lines = text.replace("\t", "    ").split("\n")
    nonblank = [l for l in lines if l.strip()]
    if not nonblank:
        return []
    indents = sorted(len(l) - len(l.lstrip()) for l in nonblank)
    base = indents[len(indents) // 4]  # lower quartile ≈ prose margin
    blocks, prose, code, blank_run = [], [], [], 0

    def end_prose():
        if prose:
            joined = ""
            for ln in prose:
                ln = ln.strip()
                if joined.endswith("-") and ln[:1].islower():
                    joined = joined[:-1] + ln
                else:
                    joined += (" " if joined else "") + ln
            blocks.append(("p", joined))
            prose.clear()

    def end_code():
        if code:
            if len([c for c in code if c.strip()]) >= 2:
                cut = min(len(c) - len(c.lstrip()) for c in code if c.strip())
                blocks.append(("code", "\n".join(c[cut:].rstrip() for c in code).strip("\n")))
            else:
                prose.extend(code)
            code.clear()
    for ln in lines:
        c = _codey(ln, base)
        if c is None:
            blank_run += 1
            if code and blank_run <= 1:
                code.append("")
            elif not code:
                end_prose()
            continue
        blank_run = 0
        if c:
            end_prose() if not code else None
            code.append(ln.rstrip())
        else:
            if code:
                while code and not code[-1].strip():
                    code.pop()
                end_code()
            prose.append(ln)
    while code and not code[-1].strip():
        code.pop()
    end_code()
    end_prose()
    return blocks


def clean_pdf(pages):
    n = len(pages)
    freq = {}
    norm = lambda s: re.sub(r"\d+", "#", s.strip().lower())
    for p in pages:
        ls = [l for l in p.split("\n") if l.strip()]
        for l in (ls[:1] + ls[-1:]):
            freq[norm(l)] = freq.get(norm(l), 0) + 1
    thr = max(3, int(0.3 * n))
    junk = {k for k, v in freq.items() if v >= thr}
    out = []
    for p in pages:
        ls = p.split("\n")
        idx = [i for i, l in enumerate(ls) if l.strip()]
        drop = set()
        for i in (idx[:1] + idx[-1:]):
            if norm(ls[i]) in junk or re.fullmatch(r"\s*\d{1,4}\s*", ls[i]):
                drop.add(i)
        out.append("\n".join(l for i, l in enumerate(ls) if i not in drop))
    return out


def pages_to_md(pages, first_page_no=1):
    blocks = []
    for i, p in enumerate(pages):
        blocks.append(("marker", "<!-- page %d -->" % (first_page_no + i)))
        blocks.extend(reflow_page(p))
    merged = []
    for kind, txt in blocks:
        if kind == "p" and merged and merged[-1][0] == "p" and not re.search(r"[.!?:;…\"”)\]]\s*$", merged[-1][1]) and txt[:1].islower():
            merged[-1] = ("p", merged[-1][1] + " " + txt)
        else:
            merged.append((kind, txt))
    out = []
    for kind, txt in merged:
        if kind == "code":
            out.append("```\n" + txt + "\n```")
        elif kind == "p" and re.match(r"^\d+(\.\d+){1,2}\s+[A-ZĄĆĘŁŃÓŚŹŻ]", txt) and len(txt) < 90:
            out.append("## " + txt)
        else:
            out.append(txt)
    return "\n\n".join(out) + "\n"


def read_pdf(path, chunk_pages):
    pages = pdf_pages(path)
    total_chars = sum(len(p.strip()) for p in pages)
    if not pages or total_chars / max(len(pages), 1) < 120:
        return None, None, "scanned"
    outline, meta = pdf_outline(path)
    pages = clean_pdf(pages)
    starts = []
    if outline:
        for depth in sorted({d for d, _, _ in outline}):
            lvl = [(t, p) for d, t, p in outline if d == depth]
            if len(lvl) >= 4:
                starts = lvl
                break
        if not starts:
            starts = [(t, p) for d, t, p in outline if d == 0]
    if len(starts) < 3:
        pat = re.compile(r"^\s*(chapter|rozdzia[łl]|cz[ęe][śs][ćc]|part|cap[íi]tulo|chapitre|capitolo|kapitel)\s+(\d+|[ivxlc]+)\b(.*)$", re.I)
        found = []
        for i, p in enumerate(pages):
            for l in [x for x in p.split("\n") if x.strip()][:4]:
                m = pat.match(l)
                if m:
                    found.append((l.strip(), i))
                    break
        if len(found) >= 3:
            starts = found
    if len(starts) < 3:
        starts = [("Part %d (pages %d–%d)" % (k + 1, s + 1, min(s + chunk_pages, len(pages))), s) for k, s in enumerate(range(0, len(pages), chunk_pages))]
    starts = sorted(set((t, min(max(p, 0), len(pages) - 1)) for t, p in starts), key=lambda x: x[1])
    chapters = []
    if starts[0][1] > 0:
        chapters.append({"title": "Front matter", "text": pages_to_md(pages[:starts[0][1]], 1), "pages": (1, starts[0][1])})
    for k, (t, p) in enumerate(starts):
        end = starts[k + 1][1] if k + 1 < len(starts) else len(pages)
        if end <= p:
            continue
        body = pages_to_md(pages[p:end], p + 1)
        chapters.append({"title": t, "text": "# %s\n\n%s" % (t, body), "pages": (p + 1, end)})
    return meta, chapters, "ok"


# ───────────────────────── main ─────────────────────────
def main():
    ap = argparse.ArgumentParser(description="Extract a book into chapters (Markdown) + manifest.json")
    ap.add_argument("input")
    ap.add_argument("outdir")
    ap.add_argument("--chunk-pages", type=int, default=25, help="PDF without usable outline: pages per part")
    ap.add_argument("--only", help="limit extraction to one chapter: its number (3), id (ch03), or a substring of its title — use a fresh OUTDIR")
    a = ap.parse_args()
    ext = os.path.splitext(a.input)[1].lower()
    warnings = []
    if ext == ".epub":
        meta, chapters = read_epub(a.input)
    elif ext in (".html", ".htm", ".xhtml"):
        meta, chapters = read_html(a.input)
    elif ext == ".docx":
        meta, chapters = read_docx(a.input)
    elif ext in (".md", ".markdown", ".txt"):
        meta, chapters = read_text(a.input)
    elif ext == ".pdf":
        meta, chapters, status = read_pdf(a.input, a.chunk_pages)
        if status == "scanned":
            print("This PDF has (almost) no text layer — it looks scanned. Run OCR first, e.g.:\n"
                  "  ocrmypdf -l pol+eng --deskew in.pdf out.pdf\nthen run this script on out.pdf. "
                  "(Or ask the user for an EPUB / text-based PDF.)", file=sys.stderr)
            sys.exit(2)
        warnings.append("PDF extraction is heuristic: code blocks, tables and multi-column pages may be imperfect. "
                        "Rasterize a page (pdftoppm -r 110 -f N -l N -png) and look at it when something seems off.")
    else:
        sys.exit("Unsupported format: %s (use epub, pdf, html, docx, md, txt)" % ext)

    # merge tiny chapters (part dividers etc.) into the following chapter
    merged = []
    carry = ""
    for i, c in enumerate(chapters):
        c["text"] = carry + c["text"]
        carry = ""
        if words(c["text"]) < 120 and i < len(chapters) - 1 and classify(c["title"], i, len(chapters)) == "chapter" and not c.get("pages"):
            carry = c["text"].rstrip() + "\n\n"
            continue
        merged.append(c)
    chapters = merged
    chapters = [c for c in chapters if c["text"].strip()]
    if not chapters:
        sys.exit("No text could be extracted from this file.")

    only_number = None
    if a.only:
        query = a.only.strip().lower()
        numbered = [("ch%02d" % (k + 1), c) for k, c in enumerate(c for c in chapters if classify(c["title"], 0, 0) == "chapter")]
        # a number or ch-id query matches only the number/id — falling back to a title
        # substring would make "--only 1" also match "Chapter 10", "Chapter 11", ...
        m = re.fullmatch(r"(?:ch0*)?(\d+)", query)
        if m:
            num = int(m.group(1))
            matches = [(cid, c) for cid, c in numbered if int(cid[2:]) == num]
        else:
            matches = [(cid, c) for cid, c in numbered if query in c["title"].strip().lower()]
        if not matches:
            sys.exit("--only '%s' matched no chapter. Available: %s" % (a.only, ", ".join("%s %s" % (cid, c["title"][:60]) for cid, c in numbered)))
        if len(matches) > 1:
            sys.exit("--only '%s' matched %d chapters (%s) — use the exact number or id" % (a.only, len(matches), ", ".join(cid for cid, _ in matches)))
        chapters = [matches[0][1]]
        only_number = int(matches[0][0][2:])

    sample = " ".join(c["text"] for c in chapters)[:80000]
    lang = meta.get("language") or guess_language(sample)
    if lang not in ("pl", "en"):
        lang = guess_language(sample)
    title = meta.get("title") or os.path.splitext(os.path.basename(a.input))[0]

    os.makedirs(os.path.join(a.outdir, "chapters"), exist_ok=True)
    for f in os.listdir(os.path.join(a.outdir, "chapters")):
        if f.endswith(".md"):
            os.remove(os.path.join(a.outdir, "chapters", f))
    # with --only, seed the counter so the single kept chapter keeps its real number
    # (ch05, not ch01) — matters both for the docstring's promise and for resuming a
    # course later against a full extraction without the ids colliding
    entries, nch, nfr = [], (only_number - 1 if only_number else 0), 0
    for i, c in enumerate(chapters):
        kind = classify(c["title"], i, len(chapters))
        if kind == "chapter":
            nch += 1
            cid = "ch%02d" % nch
        else:
            nfr += 1
            cid = "front%02d" % nfr
        if not re.match(r"^#\s", c["text"].lstrip()):
            c["text"] = "# %s\n\n%s" % (c["title"], c["text"])
        fn = "%s-%s.md" % (cid, slugify(c["title"]))
        with open(os.path.join(a.outdir, "chapters", fn), "w", encoding="utf-8") as f:
            f.write(c["text"])
        e = {"id": cid, "title": c["title"], "file": "chapters/" + fn, "words": words(c["text"]), "kind": kind,
             "has_code": "```" in c["text"], "headings": headings(c["text"], 3)[:60]}
        if c.get("pages"):
            e["pages"] = list(c["pages"])
        entries.append(e)
    manifest = {"title": title, "author": meta.get("author", ""), "language": lang, "source": os.path.basename(a.input),
                "format": ext.lstrip("."), "total_words": sum(e["words"] for e in entries if e["kind"] == "chapter"),
                "chapters": entries, "warnings": warnings}
    with open(os.path.join(a.outdir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    with open(os.path.join(a.outdir, "outline.md"), "w", encoding="utf-8") as f:
        f.write("# %s\n\n%s · language: %s · %d words in chapters\n\n" % (title, manifest["author"] or "unknown author", lang, manifest["total_words"]))
        for e in entries:
            f.write("## %s — %s  (%d words%s%s)\n" % (e["id"], e["title"], e["words"], ", code" if e["has_code"] else "", ", SKIPPED front/back matter" if e["kind"] == "front" else ""))
            for h_ in e["headings"]:
                if h_["level"] > 1:
                    f.write("%s- %s\n" % ("  " * (h_["level"] - 2), h_["title"]))
            f.write("\n")
    n_chapters = sum(1 for e in entries if e["kind"] == "chapter")
    n_front = sum(1 for e in entries if e["kind"] != "chapter")
    print("Title: %s | author: %s | language: %s | %d chapters (+%d front/back) | %d words" % (title, manifest["author"] or "?", lang, n_chapters, n_front, manifest["total_words"]))
    for e in entries:
        print("  %-8s %6d words  %s%s" % (e["id"], e["words"], e["title"][:70], "  [skipped]" if e["kind"] == "front" else ""))
    for w in warnings:
        print("NOTE:", w)
    print("Wrote", a.outdir)


if __name__ == "__main__":
    main()
