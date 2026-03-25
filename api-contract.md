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
  "identifier": "user@example.com",
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

**Known Errors:**
- `INVALID_CREDENTIALS` (401 Unauthorized): Wrong username/email or password.
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.

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
- `EMAIL_ALREADY_TAKEN` (409 Conflict): Passed email is already in use.
- `USERNAME_ALREADY_TAKEN` (409 Conflict): Passed username is already in use.
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
- `EMAIL_ALREADY_TAKEN` (409 Conflict): Passed email is already in use.
- `USERNAME_ALREADY_TAKEN` (409 Conflict): Passed username is already in use.
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token is not an admin token.

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
  "createdAt": "2026-03-02T21:00:00"
}
```

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
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
  "createdAt": "2026-03-02T21:00:00"
}
```

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Lack of permissions (not an admin or owner).
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
  "createdAt": "2026-03-02T21:00:00"
}
```

**Known Errors:**
- `EMAIL_ALREADY_TAKEN` (409 Conflict): Passed email is already in use.
- `USERNAME_ALREADY_TAKEN` (409 Conflict): Passed username is already in use.
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Lack of permissions (not an admin or owner).
- `USER_NOT_FOUND` (404 Not Found): User does not exist.

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
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.
- `INVALID_CREDENTIALS` (401 Unauthorized): Old password does not match or token is invalid.
- `FORBIDDEN` (403 Forbidden): Lack of permissions (not an admin or owner).
- `USER_NOT_FOUND` (404 Not Found): User does not exist.

---

### 2.7. Delete User
- **URL**: `/api/v1/users/{id}`
- **Method**: `DELETE`
- **Description**: Deletes a user account. Requires `ADMIN` authority OR the requesting user ID must match the parameter ID.

**Success (204 No Content):**
*(Empty Response Body)*

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Lack of permissions (not an admin or owner).
- `USER_NOT_FOUND` (404 Not Found): User does not exist.

---

## 3. User Groups (`/api/v1/user-groups`)

### 3.1. Create User Group
- **URL**: `/api/v1/user-groups`
- **Method**: `POST`
- **Description**: Creates a new user group. Group name must be unique. Requires `ADMIN` authority.

**Request Body (JSON):**
```json
{
  "name": "Angielski A1",
  "description": "Grupa początkująca - semestr letni"
}
```

**Success (201 Created):**
```json
{
  "id": 1,
  "name": "Angielski A1",
  "description": "Grupa początkująca - semestr letni",
  "studentCount": 0,
  "createdAt": "2026-03-21T10:00:00"
}
```

**Known Errors:**
- `GROUP_NAME_ALREADY_EXISTS` (409 Conflict): Group with this name already exists.
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token is not an admin token.

---

### 3.2. Get All User Groups
- **URL**: `/api/v1/user-groups`
- **Method**: `GET`
- **Description**: Returns a list of all user groups. Requires `ADMIN` authority.

**Success (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Angielski A1",
    "description": "Grupa początkująca - semestr letni",
    "studentCount": 2,
    "createdAt": "2026-03-21T10:00:00"
  }
]
```

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token is not an admin token.

---

### 3.3. Get User Group by ID
- **URL**: `/api/v1/user-groups/{id}`
- **Method**: `GET`
- **Description**: Returns a single user group by its ID. Requires `ADMIN` authority.

**Success (200 OK):**
```json
{
  "id": 1,
  "name": "Angielski A1",
  "description": "Grupa początkująca - semestr letni",
  "studentCount": 2,
  "createdAt": "2026-03-21T10:00:00"
}
```

**Known Errors:**
- `USER_GROUP_NOT_FOUND` (404 Not Found): Group does not exist.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token is not an admin token.

---

### 3.4. Update User Group
- **URL**: `/api/v1/user-groups/{id}`
- **Method**: `PUT`
- **Description**: Updates name and/or description of an existing group. Requires `ADMIN` authority.

**Request Body (JSON):**
```json
{
  "name": "Angielski B1",
  "description": "Grupa średniozaawansowana"
}
```

**Success (200 OK):**
```json
{
  "id": 1,
  "name": "Angielski B1",
  "description": "Grupa średniozaawansowana",
  "studentCount": 2,
  "createdAt": "2026-03-21T10:00:00"
}
```

**Known Errors:**
- `USER_GROUP_NOT_FOUND` (404 Not Found): Group does not exist.
- `GROUP_NAME_ALREADY_EXISTS` (409 Conflict): Another group with this name already exists.
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token is not an admin token.

---

### 3.5. Delete User Group
- **URL**: `/api/v1/user-groups/{id}`
- **Method**: `DELETE`
- **Description**: Deletes a user group and all member associations. Does not delete user accounts. Requires `ADMIN` authority.

**Success (204 No Content):**
*(Empty Response Body)*

**Known Errors:**
- `USER_GROUP_NOT_FOUND` (404 Not Found): Group does not exist.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token is not an admin token.

---

### 3.6. Add Member to Group
- **URL**: `/api/v1/user-groups/{id}/members/{userId}`
- **Method**: `POST`
- **Description**: Adds a student to a group. Only users with role `STUDENT` can be added. A student can belong to at most one group. Requires `ADMIN` authority.

**Success (204 No Content):**
*(Empty Response Body)*

**Known Errors:**
- `USER_GROUP_NOT_FOUND` (404 Not Found): Group does not exist.
- `USER_NOT_FOUND` (404 Not Found): User does not exist.
- `INVALID_ROLE_FOR_GROUP` (400 Bad Request): User is not a student.
- `STUDENT_ALREADY_IN_GROUP` (409 Conflict): Student is already assigned to a group.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token is not an admin token.

---

### 3.7. Remove Member from Group
- **URL**: `/api/v1/user-groups/{id}/members/{userId}`
- **Method**: `DELETE`
- **Description**: Removes a student from a group. Does not delete the user account. Requires `ADMIN` authority.

**Success (204 No Content):**
*(Empty Response Body)*

**Known Errors:**
- `USER_GROUP_NOT_FOUND` (404 Not Found): Group does not exist.
- `MEMBER_NOT_IN_GROUP` (404 Not Found): User is not a member of this group.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token is not an admin token.

---

# 4. Lessons (`/api/v1/lessons`)

Poniżej znajdziesz opis endpointów do zarządzania lekcjami. Ścieżka bazowa: `/api/v1/lessons`.

### 4.1. Get list of lessons
- **URL**: `/api/v1/lessons`
- **Method**: `GET`
- **Description**: Pobiera listę lekcji. Obsługuje filtry i sortowanie.
- **Query params**:
  - `search` (string, opcjonalne) — wyszukiwanie po tytule / temacie
  - `groupId` (integer, opcjonalne) — filtr po przypisanej grupie
  - `status` (boolean, opcjonalne) — filtr po polu `isActive`
  - `sort` (string, opcjonalne) — np. `createdAt:desc` lub `title:asc`
- **Authorization**: `TEACHER` lub `ADMIN`

**Success (200 OK):**
```json
[
  {
    "id": 12,
    "title": "Present Simple - lesson 1",
    "theme": "Grammar",
    "isActive": true,
    "teacherId": 3,
    "createdAt": "2026-03-21T10:00:00",
    "groups": [ { "id": 1, "name": "Angielski A1" } ]
  }
]
```

| Field | Type                  | Description |
|-------|-----------------------|-------------|
| `id` | Inteager              | ID lekcji |
| `title` | String                | Tytuł lekcji |
| `theme` | String                | Temat kategorii lekcji |
| `isActive` | Boolean               | Czy lekcja jest aktywna |
| `teacherId` | Integer               | ID nauczyciela, który utworzył lekcję |
| `createdAt` | String (ISO datetime) | Data utworzenia |
| `groups` | List<GroupDto>        | Lista grup przypisanych do lekcji (id, name) |

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 4.2. Create a new lesson
- **URL**: `/api/v1/lessons`
- **Method**: `POST`
- **Description**: Tworzy nową lekcję. Można jednocześnie przypisać lekcję do grup.
- **Authorization**: `TEACHER`

**Request Body (JSON):**
```json
{
  "title": "Present Simple - lesson 1",
  "theme": "Grammar",
  "groupIds": [1, 2]
}
```

**Success (201 Created):**
Zwraca utworzoną reprezentację `LessonResponse` (jak w sekcji 4.1).

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Brak wymaganych pól (`title`, `theme`) lub złe typy.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit creation.

---

### 4.3. Update lesson data
- **URL**: `/api/v1/lessons/{id}`
- **Method**: `PUT`
- **Description**: Aktualizuje pola lekcji (title, theme, description, group assignment). Wymaga uprawnień nauczyciela.
- **Authorization**: `TEACHER`

**Request Body (JSON):**
Używa tego samego kształtu co `LessonRequest` (patrz 4.2).

**Success (200 OK):**
Zwraca zaktualizowaną reprezentację `LessonResponse`.

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Złe dane wejściowe.
- `USER_NOT_FOUND` / `LESSON_NOT_FOUND` (404 Not Found): Nie znaleziono lekcji (lub powiązanych zasobów).
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden)

---

### 4.4. Quick status change (is_active)
- **URL**: `/api/v1/lessons/{id}/status`
- **Method**: `PATCH`
- **Description**: Szybka zmiana flagi `isActive` (włącz/wyłącz lekcję).
- **Authorization**: `TEACHER`

**Request Body (JSON):**
```json
{ "isActive": true }
```

**Success (204 No Content):** *(Empty Response Body)*

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request)
- `LESSON_NOT_FOUND` (404 Not Found)
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden)

---

### 4.5. Delete lesson
- **URL**: `/api/v1/lessons/{id}`
- **Method**: `DELETE`
- **Description**: Usuwa lekcję. Wymaga roli `TEACHER`.
- **Authorization**: `TEACHER`

**Success (204 No Content):** *(Empty Response Body)*

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden)

---

## 5. Teacher Stats (`/api/v1/teacher/stats`)

### 5.1. Get Dashboard Statistics
- **URL**: `/api/v1/teacher/stats`
- **Method**: `GET`
- **Description**: Returns aggregated dashboard statistics: total and active lesson counts, active student count, and average answer score. Requires `ADMIN` authority.

**Success (200 OK):**
```json
{
  "totalLessons": 5,
  "activeLessons": 3,
  "activeStudents": 12,
  "avgScore": 72.5
}
```

| Field | Type | Description |
|-------|------|-------------|
| `totalLessons` | Long | Total number of lessons in the system. |
| `activeLessons` | Long | Number of lessons where `is_active = TRUE`. |
| `activeStudents` | Long | Distinct students belonging to groups that have at least one lesson assigned. |
| `avgScore` | Double | Average correctness score (0–100). Returns `0.0` when no answers exist (COALESCE guard). |

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token is not an admin token (e.g. STUDENT role).

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
