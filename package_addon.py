#!/usr/bin/env python3
"""Gera um XPI sem assinatura, sem credenciais, para validação e assinatura Mozilla."""
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'HTB-Pocket-Translator'
FILES = ['manifest.json', 'background.js', 'content.js', 'translation-guard.js', 'models.json',
         'popup.html', 'popup.js', 'popup.css', 'styles.css',
         'icons/icon16.png', 'icons/icon48.png', 'icons/icon128.png']

def build():
    version = json.loads((SOURCE / 'manifest.json').read_text())['version']
    target = ROOT / 'dist' / f'htb-pocket-translator-{version}-unsigned.xpi'
    target.parent.mkdir(exist_ok=True)
    with ZipFile(target, 'w', compression=ZIP_DEFLATED) as archive:
        for name in FILES:
            archive.writestr(name, (SOURCE / name).read_bytes())
    return target

if __name__ == '__main__':
    print(build())
