# TFI UCH-FyD

MVP de la arquitectura SOA del TP3 (Arquitectura de Sistemas, UCh, Grupo 13).
Un comercio donde los clientes se registran, ven el catálogo y hacen pedidos **sin sobreventa de stock**.

## 1. Levantar el sistema

Requisitos: **Docker Desktop** abierto, **Node.js 22** y **PowerShell 7** (`pwsh`).

```powershell
git clone https://github.com/joaquinhega/tfi-uch-fyd.git
cd tfi-uch-fyd
pwsh scripts/levantar.ps1 -Limpio
```

El script crea el `.env` (copia de `.env.example`), genera las claves del token, construye los 10 contenedores y espera a que estén sanos.

| Qué | Dónde |
|---|---|
| Aplicación | http://localhost:5173 |
| Estado del Gateway y sus circuitos | http://localhost:8080/health |

`-Limpio` borra las bases y arranca de cero. Sin `-Limpio` conserva los datos.

**Si algo falla**
- `mongo exited (48)` al usar `-Limpio`: falla intermitente de MongoDB al inicializar. Correr `docker compose up -d --wait`.
- La pantalla no muestra los cambios: recargar con **Ctrl+F5**.
- Ver qué pasó: `docker compose ps -a` y `docker compose logs <servicio>`.

## 2. Usuarios

| Usuario | Contraseña | Qué puede hacer |
|---|---|---|
| `admin@uchfyd.com` | `Admin2026!` | Todo: catálogo, pedidos de todos, cuentas, artículos y auditoría |
| `cliente@uchfyd.com` | `Cliente2026!` | Catálogo y sus propios pedidos |
| `inactivo@uchfyd.com` | `Inactivo2026!` | Nada: el login se rechaza hasta que un admin la active |

Son datos de demo (`MODO=demo`). En producción solo existe el admin, con la contraseña que se ponga en `.env`.

## 3. Qué hace cada módulo

```
Navegador ──► API Gateway ──► Autenticación   Node.js + MongoDB
                          ├─► Stock/Catálogo  FastAPI + PostgreSQL
                          ├─► Pedidos         FastAPI + PostgreSQL ──► Stock
                          └─► Auditoría       FastAPI + PostgreSQL
```

| Carpeta | Módulo | Qué hace | Archivos para mirar |
|---|---|---|---|
| `frontend/` | Aplicación web | Pantallas. Solo habla con el Gateway | `src/api.js`, `src/paginas/` |
| `gateway/` | API Gateway | Única puerta: valida token y rol, filtra IP, Circuit Breaker, ID de correlación, enruta | `app/main.py`, `app/rutas.py`, `app/seguridad.py` |
| `auth-service/` | Autenticación | Registro, login, emite el token (JWT RS256), activa cuentas | `src/services/authService.js` |
| `stock-service/` | Stock y Catálogo | Catálogo con caché, ABM de artículos, reservar/liberar stock sin sobreventa, IA | `app/services/reserva_service.py`, `app/ia.py` |
| `pedidos-service/` | Pedidos | Crea pedidos, pide la reserva a Stock, modo degradado, compensación, recuperación | `app/services/pedido_service.py` |
| `auditoria-service/` | Auditoría | Blockchain: guarda eventos como bloques encadenados por hash y verifica la cadena | `app/cadena.py` |
| `scripts/` | Herramientas | Levantar el sistema y scripts de demo | `levantar.ps1`, `demo/` |

**Todos los servicios Python tienen la misma estructura:**
`routes/` (endpoints) → `services/` (lógica) → `dao/` (base de datos), más `models.py` (tablas) y `schemas.py` (datos de entrada y salida).

## 4. Cómo viaja un pedido

1. `frontend/src/paginas/Catalogo.jsx` → `POST /api/v1/pedidos` con el token.
2. `gateway/app/main.py`: valida el token, asigna el ID de correlación y reenvía a Pedidos.
3. `pedidos-service/.../pedido_service.py`: guarda el pedido PENDIENTE y llama a Stock (con Circuit Breaker).
4. `stock-service/.../reserva_service.py`: bloquea la fila del artículo (`FOR UPDATE`), descuenta y confirma.
5. Pedidos marca el pedido ACEPTADO y envía el evento a Auditoría.
6. Si Stock tarda más de 2 s, la respuesta es **EN ESPERA** y se resuelve después. Si algo falla después de reservar, se **compensa** liberando el stock.

## 5. Patrones y dónde están

Buscar el comentario en el código: cada patrón está marcado con su nombre.

| Patrón | Archivo |
|---|---|
| API Gateway, filtro de IP, CORS | `gateway/app/main.py`, `gateway/app/rutas.py` |
| Access token JWT RS256 (token issuer) | `auth-service/src/services/authService.js`, `gateway/app/seguridad.py` |
| Circuit Breaker | `gateway/app/circuit_breaker.py`, `pedidos-service/app/cliente_stock.py` |
| Bloqueo pesimista, transacción ACID, idempotencia | `stock-service/app/services/reserva_service.py` |
| Compensación, modo degradado, recuperación | `pedidos-service/app/services/pedido_service.py` |
| Caché con TTL | `stock-service/app/cache.py` |
| DAO | `*/dao/` |
| Log Aggregation (ID de correlación) | `*/logger.py`, `auth-service/src/logger.js` |
| Blockchain | `auditoria-service/app/cadena.py` |
| IA (reglas de asociación) | `stock-service/app/ia.py` |

## 6. Probar

```powershell
pwsh scripts/demo/demo-completa.ps1     # los 10 scripts y un resumen
pwsh scripts/demo/04-circuit-breaker.ps1  # uno solo
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

**Comandos útiles**
```powershell
docker compose stop stock-service       # apagar un servicio (ver el Circuit Breaker)
docker compose start stock-service
docker compose logs -f pedidos-service  # logs en vivo
docker compose logs | Select-String <id-de-correlación>
```

## 7. Configuración (`.env`)

| Variable | Para qué |
|---|---|
| `MODO` | `demo` (usuarios y datos de prueba) o `produccion` |
| `NEGOCIO_NOMBRE`, `MONEDA`, `LOCALE` | Datos del negocio que muestra la aplicación |
| `CB_FAIL_MAX`, `CB_RESET_TIMEOUT_SECONDS` | Fallos para abrir el circuito y segundos hasta probar de nuevo |
| `RESERVA_TIMEOUT_SECONDS` | Plazo blando del pedido (2 s) |
| `IP_BLOCKLIST` | IPs bloqueadas en el Gateway |
| `FAULT_AFTER_RESERVE` | Falla inyectada para probar la compensación (solo demo) |

El catálogo inicial está en `stock-service/datos/catalogo.json`.

## 8. Contratos (OpenAPI)

- http://localhost:8080/api/v1/auth/openapi.yaml
- http://localhost:8080/api/v1/stock/openapi.json
- http://localhost:8080/api/v1/pedidos/openapi.json
