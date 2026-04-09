# {{PROJECT_NAME}}

Flask API.

## Começando

```bash
# Criar virtual environment
python -m venv .venv
source .venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Copiar variáveis de ambiente
cp .env.example .env

# Rodar em desenvolvimento
python src/server.py
```

## Scripts

- `python src/server.py` — Inicia o servidor de desenvolvimento
- `gunicorn "src.app:create_app()"` — Inicia em produção
