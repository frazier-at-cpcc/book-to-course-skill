"""Player UI language packs.

Each language is one folder, assets/i18n/<code>/, holding strings.json (short key → text shown in the
player) and README.md (copied into every course as its how-to-run guide). English is the base pack:
its keys are the full set, and it fills any key another pack lacks. Adding a language = adding a folder.
"""
import json
import os
import re

I18N = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "i18n")
BASE = "en"
CODE_RE = re.compile(r"^[a-z]{2,3}(?:-[A-Za-z0-9]+)?$")


def ui_lang_packs():
    """Codes of the language folders that have a strings.json."""
    try:
        names = os.listdir(I18N)
    except OSError:
        return set()
    return {n for n in names if os.path.isfile(os.path.join(I18N, n, "strings.json"))}


def load_strings(code):
    with open(os.path.join(I18N, code, "strings.json"), encoding="utf-8") as f:
        return json.load(f)


def ui_strings(ui_lang):
    """(strings for the player, keys missing from ui_lang's pack) — English fills the gaps."""
    base = load_strings(BASE)
    if ui_lang == BASE or ui_lang not in ui_lang_packs():
        return base, []
    own = load_strings(ui_lang)
    return dict(base, **own), sorted(set(base) - set(own))


def readme_for(ui_lang):
    """README.md of ui_lang's folder, falling back to English like the player does."""
    p = os.path.join(I18N, ui_lang, "README.md")
    return p if os.path.exists(p) else os.path.join(I18N, BASE, "README.md")
