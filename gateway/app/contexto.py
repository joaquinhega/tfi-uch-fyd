from contextvars import ContextVar

# ID de correlación del pedido en curso: viaja por todos los servicios y aparece en todos los logs
correlation_id: ContextVar[str] = ContextVar("correlation_id", default="-")