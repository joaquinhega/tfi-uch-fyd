import os

import jwt

# JWT RS256: el Gateway solo tiene la clave pública
PUBLIC_KEY = open(os.environ["JWT_PUBLIC_KEY_FILE"], encoding="utf-8").read()
JWT_ISSUER = os.getenv("JWT_ISSUER", "uch-fyd-auth")


def validar_token(authorization: str | None):
    if not authorization or not authorization.lower().startswith("bearer "):
        return None, "Falta el token de acceso"
    token = authorization[7:].strip()
    try:
        claims = jwt.decode(
            token,
            PUBLIC_KEY,
            algorithms=["RS256"],
            issuer=JWT_ISSUER,
            options={"require": ["exp", "sub", "iss"]},
        )
    except jwt.ExpiredSignatureError:
        return None, "Token vencido"
    except jwt.InvalidTokenError:
        return None, "Token inválido"
    return {"id": claims["sub"], "rol": claims.get("rol", ""), "email": claims.get("email", "")}, None