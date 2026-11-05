import threading
import time

from app.logger import log


class CircuitoAbierto(Exception):
    """Se rechaza la llamada sin intentarla: el servicio remoto viene fallando."""


class CircuitBreaker:
    """Patrón Circuit Breaker (TP2 §4.1, TP3 §3).

    CERRADO     -> las llamadas pasan. Cuenta fallos consecutivos.
    ABIERTO     -> tras N fallos, se rechaza todo al instante (no se espera a un servicio caído).
    SEMIABIERTO -> pasado el tiempo de espera, se deja pasar UNA llamada de prueba:
                   si funciona, se cierra; si falla, se vuelve a abrir.
    """

    CERRADO = "CERRADO"
    ABIERTO = "ABIERTO"
    SEMIABIERTO = "SEMIABIERTO"

    def __init__(self, nombre: str, max_fallos: int, segundos_abierto: float):
        self.nombre = nombre
        self.max_fallos = max_fallos
        self.segundos_abierto = segundos_abierto
        self._estado = self.CERRADO
        self._fallos = 0
        self._abierto_desde = 0.0
        self._prueba_en_curso = False
        self._lock = threading.Lock()

    @property
    def estado(self) -> str:
        return self._estado

    def llamar(self, funcion, *args, **kwargs):
        with self._lock:
            if self._estado == self.ABIERTO:
                if time.monotonic() - self._abierto_desde < self.segundos_abierto:
                    raise CircuitoAbierto(f"Circuito hacia {self.nombre} ABIERTO")
                self._cambiar(self.SEMIABIERTO)
            if self._estado == self.SEMIABIERTO:
                if self._prueba_en_curso:
                    raise CircuitoAbierto(f"Circuito hacia {self.nombre} SEMIABIERTO: prueba en curso")
                self._prueba_en_curso = True

        try:
            resultado = funcion(*args, **kwargs)
        except Exception:
            self._registrar_fallo()
            raise
        self._registrar_exito()
        return resultado

    def _registrar_fallo(self) -> None:
        with self._lock:
            self._prueba_en_curso = False
            self._fallos += 1
            if self._estado == self.SEMIABIERTO or self._fallos >= self.max_fallos:
                self._abierto_desde = time.monotonic()
                self._cambiar(self.ABIERTO)

    def _registrar_exito(self) -> None:
        with self._lock:
            self._prueba_en_curso = False
            self._fallos = 0
            if self._estado != self.CERRADO:
                self._cambiar(self.CERRADO)

    def _cambiar(self, nuevo: str) -> None:
        log("warning", f"circuito hacia {self.nombre}: {self._estado} -> {nuevo}", circuito=nuevo, fallos=self._fallos)
        self._estado = nuevo