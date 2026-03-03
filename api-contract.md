# FreeEdu API Contract

This document outlines the API endpoints available for the FreeEdu frontend application.
All backend responses now utilize standard RFC-7807 ProblemDetail for errors, giving consistent JSON structures.

## Base URL
Default local development base URL is `http://localhost:8080`

## 1. Authentication (`/api/v1/auth`)

### 1.1. Login User
- **URL**: `/api/v1/auth/login`
- **Method**: `POST`
- **Description**: Authenticates an existing user and returns a JWT token.

**Request Body (JSON):**
```json
{
  "identifier": "user@example.com", // Can be username or email
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
  - `INVALID_CREDENTIALS`: Wrong username/email or password.

---

## 2. User Management (`/api/v1/users`)

### 2.1. Register Student
- **URL**: `/api/v1/users/register`
- **Method**: `POST`
- **Description**: Registers a new user with the `STUDENT` role. Requires `ADMIN` authority.

**Request Body (JSON):**
```json
{
  "email": "user@example.com",
  "username": "student1",
  "password": "strongPassword123"
}
```

**Success (201 Created):**
*(Empty Response Body)*

**Known Errors:**
- `EMAIL_ALREADY_TAKEN` (400 Bad Request): Passed email is already in use.
- `USERNAME_ALREADY_TAKEN` (400 Bad Request): Passed username is already in use.
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token is not an admin token.

---

### 2.2. Create Admin
- **URL**: `/api/v1/users/admin`
- **Method**: `POST`
- **Description**: Registers a new user with the `ADMIN` role. Requires `ADMIN` authority.

**Request Body (JSON):**
```json
{
  "email": "admin@example.com",
  "username": "admin1",
  "password": "secureAdminPassword"
}
```
**Success (201 Created):**
*(Empty Response Body)*

**Known Errors:**
- `EMAIL_ALREADY_TAKEN` (400 Bad Request): Passed email is already in use.
- `USERNAME_ALREADY_TAKEN` (400 Bad Request): Passed username is already in use.
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.

---

### 2.3. Get Current User Profile
- **URL**: `/api/v1/users/me`
- **Method**: `GET`
- **Description**: Retrieves the profile details of the currently authenticated user. Requires a valid JWT.

**Success (200 OK):**
```json
{
  "id": 1,
  "username": "student1",
  "email": "user@example.com",
  "role": "STUDENT",
  "createdAt": "2026-03-02T21:00:00Z"
}
```

**Known Errors:**
- `USER_NOT_FOUND` (404 Not Found): User does not exist (token might be stale).

---

### 2.4. Get User Details
- **URL**: `/api/v1/users/{id}`
- **Method**: `GET`
- **Description**: Retrieves user details. Requires `ADMIN` authority OR the requesting user ID must match the parameter ID.

**Success (200 OK):**
```json
{
  "id": 1,
  "username": "student1",
  "email": "user@example.com",
  "role": "STUDENT",
  "createdAt": "2026-03-02T21:00:00Z"
}
```

**Known Errors:**
- `USER_NOT_FOUND` (404 Not Found): User does not exist.

---

### 2.5. Update User Profile
- **URL**: `/api/v1/users/{id}`
- **Method**: `PUT`
- **Description**: Updates username or email. Requires `ADMIN` authority OR the requesting user ID must match the parameter ID.

**Request Body (JSON):**
```json
{
  "email": "new.email@example.com",
  "username": "newUsername"
}
```

**Success (200 OK):**
```json
{
  "id": 1,
  "username": "newUsername",
  "email": "new.email@example.com",
  "role": "STUDENT",
  "createdAt": "2026-03-02T21:00:00Z"
}
```

**Known Errors:**
- `EMAIL_ALREADY_TAKEN` (400 Bad Request): Passed email is already in use.
- `USERNAME_ALREADY_TAKEN` (400 Bad Request): Passed username is already in use.
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.

---

### 2.6. Change Password
- **URL**: `/api/v1/users/{id}/password`
- **Method**: `PUT`
- **Description**: Changes the user's password. Requires `ADMIN` authority OR the requesting user ID must match the parameter ID.

**Request Body (JSON):**
```json
{
  "oldPassword": "strongPassword123",
  "newPassword": "evenStrongerPassword456"
}
```

**Success (204 No Content):**
*(Empty Response Body)*

**Known Errors:**
- `INVALID_CREDENTIALS` (401 Unauthorized): Old password does not match.

---

### 2.7. Delete User
- **URL**: `/api/v1/users/{id}`
- **Method**: `DELETE`
- **Description**: Deletes a user account. Requires `ADMIN` authority OR the requesting user ID must match the parameter ID.

**Success (204 No Content):**
*(Empty Response Body)*

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
