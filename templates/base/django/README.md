# {{PROJECT_NAME}}

Django API.

## Começando

```bash
# Criar virtual environment
python -m venv .venv
source .venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Copiar variáveis de ambiente
cp .env.example .env

# Rodar migrações
python manage.py migrate

# Rodar em desenvolvimento
python manage.py runserver 0.0.0.0:8000
```

## Scripts

- `python manage.py runserver` — Servidor de desenvolvimento
- `python manage.py migrate` — Aplicar migrações
- `python manage.py createsuperuser` — Criar admin
- `gunicorn config.wsgi:application` — Produção
