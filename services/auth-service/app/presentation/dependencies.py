from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.application.auth_use_cases import decode_token

bearer = HTTPBearer()

BearerDep = Annotated[HTTPAuthorizationCredentials, Depends(bearer)]


def get_current_payload(credentials: BearerDep) -> dict:
    try:
        return decode_token(credentials.credentials)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_token"
        )


CurrentUserDep = Annotated[dict, Depends(get_current_payload)]


def require_role(*allowed_roles: str):
    def _check(payload: CurrentUserDep) -> dict:
        if payload.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="forbidden"
            )
        return payload

    return _check
