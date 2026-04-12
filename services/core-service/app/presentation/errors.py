from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class ProblemException(Exception):
    def __init__(
        self,
        *,
        status: int,
        title: str,
        detail: str,
        type_: str,
        errors: list[dict[str, Any]] | None = None,
    ) -> None:
        self.status = status
        self.title = title
        self.detail = detail
        self.type = type_
        self.errors = errors or []

    def to_dict(self, instance: str) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "type": self.type,
            "title": self.title,
            "status": self.status,
            "detail": self.detail,
            "instance": instance,
        }
        if self.errors:
            payload["errors"] = self.errors
        return payload


def problem_response(*, problem: ProblemException, instance: str) -> JSONResponse:
    return JSONResponse(
        status_code=problem.status,
        content=problem.to_dict(instance=instance),
        media_type="application/problem+json",
    )


def unauthorized_problem(detail: str) -> ProblemException:
    return ProblemException(
        status=401,
        title="Unauthorized",
        detail=detail,
        type_="https://drivemind.dev/problems/unauthorized",
    )


def forbidden_problem(detail: str = "forbidden") -> ProblemException:
    return ProblemException(
        status=403,
        title="Forbidden",
        detail=detail,
        type_="https://drivemind.dev/problems/forbidden",
    )


def not_found_problem(detail: str) -> ProblemException:
    return ProblemException(
        status=404,
        title="Not Found",
        detail=detail,
        type_="https://drivemind.dev/problems/not-found",
    )


def unprocessable_problem(detail: str, errors: list[dict[str, Any]] | None = None) -> ProblemException:
    return ProblemException(
        status=422,
        title="Unprocessable Entity",
        detail=detail,
        type_="https://drivemind.dev/problems/validation-error",
        errors=errors,
    )


async def problem_exception_handler(request: Request, exc: ProblemException) -> JSONResponse:
    return problem_response(problem=exc, instance=str(request.url.path))


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = [
        {
            "field": ".".join(str(item) for item in error.get("loc", [])),
            "message": error.get("msg", "invalid value"),
        }
        for error in exc.errors()
    ]
    problem = ProblemException(
        status=422,
        title="Unprocessable Entity",
        detail="validation_error",
        type_="https://drivemind.dev/problems/validation-error",
        errors=errors,
    )
    return problem_response(problem=problem, instance=str(request.url.path))
