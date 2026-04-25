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
  "id": 1,
  "username": "student1",
  "email": "user@example.com",
  "role": "STUDENT",
  "createdAt": "2026-03-02T21:00:00",
  "avatarUrl": "preset:avatar_1"
}
```

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `USER_NOT_FOUND` (404 Not Found): User does not exist (token might be stale).

---

### 2.4. Get User Details
- **URL**: `/api/v1/users/{id}`
- **Method**: `GET`
- **Description**: Retrieves user details. Requires `ADMIN` authority OR requester is the same user (`owner`) OR `TEACHER` authority with access only to students assigned to one of the current teacher's groups.

**Success (200 OK):**
```json
{
  "id": 1,
  "username": "student1",
  "email": "user@example.com",
  "role": "STUDENT",
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
- `FORBIDDEN` (403 Forbidden): Lack of permissions (not admin and not owner).
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
- **URL**: `/api/v1/users/{id}`
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
- **URL**: `/api/v1/users/{id}/avatar`
- **Method**: `POST`
- **Description**: Uploads a custom avatar image (JPEG, PNG). Maximum file size is 2 MB. Requires `ADMIN` authority OR the requesting user ID must match the parameter ID.

**Request:** `multipart/form-data`
- `file`: The image file to upload.

**Success (200 OK):**
```json
{
  "id": 1,
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
- **URL**: `/api/v1/users/{id}/avatar/preset`
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
  "id": 1,
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
  "id": 1,
  "name": "Angielski A1",
  "description": "Grupa początkująca - semestr letni",
  "studentCount": 0,
  "teacherId": 4,
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
    "id": 1,
    "name": "Angielski A1",
    "description": "Grupa początkująca - semestr letni",
    "studentCount": 2,
    "teacherId": 4,
    "createdAt": "2026-03-21T10:00:00"
  }
]
```

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 3.3. Get User Group by ID
- **URL**: `/api/v1/user-groups/{id}`
- **Method**: `GET`
- **Description**: Returns a single user group by its ID. Requires `ADMIN` OR teacher who owns that group.

**Success (200 OK):**
```json
{
  "id": 1,
  "name": "Angielski A1",
  "description": "Grupa początkująca - semestr letni",
  "studentCount": 2,
  "teacherId": 4,
  "createdAt": "2026-03-21T10:00:00"
}
```

**Known Errors:**
- `USER_GROUP_NOT_FOUND` (404 Not Found): Group does not exist.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 3.4. Update User Group
- **URL**: `/api/v1/user-groups/{id}`
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
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 3.5. Delete User Group
- **URL**: `/api/v1/user-groups/{id}`
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
- **URL**: `/api/v1/user-groups/{id}/members/{userId}`
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
- **URL**: `/api/v1/user-groups/{id}/members/{userId}`
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
    "id": 12,
    "title": "Present Simple - lesson 1",
    "theme": "Grammar",
    "isActive": true,
    "teacherId": 3,
    "teacherName": "pan_tomasz",
    "teacherAvatarUrl": "preset:avatar_3",
    "createdAt": "2026-03-21T10:00:00",
    "groups": [ { "id": 1, "name": "Angielski A1" } ]
  }
]
```

| Field | Type                  | Description |
|-------|-----------------------|-------------|
| `id` | Integer               | ID lekcji |
| `title` | String                | Tytuł lekcji |
| `theme` | String                | Temat kategorii lekcji |
| `isActive` | Boolean               | Czy lekcja jest aktywna |
| `teacherId` | Integer               | ID nauczyciela, który utworzył lekcję |
| `teacherName` | String                | Username nauczyciela |
| `teacherAvatarUrl` | String                | URL do awatara nauczyciela (preset:name lub /uploads/...) |
| `createdAt` | String (ISO datetime) | Data utworzenia |
| `groups` | List<GroupDto>        | Lista grup przypisanych do lekcji (id, name) |
| `attachment` | LessonAttachmentResponse \| null | Metadane załącznika (PDF/TXT/DOCX/DOC/ODT) lub `null` |

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 4.2. Create a new lesson
- **URL**: `/api/v1/lessons`
- **Method**: `POST`
- **Description**: Tworzy nową lekcję. Można jednocześnie przypisać lekcję do grup.
- **Authorization**: `TEACHER` lub `ADMIN`

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
- **Authorization**: `ADMIN` lub w�a�ciciel lekcji (`TEACHER`)

**Request Body (JSON):**
Używa tego samego kształtu co `LessonRequest` (patrz 4.2).

**Success (200 OK):**
Zwraca zaktualizowaną reprezentację `LessonResponse`.

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Złe dane wejściowe.
- `LESSON_NOT_FOUND` (404 Not Found): Nie znaleziono lekcji.
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden)

---

### 4.4. Quick status change (is_active)
- **URL**: `/api/v1/lessons/{id}/status`
- **Method**: `PATCH`
- **Description**: Szybka zmiana flagi `isActive` (włącz/wyłącz lekcję).
- **Authorization**: `ADMIN` lub w�a�ciciel lekcji (`TEACHER`)

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
- **Description**: Usuwa lekcję. Dost�p dla `ADMIN` lub w�a�ciciela lekcji (`TEACHER`).
- **Authorization**: `ADMIN` lub w�a�ciciel lekcji (`TEACHER`)

**Success (204 No Content):** *(Empty Response Body)*

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden)

---

### 4.6. Upload lesson attachment
- **URL**: `/api/v1/lessons/{lessonId}/attachments`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Description**: Przesyła plik jako załącznik do lekcji. Jeżeli lekcja już ma załącznik, poprzedni jest usuwany i zastępowany nowym. Tylko jeden załącznik na lekcję.
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
  "id": 1,
  "originalFileName": "notatki.pdf",
  "contentType": "application/pdf",
  "fileSize": 204800,
  "createdAt": "2026-04-25T10:00:00"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | ID załącznika |
| `originalFileName` | String | Oryginalna nazwa pliku |
| `contentType` | String | Typ MIME przesłanego pliku (np. `application/pdf`, `text/plain`) |
| `fileSize` | Long | Rozmiar pliku w bajtach |
| `createdAt` | String (ISO datetime) | Data przesłania |

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `ATTACHMENT_INVALID_FILE_TYPE` (400 Bad Request): Niedozwolony typ pliku. Dozwolone: PDF, TXT, DOCX, DOC, ODT.
- `ATTACHMENT_FILE_TOO_LARGE` (400 Bad Request): Plik przekracza 10 MB.
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden)

---

### 4.7. Download attachment
- **URL**: `/api/v1/lessons/{lessonId}/attachments/{attachmentId}`
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
- **URL**: `/api/v1/lessons/{lessonId}/attachments/{attachmentId}`
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

**LessonResponse** (`attachment` field — present in all lesson endpoints):
```json
{
  "id": 12,
  "title": "Present Simple - lesson 1",
  "theme": "Grammar",
  "isActive": true,
  "teacherId": 3,
  "teacherName": "pan_tomasz",
  "teacherAvatarUrl": "preset:avatar_3",
  "createdAt": "2026-03-21T10:00:00",
  "groups": [ { "id": 1, "name": "Angielski A1" } ],
  "attachment": {
    "id": 1,
    "originalFileName": "notatki.pdf",
    "contentType": "application/pdf",
    "fileSize": 204800,
    "createdAt": "2026-04-25T10:00:00"
  }
}
```
Pole `attachment` ma wartość `null` jeśli lekcja nie ma załącznika.

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
- **URL**: `/api/v1/teacher/lessons/{lessonId}/stats`
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
      "userId": 8,
      "username": "jan_kowalski",
      "completedAt": "2026-01-20T12:00:00",
      "score": 8,
      "maxScore": 10,
      "resultPercent": 80.0
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

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 5.3.1. Get Detailed Lesson Result For Selected Student
- **URL**: `/api/v1/teacher/lessons/{lessonId}/students/{userId}/result`
- **Method**: `GET`
- **Description**: Zwraca szczegolowy wynik ukonczonej lekcji dla wskazanego ucznia. Endpoint jest scoped do nauczyciela-owner'a lekcji.
- **Authorization**: `TEACHER`

**Success (200 OK):**
```json
{
  "lessonId": 12,
  "lessonTitle": "Present Simple - lesson 1",
  "userId": 8,
  "username": "jan_kowalski",
  "score": 4,
  "maxScore": 5,
  "resultPercent": 80.0,
  "completedAt": "2026-03-21T10:25:00",
  "tasks": [
    {
      "taskId": 101,
      "taskType": "choose",
      "section": "Grammar",
      "taskText": "Choose the correct answer",
      "hint": "Look at the subject.",
      "userAnswer": "go",
      "correctAnswer": "goes",
      "isCorrect": false,
      "possibleAnswers": "go|goes|going",
      "words": null
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `lessonId` | Integer | ID lekcji. |
| `lessonTitle` | String | Tytul lekcji. |
| `userId` | Integer | ID ucznia, ktorego wynik jest zwracany. |
| `username` | String | Username ucznia. |
| `score` | Integer | Zdobyte punkty. |
| `maxScore` | Integer | Maksymalna liczba punktow. |
| `resultPercent` | Double | Wynik procentowy zaokraglony do jednego miejsca po przecinku. |
| `completedAt` | String (ISO datetime) | Czas zakonczenia lekcji. |
| `tasks` | List | Lista zadan w stabilnej kolejnosci prezentacyjnej. |
| `tasks[].taskId` | Integer | ID zadania w aktualnej lekcji. |
| `tasks[].taskType` | String | `choose`, `write`, `scatter` albo `speak`. |
| `tasks[].section` | String or null | Sekcja zadania, jesli jest ustawiona. |
| `tasks[].taskText` | String | Tresc zadania. |
| `tasks[].hint` | String or null | Podpowiedz zapisana dla zadania. |
| `tasks[].userAnswer` | String or null | Zapisana odpowiedz ucznia. Dla `choose` zwracana jest wartosc tekstowa, nie indeks. |
| `tasks[].correctAnswer` | String or null | Poprawna odpowiedz. |
| `tasks[].isCorrect` | Boolean | Status poprawnosci odpowiedzi. |
| `tasks[].possibleAnswers` | String or null | Lista mozliwych odpowiedzi rozdzielona `|` dla `choose`. |
| `tasks[].words` | String or null | Lista slow rozdzielona `|` dla `scatter`. |

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `STUDENT_NO_ACCESS` (403 Forbidden): Wskazany uczen nie ma dostepu do tej lekcji.
- `LESSON_RESULT_NOT_FOUND` (404 Not Found): Brak ukonczonego wyniku dla user+lesson.
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

### 5.6. Create Student (Teacher API)
- **URL**: `/api/v1/teacher/students`
- **Method**: `POST`
- **Description**: Tworzy konto ucznia i od razu przypisuje go do wskazanej grupy należącej do aktualnie zalogowanego nauczyciela. Pole `groupId` jest **wymagane**.
- **Authorization**: `TEACHER`

**Request Body (JSON):**
```json
{
  "username": "new_student",
  "email": "new.student@example.com",
  "password": "password123",
  "groupId": 1
}
```

**Success (201 Created):**
```json
{
  "id": 15,
  "username": "new_student",
  "email": "new.student@example.com",
  "role": "STUDENT",
  "createdAt": "2026-03-30T20:15:00",
  "groupId": 1,
  "avatarUrl": "preset:avatar_1"
}
```

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid (w tym brak `groupId`).
- `INVALID_ROLE_FOR_GROUP` (400 Bad Request): Wskazana grupa nie należy do aktualnego nauczyciela.
- `USER_GROUP_NOT_FOUND` (404 Not Found): Grupa o podanym ID nie istnieje.
- `EMAIL_ALREADY_TAKEN` (409 Conflict): Email already exists.
- `USERNAME_ALREADY_TAKEN` (409 Conflict): Username already exists.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 5.7. Update Student (Teacher API)
- **URL**: `/api/v1/teacher/students/{id}`
- **Method**: `PUT`
- **Description**: Aktualizuje dane ucznia (username, email) oraz przypisaną grupę. Uczeń musi należeć do jednej z grup nauczyciela. `groupId` jest wymagany i docelowa grupa również musi należeć do nauczyciela.
- **Authorization**: `TEACHER`

**Request Body (JSON):**
```json
{
  "username": "updated_student",
  "email": "updated.student@example.com",
  "groupId": 2
}
```

**Success (200 OK):**
```json
{
  "id": 15,
  "username": "updated_student",
  "email": "updated.student@example.com",
  "role": "STUDENT",
  "createdAt": "2026-03-30T20:15:00",
  "groupId": 2,
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
    "id": 3,
    "username": "teacher1",
    "email": "teacher@example.com",
    "role": "TEACHER",
    "createdAt": "2026-03-02T21:00:00"
  }
]
```

**Known Errors:**
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
    "id": 8,
    "username": "student1",
    "email": "user@example.com",
    "role": "STUDENT",
    "groupId": 1,
    "groupName": "Angielski A1",
    "createdAt": "2026-03-02T21:00:00"
  }
]
```

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---
### 6.4. Create Student (Admin API)
- **URL**: `/api/v1/admin/students`
- **Method**: `POST`
- **Description**: Tworzy konto ucznia. Opcjonalnie przypisuje do grupy. Wymaga `ADMIN`.

**Request Body (JSON):**
```json
{
  "username": "new_student",
  "email": "new.student@example.com",
  "password": "password123",
  "groupId": 1
}
```
> `groupId` jest opcjonalne. Jeśli nie podano, uczeń zostaje stworzony bez przypisania do grupy.

**Success (201 Created):**
```json
{
  "id": 15,
  "username": "new_student",
  "email": "new.student@example.com",
  "role": "STUDENT",
  "createdAt": "2026-03-26T20:15:00"
}
```

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Fields are missing or invalid.
- `USER_GROUP_NOT_FOUND` (404 Not Found): Group does not exist.
- `EMAIL_ALREADY_TAKEN` (409 Conflict): Email already exists.
- `USERNAME_ALREADY_TAKEN` (409 Conflict): Username already exists.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---
### 6.5. Update Student (Admin API)
- **URL**: `/api/v1/admin/students/{id}`
- **Method**: `PUT`
- **Description**: Aktualizuje dane ucznia (username, email) oraz opcjonalnie zmienia przypisanie do grupy. Wymaga `ADMIN`.

**Request Body (JSON):**
```json
{
  "username": "updated_student",
  "email": "updated.student@example.com",
  "groupId": 2
}
```
> Jeśli `groupId` jest `null` lub pominięte, dotychczasowe powiązanie z grupą zostaje usunięte.

**Success (200 OK):**
```json
{
  "id": 15,
  "username": "updated_student",
  "email": "updated.student@example.com",
  "role": "STUDENT",
  "groupId": 2,
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
  "averageScore": 80.0
}
```

| Field | Type | Description |
|-------|------|-------------|
| `totalLessons` | Integer | Liczba lekcji przypisanych do grupy ucznia. |
| `completedLessons` | Integer | Liczba lekcji ukonczonych przez ucznia. |
| `inProgressLessons` | Integer | Liczba lekcji rozpoczetych, ale jeszcze nieukonczonych. |
| `averageScore` | Double | Sredni wynik procentowy z lekcji, ktore maja zapisany rezultat. |

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 7.2. Get Student Lessons
- **URL**: `/api/v1/student/lessons`
- **Method**: `GET`
- **Description**: Zwraca lekcje przypisane do aktualnego ucznia przez jego grupe wraz ze statusem postepu i wynikiem. Wymaga `STUDENT`.

**Success (200 OK):**
```json
[
  {
    "id": 12,
    "title": "Present Simple - lesson 1",
    "theme": "Grammar",
    "isActive": true,
    "teacherId": 3,
    "teacherName": "pan_tomasz",
    "teacherAvatarUrl": "preset:avatar_3",
    "createdAt": "2026-03-21T10:00:00",
    "groups": [
      { "id": 1, "name": "Angielski A1" }
    ],
    "status": "COMPLETED",
    "score": 4,
    "maxScore": 5,
    "resultPercent": 80.0
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | ID lekcji. |
| `title` | String | Tytul lekcji. |
| `theme` | String | Temat lekcji. |
| `isActive` | Boolean | Flaga aktywnosci lekcji. |
| `teacherId` | Integer | ID nauczyciela prowadzacego. |
| `teacherName` | String | Username nauczyciela prowadzacego. |
| `createdAt` | String (ISO datetime) | Data utworzenia lekcji. |
| `groups` | List<GroupDto> | W student dashboard zwracana jest tylko grupa aktualnego ucznia, nawet jesli lekcja jest przypisana do wielu grup. |
| `status` | String | `NOT_STARTED`, `IN_PROGRESS` albo `COMPLETED`. |
| `score` | Integer or null | Zdobyta liczba punktow dla lekcji z zapisanym postepem. |
| `maxScore` | Integer or null | Maksymalna liczba punktow dla biezacej proby. |
| `resultPercent` | Double or null | Wynik procentowy, jesli lekcja ma zapisany rezultat. |

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 7.2.1. Get Detailed Result Of Completed Lesson
- **URL**: `/api/v1/student/lessons/{lessonId}/result`
- **Method**: `GET`
- **Description**: Zwraca trwaly widok szczegolowego wyniku ukonczonej lekcji dla aktualnie zalogowanego ucznia.
- **Authorization**: `STUDENT`

**Success (200 OK):** Response ma ten sam shape jak `GET /api/v1/teacher/lessons/{lessonId}/students/{userId}/result`.

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `STUDENT_NO_ACCESS` (403 Forbidden): Uczen nie ma dostepu do tej lekcji.
- `LESSON_RESULT_NOT_FOUND` (404 Not Found): Brak ukonczonego wyniku dla tej lekcji.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 7.3. Get Personal Progress
- **URL**: `/api/v1/student/progress`
- **Method**: `GET`
- **Description**: Zwraca podsumowanie postepu ucznia w formie DTO. Wymaga `STUDENT`.

**Success (200 OK):**
```json
{
  "summary": "Ukonczono 1 z 2 lekcji. Sredni wynik wynosi 80.0%.",
  "completedLessons": 1,
  "totalLessons": 2,
  "inProgressLessons": 1,
  "averageScore": 80.0
}
```

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---
## 8. Tasks (`/api/v1/lessons/{lessonId}/tasks`)

Task management endpoints nested under lessons. All task CRUD requires `ADMIN` or lesson owner (`TEACHER`).

### 8.1. Get Lesson Tasks
- **URL**: `/api/v1/lessons/{lessonId}/tasks`
- **Method**: `GET`
- **Description**: Returns all tasks for a lesson grouped by section. Students get answers stripped and auto-start tracking only when the lesson is active. Teachers/admins see correct answers and may inspect inactive lessons.
- **Authorization**: `STUDENT`, `TEACHER`, or `ADMIN`

**Success (200 OK):**
```json
{
  "lessonId": 1,
  "status": "IN_PROGRESS",
  "sections": [
    {
      "section": "Vocabulary",
      "chooseTasks": [
        {
          "id": 1,
          "lessonId": 1,
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
- **URL**: `/api/v1/lessons/{lessonId}/tasks/choose`
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
  "id": 1, "lessonId": 1, "task": "...", "possibleAnswers": "...",
  "correctAnswer": 1, "hint": "...", "section": "...", "createdAt": "..."
}
```

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `VALIDATION_FAILED` (400 Bad Request): Missing required fields (`task`, `possibleAnswers`, `correctAnswer`)
- `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.3. Update Choose Task
- **URL**: `/api/v1/lessons/{lessonId}/tasks/choose/{taskId}`
- **Method**: `PUT`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Request/Response**: Same shape as 8.2. **Success: 200 OK.**

**Known Errors:**
- `TASK_NOT_FOUND` (404 Not Found)
- `VALIDATION_FAILED` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.4. Delete Choose Task
- **URL**: `/api/v1/lessons/{lessonId}/tasks/choose/{taskId}`
- **Method**: `DELETE`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Success (204 No Content):** *(Empty Response Body)*

**Known Errors:**
- `TASK_NOT_FOUND` (404 Not Found)
- `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.5. Create Write Task
- **URL**: `/api/v1/lessons/{lessonId}/tasks/write`
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
  "id": 1, "lessonId": 1, "task": "...", "correctAnswer": "...",
  "hint": "...", "section": "...", "createdAt": "..."
}
```

**Known Errors:**
- `LESSON_NOT_FOUND` (404), `VALIDATION_FAILED` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.6. Update Write Task
- **URL**: `/api/v1/lessons/{lessonId}/tasks/write/{taskId}`
- **Method**: `PUT`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Success: 200 OK.** Same shape as 8.5.

**Known Errors:**
- `TASK_NOT_FOUND` (404), `VALIDATION_FAILED` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.7. Delete Write Task
- **URL**: `/api/v1/lessons/{lessonId}/tasks/write/{taskId}`
- **Method**: `DELETE`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Success (204 No Content)**

**Known Errors:**
- `TASK_NOT_FOUND` (404), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.8. Create Scatter Task
- **URL**: `/api/v1/lessons/{lessonId}/tasks/scatter`
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
  "id": 1, "lessonId": 1, "task": "...", "words": "...", "correctAnswer": "...",
  "hint": "...", "section": "...", "createdAt": "..."
}
```

**Known Errors:**
- `LESSON_NOT_FOUND` (404), `VALIDATION_FAILED` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.9. Update Scatter Task
- **URL**: `/api/v1/lessons/{lessonId}/tasks/scatter/{taskId}`
- **Method**: `PUT`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Success: 200 OK.** Same shape as 8.8.

**Known Errors:**
- `TASK_NOT_FOUND` (404), `VALIDATION_FAILED` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.10. Delete Scatter Task
- **URL**: `/api/v1/lessons/{lessonId}/tasks/scatter/{taskId}`
- **Method**: `DELETE`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Success (204 No Content)**

**Known Errors:**
- `TASK_NOT_FOUND` (404), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.11. Create Speak Task
- **URL**: `/api/v1/lessons/{lessonId}/tasks/speak`
- **Method**: `POST`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Request Body (JSON):**
```json
{
  "task": "Say the sentence: 'Hello, how are you?'",
  "expectedText": "Hello, how are you?",
  "hint": "Focus on pronunciation",
  "section": "Speaking"
}
```

**Success (201 Created):**
```json
{
  "id": 1, "lessonId": 1, "task": "...", "expectedText": "...", "hint": "...",
  "section": "...", "createdAt": "..."
}
```

**Known Errors:**
- `LESSON_NOT_FOUND` (404), `VALIDATION_FAILED` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.12. Update Speak Task
- **URL**: `/api/v1/lessons/{lessonId}/tasks/speak/{taskId}`
- **Method**: `PUT`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Success: 200 OK.** Same shape as 8.11.

**Known Errors:**
- `TASK_NOT_FOUND` (404), `VALIDATION_FAILED` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.13. Delete Speak Task
- **URL**: `/api/v1/lessons/{lessonId}/tasks/speak/{taskId}`
- **Method**: `DELETE`
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Success (204 No Content)**

**Known Errors:**
- `TASK_NOT_FOUND` (404), `UNAUTHORIZED` (401), `FORBIDDEN` (403)

---

### 8.14. Transcribe Speak Task Audio
- **URL**: `/api/v1/lessons/{lessonId}/tasks/speak/{taskId}/transcribe`
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
  "score": 0.95,
  "words": [
    { "expected": "hello", "actual": "hello", "correct": true },
    { "expected": "how", "actual": "how", "correct": true },
    { "expected": "are", "actual": "are", "correct": true },
    { "expected": "you", "actual": "you", "correct": true }
  ]
}
```

**Known Errors:**
- `STT_AUDIO_REQUIRED` (400): Audio file is missing or empty.
- `LESSON_NOT_FOUND` (404), `TASK_NOT_FOUND` (404)
- `LESSON_NOT_ACTIVE` (403), `STUDENT_NO_ACCESS` (403)
- `STT_SERVICE_UNAVAILABLE` (503): Local STT service is not reachable or failed to transcribe.

---

### 8.15. Submit Lesson Answers
- **URL**: `/api/v1/lessons/{lessonId}/submit`
- **Method**: `POST`
- **Description**: Submits all answers for an active lesson at once. Grades each answer and marks lesson as `COMPLETED`. One-shot — cannot re-submit.
- **Authorization**: `STUDENT` only

**Request Body (JSON):**
```json
{
  "answers": [
    { "taskId": 1, "taskType": "choose", "answer": "1" },
    { "taskId": 2, "taskType": "write", "answer": "went" },
    { "taskId": 3, "taskType": "speak", "answer": "Hello how are you" }
  ]
}
```

**Success (200 OK):**
```json
{
  "score": 2,
  "maxScore": 3,
  "details": [
    { "taskId": 1, "taskType": "choose", "isCorrect": true, "correctAnswer": "1" },
    { "taskId": 2, "taskType": "write", "isCorrect": true, "correctAnswer": "went" }
  ]
}
```

**Grading logic:**
- `choose`: exact string match on correctAnswer index
- `write` / `scatter`: case-insensitive, trimmed comparison
- `speak`: normalized transcription compared with `expectedText`; accepted when similarity is at least `application.stt.min-score` (default `0.85`)

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

### 8.15. Reset User Progress
- **URL**: `/api/v1/lessons/{lessonId}/users/{userId}/reset`
- **Method**: `POST`
- **Description**: Deletes all UserAnswer and UserLesson records for a user+lesson, allowing re-attempt.
- **Authorization**: `ADMIN` or lesson owner (`TEACHER`)

**Success (204 No Content):** *(Empty Response Body)*

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found): Lesson does not exist.
- `UNAUTHORIZED` (401), `FORBIDDEN` (403)

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



