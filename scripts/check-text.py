#!/usr/bin/env python3
"""Site text checks run by .github/workflows/site-checks.yml.

Fails when a text file:
  * contains an em dash (U+2014), either as the character or as an HTML
    entity (named, decimal or hex)
  * starts with a UTF-8 byte order mark
  * is not valid UTF-8
  * mixes line endings (CRLF together with bare LF, or any bare CR)

Line endings are not required to be CRLF: with core.autocrlf=true Git stores
LF in the repository and only converts to CRLF in a Windows checkout, so CI
sees LF. A file must simply use one style throughout.

Usage: python3 scripts/check-text.py [root]
"""
import os
import re
import sys

EXTENSIONS = {".html", ".css", ".js", ".md", ".xml", ".txt", ".json", ".yml", ".yaml", ".toml", ".py"}
SKIP_DIRS = {".git", "node_modules", ".lighthouseci"}
# Built from pieces so this file does not match its own pattern
AMP = "&"
EM_DASH = re.compile("\u2014|" + AMP + "mdash;|" + AMP + "#8212;|" + AMP + "#x2014;", re.IGNORECASE)


def check_file(path):
    problems = []
    data = open(path, "rb").read()
    if data.startswith(b"\xef\xbb\xbf"):
        problems.append("starts with a UTF-8 BOM")
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError as err:
        return problems + ["is not valid UTF-8 (%s)" % err]
    crlf = data.count(b"\r\n")
    bare_lf = data.count(b"\n") - crlf
    bare_cr = data.count(b"\r") - crlf
    if bare_cr:
        problems.append("has %d bare CR line ending(s)" % bare_cr)
    if crlf and bare_lf:
        problems.append("mixes line endings (%d CRLF, %d LF)" % (crlf, bare_lf))
    for number, line in enumerate(text.splitlines(), 1):
        if EM_DASH.search(line):
            problems.append("line %d has an em dash: %s" % (number, line.strip()[:80]))
    return problems


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    checked = 0
    failures = 0
    for folder, dirs, files in os.walk(root):
        dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
        for name in sorted(files):
            if os.path.splitext(name)[1].lower() not in EXTENSIONS:
                continue
            path = os.path.join(folder, name)
            checked += 1
            for problem in check_file(path):
                failures += 1
                print("%s: %s" % (os.path.relpath(path, root), problem))
    print("Checked %d text files, %d problem(s)." % (checked, failures))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
