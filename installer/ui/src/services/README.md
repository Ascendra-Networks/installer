# Installer UI Services

API and shared logic are split into focused services:

| Service | Responsibility |
|--------|----------------|
| **providers** | Static list: `CLOUD_PROVIDERS` (cloud provider options for step1). |
| **components** | Catalog of installable components: `AVAILABLE_COMPONENTS`, `getAvailableComponents()`. Used in step4 & step5. |
| **aws.service** | AWS API: regions, VPCs, subnets, machine types, AZs, credential validation, cache clear. |
| **deployment.service** | Deployments: create, get, list, delete; plus `getAccessUrls(clusterName)`. |
| **wizard-state.service** | Persisted wizard session: `get()`, `save(state)`, `clear()`. |
| **websocket.service** | Socket.IO connection: `initializeWebSocket()`, `getSocket()`, `closeWebSocket()`. |

All HTTP services use `VITE_API_URL` (or `VITE_WS_URL` for the websocket). Validators (e.g. cluster name) live in `utils/validators.ts`.
