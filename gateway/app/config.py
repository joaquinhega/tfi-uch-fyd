import os

IP_BLOCKLIST = {ip.strip() for ip in os.getenv("IP_BLOCKLIST", "").split(",") if ip.strip()}

CB_FAIL_MAX = int(os.getenv("CB_FAIL_MAX", "3"))
CB_RESET_TIMEOUT_SECONDS = float(os.getenv("CB_RESET_TIMEOUT_SECONDS", "15"))

CONNECT_TIMEOUT_SECONDS = float(os.getenv("CONNECT_TIMEOUT_SECONDS", "2"))
TIMEOUT_SERVICIOS_SECONDS = float(os.getenv("TIMEOUT_SERVICIOS_SECONDS", "10"))

CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]