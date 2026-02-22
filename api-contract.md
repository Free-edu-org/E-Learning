# FreeEdu API Contract

This document outlines the API endpoints available for the FreeEdu frontend application.
All backend responses now utilize standard RFC-7807 ProblemDetail for errors, giving consistent JSON structures.

## Base URL
Default local development base URL is `http://localhost:8080`

## Authentication

### 1. Register User
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Description**: Registers a new user.

**Request Body (JSON):**
```json
{
  "email": "user@example.com",
  "username": "student1",
  "password": "strongPassword123",
  "role": "STUDENT" // Can be STUDENT or ADMIN
}
```

**Success (201 Created):**
```json
{
  "token": "eyJhbGci... (JWT token)",
  "role": "STUDENT"
}
```

**Known Errors (400 Bad Request / 401 Unauthorized):**
- Returns a standard ProblemDetail JSON structure with custom `code` property.
- Example `code` values:
  - `EMAIL_ALREADY_TAKEN`: Passed email is already in use.
  - `VALIDATION_FAILED`: Fields are missing or invalid.

---

### 2. Login User
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Description**: Authenticates an existing user and returns a JWT token.

**Request Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "strongPassword123"
}
```

**Success (200 OK):**
```json
{
  "token": "eyJhbGci... (JWT token)",
  "role": "STUDENT"
}
```

**Known Errors (401 Unauthorized):**
- Example `code` values:
  - `INVALID_CREDENTIALS`: Wrong email or password.

---

## Global Application Errors
In case of internal server errors, validation failures, or other unforeseen errors, the API will respond using a JSON structure mimicking RFC-7807 standard (with an added `code` field corresponding to Java `ErrorCode`):
```json
{
  "type": "/api/auth/register",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed: email: must not be blank",
  "instance": "/api/auth/register",
  "code": "VALIDATION_FAILED"
}
```

## Swagger UI Auto-Generation
You can view and test the fully interactive endpoints using Swagger UI (provided by `springdoc`).
Once the backend is running, navigate your browser to:
- `http://localhost:8080/swagger-ui.html`
Raw OpenAPI specs are also available at `http://localhost:8080/v3/api-docs`
