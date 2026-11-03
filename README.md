# TFI UCH-FyD — MVP de la arquitectura SOA

Trabajo final de Arquitectura de Sistemas (Universidad Champagnat). Grupo 13.
Implementa la arquitectura del TP3 corregido: API Gateway + 3 servicios con base propia.

## Estructura
| Carpeta | Componente | Stack |
|---|---|---|
| gateway/ | API Gateway (único punto de entrada) | FastAPI |
| auth-service/ | Autenticación y emisión del JWT | Node.js + MongoDB |
| stock-service/ | Stock/Catálogo (reserva y liberación) | FastAPI + PostgreSQL |
| pedidos-service/ | Pedidos | FastAPI + PostgreSQL |
| frontend/ | SPA mínima | React + Vite |
| docs/adr/ | Decisiones arquitectónicas | Markdown |
| scripts/demo/ | Scripts de la demo | PowerShell |

## Estado
En construcción. Ver el backlog en Drive (carpeta TFI).