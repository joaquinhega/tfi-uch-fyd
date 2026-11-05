from contextvars import ContextVar

# ID de correlación del pedido en curso (lo genera el Gateway)
correlation_id: ContextVar[str] = ContextVar("correlation_id", default="-")