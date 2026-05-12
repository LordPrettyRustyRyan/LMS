class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, headers: dict | None = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.headers = headers or {}


# -------- AUTH ERRORS --------

class EmailAlreadyExists(AppError):
    def __init__(self):
        super().__init__(
            code="EMAIL_ALREADY_EXISTS",
            message="Email already registered",
            status_code=400
        )

class InvalidRole(AppError):
    def __init__(self):
        super().__init__(
            code="INVALID_ROLE",
            message="Invalid Role. Must be 'teacher' or 'student'.",
            status_code=400
        )

class InvalidCredentials(AppError):
    def __init__(self):
        super().__init__(
            code="INVALID_CREDENTIALS",
            message="Incorrect email or password",
            status_code=401,
            headers={"WWW-Authenticate": "Bearer"}
        )

class UserNotFound(AppError):
    def __init__(self):
        super().__init__(
            code="USER_NOT_FOUND",
            message="User not found",
            status_code=404
        )

class Unauthorized(AppError):
    def __init__(self):
        super().__init__(
            code="UNAUTHORIZED",
            message="Invalid authentication credentials",
            status_code=401
        )

class Forbidden(AppError):
    def __init__(self, message="Access forbidden"):
        super().__init__(
            code="FORBIDDEN",
            message=message,
            status_code=403
        )

class OldPasswordRequired(AppError):
    def __init__(self):
        super().__init__(
            code="OLD_PASSWORD_REQUIRED",
            message="Old password required to set a new one",
            status_code=400
        )

class EmptyUpdateRequest(AppError):
    def __init__(self, code="EMPTY_UPDATE_REQUEST", message="No fields provided for update", status_code = 400):
        super().__init__(code, message, status_code)


# -------- ASSIGNMENT ERRORS --------

class AssignmentNotFound(AppError):
    def __init__(self):
        super().__init__(
            code="ASSIGNMENT_NOT_FOUND",
            message="Assignment not found",
            status_code=404
        )

class NotAssignmentOwner(AppError):
    def __init__(self):
        super().__init__(
            code="NOT_ASSIGNMENT_OWNER",
            message="You are not allowed to modify this assignment",
            status_code=403
        )

class InvalidAssignmentState(AppError):
    def __init__(self, message="Invalid assignment state"):
        super().__init__(
            code="INVALID_ASSIGNMENT_STATE",
            message=message,
            status_code=400
        )

class InvalidAssignmentID(AppError):
    def __init__(self, message="Invalid assignment ID"):
        super().__init__(
            code="INVALID_ASSIGNMENT_ID",
            message=message,
            status_code=400
        )

class ClassroomNotFound(AppError):
    def __init__(self):
        super().__init__(
            code="CLASSROOM_NOT_FOUND",
            message="Classroom not found",
            status_code=404
        )

class ClassroomInvalidID(AppError):
    def __init__(self):
        super().__init__(
            code="CLASSROOM_INVALID_ID",
            message="Invalid classroom id",
            status_code=400
        )

class NotClassroomOwner(AppError):
    def __init__(self):
        super().__init__(
            code="NOT_CLASSROOM_OWNER",
            message="You do not own this classroom",
            status_code=403
        )


# -------- ASSIGNMENT ATTEMPT ERRORS --------

class AttemptNotFound(AppError):
    def __init__(self):
        super().__init__(
            code="ATTEMPT_NOT_FOUND",
            message="Attempt not found",
            status_code=404
        )

class NotAttemptOwner(AppError):
    def __init__(self):
        super().__init__(
            code="NOT_ATTEMPT_OWNER",
            message="Not allowed. You do not own this attempt",
            status_code=403
        )

class InvalidAttemptID(AppError):
    def __init__(self):
        super().__init__(
            code="INVALID_ATTEMPT_ID",
            message="Invalid Attempt ID",
            status_code=401
        )

class AttemptAlreadySubmitted(AppError):
    def __init__(self):
        super().__init__(
            code="ATTEMPT_ALREADY_SUBMITTED",
            message="Attempt already submitted",
            status_code=400
        )

class AttemptLocked(AppError):
    def __init__(self):
        super().__init__(
            code="ATTEMPT_LOCKED",
            message="Attempt is locked after submission",
            status_code=400
        )
        

class AssignmentNotAvailable(AppError):
    def __init__(self):
        super().__init__(
            code="ASSIGNMENT_NOT_AVAILABLE",
            message="Assignment is not available",
            status_code=400
        )


# -------- ASSIGNMENT RESPONSES ERRORS --------

class ResponseNotFound(AppError):
    def __init__(self):
        super().__init__(
            code="RESPONSE_NOT_FOUND",
            message="Response not found",
            status_code=404
        )

class NotResponseOwner(AppError):
    def __init__(self):
        super().__init__(
            code="NOT_RESPONSE_OWNER",
            message="You do not own this response",
            status_code=403
        )

class AssignmentClosed(AppError):
    def __init__(self):
        super().__init__(
            code="ASSIGNMENT_CLOSED",
            message="Assignment is closed",
            status_code=400
        )