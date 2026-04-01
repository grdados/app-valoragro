# Valor Agro — ERP Gestão de Comissões de Consórcios

ERP completo para gestão de comissões de vendas de consórcios com hierarquia de acesso, automação de cálculos, dashboards gerenciais e relatórios exportáveis.

---

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução
- Portas **5173** (frontend), **8000** (backend) e **5432** (PostgreSQL) livres

---

## Como executar (PowerShell)

```powershell
# 1. Entre na pasta do projeto
Set-Location "C:\Users\Elvis\.verdent\verdent-projects\valorAgro"

# 2. Suba todos os serviços (primeira vez faz o build)
docker-compose up --build

# Nas próximas vezes (sem rebuild):
docker-compose up
```

Acesse:
- **Frontend:** http://localhost:5173
- **API REST:** http://localhost:8000/api/
- **Documentação Swagger:** http://localhost:8000/api/docs/
- **Admin Django:** http://localhost:8000/admin/

---

## Usuários de demonstração

| Usuário | Senha | Perfil |
|---|---|---|
| `admin` | `admin123` | Administrador (acesso total) |
| `carlos` | `coord123` | Coordenador (equipe 1) |
| `ana` | `coord123` | Coordenador (equipe 2) |
| `joao` | `vend123` | Vendedor (equipe Carlos) |
| `maria` | `vend123` | Vendedor (equipe Carlos) |
| `pedro` | `vend123` | Vendedor (equipe Ana) |

---

## Funcionalidades

### Hierarquia de Acesso
- **Administrador** — visão total, altera status de comissões, gerencia cadastros
- **Coordenador** — vê sua equipe e vendedores vinculados
- **Vendedor** — vê apenas suas próprias vendas e comissões

### Formulário Inteligente de Venda
1. Preencha: data, COBAN, tipo de bem, valor do bem
2. O sistema identifica a faixa de comissão e lista consórcios disponíveis
3. Selecione o consórcio → plano de parcelas calculado automaticamente
4. Clique em "Confirmar" → venda e comissões criadas de uma vez

### Regra de Vencimento
- **Corte dia 19:** venda até dia 18 → vence dia 10 do mês seguinte; venda após dia 18 → dia 10 do mês subsequente
- **Assembleia:** se a data de venda for anterior à data da assembleia, o vencimento é calculado a partir da data da assembleia

### Status de Comissões
| Status | Descrição |
|---|---|
| Pendente | Aguardando pagamento |
| Pago | Comissão liquidada (somente Admin pode alterar) |
| Vencido | Data de vencimento ultrapassada sem pagamento |

### Relatórios
Exporta em **Excel (.xlsx)** ou **PDF** com filtros de vendedor, coordenador, período e status:
- Comissões em Aberto
- Comissões em Atraso
- Comissões Pagas
- Extrato por Vendedor
- Extrato por Coordenador

---

## Comandos úteis (PowerShell)

```powershell
# Parar os serviços
docker-compose down

# Parar e apagar o banco de dados (reset completo)
docker-compose down -v

# Ver logs do backend
docker-compose logs -f backend

# Executar comando Django manualmente
docker-compose exec backend python manage.py <comando>

# Atualizar parcelas vencidas manualmente
docker-compose exec backend python manage.py update_vencidas

# Criar novo superusuário
docker-compose exec backend python manage.py createsuperuser
```

---

## Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Recharts |
| Backend | Django 4.2, Django REST Framework, SimpleJWT |
| Banco de Dados | PostgreSQL 15 |
| Exportação | openpyxl (Excel), ReportLab (PDF) |
| Containerização | Docker, Docker Compose |

---

## Variáveis de Ambiente

Edite o `docker-compose.yml` ou crie um arquivo `.env` na raiz do projeto para customizar:

| Variável | Padrão | Descrição |
|---|---|---|
| `SECRET_KEY` | insecure-dev-key | Chave secreta Django (mude em produção!) |
| `DB_PASSWORD` | valoragro123 | Senha do banco de dados |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | 60 | Tempo de expiração do token de acesso |

---

## Deploy (GitHub + Render + Vercel)

### GitHub
- Repositorio alvo: `https://github.com/grdados/app-valoragro.git`
- O projeto foi preparado para push com `.gitignore` adequado para Node/Python.

### Render (Backend Django)
- Arquivo de blueprint criado: `render.yaml` (raiz).
- Cria automaticamente:
  - Banco Postgres (`valoragro-db`)
  - Servico web Python (`valoragro-backend`)
- Comandos:
  - Build: `pip install -r requirements.txt && python manage.py collectstatic --no-input`
  - Start: `python manage.py migrate --no-input && gunicorn config.wsgi:application`
- Importe o repositorio no Render e selecione o blueprint.
- Configure `CORS_ALLOWED_ORIGINS` com a URL final do Vercel.

### Vercel (Frontend Vite)
- Arquivo criado: `frontend/vercel.json` para fallback SPA.
- No Vercel:
  - Framework: Vite
  - Root Directory: `frontend`
  - Build command: `npm run build`
  - Output directory: `dist`
- Variavel obrigatoria:
  - `VITE_API_URL=https://SEU-BACKEND.onrender.com/api`
