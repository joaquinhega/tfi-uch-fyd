# TFI UCH-FyD

MVP de la arquitectura SOA del TP3. Arquitectura de Sistemas, Universidad Champagnat. Grupo 13.

## Arquitectura

```
Navegador ──► API Gateway ──► Autenticación   Node.js + MongoDB
                          ├─► Stock/Catálogo  FastAPI + PostgreSQL
                          ├─► Pedidos         FastAPI + PostgreSQL ──► Stock
                          └─► Auditoría       FastAPI + PostgreSQL
```

| Patrón | Dónde |
|---|---|
| API Gateway, filtro de IP, CORS | `gateway/app/main.py`, `gateway/app/rutas.py` |
| Access token JWT RS256 (token issuer) | `auth-service/src/services/authService.js`, `gateway/app/seguridad.py` |
| Circuit Breaker | `gateway/app/circuit_breaker.py`, `pedidos-service/app/cliente_stock.py` |
| Bloqueo pesimista, transacción ACID, idempotencia | `stock-service/app/services/reserva_service.py` |
| Compensación (liberarStock), modo degradado, recuperación | `pedidos-service/app/services/pedido_service.py` |
| Caché con TTL | `stock-service/app/cache.py` |
| DAO | `*/dao/` |
| Log Aggregation (ID de correlación) | `*/logger.py`, `auth-service/src/logger.js` |
| Blockchain (cadena de hashes) | `auditoria-service/app/cadena.py` |
| IA (reglas de asociación) | `stock-service/app/ia.py` |

## Levantar

Requisitos: Docker Desktop, Node.js 22, PowerShell 7.

```powershell
pwsh scripts/levantar.ps1          # conserva los datos
pwsh scripts/levantar.ps1 -Limpio  # desde cero
```

- Frontend: http://localhost:5173
- Gateway: http://localhost:8080/health

## Usuarios de prueba

`admin@uchfyd.com`, `cliente@uchfyd.com`, `inactivo@uchfyd.com`. Contraseñas en `.env`.

## Demo

```powershell
pwsh scripts/demo/demo-completa.ps1
```

| Script | Prueba |
|---|---|
| 01 | Login y token RS256 |
| 02 | Sin token, token alterado, rol insuficiente |
| 03 | 50 pedidos simultáneos, sin sobreventa |
| 04 | Circuit Breaker con Stock caído |
| 05 | Compensación |
| 06 | ID de correlación |
| 07 | Modo degradado (EN ESPERA) |
| 08 | Blockchain |
| 09 | IA |
| 10 | Recuperación tras reiniciar Pedidos |

## Contratos (OpenAPI)

- `GET /api/v1/auth/openapi.yaml`
- `GET /api/v1/stock/openapi.json`
- `GET /api/v1/pedidos/openapi.json`
