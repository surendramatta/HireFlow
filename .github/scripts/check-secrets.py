"""Detect common credential formats in tracked source and bundled ZIP files.
Reports locations only; never prints credential values. Not a complete audit.
"""
import io
import re
import subprocess
import sys
import zipfile
from pathlib import Path

root = Path(subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip())
patterns = [
    re.compile(rb'(?:sk-(?:proj-|ant-)?[A-Za-z0-9_-]{24,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|gsk_[A-Za-z0-9]{30,}|AIza[A-Za-z0-9_-]{35}|AKIA[A-Z0-9]{16})'),
    re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
]
found = []
for name in subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().split('\0'):
    path = root / name
    if not name or not path.is_file(): continue
    data = path.read_bytes()
    entries = [(name, data)]
    if name.endswith('.zip'):
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                entries += [(name + '!' + item.filename, archive.read(item)) for item in archive.infolist()
                            if not item.is_dir() and item.file_size < 2_000_000]
        except zipfile.BadZipFile:
            found.append(name + ': unreadable archive requires review')
    for filename, content in entries:
        for pattern in patterns:
            if pattern.search(content): found.append(filename + ': possible credential')
for result in sorted(set(found)): print(result)
if not found: print('No common credential patterns found in tracked files.')
sys.exit(bool(found))
