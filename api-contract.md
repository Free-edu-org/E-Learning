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

---

### 1.2. Request Password Reset Link
- **URL**: `/api/v1/auth/forgot-password`
- **Method**: `POST`
- **Description**: Requests a password reset link.

---

### 1.3. Reset Password
- **URL**: `/api/v1/auth/reset-password`
- **Method**: `POST`
- **Description**: Resets the account password using a valid token.

---

## 2. User Management (`/api/v1/users`)

### 2.1. Register Student
- **URL**: `/api/v1/users/register`
- **Method**: `POST`
- **Description**: Registers a new user with the `STUDENT` role. Requires `ADMIN`.

---

### 2.2. Create Admin / Teacher
- **URL**: `/api/v1/users/admin` or `/api/v1/users/teacher`
- **Method**: `POST`

---

### 2.3. Get Current User Profile
- **URL**: `/api/v1/users/me`
- **Method**: `GET`

**Success (200 OK):**
```json
{
  "publicId": "33333333-3333-3333-3333-333333333333",
  "username": "student1",
  "email": "user@example.com",
  "role": "STUDENT",
  "createdAt": "2026-03-02T21:00:00",
  "avatarUrl": "preset:avatar_1"
}
```

---

### 2.4. Get User Details
- **URL**: `/api/v1/users/{publicId}`
- **Method**: `GET`

---

### 2.5. Update User Profile
- **URL**: `/api/v1/users/{publicId}`
- **Method**: `PUT`

---

### 2.6. Change Password
- **URL**: `/api/v1/users/{publicId}/password`
- **Method**: `PUT`

---

### 2.7. Delete User
- **URL**: `/api/v1/users/{publicId}`
- **Method**: `DELETE`

---

### 2.8. Upload Avatar
- **URL**: `/api/v1/users/{publicId}/avatar`
- **Method**: `POST`

---

## 3. User Groups (`/api/v1/user-groups`)

### 3.1. Create User Group
- **URL**: `/api/v1/user-groups`
- **Method**: `POST`

**Success (201 Created):**
```json
{
  "publicId": "11111111-1111-1111-1111-111111111111",
  "name": "Angielski A1",
  "description": "Grupa początkująca",
  "studentCount": 0,
  "teacherPublicId": "22222222-2222-2222-2222-222222222222",
  "createdAt": "2026-03-21T10:00:00"
}
```

---

### 3.2. Get All User Groups
- **URL**: `/api/v1/user-groups`
- **Method**: `GET`

---

### 3.3. Get User Group by Public ID
- **URL**: `/api/v1/user-groups/{groupPublicId}`
- **Method**: `GET`

---

### 3.4. Update User Group
- **URL**: `/api/v1/user-groups/{groupPublicId}`
- **Method**: `PUT`

---

### 3.5. Delete User Group
- **URL**: `/api/v1/user-groups/{groupPublicId}`
- **Method**: `DELETE`

---

### 3.6. Add Member to Group
- **URL**: `/api/v1/user-groups/{groupPublicId}/members/{userPublicId}`
- **Method**: `POST`

---

### 3.7. Remove Member from Group
- **URL**: `/api/v1/user-groups/{groupPublicId}/members/{userPublicId}`
- **Method**: `DELETE`

---

## 4. Lessons (`/api/v1/lessons`)

### 4.1. Get list of lessons
- **URL**: `/api/v1/lessons`
- **Method**: `GET`

**Success (200 OK):**
```json
[
  {
    "publicId": "44444444-4444-4444-4444-444444444444",
    "title": "Present Simple",
    "theme": "Grammar",
    "isActive": true,
    "teacherPublicId": "22222222-2222-2222-2222-222222222222",
    "teacherName": "pan_tomasz",
    "createdAt": "2026-03-21T10:00:00",
    "groups": [ { "publicId": "11111111-1111-1111-1111-111111111111", "name": "Angielski A1" } ]
  }
]
```

---

### 4.2. Create a new lesson
- **URL**: `/api/v1/lessons`
- **Method**: `POST`

**Request Body (JSON):**
```json
{
  "title": "Present Simple",
  "theme": "Grammar",
  "groupPublicIds": ["11111111-1111-1111-1111-111111111111"]
}
```

---

### 4.3. Update lesson data
- **URL**: `/api/v1/lessons/{lessonPublicId}`
- **Method**: `PUT`

---

### 4.4. Quick status change (isActive)
- **URL**: `/api/v1/lessons/{lessonPublicId}/status`
- **Method**: `PATCH`

---

### 4.5. Delete lesson
- **URL**: `/api/v1/lessons/{lessonPublicId}`
- **Method**: `DELETE`

---

### 4.6. Upload lesson attachment
- **URL**: `/api/v1/lessons/{lessonPublicId}/attachments`
- **Method**: `POST`

**Success (201 Created):**
```json
{
  "publicId": "55555555-5555-5555-5555-555555555555",
  "originalFileName": "notatki.pdf",
  "contentType": "application/pdf",
  "fileSize": 204800,
  "createdAt": "2026-04-25T10:00:00"
}
```

---

### 4.7. Download attachment
- **URL**: `/api/v1/lessons/{lessonPublicId}/attachments/{attachmentPublicId}`
- **Method**: `GET`

---

### 4.8. Delete lesson attachment
- **URL**: `/api/v1/lessons/{lessonPublicId}/attachments/{attachmentPublicId}`
- **Method**: `DELETE`

---

## 5. Teacher Dashboard (`/api/v1/teacher`)

### 5.1. Get Dashboard Statistics
- **URL**: `/api/v1/teacher/stats`
- **Method**: `GET`

---

### 5.2. Get My Lessons
- **URL**: `/api/v1/teacher/lessons`
- **Method**: `GET`

---

### 5.3. Get Lesson Statistics
- **URL**: `/api/v1/teacher/lessons/{lessonPublicId}/stats`
- **Method**: `GET`

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
      "resultPercent": 80.0
    }
  ]
}
```

---

### 5.4. Get Detailed Lesson Result For Selected Student
- **URL**: `/api/v1/teacher/lessons/{lessonPublicId}/students/{studentPublicId}/result`
- **Method**: `GET`

**Success (200 OK):**
```json
{
  "lessonPublicId": "44444444-4444-4444-4444-444444444444",
  "userPublicId": "33333333-3333-3333-3333-333333333333",
  "score": 4,
  "maxScore": 5,
  "resultPercent": 80.0,
  "tasks": [
    {
      "taskPublicId": "66666666-6666-6666-6666-666666666666",
      "taskType": "choose",
      "userAnswer": "go",
      "correctAnswer": "goes",
      "isCorrect": false
    }
  ]
}
```

---

## 6. Admin Dashboard (`/api/v1/admin`)

### 6.1. Get Global Stats
- **URL**: `/api/v1/admin/stats`
- **Method**: `GET`

---

### 6.2. Get All Teachers / Students
- **URL**: `/api/v1/admin/teachers` or `/api/v1/admin/students`
- **Method**: `GET`

---

### 6.3. Create / Update Student (Admin API)
- **URL**: `/api/v1/admin/students` or `/api/v1/admin/students/{studentPublicId}`
- **Method**: `POST` / `PUT`

---

## 7. Student Dashboard (`/api/v1/student`)

### 7.1. Get Dashboard Statistics
- **URL**: `/api/v1/student/stats`
- **Method**: `GET`

---

### 7.2. Get Student Lessons
- **URL**: `/api/v1/student/lessons`
- **Method**: `GET`

---

### 7.3. Get Detailed Result Of Completed Lesson
- **URL**: `/api/v1/student/lessons/{lessonPublicId}/result`
- **Method**: `GET`

---

## 8. Tasks (`/api/v1/lessons/{lessonPublicId}/tasks`)

### 8.1. Get Lesson Tasks
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks`
- **Method**: `GET`

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
          "publicId": "66666666-6666-6666-6666-666666666666",
          "task": "...",
          "possibleAnswers": "a|b|c",
          "correctAnswer": null
        }
      ]
    }
  ]
}
```

---

### 8.2. Create Choose / Write / Scatter / Speak Task
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/choose`
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/write`
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/scatter`
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/speak`
- **Method**: `POST`

---

### 8.3. Update / Delete Task
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/choose/{taskPublicId}`
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/write/{taskPublicId}`
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/scatter/{taskPublicId}`
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/speak/{taskPublicId}`
- **Method**: `PUT` / `DELETE`

---

### 8.4. Transcribe Speak Task Audio
- **URL**: `/api/v1/lessons/{lessonPublicId}/tasks/speak/{taskPublicId}/transcribe`
- **Method**: `POST`
- **Request**: multipart form-data with `file`

---

### 8.5. Submit Lesson Answers
- **URL**: `/api/v1/lessons/{lessonPublicId}/submit`
- **Method**: `POST`

**Request Body (JSON):**
```json
{
  "answers": [
    { "taskPublicId": "66666666-6666-6666-6666-666666666666", "taskType": "choose", "answer": "1" }
  ]
}
```

**Success (200 OK):**
```json
{
  "score": 1,
  "maxScore": 1,
  "details": [
    { "taskPublicId": "66666666-6666-6666-6666-666666666666", "taskType": "choose", "isCorrect": true }
  ]
}
```

---

### 8.6. Reset User Progress
- **URL**: `/api/v1/lessons/{lessonPublicId}/users/{userPublicId}/reset`
- **Method**: `POST`

---

## 9. Global Application Errors
RFC-7807 ProblemDetail format is used.

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Error description",
  "code": "ERROR_CODE"
}
```

---

## 10. Swagger UI
- `http://localhost:8080/swagger-ui.html`
- `http://localhost:8080/v3/api-docs`
