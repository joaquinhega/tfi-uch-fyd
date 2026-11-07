import os

# Filtrado por IP (TP3 §5): IPs separadas por coma. Una IP bloqueada queda bloqueada para los tres servicios.
IP_BLOCKLIST = {ip.strip() for ip in os.getenv("IP_BLOCKLIST", "").split(",") if ip.strip()}

# Circuit Breaker por servicio (TP3 §3)
CB_FAIL_MAX = int(os.getenv("CB_FAIL_MAX", "3"))
CB_RESET_TIMEOUT_SECONDS = float(os.getenv("CB_RESET_TIMEOUT_SECONDS", "15"))

# Tiempos máximos hacia los servicios:
#   conexión corta (fail fast): si un servicio no acepta la conexión en 2 s se lo considera caído
#   respuesta más larga: un pedido puede tardar hasta ~2 s por el plazo blando
CONNECT_TIMEOUT_SECONDS = float(os.getenv("CONNECT_TIMEOUT_SECONDS", "2"))
TIMEOUT_SERVICIOS_SECONDS = float(os.getenv("TIMEOUT_SERVICIOS_SECONDS", "10"))

# CORS: solo la SPA puede llamar al Gateway desde el navegador
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]