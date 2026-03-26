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
- **Description**: Retrieves user details. Requires `ADMIN` authority OR `TEACHER` authority (only if the requested user is a `STUDENT`), OR the requesting user ID must match the parameter ID.

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

### 2.8. List Students
- **URL**: `/api/v1/users/students`
- **Method**: `GET`
- **Description**: Returns all users with role `STUDENT`. Requires `ADMIN` authority.

**Success (200 OK):**
```json
[
  {
    "id": 2,
    "email": "student1@edu.pl",
    "username": "student1",
    "role": "STUDENT",
    "createdAt": "2026-03-02T21:00:00"
  }
]
```

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token is not an admin token.

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
- **Description**: Returns a list of all user groups. Requires `TEACHER` or `ADMIN` authority.

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
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 3.3. Get User Group by ID
- **URL**: `/api/v1/user-groups/{id}`
- **Method**: `GET`
- **Description**: Returns a single user group by its ID. Requires `ADMIN` or `TEACHER` authority.

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
- `FORBIDDEN` (403 Forbidden): Token is not an admin token.

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
- `FORBIDDEN` (403 Forbidden): Token is not an admin token.

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
- `FORBIDDEN` (403 Forbidden): Token is not an admin token.

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
- `FORBIDDEN` (403 Forbidden): Token is not an admin token.

---

## 4. Lessons (`/api/v1/lessons`)

### 4.1. Get list of lessons
- **URL**: `/api/v1/lessons`
- **Method**: `GET`
- **Description**: Pobiera listę lekcji. Obsługuje filtry i sortowanie.
- **Query params**:
  - `search` (string, optional) - wyszukiwanie po tytule / temacie
  - `groupId` (integer, optional) - filtr po przypisanej grupie
  - `status` (boolean, optional) - filtr po polu `isActive`
  - `sort` (string, optional) - np. `createdAt:desc` lub `title:asc`
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
    "groups": [{ "id": 1, "name": "Angielski A1" }]
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | ID lekcji |
| `title` | String | Tytul lekcji |
| `theme` | String | Temat kategorii lekcji |
| `isActive` | Boolean | Czy lekcja jest aktywna |
| `teacherId` | Integer | ID nauczyciela, ktory utworzyl lekcje |
| `createdAt` | String (ISO datetime) | Data utworzenia |
| `groups` | List<GroupDto> | Lista grup przypisanych do lekcji (`id`, `name`) |

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 4.2. Create a new lesson
- **URL**: `/api/v1/lessons`
- **Method**: `POST`
- **Description**: Tworzy nowa lekcje. Mozna jednoczesnie przypisac lekcje do grup.
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
Zwraca utworzona reprezentacje `LessonResponse` (jak w sekcji 4.1).

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Brak wymaganych pol (`title`, `theme`) lub zly format danych.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit creation.

---

### 4.3. Update lesson data
- **URL**: `/api/v1/lessons/{id}`
- **Method**: `PUT`
- **Description**: Aktualizuje pola lekcji (`title`, `theme`, `groupIds`).
- **Authorization**: `TEACHER` lub `ADMIN` (tylko wlasciciel lekcji)

**Request Body (JSON):**
```json
{
  "title": "Present Simple - lesson 2",
  "theme": "Grammar",
  "groupIds": [1]
}
```

**Success (200 OK):**
Zwraca zaktualizowana reprezentacje `LessonResponse`.

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request): Zle dane wejsciowe.
- `LESSON_NOT_FOUND` (404 Not Found): Nie znaleziono lekcji.
- `NOT_LESSON_OWNER` (403 Forbidden): Uzytkownik nie jest wlascicielem lekcji.
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.

---

### 4.4. Quick status change (isActive)
- **URL**: `/api/v1/lessons/{id}/status`
- **Method**: `PATCH`
- **Description**: Szybka zmiana flagi `isActive` (wlacz/wylacz lekcje).
- **Authorization**: `TEACHER` lub `ADMIN` (tylko wlasciciel lekcji)

**Request Body (JSON):**
```json
{ "isActive": true }
```

**Success (204 No Content):** *(Empty Response Body)*

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request)
- `LESSON_NOT_FOUND` (404 Not Found)
- `NOT_LESSON_OWNER` (403 Forbidden)
- `UNAUTHORIZED` (401 Unauthorized)

---

### 4.5. Delete lesson
- **URL**: `/api/v1/lessons/{id}`
- **Method**: `DELETE`
- **Description**: Usuwa lekcje.
- **Authorization**: `TEACHER` lub `ADMIN` (tylko wlasciciel lekcji)

**Success (204 No Content):** *(Empty Response Body)*

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `NOT_LESSON_OWNER` (403 Forbidden)
- `UNAUTHORIZED` (401 Unauthorized)

---

## 5. Student Lesson Access (`/api/v1/student`)

### 5.1. Get Student Lessons
- **URL**: `/api/v1/student/lessons`
- **Method**: `GET`
- **Description**: Zwraca aktywne lekcje dostepne dla zalogowanego ucznia (przez grupe lub przypisanie bezposrednie).
- **Authorization**: `STUDENT`

**Success (200 OK):**
```json
[
  {
    "id": 12,
    "title": "Present Simple - lesson 1",
    "theme": "Grammar",
    "status": null
  }
]
```

`status` moze przyjmowac wartosci: `null`, `IN_PROGRESS`, `COMPLETED`.

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Endpoint dostepny tylko dla roli `STUDENT`.

---

## 6. Tasks (`/api/v1/lessons/{lessonId}`)

### 6.1. Get Lesson Tasks
- **URL**: `/api/v1/lessons/{lessonId}/tasks`
- **Method**: `GET`
- **Description**: Zwraca zadania pogrupowane sekcjami dla lekcji.
- **Authorization**: `STUDENT` lub `ADMIN`

**Success (200 OK):**
```json
{
  "lessonId": 12,
  "lessonTitle": "Present Simple - lesson 1",
  "status": "IN_PROGRESS",
  "sections": {
    "default": [
      {
        "id": 101,
        "taskType": "choose_tasks",
        "task": "Choose the correct form",
        "hint": "Use 3rd person",
        "section": "default",
        "possibleAnswers": "goes|go",
        "words": null,
        "correctAnswerIndex": null,
        "correctAnswerText": null
      }
    ]
  }
}
```

Uwagi:
- Dla roli `STUDENT` pola `correctAnswerIndex` i `correctAnswerText` sa zawsze `null`.
- Dla roli `ADMIN` endpoint zwraca poprawne odpowiedzi (pola uzupelnione).

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `LESSON_NOT_ACCESSIBLE` (403 Forbidden)
- `LESSON_ALREADY_COMPLETED` (403 Forbidden)
- `UNAUTHORIZED` (401 Unauthorized)

---

### 6.2. Submit Lesson Answers
- **URL**: `/api/v1/lessons/{lessonId}/submit`
- **Method**: `POST`
- **Description**: Wysyla odpowiedzi ucznia i dokonuje oceny.
- **Authorization**: `STUDENT`

**Request Body (JSON):**
```json
{
  "answers": [
    {
      "taskId": 101,
      "taskType": "choose_tasks",
      "answer": "0"
    },
    {
      "taskId": 205,
      "taskType": "write_tasks",
      "answer": "She goes to school"
    }
  ]
}
```

**Success (200 OK):**
```json
{
  "lessonId": 12,
  "score": 7,
  "maxScore": 10,
  "status": "COMPLETED",
  "results": [
    {
      "taskId": 101,
      "taskType": "choose_tasks",
      "isCorrect": true
    }
  ]
}
```

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request)
- `LESSON_NOT_FOUND` (404 Not Found)
- `LESSON_NOT_ACCESSIBLE` (403 Forbidden)
- `LESSON_NOT_STARTED` (400 Bad Request)
- `ALREADY_SUBMITTED` (409 Conflict)
- `INVALID_TASK_TYPE` (400 Bad Request)
- `TASK_NOT_FOUND` (404 Not Found)
- `UNAUTHORIZED` (401 Unauthorized)

---

## 7. Task Management (`/api/v1/lessons/{lessonId}`)

Wszystkie endpointy w tej sekcji wymagaja roli `ADMIN` i dodatkowo wlascicielstwa lekcji (`NOT_LESSON_OWNER` gdy lekcja nie nalezy do zalogowanego uzytkownika).

### 7.1. Create Task
- **URL**:
  - `/api/v1/lessons/{lessonId}/tasks/speak`
  - `/api/v1/lessons/{lessonId}/tasks/choose`
  - `/api/v1/lessons/{lessonId}/tasks/write`
  - `/api/v1/lessons/{lessonId}/tasks/scatter`
- **Method**: `POST`

**Request Body examples:**
```json
{
  "task": "Powtorz zdanie",
  "hint": "Zwracaj uwage na wymowe",
  "section": "speaking"
}
```

```json
{
  "task": "Choose the correct form",
  "possibleAnswers": "goes|go",
  "correctAnswer": 0,
  "hint": "3rd person",
  "section": "grammar"
}
```

```json
{
  "task": "Uloz zdanie",
  "correctAnswer": "She goes to school",
  "hint": "Present Simple",
  "section": "writing"
}
```

```json
{
  "task": "Uloz wyrazy we wlasciwej kolejnosci",
  "words": "school|to|goes|she",
  "correctAnswer": "she goes to school",
  "hint": "Podmiot + czasownik + dopelnienie",
  "section": "grammar"
}
```

**Success (201 Created):**
Zwraca `TaskResponse` (z uzupelnionymi polami poprawnych odpowiedzi dla admina).

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request)
- `LESSON_NOT_FOUND` (404 Not Found)
- `NOT_LESSON_OWNER` (403 Forbidden)
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden): Brak roli `ADMIN`.

---

### 7.2. Update Task
- **URL**:
  - `/api/v1/lessons/{lessonId}/tasks/speak/{taskId}`
  - `/api/v1/lessons/{lessonId}/tasks/choose/{taskId}`
  - `/api/v1/lessons/{lessonId}/tasks/write/{taskId}`
  - `/api/v1/lessons/{lessonId}/tasks/scatter/{taskId}`
- **Method**: `PUT`
- **Request Body**: jak w sekcji 7.1 dla odpowiedniego typu zadania.

**Success (200 OK):**
Zwraca zaktualizowane `TaskResponse`.

**Known Errors:**
- `VALIDATION_FAILED` (400 Bad Request)
- `LESSON_NOT_FOUND` (404 Not Found)
- `TASK_NOT_FOUND` (404 Not Found)
- `NOT_LESSON_OWNER` (403 Forbidden)
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden): Brak roli `ADMIN`.

---

### 7.3. Delete Task
- **URL**: `/api/v1/lessons/{lessonId}/tasks/{taskType}/{taskId}`
- **Method**: `DELETE`
- **Path param `taskType`**: `speak`, `choose`, `write`, `scatter`

**Success (204 No Content):** *(Empty Response Body)*

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `TASK_NOT_FOUND` (404 Not Found)
- `INVALID_TASK_TYPE` (400 Bad Request)
- `NOT_LESSON_OWNER` (403 Forbidden)
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden): Brak roli `ADMIN`.

---

### 7.4. Reset Student Progress
- **URL**: `/api/v1/lessons/{lessonId}/users/{userId}/reset`
- **Method**: `POST`
- **Description**: Usuwa odpowiedzi i status realizacji lekcji dla wskazanego ucznia.

**Success (204 No Content):** *(Empty Response Body)*

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `NOT_LESSON_OWNER` (403 Forbidden)
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden): Brak roli `ADMIN`.

---

### 7.5. Get Assigned Students for Lesson
- **URL**: `/api/v1/lessons/{lessonId}/students`
- **Method**: `GET`
- **Description**: Zwraca uczniow z dostepem do lekcji (przypisanie bezposrednie i przez grupy).

**Success (200 OK):**
```json
[
  {
    "id": 2,
    "username": "student1",
    "email": "student1@edu.pl",
    "accessType": "direct",
    "groupName": null
  },
  {
    "id": 3,
    "username": "student2",
    "email": "student2@edu.pl",
    "accessType": "group",
    "groupName": "Angielski A1"
  }
]
```

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `NOT_LESSON_OWNER` (403 Forbidden)
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden): Brak roli `ADMIN`.

---

### 7.6. Assign Student Directly to Lesson
- **URL**: `/api/v1/lessons/{lessonId}/students/{userId}`
- **Method**: `POST`
- **Description**: Przypisuje ucznia bezposrednio do lekcji.

**Success (201 Created):** *(Empty Response Body)*

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `NOT_LESSON_OWNER` (403 Forbidden)
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden): Brak roli `ADMIN`.

---

### 7.7. Remove Direct Assignment from Lesson
- **URL**: `/api/v1/lessons/{lessonId}/students/{userId}`
- **Method**: `DELETE`
- **Description**: Usuwa bezposrednie przypisanie ucznia do lekcji.

**Success (204 No Content):** *(Empty Response Body)*

**Known Errors:**
- `LESSON_NOT_FOUND` (404 Not Found)
- `NOT_LESSON_OWNER` (403 Forbidden)
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden): Brak roli `ADMIN`.

---

## 8. Teacher Stats (`/api/v1/teacher/stats`)

### 8.1. Get Dashboard Statistics
- **URL**: `/api/v1/teacher/stats`
- **Method**: `GET`
- **Description**: Returns aggregated dashboard statistics: total and active lesson counts, active student count, and average answer score. Requires `TEACHER` or `ADMIN` authority.

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
| `avgScore` | Double | Average correctness score (0-100). Returns `0.0` when no answers exist (COALESCE guard). |

**Known Errors:**
- `UNAUTHORIZED` (401 Unauthorized): Invalid or missing token.
- `FORBIDDEN` (403 Forbidden): Token role does not permit access.

---

### 5.2. Get My Lessons
- **URL**: `/api/v1/teacher/lessons`
- **Method**: `GET`
- **Description**: Pobiera listę lekcji wykreowanych i przypisanych WYŁĄCZNIE do odpytującego nauczyciela. Odciąża generyczny `LessonController` chroniąc przed dostępem do obcych materiałów.
- **Authorization**: `TEACHER` lub `ADMIN`

**Success (200 OK):** Zwraca macierz obiektów `LessonResponse` (odpowiednik standardowego 4.1. Get list of lessons).

---

### 5.3. Get My Groups
- **URL**: `/api/v1/teacher/my-groups`
- **Method**: `GET`
- **Description**: Odtworzenie logiki UserGroup dedykowanej pulpitu Nauczyciela. Zwraca wszystkie grupy stworzone przez logującego się Nauczyciela (`teacherId = currentUserId`).
- **Authorization**: `TEACHER` lub `ADMIN`

**Success (200 OK):** Zwraca macierz elementów `UserGroupResponse` z wyliczoną ilością wpisanych do nich studentów.

---

## 6. Admin Dashboard (`/api/v1/admin`)

Warstwa BFF dla administratora. Dedykowana wyciągom z zakresu całego systemu.

### 6.1. Get Global Stats
- **URL**: `/api/v1/admin/stats`
- **Method**: `GET`
- **Description**: Endpoint statystyk ogólnych dla panelu (placeholder). Wymaga `ADMIN`.

---

## 7. Student Dashboard (`/api/v1/student`)

Warstwa BFF dla uczniów.

### 7.1. Get Personal Progress
- **URL**: `/api/v1/student/progress`
- **Method**: `GET`
- **Description**: Zwraca status lekcji, oceny i progres ucznia (placeholder). Wymaga `STUDENT` lub wyższej rangi.

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
