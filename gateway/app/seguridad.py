import os

import jwt

# El Gateway solo tiene la clave PÚBLICA: puede validar tokens, nunca emitirlos (TP3 §5).
PUBLIC_KEY = open(os.environ["JWT_PUBLIC_KEY_FILE"], encoding="utf-8").read()
JWT_ISSUER = os.getenv("JWT_ISSUER", "uch-fyd-auth")


def validar_token(authorization: str | None):
    """Devuelve (identidad, error). Valida firma, emisor y vencimiento sin consultar a Autenticación."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None, "Falta el token de acceso"
    token = authorization[7:].strip()
    try:
        claims = jwt.decode(
            token,
            PUBLIC_KEY,
            algorithms=["RS256"],  # algoritmo fijo: se rechaza cualquier otro
            issuer=JWT_ISSUER,
            options={"require": ["exp", "sub", "iss"]},
        )
    except jwt.ExpiredSignatureError:
        return None, "Token vencido"
    except jwt.InvalidTokenError:
        return None, "Token inválido"
    return {"id": claims["sub"], "rol": claims.get("rol", ""), "email": claims.get("email", "")}, None