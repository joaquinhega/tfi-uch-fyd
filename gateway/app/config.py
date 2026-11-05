import os

# Filtrado por IP (TP3 §5): IPs separadas por coma. Una IP bloqueada queda bloqueada para los tres servicios.
IP_BLOCKLIST = {ip.strip() for ip in os.getenv("IP_BLOCKLIST", "").split(",") if ip.strip()}

# Circuit Breaker por servicio (TP3 §3)
CB_FAIL_MAX = int(os.getenv("CB_FAIL_MAX", "3"))
CB_RESET_TIMEOUT_SECONDS = float(os.getenv("CB_RESET_TIMEOUT_SECONDS", "15"))

# Tiempo máximo de espera de una respuesta de un servicio
TIMEOUT_SERVICIOS_SECONDS = float(os.getenv("TIMEOUT_SERVICIOS_SECONDS", "10"))