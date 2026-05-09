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
- `ACCOUNT_NOT_ACTIVE` (401 Unauthorized): Account is in `INVITED` state and still requires initial activation.
- `EMAIL_VERIFICATION_REQUIRED` (401 Unauthorized): Account exists, but the student has not confirmed their email address yet.
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.

---

### 1.2. Request Password Reset Link
- **URL**: `/api/v1/auth/forgot-password`
- **Method**: `POST`
- **Description**: Requests a password reset link for the user account identified by email. For security reasons, the endpoint always returns the same accepted response, regardless of whether the account exists.

**Request Body (JSON):**
```json
{
  "email": "user@example.com"
}
```

**Success (202 Accepted):**
```json
{
  "message": "If the account exists, a reset link has been sent."
}
```

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.

---

### 1.3. Reset Password
- **URL**: `/api/v1/auth/reset-password`
- **Method**: `POST`
- **Description**: Resets the account password using a valid password reset token.

**Request Body (JSON):**
```json
{
  "token": "password-reset-token",
  "newPassword": "newStrongPassword123!",
  "confirmPassword": "newStrongPassword123!"
}
```

**Success (204 No Content):**
*(Empty Response Body)*

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.
- `PASSWORD_CONFIRMATION_MISMATCH` (400 Bad Request): `newPassword` and `confirmPassword` do not match.
- `PASSWORD_RESET_TOKEN_INVALID` (400 Bad Request): Reset token does not exist or is invalid.
- `PASSWORD_RESET_TOKEN_EXPIRED` (400 Bad Request): Reset token has expired.
- `PASSWORD_RESET_TOKEN_USED` (400 Bad Request): Reset token has already been used.

---

### 1.4. Validate Invitation Token *(no auth required)*
- **URL**: `/api/v1/auth/invite/{token}`
- **Method**: `GET`
- **Description**: Validates an account activation token and returns the associated email. Used by the activation page to pre-fill the email field before the student sets their credentials.

**Success (200 OK):**
```json
{
  "email": "student@example.com"
}
```

**Known Errors:**
- `INVITATION_TOKEN_INVALID` (400 Bad Request): Token does not exist or is malformed.
- `INVITATION_TOKEN_EXPIRED` (400 Bad Request): Token has passed its expiration time.
- `INVITATION_TOKEN_USED` (400 Bad Request): Token has already been used.

---

### 1.5. Activate Account *(no auth required)*
- **URL**: `/api/v1/auth/activate`
- **Method**: `POST`
- **Description**: Finalizes an invited student account. The student provides the token from the email link, chooses a username and password. The account status changes from `INVITED` to `ACTIVE` and the token is invalidated.

**Request Body (JSON):**
```json
{
  "token": "activation-token-from-email",
  "username": "jan_kowalski",
  "password": "strongPassword123"
}
```

**Success (204 No Content):**
*(Empty Response Body)*

**Known Errors:**
- `INVITATION_TOKEN_INVALID` (400 Bad Request): Token does not exist or is malformed.
- `INVITATION_TOKEN_EXPIRED` (400 Bad Request): Token has passed its expiration time.
- `INVITATION_TOKEN_USED` (400 Bad Request): Token has already been used.
- `ACCOUNT_ALREADY_ACTIVE` (409 Conflict): Account is already active.
- `USERNAME_ALREADY_TAKEN` (409 Conflict): Chosen username is already in use.
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.

---

### 1.6. Get Email Verification Token Info *(no auth required)*
- **URL**: `/api/v1/auth/email-verification/{token}`
- **Method**: `GET`
- **Description**: Returns the current state of an email verification token and the email address linked to it. Used by the public verification screen reached from the email link.

**Success (200 OK):**
```json
{
  "email": "student@example.com",
  "status": "VALID"
}
```

**Possible `status` values:**
- `VALID`
- `EXPIRED`
- `USED`
- `ALREADY_VERIFIED`

**Known Errors:**
- `EMAIL_VERIFICATION_TOKEN_INVALID` (400 Bad Request): Token does not exist or is malformed.

---

### 1.7. Confirm Email Verification *(no auth required)*
- **URL**: `/api/v1/auth/email-verification/confirm`
- **Method**: `POST`
- **Description**: Confirms a student's email address using a valid verification token. On success, the account status changes from `EMAIL_VERIFICATION_PENDING` to `ACTIVE`.

**Request Body (JSON):**
```json
{
  "token": "email-verification-token"
}
```

**Success (204 No Content):**
*(Empty Response Body)*

**Known Errors:**
- `EMAIL_VERIFICATION_TOKEN_INVALID` (400 Bad Request): Token does not exist or is malformed.
- `EMAIL_VERIFICATION_TOKEN_EXPIRED` (400 Bad Request): Token has passed its expiration time.
- `EMAIL_VERIFICATION_TOKEN_USED` (400 Bad Request): Token has already been used.
- `EMAIL_ALREADY_VERIFIED` (409 Conflict): Account has already completed email verification.
- `EMAIL_VERIFICATION_NOT_PENDING` (409 Conflict): Account is not in `EMAIL_VERIFICATION_PENDING` state.
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.

---

### 1.8. Resend Email Verification *(no auth required)*
- **URL**: `/api/v1/auth/email-verification/resend`
- **Method**: `POST`
- **Description**: Resends the email verification link for an account awaiting email confirmation. For security reasons, the endpoint always returns the same accepted response, regardless of whether the email belongs to a pending account.

**Request Body (JSON):**
```json
{
  "email": "student@example.com"
}
```

**Success (202 Accepted):**
```json
{
  "message": "If the account is awaiting email verification, a verification link has been sent."
}
```

**Known Errors:**
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
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

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
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 2.2.1. Create Teacher
- **URL**: `/api/v1/users/teacher`
- **Method**: `POST`
- **Description**: Registers a new user with the `TEACHER` role. Requires `ADMIN` authority.

**Request Body (JSON):**
```json
{
  "email": "teacher@example.com",
  "username": "teacher1",
  "password": "secureTeacherPassword"
}
```

**Success (201 Created):**
*(Empty Response Body)*

**Known Errors:**
- `EMAIL_ALREADY_TAKEN` (409 Conflict): Passed email is already in use.
- `USERNAME_ALREADY_TAKEN` (409 Conflict): Passed username is already in use.
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 2.3. Get Current User Profile
- **URL**: `/api/v1/users/me`
- **Method**: `GET`
- **Description**: Retrieves the profile details of the currently authenticated user. Requires a valid JWT.

**Success (200 OK):**
```json
{
  "publicId": "33333333-3333-3333-3333-333333333333",
  "username": "student1",
  "email": "user@example.com",
  "role": "STUDENT",
  "status": "ACTIVE",
  "createdAt": "2026-03-02T21:00:00",
  "avatarUrl": "preset:avatar_1"
}
```

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `USER_NOT_FOUND` (404 Not Found): User does not exist (token might be stale).

---

### 2.4. Get User Details
- **URL**: `/api/v1/users/{publicId}`
- **Method**: `GET`
- **Description**: Retrieves user details. Requires `ADMIN` authority OR requester is the same user (`owner`) OR `TEACHER` authority with access only to students assigned to one of the current teacher's groups.

**Success (200 OK):**
```json
{
  "publicId": "33333333-3333-3333-3333-333333333333",
  "username": "student1",
  "email": "user@example.com",
  "role": "STUDENT",
  "status": "ACTIVE",
  "createdAt": "2026-03-02T21:00:00",
  "avatarUrl": "preset:avatar_1"
}
```

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Lack of permissions (not admin, not owner, and no teacher-group-student relation).
- `USER_NOT_FOUND` (404 Not Found): User does not exist.

---

### 2.5. Update User Profile
- **URL**: `/api/v1/users/{publicId}`
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
  "publicId": "33333333-3333-3333-3333-333333333333",
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
- `FORBIDDEN` (403 Forbidden): Lack of permissions (not admin and not owner).
- `USER_NOT_FOUND` (404 Not Found): User does not exist.

---

### 2.6. Change Password
- **URL**: `/api/v1/users/{publicId}/password`
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
- `INVALID_OLD_PASSWORD` (401 Unauthorized): Old password does not match.
- `UNAUTHORIZED` (401 Unauthorized): Token is invalid or missing.
- `FORBIDDEN` (403 Forbidden): Lack of permissions (not admin and not owner).
- `USER_NOT_FOUND` (404 Not Found): User does not exist.

**Invalid old password response (401 Unauthorized):**
```json
{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Obecne hasło jest nieprawidłowe.",
  "instance": "/api/v1/users/1/password",
  "code": "INVALID_OLD_PASSWORD"
}
```

---

### 2.7. Delete User
- **URL**: `/api/v1/users/{publicId}`
- **Method**: `DELETE`
- **Description**: Deletes a user account. Requires `ADMIN` authority OR the requesting user ID must match the parameter ID.

**Success (204 No Content):**
*(Empty Response Body)*

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Lack of permissions (not admin and not owner).
- `USER_NOT_FOUND` (404 Not Found): User does not exist.

---

### 2.8. Upload Avatar
- **URL**: `/api/v1/users/{publicId}/avatar`
- **Method**: `POST`
- **Description**: Uploads a custom avatar image (JPEG, PNG). Maximum file size is 2 MB. Requires `ADMIN` authority OR the requesting user ID must match the parameter ID.

**Request:** `multipart/form-data`
- `file`: The image file to upload.

**Success (200 OK):**
```json
{
  "publicId": "33333333-3333-3333-3333-333333333333",
  "username": "student1",
  "email": "user@example.com",
  "role": "STUDENT",
  "createdAt": "2026-03-02T21:00:00",
  "avatarUrl": "/uploads/avatars/1.jpg"
}
```

**Known Errors:**
- `AVATAR_INVALID_FILE_TYPE` (400 Bad Request): File format is not JPEG or PNG.
- `AVATAR_FILE_TOO_LARGE` (400 Bad Request): File is larger than 2 MB.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Lack of permissions (not admin and not owner).
- `USER_NOT_FOUND` (404 Not Found): User does not exist.

---

### 2.9. Set Preset Avatar
- **URL**: `/api/v1/users/{publicId}/avatar/preset`
- **Method**: `PUT`
- **Description**: Sets the user's avatar to one of the predefined presets (e.g., `avatar_1`, `avatar_2`). Requires `ADMIN` authority OR the requesting user ID must match the parameter ID.

**Request Body (JSON):**
```json
{
  "presetName": "avatar_3"
}
```

**Success (200 OK):**
```json
{
  "publicId": "33333333-3333-3333-3333-333333333333",
  "username": "student1",
  "email": "user@example.com",
  "role": "STUDENT",
  "createdAt": "2026-03-02T21:00:00",
  "avatarUrl": "preset:avatar_3"
}
```

**Known Errors:**
- `AVATAR_INVALID_PRESET` (400 Bad Request): Preset name is not in the allowed list.
- `VALIDATION_FAILED` (400 Bad Request): Request body is missing or invalid.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Lack of permissions (not admin and not owner).
- `USER_NOT_FOUND` (404 Not Found): User does not exist.

---

## 3. User Groups (`/api/v1/user-groups`)

### 3.1. Create User Group
- **URL**: `/api/v1/user-groups`
- **Method**: `POST`
- **Description**: Creates a new user group. Group name must be unique. Requires `ADMIN` or `TEACHER` authority.

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
  "publicId": "33333333-3333-3333-3333-333333333333",
  "name": "Angielski A1",
  "description": "Grupa początkująca - semestr letni",
  "studentCount": 0,
  "teacherPublicId": "22222222-2222-2222-2222-222222222222",
  "createdAt": "2026-03-21T10:00:00"
}
```

**Known Errors:**
- `GROUP_NAME_ALREADY_EXISTS` (409 Conflict): Group with this name already exists.
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 3.2. Get All User Groups
- **URL**: `/api/v1/user-groups`
- **Method**: `GET`
- **Description**: Returns user groups visible to current user. `ADMIN` gets all groups, `TEACHER` gets only own groups (`teacher_id = currentUserId`).

**Success (200 OK):**
```json
[
  {
    "publicId": "33333333-3333-3333-3333-333333333333",
    "name": "Angielski A1",
    "description": "Grupa początkująca - semestr letni",
    "studentCount": 2,
    "teacherPublicId": "22222222-2222-2222-2222-222222222222",
    "createdAt": "2026-03-21T10:00:00"
  }
]
```

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 3.3. Get User Group by Public ID
- **URL**: `/api/v1/user-groups/{groupPublicId}`
- **Method**: `GET`
- **Description**: Returns a single user group by its ID. Requires `ADMIN` OR teacher who owns that group.

**Success (200 OK):**
```json
{
  "publicId": "33333333-3333-3333-3333-333333333333",
  "name": "Angielski A1",
  "description": "Grupa początkująca - semestr letni",
  "studentCount": 2,
  "teacherPublicId": "22222222-2222-2222-2222-222222222222",
  "createdAt": "2026-03-21T10:00:00"
}
```

**Known Errors:**
- `USER_GROUP_NOT_FOUND` (404 Not Found): Group does not exist.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 3.4. Update User Group
- **URL**: `/api/v1/user-groups/{groupPublicId}`
- **Method**: `PUT`
- **Description**: Updates name and/or description of an existing group. Requires `ADMIN` authority OR the requesting user must be the group owner (`TEACHER`).

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
  "publicId": "33333333-3333-3333-3333-333333333333",
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
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 3.5. Delete User Group
- **URL**: `/api/v1/user-groups/{groupPublicId}`
- **Method**: `DELETE`
- **Description**: Deletes a user group and all member associations. Does not delete user accounts. Requires `ADMIN` authority OR the requesting user must be the group owner (`TEACHER`).

**Success (204 No Content):**
*(Empty Response Body)*

**Known Errors:**
- `USER_GROUP_NOT_FOUND` (404 Not Found): Group does not exist.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 3.6. Add Member to Group
- **URL**: `/api/v1/user-groups/{groupPublicId}/members/{userPublicId}`
- **Method**: `POST`
- **Description**: Adds a student to a group. Only users with role `STUDENT` can be added. A student can belong to at most one group. Requires `ADMIN` authority OR the requesting user must be the group owner (`TEACHER`).

**Success (204 No Content):**
*(Empty Response Body)*

**Known Errors:**
- `USER_GROUP_NOT_FOUND` (404 Not Found): Group does not exist.
- `USER_NOT_FOUND` (404 Not Found): User does not exist.
- `INVALID_ROLE_FOR_GROUP` (400 Bad Request): User is not a student.
- `STUDENT_ALREADY_IN_GROUP` (409 Conflict): Student is already assigned to a group.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 3.7. Remove Member from Group
- **URL**: `/api/v1/user-groups/{groupPublicId}/members/{userPublicId}`
- **Method**: `DELETE`
- **Description**: Removes a student from a group. Does not delete the user account. Requires `ADMIN` authority OR the requesting user must be the group owner (`TEACHER`).

**Success (204 No Content):**
*(Empty Response Body)*

**Known Errors:**
- `USER_GROUP_NOT_FOUND` (404 Not Found): Group does not exist.
- `MEMBER_NOT_IN_GROUP` (404 Not Found): User is not a member of this group.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

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
    "publicId": "33333333-3333-3333-3333-333333333333",
    "title": "Present Simple - lesson 1",
    "theme": "Grammar",
    "isActive": true,
    "teacherPublicId": "22222222-2222-2222-2222-222222222222",
    "teacherName": "pan_tomasz",
    "teacherAvatarUrl": "preset:avatar_3",
    "createdAt": "2026-03-21T10:00:00",
    "groups": [ { "publicId": "33333333-3333-3333-3333-333333333333", "name": "Angielski A1" } ]
  }
]
```

| Field | Type                  | Description |
|-------|-----------------------|-------------|
| `publicId` | String               | Public ID lekcji |
| `title` | String                | Tytuł lekcji |
| `theme` | String                | Temat kategorii lekcji |
| `isActive` | Boolean               | Czy lekcja jest aktywna |
| `teacherPublicId` | String               | Public ID nauczyciela, który utworzył lekcję |
| `teacherName` | String                | Username nauczyciela |
| `teacherAvatarUrl` | String                | URL do awatara nauczyciela (preset:name lub /uploads/...) |
| `createdAt` | String (ISO datetime) | Data utworzenia |
| `groups` | List<GroupDto>        | Lista grup przypisanych do lekcji (publicId, name) |
| `attachments` | List<LessonAttachmentResponse> | Lista załączników lekcji (maks. 5). Pusta lista jeśli brak załączników. |

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 4.2. Create a new lesson
- **URL**: `/api/v1/lessons`
- **Method**: `POST`
- **Description**: Tworzy nową lekcję. Można jednocześnie przypisać lekcję do grup. `title` jest wymagany i może mieć maksymalnie 30 znaków.
- **Authorization**: `TEACHER` lub `ADMIN`

**Request Body (JSON):**
```json
{
  "title": "Present Simple - lesson 1",
  "theme": "Grammar",
  "groupPublicIds": ["11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222"]
}
```

**Success (201 Created):**
Zwraca utworzoną reprezentację `LessonResponse` (jak w sekcji 4.1).

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Brak wymaganych pól (`title`, `theme`), tytuł dłuższy niż 30 znaków lub złe typy.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit creation.

---

### 4.3. Update lesson data
- **URL**: `/api/v1/lessons/{lessonPublicId}`
- **Method**: `PUT`
- **Description**: Aktualizuje pola lekcji (title, theme, description, group assignment). Wymaga uprawnień nauczyciela. `title` może mieć maksymalnie 30 znaków.
- **Authorization**: `ADMIN` lub właściciel lekcji (`TEACHER`)

**Request Body (JSON):**
Używa tego samego kształtu co `LessonRequest` (patrz 4.2).

**Success (200 OK):**
Zwraca zaktualizowaną reprezentację `LessonResponse`.

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Złe dane wejściowe, w tym tytuł dłuższy niż 30 znaków.
- `LESSON_NOT_FOUND` (404 Not Found): Nie znaleziono lekcji.
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden)

---

### 4.4. Quick status change (is_active)
- **URL**: `/api/v1/lessons/{lessonPublicId}/status`
- **Method**: `PATCH`
- **Description**: Szybka zmiana flagi `isActive` (włącz/wyłącz lekcję).
- **Authorization**: `ADMIN` lub właściciel lekcji (`TEACHER`)

**Request Body (JSON):**
```json
{ "isActive": true }
```

**Success (204 No Content):** *(Empty Response Body)*

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request)
- `LESSON_CANNOT_BE_ACTIVATED_WITHOUT_TASKS` (400 Bad Request): Nie można aktywować lekcji, która nie ma jeszcze żadnych zadań.
- `LESSON_NOT_FOUND` (404 Not Found)
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden)

---

### 4.5. Delete lesson
- **URL**: `/api/v1/lessons/{lessonPublicId}`
- **Method**: `DELETE`
- **Description**: Usuwa lekcję. Dostęp dla `ADMIN` lub właściciela lekcji (`TEACHER`).
- **Authorization**: `ADMIN` lub właściciel lekcji (`TEACHER`)

**Success (204 No Content):** *(Empty Response Body)*

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden)

---

### 4.6. Upload lesson attachment
- **URL**: `/api/v1/lessons/{lessonPublicId}/attachments`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Description**: Przesyła plik jako załącznik do lekcji. Lekcja może mieć maksymalnie 5 załączników.
- **Authorization**: `ADMIN` lub właściciel lekcji (`TEACHER`)

**Form part:**
- `file` (binary) — plik, max 10 MB

**Dozwolone typy plików:**

| MIME type | Rozszerzenie |
|-----------|--------------|
| `application/pdf` | `.pdf` |
| `text/plain` | `.txt` |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `.docx` |
| `application/msword` | `.doc` |
| `application/vnd.oasis.opendocument.text` | `.odt` |

**Success (201 Created):**
```json
{
  "publicId": "33333333-3333-3333-3333-333333333333",
  "originalFileName": "notatki.pdf",
  "contentType": "application/pdf",
  "fileSize": 204800,
  "createdAt": "2026-04-25T10:00:00"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `publicId` | String | ID załącznika |
| `originalFileName` | String | Oryginalna nazwa pliku |
| `contentType` | String | Typ MIME przesłanego pliku (np. `application/pdf`, `text/plain`) |
| `fileSize` | Long | Rozmiar pliku w bajtach |
| `createdAt` | String (ISO datetime) | Data przesłania |

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `ATTACHMENT_LIMIT_REACHED` (400 Bad Request): Lekcja posiada już 5 załączników.
- `ATTACHMENT_INVALID_FILE_TYPE` (400 Bad Request): Niedozwolony typ pliku. Dozwolone: PDF, TXT, DOCX, DOC, ODT.
- `ATTACHMENT_FILE_TOO_LARGE` (400 Bad Request): Plik przekracza 10 MB.
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden)

---

### 4.7. Download attachment
- **URL**: `/api/v1/lessons/{lessonPublicId}/attachments/{attachmentPublicId}`
- **Method**: `GET`
- **Description**: Pobiera plik załącznika. Wymaga autoryzacji — nie jest dostępny publicznie. Uczeń może pobrać załącznik tylko jeśli ma dostęp do tej lekcji.
- **Authorization**: `ADMIN`, właściciel lekcji (`TEACHER`) lub uczeń mający dostęp do lekcji (`STUDENT`)

**Success (200 OK):**
- Response body: binary file (`Content-Type` zgodny z typem przesłanego pliku)
- Header: `Content-Disposition: attachment; filename="<originalFileName>"`

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `ATTACHMENT_NOT_FOUND` (404 Not Found)
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden)

---

### 4.8. Delete lesson attachment
- **URL**: `/api/v1/lessons/{lessonPublicId}/attachments/{attachmentPublicId}`
- **Method**: `DELETE`
- **Description**: Usuwa załącznik z lekcji. Plik jest fizycznie usuwany z dysku.
- **Authorization**: `ADMIN` lub właściciel lekcji (`TEACHER`)

**Success (204 No Content):** *(Empty Response Body)*

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `ATTACHMENT_NOT_FOUND` (404 Not Found)
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden)

---

**LessonResponse** (`attachments` field — present in all lesson endpoints):
```json
{
  "publicId": "33333333-3333-3333-3333-333333333333",
  "title": "Present Simple - lesson 1",
  "theme": "Grammar",
  "isActive": true,
  "teacherPublicId": "22222222-2222-2222-2222-222222222222",
  "teacherName": "pan_tomasz",
  "teacherAvatarUrl": "preset:avatar_3",
  "createdAt": "2026-03-21T10:00:00",
  "groups": [ { "publicId": "33333333-3333-3333-3333-333333333333", "name": "Angielski A1" } ],
  "attachments": [
    {
      "publicId": "33333333-3333-3333-3333-333333333333",
      "originalFileName": "notatki.pdf",
      "contentType": "application/pdf",
      "fileSize": 204800,
      "createdAt": "2026-04-25T10:00:00"
    }
  ]
}
```
Pole `attachments` jest pustą listą `[]` jeśli lekcja nie ma załączników. Maks. 5 elementów.

---

## 5. Teacher Dashboard (`/api/v1/teacher`)

Zbiór zapytań agregacyjnych specjalnie dostrojonych do ekranu Pupy Nauczyciela (Architektura BFF). Odfiltrowuje dane tylko do zakresu `currentUserId` nauczyciela autoryzowanego przez JWT.

### 5.1. Get Dashboard Statistics
- **URL**: `/api/v1/teacher/stats`
- **Method**: `GET`
- **Description**: Returns aggregated dashboard statistics: total and active lesson counts, active student count, and average answer score. Requires `TEACHER` authority.

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
| `totalLessons` | Long | Total number of lessons mapped to the requesting teacher. |
| `activeLessons` | Long | Number of active lessons mapped to the requesting teacher. |
| `activeStudents` | Long | Distinct students belonging to resolving groups. |
| `avgScore` | Double | Average correctness score (0–100). |

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 5.2. Get My Lessons
- **URL**: `/api/v1/teacher/lessons`
- **Method**: `GET`
- **Description**: Pobiera listę lekcji wykreowanych i przypisanych WYŁĄCZNIE do odpytującego nauczyciela. Odciąża generyczny `LessonController` chroniąc przed dostępem do obcych materiałów.
- **Authorization**: `TEACHER`

**Success (200 OK):** Zwraca macierz obiektów `LessonResponse` (odpowiednik standardowego 4.1. Get list of lessons).

---

### 5.3. Get Lesson Statistics
- **URL**: `/api/v1/teacher/lessons/{lessonPublicId}/stats`
- **Method**: `GET`
- **Description**: Zwraca statystyki wyników uczniów dla wskazanej lekcji. Scoped do nauczyciela autoryzowanego przez JWT.
- **Authorization**: `TEACHER`

**Success (200 OK):**
```json
{
  "avgScore": 80.0,
  "studentsCompleted": 5,
  "bestScore": 100.0,
  "studentResults": [
    {
      "userPublicId": "33333333-3333-3333-3333-333333333333",
      "username": "jan_kowalski",
      "completedAt": "2026-01-20T12:00:00",
      "score": 8,
      "maxScore": 10,
      "resultPercent": 80.0,
      "totalTabSwitchCount": 3
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `avgScore` | Double | Średni wynik procentowy wszystkich uczniów którzy odpowiedzieli na pytania lekcji. |
| `studentsCompleted` | Integer | Liczba uczniów z zapisanymi odpowiedziami. |
| `bestScore` | Double | Najwyższy indywidualny wynik procentowy. |
| `studentResults` | List | Lista wyników per uczeń, posortowana malejąco po `resultPercent`. |
| `studentResults[].userPublicId` | String | Public ID ucznia. |
| `studentResults[].username` | String | Nazwa użytkownika ucznia. |
| `studentResults[].completedAt` | String (ISO datetime) or null | Czas ukończenia lekcji. |
| `studentResults[].score` | Integer | Liczba zdobytych punktów. |
| `studentResults[].maxScore` | Integer | Maksymalna liczba punktów. |
| `studentResults[].resultPercent` | Double | Wynik procentowy ucznia. |
| `studentResults[].totalTabSwitchCount` | Integer | Suma zarejestrowanych przejść ucznia do innych zakładek podczas całej lekcji. |

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 5.3.1. Get Detailed Lesson Result For Selected Student
- **URL**: `/api/v1/teacher/lessons/{lessonPublicId}/students/{userPublicId}/result`
- **Method**: `GET`
- **Description**: Zwraca szczegółowy wynik ukończonej lekcji dla wskazanego ucznia. Endpoint jest scoped do nauczyciela-owner'a lekcji.
- **Authorization**: `TEACHER`

**Success (200 OK):**
```json
{
  "lessonPublicId": "44444444-4444-4444-4444-444444444444",
  "lessonTitle": "Present Simple - lesson 1",
  "userPublicId": "33333333-3333-3333-3333-333333333333",
  "username": "jan_kowalski",
  "score": 4,
  "maxScore": 5,
  "resultPercent": 80.0,
  "completedAt": "2026-03-21T10:25:00",
  "tasks": [
    {
      "taskPublicId": "66666666-6666-6666-6666-666666666666",
      "taskType": "choose",
      "section": "Grammar",
      "taskText": "Choose the correct answer",
      "hint": "Look at the subject.",
      "userAnswer": "go",
      "correctAnswer": "goes",
      "isCorrect": false,
      "possibleAnswers": "go|goes|going",
      "words": null,
      "tabSwitchCount": 2
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `lessonPublicId` | String | Public ID lekcji. |
| `lessonTitle` | String | Tytul lekcji. |
| `userPublicId` | String | Public ID ucznia, ktorego wynik jest zwracany. |
| `username` | String | Username ucznia. |
| `score` | Integer | Zdobyte punkty. |
| `maxScore` | Integer | Maksymalna liczba punktów. |
| `resultPercent` | Double | Wynik procentowy zaokrąglony do jednego miejsca po przecinku. |
| `completedAt` | String (ISO datetime) | Czas zakończenia lekcji. |
| `tasks` | List | Lista zadań w stabilnej kolejności prezentacyjnej. |
| `tasks[].taskPublicId` | String | Public ID zadania w aktualnej lekcji. |
| `tasks[].taskType` | String | `choose`, `write`, `scatter` albo `speak`. |
| `tasks[].section` | String or null | Sekcja zadania, jeśli jest ustawiona. |
| `tasks[].taskText` | String | Treść zadania. |
| `tasks[].hint` | String or null | Podpowiedź zapisana dla zadania. |
| `tasks[].userAnswer` | String or null | Zapisana odpowiedź ucznia. Dla `choose` zwracana jest wartość tekstowa, nie indeks. |
| `tasks[].correctAnswer` | String or null | Poprawna odpowiedź. |
| `tasks[].isCorrect` | Boolean | Status poprawności odpowiedzi. |
| `tasks[].possibleAnswers` | String or null | Lista możliwych odpowiedzi rozdzielona `|` dla `choose`. |
| `tasks[].words` | String or null | Lista słów rozdzielona `|` dla `scatter`. |
| `tasks[].tabSwitchCount` | Integer | Liczba zarejestrowanych przejść ucznia do innej zakładki podczas rozwiązywania tego zadania. |

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `STUDENT_NO_ACCESS` (403 Forbidden): Wskazany uczeń nie ma dostępu do tej lekcji.
- `LESSON_RESULT_NOT_FOUND` (404 Not Found): Brak ukończonego wyniku dla user+lesson.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access or nauczyciel nie jest ownerem lekcji.

---

### 5.4. Get My Groups
- **URL**: `/api/v1/teacher/my-groups`
- **Method**: `GET`
- **Description**: Odtworzenie logiki UserGroup dedykowanej pulpitu Nauczyciela. Zwraca wszystkie grupy stworzone przez logującego się Nauczyciela (`teacherId = currentUserId`).
- **Authorization**: `TEACHER`

**Success (200 OK):** Zwraca macierz elementów `UserGroupResponse` z wyliczoną ilością wpisanych do nich studentów.

---

### 5.5. Get My Students
- **URL**: `/api/v1/teacher/students`
- **Method**: `GET`
- **Description**: Zwraca listę uczniów przypisanych do grup aktualnie zalogowanego nauczyciela (relacja przez `UserInGroup` oraz `UserGroup.teacherId`).
- **Authorization**: `TEACHER`

**Success (200 OK):** Zwraca macierz elementów `TeacherStudentResponse` (wyłącznie użytkownicy z rolą `STUDENT`) z `groupId` aktualnego przypisania do grupy nauczyciela.

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 5.6. Create Student / Send Invitation (Teacher API)
- **URL**: `/api/v1/teacher/students`
- **Method**: `POST`
- **Description**: Tworzy konto ucznia w stanie `INVITED` i wysyła email z linkiem aktywacyjnym. Uczeń musi kliknąć link i ustawić username oraz hasło, zanim konto stanie się `ACTIVE`. Pole `groupPublicId` jest **wymagane** i musi wskazywać grupę należącą do aktualnie zalogowanego nauczyciela.
- **Authorization**: `TEACHER`

**Request Body (JSON):**
```json
{
  "email": "new.student@example.com",
  "groupPublicId": "11111111-1111-1111-1111-111111111111"
}
```

**Success (201 Created):**
```json
{
  "publicId": "33333333-3333-3333-3333-333333333333",
  "username": null,
  "email": "new.student@example.com",
  "role": "STUDENT",
  "status": "INVITED",
  "createdAt": "2026-03-30T20:15:00",
  "groupPublicId": "11111111-1111-1111-1111-111111111111",
  "avatarUrl": null
}
```

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid (w tym brak `groupPublicId`).
- `INVALID_ROLE_FOR_GROUP` (400 Bad Request): Wskazana grupa nie należy do aktualnego nauczyciela.
- `USER_GROUP_NOT_FOUND` (404 Not Found): Grupa o podanym ID nie istnieje.
- `EMAIL_ALREADY_TAKEN` (409 Conflict): Email already exists.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 5.8. Resend Invitation (Teacher API)
- **URL**: `/api/v1/teacher/students/{studentPublicId}/resend-invite`
- **Method**: `POST`
- **Description**: Unieważnia poprzedni token i wysyła nowy email aktywacyjny do ucznia o statusie `INVITED`. Uczeń musi należeć do jednej z grup aktualnie zalogowanego nauczyciela.
- **Authorization**: `TEACHER`

**Success (204 No Content):**
*(Empty Response Body)*

**Known Errors:**
- `USER_NOT_FOUND` (404 Not Found): Uczeń o podanym ID nie istnieje.
- `ACCOUNT_NOT_INVITED` (409 Conflict): Konto ucznia nie ma statusu `INVITED` (już aktywne).
- `FORBIDDEN` (403 Forbidden): Uczeń nie należy do żadnej grupy tego nauczyciela.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.

---

### 5.7. Update Student (Teacher API)
- **URL**: `/api/v1/teacher/students/{studentPublicId}`
- **Method**: `PUT`
- **Description**: Aktualizuje dane ucznia (username, email) oraz przypisaną grupę. Uczeń musi należeć do jednej z grup nauczyciela. `groupPublicId` jest wymagany i docelowa grupa również musi należeć do nauczyciela.
- **Authorization**: `TEACHER`

**Request Body (JSON):**
```json
{
  "username": "updated_student",
  "email": "updated.student@example.com",
  "groupPublicId": "11111111-1111-1111-1111-111111111111"
}
```

**Success (200 OK):**
```json
{
  "publicId": "33333333-3333-3333-3333-333333333333",
  "username": "updated_student",
  "email": "updated.student@example.com",
  "role": "STUDENT",
  "createdAt": "2026-03-30T20:15:00",
  "groupPublicId": "11111111-1111-1111-1111-111111111111",
  "avatarUrl": "preset:avatar_5"
}
```

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.
- `INVALID_ROLE_FOR_GROUP` (400 Bad Request): Wskazana grupa nie należy do aktualnego nauczyciela lub zmieniany user nie jest uczniem.
- `USER_GROUP_NOT_FOUND` (404 Not Found): Grupa o podanym ID nie istnieje.
- `USER_NOT_FOUND` (404 Not Found): Uczeń nie istnieje.
- `EMAIL_ALREADY_TAKEN` (409 Conflict): Email already exists.
- `USERNAME_ALREADY_TAKEN` (409 Conflict): Username already exists.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Uczeń docelowy nie znajduje się w żadnej z grup przypisanych do tego nauczyciela.

---

## 6. Admin Dashboard (`/api/v1/admin`)

Warstwa BFF dla administratora. Dedykowana wyciągom z zakresu całego systemu.

### 6.1. Get Global Stats
- **URL**: `/api/v1/admin/stats`
- **Method**: `GET`
- **Description**: Zwraca zagregowane statystyki systemowe dla panelu administratora. Wymaga `ADMIN`.

**Success (200 OK):**
```json
{
  "totalUsers": 14,
  "totalAdmins": 1,
  "totalTeachers": 3,
  "totalStudents": 10,
  "totalGroups": 6
}
```

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 6.2. Get All Teachers
- **URL**: `/api/v1/admin/teachers`
- **Method**: `GET`
- **Description**: Zwraca listę wszystkich kont nauczycieli widocznych dla administratora. Wymaga `ADMIN`.

**Success (200 OK):**
```json
[
  {
    "publicId": "33333333-3333-3333-3333-333333333333",
    "username": "teacher1",
    "email": "teacher@example.com",
    "role": "TEACHER",
    "status": "ACTIVE",
    "createdAt": "2026-03-02T21:00:00"
  }
]
```

> `status` is `"ACTIVE"` or `"INVITED"`. Invited teachers have `username: null` until they complete account activation.

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 6.2.1. Invite Teacher / Send Invitation (Admin API)
- **URL**: `/api/v1/admin/teachers`
- **Method**: `POST`
- **Description**: Tworzy konto nauczyciela w stanie `INVITED` i wysyła email z linkiem aktywacyjnym. Nauczyciel musi kliknąć link i ustawić username oraz hasło, zanim konto stanie się `ACTIVE`. Wymaga `ADMIN`.

**Request Body (JSON):**
```json
{
  "email": "new.teacher@example.com"
}
```

**Success (201 Created):**
```json
{
  "publicId": "33333333-3333-3333-3333-333333333333",
  "username": null,
  "email": "new.teacher@example.com",
  "role": "TEACHER",
  "status": "INVITED",
  "createdAt": "2026-03-26T20:15:00"
}
```

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.
- `EMAIL_ALREADY_TAKEN` (409 Conflict): Email already exists.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 6.2.2. Resend Teacher Invitation (Admin API)
- **URL**: `/api/v1/admin/teachers/{teacherPublicId}/resend-invite`
- **Method**: `POST`
- **Description**: Unieważnia poprzedni token i wysyła nowy email aktywacyjny do nauczyciela o statusie `INVITED`. Wymaga `ADMIN`.

**Success (204 No Content):**
*(Empty Response Body)*

**Known Errors:**
- `USER_NOT_FOUND` (404 Not Found): Nauczyciel o podanym ID nie istnieje.
- `ACCOUNT_NOT_INVITED` (409 Conflict): Konto nauczyciela nie ma statusu `INVITED` (już aktywne).
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 6.3. Get All Students
- **URL**: `/api/v1/admin/students`
- **Method**: `GET`
- **Description**: Zwraca listę wszystkich kont uczniów widocznych dla administratora. Wymaga `ADMIN`.

**Success (200 OK):**
```json
[
  {
    "publicId": "33333333-3333-3333-3333-333333333333",
    "username": "student1",
    "email": "user@example.com",
    "role": "STUDENT",
    "status": "ACTIVE",
    "groupPublicId": "11111111-1111-1111-1111-111111111111",
    "groupName": "Angielski A1",
    "createdAt": "2026-03-02T21:00:00"
  }
]
```

> `status` is `"ACTIVE"` or `"INVITED"`. Invited students have `username: null` and cannot log in until they complete account activation.

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---
### 6.4. Create Student / Send Invitation (Admin API)
- **URL**: `/api/v1/admin/students`
- **Method**: `POST`
- **Description**: Tworzy konto ucznia w stanie `INVITED` i wysyła email z linkiem aktywacyjnym. Opcjonalnie przypisuje do grupy. Uczeń musi kliknąć link i ustawić username oraz hasło, zanim konto stanie się `ACTIVE`. Wymaga `ADMIN`.

**Request Body (JSON):**
```json
{
  "email": "new.student@example.com",
  "groupPublicId": "11111111-1111-1111-1111-111111111111"
}
```
> `groupPublicId` jest opcjonalne. Jeśli nie podano, uczeń zostaje stworzony bez przypisania do grupy.

**Success (201 Created):**
```json
{
  "publicId": "33333333-3333-3333-3333-333333333333",
  "username": null,
  "email": "new.student@example.com",
  "role": "STUDENT",
  "status": "INVITED",
  "createdAt": "2026-03-26T20:15:00"
}
```

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.
- `USER_GROUP_NOT_FOUND` (404 Not Found): Group does not exist.
- `EMAIL_ALREADY_TAKEN` (409 Conflict): Email already exists.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---
### 6.4.1. Resend Invitation (Admin API)
- **URL**: `/api/v1/admin/students/{studentPublicId}/resend-invite`
- **Method**: `POST`
- **Description**: Unieważnia poprzedni token i wysyła nowy email aktywacyjny do ucznia o statusie `INVITED`. Wymaga `ADMIN`.

**Success (204 No Content):**
*(Empty Response Body)*

**Known Errors:**
- `USER_NOT_FOUND` (404 Not Found): Uczeń o podanym ID nie istnieje.
- `ACCOUNT_NOT_INVITED` (409 Conflict): Konto ucznia nie ma statusu `INVITED` (już aktywne).
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---
### 6.5. Update Student (Admin API)
- **URL**: `/api/v1/admin/students/{studentPublicId}`
- **Method**: `PUT`
- **Description**: Aktualizuje dane ucznia (username, email) oraz opcjonalnie zmienia przypisanie do grupy. Wymaga `ADMIN`.

**Request Body (JSON):**
```json
{
  "username": "updated_student",
  "email": "updated.student@example.com",
  "groupPublicId": "11111111-1111-1111-1111-111111111111"
}
```
> Jeśli `groupId` jest `null` lub pominięte, dotychczasowe powiązanie z grupą zostaje usunięte.

**Success (200 OK):**
```json
{
  "publicId": "33333333-3333-3333-3333-333333333333",
  "username": "updated_student",
  "email": "updated.student@example.com",
  "role": "STUDENT",
  "groupPublicId": "11111111-1111-1111-1111-111111111111",
  "groupName": "Angielski B2",
  "createdAt": "2026-03-26T20:15:00"
}
```

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.
- `INVALID_STUDENT_ASSIGNMENT` (400 Bad Request): Wskazany użytkownik nie ma roli `STUDENT`.
- `USER_NOT_FOUND` (404 Not Found): Student does not exist.
- `USER_GROUP_NOT_FOUND` (404 Not Found): Group does not exist.
- `EMAIL_ALREADY_TAKEN` (409 Conflict): Email already exists.
- `USERNAME_ALREADY_TAKEN` (409 Conflict): Username already exists.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---
### 6.6. Get All Achievement Definitions
- **URL**: `/api/v1/admin/achievements`
- **Method**: `GET`
- **Description**: Zwraca wszystkie definicje achievementow, aktywne i nieaktywne, posortowane po `sortOrder`, potem po wewnętrznym porządku zapisu. Wymaga `ADMIN`.

**Success (200 OK):**
```json
[
  {
    "code": "FIRST_LESSON",
    "title": "Pierwsza lekcja",
    "description": "Ukończyłeś swoją pierwszą lekcję",
    "icon": "",
    "color": "warning",
    "type": "LESSONS_COMPLETED",
    "threshold": 1,
    "active": true,
    "sortOrder": 1,
    "createdAt": "2026-05-06T12:30:00",
    "updatedAt": "2026-05-06T12:30:00"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `code` | String | Immutable publiczny identyfikator achievementu. |
| `title` | String | Nazwa achievementu. |
| `description` | String | Opis achievementu. |
| `icon` | String | Ikona prezentacyjna. |
| `color` | String | Kolor prezentacyjny. |
| `type` | Enum | Typ reguły unlocka (`LESSONS_COMPLETED`, `POINTS`, `AVATAR_CHANGED`). |
| `threshold` | Integer \| null | Próg wymagany dla typu reguły. |
| `active` | Boolean | Czy achievement jest widoczny dla studentów i brany pod uwagę przy unlockach. |
| `sortOrder` | Integer | Kolejność wyświetlania. |
| `createdAt` | String (ISO datetime) | Data utworzenia definicji. |
| `updatedAt` | String (ISO datetime) | Data ostatniej aktualizacji definicji. |

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---
### 6.7. Get Achievement Definition By Code
- **URL**: `/api/v1/admin/achievements/{code}`
- **Method**: `GET`
- **Description**: Zwraca pojedynczą definicję achievementu po immutable `code`. Wymaga `ADMIN`.

**Success (200 OK):**
```json
{
  "code": "FIRST_LESSON",
  "title": "Pierwsza lekcja",
  "description": "Ukończyłeś swoją pierwszą lekcję",
  "icon": "",
  "color": "warning",
  "type": "LESSONS_COMPLETED",
  "threshold": 1,
  "active": true,
  "sortOrder": 1,
  "createdAt": "2026-05-06T12:30:00",
  "updatedAt": "2026-05-06T12:30:00"
}
```

**Known Errors:**
- `ACHIEVEMENT_NOT_FOUND` (404 Not Found): Achievement does not exist.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---
### 6.8. Create Achievement Definition
- **URL**: `/api/v1/admin/achievements`
- **Method**: `POST`
- **Description**: Tworzy nową definicję achievementu. `code` i `type` są immutable po utworzeniu. Wymaga `ADMIN`.

**Request Body (JSON):**
```json
{
  "code": "FIRST_LESSON",
  "title": "Pierwsza lekcja",
  "description": "Ukończyłeś swoją pierwszą lekcję",
  "icon": "",
  "color": "warning",
  "type": "LESSONS_COMPLETED",
  "threshold": 1,
  "active": true,
  "sortOrder": 1
}
```

**Success (201 Created):**
```json
{
  "code": "FIRST_LESSON",
  "title": "Pierwsza lekcja",
  "description": "Ukończyłeś swoją pierwszą lekcję",
  "icon": "",
  "color": "warning",
  "type": "LESSONS_COMPLETED",
  "threshold": 1,
  "active": true,
  "sortOrder": 1,
  "createdAt": "2026-05-06T12:30:00",
  "updatedAt": "2026-05-06T12:30:00"
}
```

**Validation Rules:**
- `code` musi mieć format uppercase snake case, np. `FIRST_LESSON`.
- `LESSONS_COMPLETED` i `POINTS` wymagają `threshold > 0`.
- `AVATAR_CHANGED` wymaga `threshold = null`.
- `active` jest wymagane.
- `sortOrder` musi być `>= 0`.

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.
- `INVALID_ACHIEVEMENT_RULE` (400 Bad Request): `type` i `threshold` nie tworzą poprawnej reguły.
- `ACHIEVEMENT_CODE_ALREADY_EXISTS` (409 Conflict): `code` already exists.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---
### 6.9. Update Achievement Definition
- **URL**: `/api/v1/admin/achievements/{code}`
- **Method**: `PUT`
- **Description**: Aktualizuje edytowalne pola achievementu. `code` i `type` pozostają immutable. Wymaga `ADMIN`.

**Request Body (JSON):**
```json
{
  "title": "Pierwsza lekcja - zaktualizowana",
  "description": "Ukończyłeś swoją pierwszą lekcję",
  "icon": "",
  "color": "success",
  "threshold": 2,
  "active": true,
  "sortOrder": 1
}
```

**Success (200 OK):**
```json
{
  "code": "FIRST_LESSON",
  "title": "Pierwsza lekcja - zaktualizowana",
  "description": "Ukończyłeś swoją pierwszą lekcję",
  "icon": "",
  "color": "success",
  "type": "LESSONS_COMPLETED",
  "threshold": 2,
  "active": true,
  "sortOrder": 1,
  "createdAt": "2026-05-06T12:30:00",
  "updatedAt": "2026-05-07T09:00:00"
}
```

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.
- `INVALID_ACHIEVEMENT_RULE` (400 Bad Request): `type` i `threshold` nie tworzą poprawnej reguły.
- `ACHIEVEMENT_NOT_FOUND` (404 Not Found): Achievement does not exist.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---
### 6.10. Activate Or Deactivate Achievement Definition
- **URL**: `/api/v1/admin/achievements/{code}/active`
- **Method**: `PATCH`
- **Description**: Włącza lub wyłącza achievement. Deactivate ukrywa achievement z `GET /api/v1/student/achievements`, ale nie usuwa historycznych rekordów `user_get_achievement`. Wymaga `ADMIN`.

**Request Body (JSON):**
```json
{
  "active": false
}
```

**Success (200 OK):**
```json
{
  "code": "FIRST_LESSON",
  "title": "Pierwsza lekcja",
  "description": "Ukończyłeś swoją pierwszą lekcję",
  "icon": "",
  "color": "warning",
  "type": "LESSONS_COMPLETED",
  "threshold": 1,
  "active": false,
  "sortOrder": 1,
  "createdAt": "2026-05-06T12:30:00",
  "updatedAt": "2026-05-07T09:15:00"
}
```

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): `active` is missing.
- `ACHIEVEMENT_NOT_FOUND` (404 Not Found): Achievement does not exist.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---
## 7. Student Dashboard (`/api/v1/student`)

Warstwa BFF dla uczniow.

### 7.1. Get Dashboard Statistics
- **URL**: `/api/v1/student/stats`
- **Method**: `GET`
- **Description**: Zwraca zagregowane statystyki ucznia dla przypisanych lekcji. Wymaga `STUDENT`.

**Success (200 OK):**
```json
{
  "totalLessons": 2,
  "completedLessons": 1,
  "inProgressLessons": 1,
  "averageScore": 80.0,
  "points": 5
}
```

| Field | Type | Description |
|-------|------|-------------|
| `totalLessons` | Integer | Liczba lekcji przypisanych do grupy ucznia. |
| `completedLessons` | Integer | Liczba lekcji ukończonych przez ucznia. |
| `inProgressLessons` | Integer | Liczba lekcji rozpoczętych, ale jeszcze nieukończonych. |
| `averageScore` | Double | Średni wynik procentowy z lekcji, które mają zapisany rezultat. |
| `points` | Integer | Aktualna suma punktów przyznanych uczniowi w ledgerze `student_points`; źródłem jest `PointService`, a reset lekcji zapisuje korektę ujemną. |

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 7.2. Get Student Lessons
- **URL**: `/api/v1/student/lessons`
- **Method**: `GET`
- **Description**: Zwraca aktywne lekcje przypisane do aktualnego ucznia przez jego grupę oraz lekcje ukończone przez ucznia, nawet jeśli nauczyciel je później dezaktywuje. Wymaga `STUDENT`.

**Success (200 OK):**
```json
[
  {
    "publicId": "33333333-3333-3333-3333-333333333333",
    "title": "Present Simple - lesson 1",
    "theme": "Grammar",
    "isActive": true,
    "teacherPublicId": "22222222-2222-2222-2222-222222222222",
    "teacherName": "pan_tomasz",
    "teacherAvatarUrl": "preset:avatar_3",
    "createdAt": "2026-03-21T10:00:00",
    "groups": [
      { "publicId": "33333333-3333-3333-3333-333333333333", "name": "Angielski A1" }
    ],
    "status": "COMPLETED",
    "score": 4,
    "maxScore": 5,
    "resultPercent": 80.0,
    "attachments": [
      {
        "publicId": "33333333-3333-3333-3333-333333333333",
        "originalFileName": "notatki.pdf",
        "contentType": "application/pdf",
        "fileSize": 204800,
        "createdAt": "2026-04-25T10:00:00"
      }
    ]
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `publicId` | String | Public ID lekcji. |
| `title` | String | Tytuł lekcji. |
| `theme` | String | Temat lekcji. |
| `isActive` | Boolean | Flaga aktywności lekcji. Endpoint ukrywa tylko lekcje nieaktywne, które nie zostały jeszcze ukończone przez ucznia. |
| `teacherPublicId` | String | Public ID nauczyciela prowadzącego. |
| `teacherName` | String | Username nauczyciela prowadzącego. |
| `createdAt` | String (ISO datetime) | Data utworzenia lekcji. |
| `groups` | List<GroupDto> | W student dashboard zwracana jest tylko grupa aktualnego ucznia, nawet jeśli lekcja jest przypisana do wielu grup. |
| `status` | String | `NOT_STARTED`, `IN_PROGRESS` albo `COMPLETED`. |
| `score` | Integer or null | Zdobyta liczba punktow dla lekcji z zapisanym postepem. |
| `maxScore` | Integer or null | Maksymalna liczba punktow dla biezacej proby. |
| `resultPercent` | Double or null | Wynik procentowy, jesli lekcja ma zapisany rezultat. |
| `attachments` | List<LessonAttachmentResponse> | Lista załączników lekcji (maks. 5). Pusta lista jeśli brak. Pobieranie: `GET /api/v1/lessons/{lessonPublicId}/attachments/{attachmentPublicId}`. |

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 7.2.1. Get Detailed Result Of Completed Lesson
- **URL**: `/api/v1/student/lessons/{lessonPublicId}/result`
- **Method**: `GET`
- **Description**: Zwraca trwały widok szczegółowego wyniku ukończonej lekcji dla aktualnie zalogowanego ucznia.
- **Authorization**: `STUDENT`

**Success (200 OK):** Response ma ten sam shape jak `GET /api/v1/teacher/lessons/{lessonPublicId}/students/{userPublicId}/result`.

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `STUDENT_NO_ACCESS` (403 Forbidden): Uczeń nie ma dostępu do tej lekcji.
- `LESSON_RESULT_NOT_FOUND` (404 Not Found): Brak ukończonego wyniku dla tej lekcji.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 7.3. Get Student Skills Breakdown
- **URL**: `/api/v1/student/skills`
- **Method**: `GET`
- **Description**: Zwraca rozbicie odpowiedzi aktualnego ucznia na kategorie zadań z liczbą poprawnych i błędnych odpowiedzi. Wymaga `STUDENT`.

**Success (200 OK):**
```json
[
  { "category": "Wybór", "correct": 6, "wrong": 2 },
  { "category": "Pisanie", "correct": 1, "wrong": 1 },
  { "category": "Rozsypanka", "correct": 1, "wrong": 3 },
  { "category": "Mówienie", "correct": 2, "wrong": 0 }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `category` | String | Typ zadania. Jedna z wartosci: `Wybór`, `Pisanie`, `Rozsypanka`, `Mówienie`. |
| `correct` | Integer | Suma poprawnych odpowiedzi aktualnego ucznia dla tej kategorii. |
| `wrong` | Integer | Suma blednych odpowiedzi aktualnego ucznia dla tej kategorii. |

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 7.4. Get Student Achievements
- **URL**: `/api/v1/student/achievements`
- **Method**: `GET`
- **Description**: Zwraca tylko aktywne achievementy ucznia. Endpoint jest read-only i nie wykonuje unlocków; achievementy są odblokowywane event-driven po zapisaniu zdarzeń domenowych. Reguła `POINTS` używa aktualnego salda z ledgera `student_points`. `unlocked`, `unlockedAt` i `newlyUnlocked` wynikają z zapisanych rekordów `user_get_achievement` aktualnie zalogowanego ucznia. Wymaga `STUDENT`.

**Success (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Pierwsza lekcja",
    "description": "Ukończyłeś swoją pierwszą lekcję",
    "icon": "",
    "color": "warning",
    "unlocked": true,
    "unlockedAt": "2026-05-06T12:30:00",
    "newlyUnlocked": true
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | ID achievementu. |
| `title` | String | Nazwa achievementu. |
| `description` | String | Opis achievementu. |
| `icon` | String | Ikona lub symbol achievementu. |
| `color` | String | Kolor prezentacyjny achievementu. |
| `unlocked` | Boolean | Czy achievement został zapisany jako odblokowany dla zalogowanego ucznia. |
| `unlockedAt` | String \| null (ISO datetime) | Data odblokowania achievementu z `user_get_achievement.created_at`. |
| `newlyUnlocked` | Boolean | `true`, gdy achievement jest odblokowany i `notification_seen_at IS NULL`. |

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

### 7.5. Mark Achievement Notifications As Seen
- **URL**: `/api/v1/student/achievements/notifications/seen`
- **Method**: `POST`
- **Description**: Oznacza jako widziane wszystkie odblokowane achievementy aktualnie zalogowanego ucznia, które mają `notification_seen_at = NULL`. Endpoint nie przyjmuje `studentId`. Wymaga `STUDENT`.

**Success (200 OK):**
```json
{
  "markedCount": 2
}
```

| Field | Type | Description |
|-------|------|-------------|
| `markedCount` | Integer | Liczba rekordów `user_get_achievement`, dla których ustawiono `notification_seen_at`. |

---

### 7.6. Get Personal Progress History
- **URL**: `/api/v1/student/progress`
- **Method**: `GET`
- **Description**: Zwraca historyczny średni wynik lekcji aktualnego ucznia. Snapshot jest aktualizowany przy ukończeniu lekcji. Wymaga `STUDENT`.

**Success (200 OK):**
```json
[
  {
    "date": "2026-04-09",
    "progress": 50.0
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `date` | String (ISO date) | Dzień snapshotu średniego wyniku. |
| `progress` | Double | Historyczny średni wynik procentowy ucznia po ostatnim ukończeniu lekcji danego dnia. |

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---
## 8. Tasks (`/api/v1/lessons/{lessonPublicId}/tasks`)

Task management endpoints nested under lessons. All task CRUD requires `ADMIN` or lesson owner (`TEACHER`).

### 8.1. Get Lesson Tasks
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks`
- **Method**: `GET`
- **Description**: Returns all tasks for a lesson grouped by section. Students get answers stripped and auto-start tracking only when the lesson is active. Teachers/admins see correct answers and may inspect inactive lessons.
- **Authorization**: `STUDENT`, `TEACHER`, or `ADMIN`

**Success (200 OK):**
```json
{
  "lessonPublicId": "44444444-4444-4444-4444-444444444444",
  "status": "IN_PROGRESS",
  "sections": [
    {
      "section": "Vocabulary",
      "chooseTasks": [
        {
          "publicId": "33333333-3333-3333-3333-333333333333",
          "lessonPublicId": "44444444-4444-4444-4444-444444444444",
          "task": "Choose the correct answer",
          "possibleAnswers": "a|b|c|d",
          "correctAnswer": null,
          "hint": "Think about grammar",
          "section": "Vocabulary",
          "createdAt": "2026-03-21T10:00:00"
        }
      ],
      "writeTasks": [],
      "scatterTasks": [],
      "speakTasks": []
    }
  ]
}
```

**Notes:**
- For `STUDENT`: `correctAnswer` fields are `null` (stripped). `status` is `IN_PROGRESS` or triggers auto-start.
- For `TEACHER`/`ADMIN`: `correctAnswer` fields are visible. `status` is `null`.

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found): Lesson does not exist.
- `STUDENT_NO_ACCESS` (403 Forbidden): Student's group does not have access to this lesson.
- `LESSON_NOT_ACTIVE` (403 Forbidden): Lesson is not active for students.
- `LESSON_ALREADY_COMPLETED` (403 Forbidden): Student has already completed this lesson.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 8.2. Create Choose Task
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/choose`
- **Method**: `POST`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Request Body (JSON):**
```json
{
  "task": "Choose the correct answer",
  "possibleAnswers": "option1|option2|option3",
  "correctAnswer": 1,
  "hint": "Think about grammar",
  "section": "Vocabulary"
}
```

**Success (201 Created):**
```json
{
  "publicId": "33333333-3333-3333-3333-333333333333", "lessonPublicId": "44444444-4444-4444-4444-444444444444", "task": "...", "possibleAnswers": "...",
  "correctAnswer": 1, "hint": "...", "section": "...", "createdAt": "..."
}
```

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `VALIDATION_FAILED` (400 Bad Request): Missing required fields (`task`, `possibleAnswers`, `correctAnswer`)
- `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.3. Update Choose Task
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/choose/{taskPublicId}`
- **Method**: `PUT`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Request/Response**: Same shape as 8.2. **Success: 200 OK.**

**Known Errors:**
- `TASK_NOT_FOUND` (404 Not Found)
- `VALIDATION_FAILED` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.4. Delete Choose Task
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/choose/{taskPublicId}`
- **Method**: `DELETE`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Success (204 No Content):** *(Empty Response Body)*

**Known Errors:**
- `TASK_NOT_FOUND` (404 Not Found)
- `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.5. Create Write Task
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/write`
- **Method**: `POST`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Request Body (JSON):**
```json
{
  "task": "Write the past tense of 'go'",
  "correctAnswer": "went",
  "hint": "Irregular verb",
  "section": "Grammar"
}
```

**Success (201 Created):**
```json
{
  "publicId": "33333333-3333-3333-3333-333333333333", "lessonPublicId": "44444444-4444-4444-4444-444444444444", "task": "...", "correctAnswer": "...",
  "hint": "...", "section": "...", "createdAt": "..."
}
```

**Known Errors:**
- `LESSON_NOT_FOUND` (404), `VALIDATION_FAILED` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.6. Update Write Task
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/write/{taskPublicId}`
- **Method**: `PUT`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Success: 200 OK.** Same shape as 8.5.

**Known Errors:**
- `TASK_NOT_FOUND` (404), `VALIDATION_FAILED` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.7. Delete Write Task
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/write/{taskPublicId}`
- **Method**: `DELETE`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Success (204 No Content)**

**Known Errors:**
- `TASK_NOT_FOUND` (404), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.8. Create Scatter Task
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/scatter`
- **Method**: `POST`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Request Body (JSON):**
```json
{
  "task": "Arrange the words",
  "words": "is|cat|the|big",
  "correctAnswer": "the cat is big",
  "hint": "Subject verb adjective",
  "section": "Grammar"
}
```

**Success (201 Created):**
```json
{
  "publicId": "33333333-3333-3333-3333-333333333333", "lessonPublicId": "44444444-4444-4444-4444-444444444444", "task": "...", "words": "...", "correctAnswer": "...",
  "hint": "...", "section": "...", "createdAt": "..."
}
```

**Known Errors:**
- `LESSON_NOT_FOUND` (404), `VALIDATION_FAILED` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.9. Update Scatter Task
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/scatter/{taskPublicId}`
- **Method**: `PUT`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Success: 200 OK.** Same shape as 8.8.

**Known Errors:**
- `TASK_NOT_FOUND` (404), `VALIDATION_FAILED` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.10. Delete Scatter Task
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/scatter/{taskPublicId}`
- **Method**: `DELETE`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Success (204 No Content)**

**Known Errors:**
- `TASK_NOT_FOUND` (404), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.11. Create Speak Task
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/speak`
- **Method**: `POST`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Request Body (JSON):**
```json
{
  "expectedText": "Hello, how are you?",
  "hint": "Focus on pronunciation",
  "section": "Speaking"
}
```

**Success (201 Created):**
```json
{
  "publicId": "33333333-3333-3333-3333-333333333333", "lessonPublicId": "44444444-4444-4444-4444-444444444444", "expectedText": "...", "hint": "...",
  "section": "...", "createdAt": "..."
}
```

**Known Errors:**
- `LESSON_NOT_FOUND` (404), `VALIDATION_FAILED` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.12. Update Speak Task
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/speak/{taskPublicId}`
- **Method**: `PUT`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Success: 200 OK.** Same shape as 8.11.

**Known Errors:**
- `TASK_NOT_FOUND` (404), `VALIDATION_FAILED` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.13. Delete Speak Task
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/speak/{taskPublicId}`
- **Method**: `DELETE`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Success (204 No Content)**

**Known Errors:**
- `TASK_NOT_FOUND` (404), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.14. Transcribe Speak Task Audio
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/speak/{taskPublicId}/transcribe`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Authorization**: `STUDENT` only
- **Description**: Uploads a recorded audio answer, validates student access to the lesson, sends the file to the local STT service, and compares the transcription with `expectedText`.

**Request Parts:**
- `file`: audio file, for example `audio/webm` from browser `MediaRecorder`.

**Success (200 OK):**
```json
{
  "text": "Hello how are you",
  "expectedText": "Hello, how are you?",
  "correct": true,
  "score": 1.0,
  "words": [
    { "expected": "hello", "actual": "hello", "correct": true },
    { "expected": "how", "actual": "how", "correct": true },
    { "expected": "are", "actual": "are", "correct": true },
    { "expected": "you", "actual": "you", "correct": true }
  ]
}
```

`score` is the fraction of expected words matched in the correct position after normalization, in range `0.0-1.0`.

**Known Errors:**
- `STT_AUDIO_REQUIRED` (400): Audio file is missing or empty.
- `LESSON_NOT_FOUND` (404), `TASK_NOT_FOUND` (404)
- `LESSON_NOT_ACTIVE` (403), `STUDENT_NO_ACCESS` (403)
- `STT_SERVICE_UNAVAILABLE` (503): Local STT service is not reachable or failed to transcribe.

---

### 8.15. Submit Lesson Answers
- **URL**: `/api/v1/lessons/{lessonPublicId}/submit`
- **Method**: `POST`
- **Description**: Submits all answers for an active lesson at once. Grades each answer and marks lesson as `COMPLETED`. One-shot — cannot re-submit.
- **Authorization**: `STUDENT` only

**Request Body (JSON):**
```json
{
  "answers": [
    { "taskPublicId": "66666666-6666-6666-6666-666666666666", "taskType": "choose", "answer": "1" },
    { "taskPublicId": "66666666-6666-6666-6666-666666666666", "taskType": "write", "answer": "went" },
    { "taskPublicId": "66666666-6666-6666-6666-666666666666", "taskType": "speak", "answer": "Hello how are you" }
  ]
}
```

**Success (200 OK):**
```json
{
  "score": 2,
  "maxScore": 3,
  "details": [
    { "taskPublicId": "66666666-6666-6666-6666-666666666666", "taskType": "choose", "isCorrect": true, "correctAnswer": "1" },
    { "taskPublicId": "66666666-6666-6666-6666-666666666666", "taskType": "write", "isCorrect": true, "correctAnswer": "went" }
  ]
}
```

**Grading logic:**
- `choose`: exact string match on correctAnswer index
- `write` / `scatter`: case-insensitive, trimmed comparison
- `speak`: normalized answer is split into words and compared position-by-position with `expectedText`; `score` equals `correctWords / expectedWords`, and the answer is accepted when this score is at least `application.stt.min-score` (default `0.85`)

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `LESSON_NOT_ACTIVE` (403 Forbidden): Lesson is not active for students.
- `LESSON_NOT_STARTED` (400 Bad Request): Lesson not started yet (no prior GET /tasks call).
- `LESSON_ALREADY_COMPLETED` (403 Forbidden): Lesson already submitted.
- `STUDENT_NO_ACCESS` (403 Forbidden): Student's group does not have access.
- `TASK_NOT_FOUND` (404 Not Found): At least one referenced task does not exist or does not belong to the lesson from the path.
- `INVALID_TASK_TYPE` (400 Bad Request): Unknown task type in answers.
- `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.16. Record Task Tab Switch
- **URL**: `/api/v1/lessons/{lessonPublicId}/tab-switches`
- **Method**: `POST`
- **Description**: Rejestruje przejscie ucznia do innej zakladki lub okna podczas rozwiazywania aktualnego zadania. Backend agreguje licznik per `lesson + user + task`.
- **Authorization**: `STUDENT` only

**Request Body (JSON):**
```json
{
  "taskPublicId": "66666666-6666-6666-6666-666666666666",
  "taskType": "choose"
}
```

**Success (204 No Content):** *(Empty Response Body)*

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `LESSON_NOT_STARTED` (400 Bad Request): Lesson not started yet.
- `LESSON_ALREADY_COMPLETED` (403 Forbidden): Lesson already submitted.
- `STUDENT_NO_ACCESS` (403 Forbidden): Student's group does not have access.
- `TASK_NOT_FOUND` (404 Not Found): Referenced task does not exist or does not belong to the lesson from the path.
- `INVALID_TASK_TYPE` (400 Bad Request): Unknown task type.
- `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.17. Reset User Progress
- **URL**: `/api/v1/lessons/{lessonPublicId}/users/{userPublicId}/reset`
- **Method**: `POST`
- **Description**: Deletes all UserAnswer, UserLesson and recorded tab-switch telemetry for a user+lesson, allowing re-attempt.
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Success (204 No Content):** *(Empty Response Body)*

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found): Lesson does not exist.
- `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

## 9. Group Invitations

Nauczyciel generuje zaproszenia do grupy. Uczeń używa linku z tokenem do stworzenia konta i automatycznego przypisania do grupy.

### 9.1. Create Invitation
- **URL**: `/api/v1/teacher/groups/{groupPublicId}/invitations`
- **Method**: `POST`
- **Description**: Creates a new invitation link for a group.
- **Authorization**: `ADMIN` or group owner (`TEACHER`)

**Request Body (JSON):**
```json
{
  "maxUses": 10,
  "expiresAt": "2026-12-31T23:59:59"
}
```

**Success (201 Created):**
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "groupPublicId": "group-uuid",
  "groupName": "Klasa 1A",
  "maxUses": 10,
  "usedCount": 0,
  "expiresAt": "2026-12-31T23:59:59",
  "isActive": true,
  "createdAt": "2026-05-06T10:00:00"
}
```

**Known Errors:**
- `USER_GROUP_NOT_FOUND` (404 Not Found)
- `VALIDATION_FAILED` (400 Bad Request): `maxUses` < 1 or `expiresAt` not in the future.
- `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 9.2. List Invitations for a Group
- **URL**: `/api/v1/teacher/groups/{groupPublicId}/invitations`
- **Method**: `GET`
- **Description**: Returns all invitations for the group, newest first.
- **Authorization**: `ADMIN` or group owner (`TEACHER`)

**Success (200 OK):** Array of invitation objects (same shape as 9.1 response).

**Known Errors:**
- `USER_GROUP_NOT_FOUND` (404 Not Found)
- `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 9.3. Deactivate Invitation
- **URL**: `/api/v1/teacher/groups/{groupPublicId}/invitations/{token}`
- **Method**: `DELETE`
- **Description**: Sets `isActive = false` on the invitation — it can no longer be used.
- **Authorization**: `ADMIN` or group owner (`TEACHER`)

**Success (204 No Content):** *(Empty Response Body)*

**Known Errors:**
- `INVITATION_NOT_FOUND` (404 Not Found)
- `USER_GROUP_NOT_FOUND` (404 Not Found)
- `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 9.4. Get Public Invitation Info *(no auth required)*
- **URL**: `/api/v1/invitations/{token}`
- **Method**: `GET`
- **Description**: Returns public metadata for a token (group name, limits). Used by the registration page to display the target group before the student fills in the form.

**Success (200 OK):**
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "groupName": "Klasa 1A",
  "maxUses": 10,
  "usedCount": 3
}
```

**Known Errors:**
- `INVITATION_NOT_FOUND` (404)
- `INVITATION_EXPIRED` (410 Gone)
- `INVITATION_LIMIT_REACHED` (410 Gone)
- `INVITATION_INACTIVE` (410 Gone)

---

### 9.5. Register Student via Invitation *(no auth required)*
- **URL**: `/api/v1/invitations/register`
- **Method**: `POST`
- **Description**: Creates a new student account and assigns it to the group associated with the invitation. The account is created in `EMAIL_VERIFICATION_PENDING` state, a verification email is sent to the address provided by the student, and the student must confirm that email before logging in.

**Request Body (JSON):**
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "email": "uczen@example.com",
  "username": "jan_kowalski",
  "password": "strongPassword123"
}
```

**Success (201 Created):**
```json
{
  "message": "Email verification required."
}
```

**Known Errors:**
- `INVITATION_NOT_FOUND` (404)
- `INVITATION_EXPIRED` (410 Gone)
- `INVITATION_LIMIT_REACHED` (410 Gone)
- `INVITATION_INACTIVE` (410 Gone)
- `EMAIL_ALREADY_TAKEN` (409 Conflict)
- `USERNAME_ALREADY_TAKEN` (409 Conflict)
- `VALIDATION_FAILED` (400 Bad Request)

---

## Global Application Errors

**1. Token Expiration**
All endpoints secured by JWT may return a `401 Unauthorized` containing the `TOKEN_EXPIRED` code if the provided token has lived past its expiration time:
```json
{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Token expired",
  "instance": "/api/v1/lessons",
  "code": "TOKEN_EXPIRED"
}
```

**2. Standard Application Errors**
In case of internal server errors, validation failures, or other unforeseen errors, the API will respond using a JSON structure mimicking RFC-7807 standard (with an added `code` field corresponding to Java `ErrorCode`):
```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed: email: must not be blank",
  "instance": "/api/v1/users/register",
  "code": "VALIDATION_FAILED"
}
```

## Swagger UI Auto-Generation
You can view and test the fully interactive endpoints using Swagger UI (provided by `springdoc`).
Once the backend is running, navigate your browser to:
- `http://localhost:8080/swagger-ui.html`
Raw OpenAPI specs are also available at `http://localhost:8080/v3/api-docs`



