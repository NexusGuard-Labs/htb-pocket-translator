#!/usr/bin/env python3
"""Edita exclusivamente models.json, sem substituir termos em outros arquivos."""
import argparse
import json
from pathlib import Path
import re

MODELS_PATH = Path(__file__).resolve().parent / 'HTB-Pocket-Translator' / 'models.json'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('modelos', nargs='*', help='IDs de modelos Gemini em ordem de preferência')
    args = parser.parse_args()
    if not args.modelos:
        print('Modelos atuais:', ', '.join(json.loads(MODELS_PATH.read_text())))
        print('Uso: python3 atualizar_modelo.py gemini-3.5-flash-lite gemini-3.5-flash')
        return
    if len(args.modelos) > 3 or any(not re.fullmatch(r'gemini-[a-zA-Z0-9._-]+', model) for model in args.modelos):
        parser.error('Informe de 1 a 3 IDs válidos de modelos Gemini.')
    MODELS_PATH.write_text(json.dumps(list(dict.fromkeys(args.modelos)), indent=2) + '\n')
    print('models.json atualizado. Recarregue a extensão e use Testar Conexão para validar a disponibilidade.')


if __name__ == '__main__':
    main()
