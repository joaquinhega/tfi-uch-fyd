import threading
import time


# Caché con TTL
class CacheCatalogo:
    def __init__(self, ttl_segundos: int):
        self.ttl = ttl_segundos
        self._datos = None
        self._expira = 0.0
        self._lock = threading.Lock()

    def obtener(self):
        with self._lock:
            if self._datos is not None and time.monotonic() < self._expira:
                return self._datos
            return None

    def guardar(self, datos) -> None:
        with self._lock:
            self._datos = datos
            self._expira = time.monotonic() + self.ttl

    def invalidar(self) -> None:
        with self._lock:
            self._datos = None