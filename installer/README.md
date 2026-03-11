# Ascendra Installer

A browser-based wizard that provisions and configures an Ascendra Kubernetes cluster - corrently on **AWS** (via Terraform + Ansible) or on **bare-metal / VM infrastructure** (via Ansible only).

## Architecture

| Component | Stack | Port |
|-----------|-------|------|
| Backend | Node.js + Express + Socket.IO | 3001 |
| Frontend | React 18 + Vite + Tailwind | 5173 |

The backend orchestrates Terraform and Ansible processes and streams real-time progress to the UI over WebSocket.

## Prerequisites

- Docker & Docker Compose
- AWS credentials (`~/.aws`) - required for AWS deployments

## Configuration

Copy and fill in the environment file:

```bash
cp installer/backend/example.env installer/backend/.env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GHCR_USERNAME` | Yes | GitHub Container Registry username |
| `GHCR_PASSWORD` | Yes | GitHub Container Registry password / PAT |
| `AWS_PROFILE` | No | AWS CLI profile (default: `default`) |

## Running

### Docker Compose

Run from the **installer dir**:

```bash
docker compose -f docker-compose.yml up --build
```

Open [http://localhost:5173](http://localhost:5173).

## Wizard Flow

1. **Provider** — select AWS or On-Premise
2. **Configuration** — configure cluster nodes, networking, and credentials
3. **Provisioning** — live progress of Terraform (AWS) / SSH validation (on-prem) + Kubernetes setup via Ansible
4. **Components** — select optional add-ons (e.g. Management Dashboard)
5. **Installation** — live component installation progress

## API Docs

Interactive API reference is served at [http://localhost:3001/api-docs](http://localhost:3001/api-docs) when the backend is running.
