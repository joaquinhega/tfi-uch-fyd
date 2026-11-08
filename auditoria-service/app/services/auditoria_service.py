from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.cadena import HASH_GENESIS, calcular_hash, verificar_cadena
from app.contexto import correlation_id
from app.dao.bloque_dao import BloqueDao
from app.logger import log
from app.models import Bloque
from app.schemas import BloqueOut, EventoIn, VerificacionOut


class AuditoriaService:
    def __init__(self, session: Session):
        self.session = session
        self.dao = BloqueDao(session)

    def _encadenar(self, tipo: str, servicio: str, datos: dict) -> Bloque:
        ultimo = self.dao.ultimo()
        indice = 0 if ultimo is None else ultimo.indice + 1
        hash_anterior = HASH_GENESIS if ultimo is None else ultimo.hash
        ts = datetime.now(timezone.utc).isoformat()
        bloque = Bloque(
            indice=indice, ts=ts, tipo=tipo, servicio=servicio, datos=datos, hash_anterior=hash_anterior,
            hash=calcular_hash(indice, ts, tipo, servicio, datos, hash_anterior),
            correlation_id=correlation_id.get(),
        )
        self.dao.agregar(bloque)
        return bloque

    def crear_genesis_si_falta(self) -> None:
        with self.session.begin():
            self.dao.bloquear_cadena()
            if self.dao.ultimo() is None:
                self._encadenar("GENESIS", "auditoria", {"descripcion": "Inicio de la cadena de auditoría"})
                log("info", "bloque génesis creado")

    def registrar(self, evento: EventoIn) -> BloqueOut:
        with self.session.begin():
            self.dao.bloquear_cadena()
            bloque = self._encadenar(evento.tipo, evento.servicio, evento.datos)
        log("info", "bloque agregado", indice=bloque.indice, tipo=bloque.tipo, hash=bloque.hash[:12])
        return BloqueOut.model_validate(bloque)

    def listar(self, limite: int) -> list[BloqueOut]:
        return [BloqueOut.model_validate(b) for b in self.dao.listar(limite)]

    def verificar(self) -> VerificacionOut:
        resultado = VerificacionOut(**verificar_cadena(self.dao.todos()))
        log("info" if resultado.valida else "critical", "verificación de la cadena", **resultado.model_dump())
        return resultado