from typing import Any, Optional


def success_response(data: Any = None, message: Optional[str] = None):
    return {
        "success": True,
        "data": data,
        "message": message
    }


def error_response(code: str, message: str):
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message
        }
    }