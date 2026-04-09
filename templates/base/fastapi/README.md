# {{PROJECT_NAME}}

FastAPI.

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

- `python src/server.py` — Inicia o servidor de desenvolvimento (com hot reload)
- `uvicorn src.app:app --host 0.0.0.0 --port 8000` — Inicia em produção
