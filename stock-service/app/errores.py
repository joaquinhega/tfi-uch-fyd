class ErrorNegocio(Exception):
    def __init__(self, status: int, codigo: str, mensaje: str):
        super().__init__(mensaje)
        self.status = status
        self.codigo = codigo
        self.mensaje = mensaje