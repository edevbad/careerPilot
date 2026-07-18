# API Documentation

Base URL: `http://localhost:5000/api`

All successful responses use the `ApiResponse` envelope:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Success",
  "data": { /* resource payload */ }
}
```

Authentication note:
- Protected endpoints require `Authorization: Bearer <accessToken>` header.
- Refresh tokens are sent/received via `refreshToken` cookie for `refresh-token`.

---

## Auth

### POST /auth/login
- Body:

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```
- Response (200):

```json
{
  "statusCode":200,
  "success":true,
  "message":"Success",
  "data":{
    "accessToken":"<jwt>",
    "user":{
      "_id":"...",
      "name":"...",
      "email":"...",
      "careerGoal":"...",
      "role":"user",
      "createdAt":"...",
      "updatedAt":"..."
    }
  }
}
```

### POST /auth/register
- Body:

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "Password123",
  "confirmPassword": "Password123",
  "role": "user" // optional, defaults to 'user'
}
```
- Response (201): same envelope with `accessToken` and `user` in `data`.

### POST /auth/refresh-token
- Body: none (reads `refreshToken` cookie).
- Response (200): returns a new `accessToken` and `user` in `data`.

### POST /auth/logout (protected)
- Body: none
- Response (200): message `Logged out successfully` and clears the refresh cookie.

### GET /auth/profile (protected)
- Params: none
- Response (200): `data.user` with user profile fields.

### PUT /auth/profile (protected)
- Body (partial updates allowed):

```json
{
  "name": "New Name",
  "careerGoal": "Become a senior backend engineer"
}
```
- Notes: `email` and `password` cannot be changed via this endpoint.

---

## Roadmaps

Base path: `/roadmaps`

### POST /roadmaps/generate (protected)
- Body:

```json
{
  "targetCareer": "Frontend Developer",
  "skillLevel": "Beginner",
  "duration": "3 months",
  "interests": "React, TypeScript",
  "startDate": "2026-07-01"
}
```
- Response (201): `data.roadmap` — the newly generated roadmap object (see model for `phases`, `skills`, `dailyTasks`).

### POST /roadmaps/:id/regenerate (protected)
- Params:
  - `id` (path) — roadmap id (MongoId)
- Body (optional):

```json
{ "feedback": "Make it more focused on React basics" }
```
- Response (200): `data.roadmap` — regenerated roadmap

### GET /roadmaps (protected)
- Params: none
- Response (200): `data.roadmaps` — array of roadmap objects

### GET /roadmaps/:id (protected)
- Params:
  - `id` (path) — roadmap id (MongoId)
- Response (200): `data.roadmap` — single roadmap object

### PUT /roadmaps/:id (protected)
- Params: `id` (path)
- Body: fields to update. Note: `targetCareer` and `isActive` are not allowed to change.

Example body:

```json
{
  "skillLevel": "Intermediate",
  "duration": "6 months",
  "interests": "APIs, Testing",
  "summary": "Condensed plan"
}
```
- Response (200): `data.roadmap` — updated roadmap

### DELETE /roadmaps/:id (protected)
- Params: `id` (path)
- Response (200): message `Roadmap deleted`

### PATCH /roadmaps/:id/skill-progress (protected)
- Params: `id` (path)
- Body:

```json
{
  "phaseIndex": 0,
  "skillIndex": 1,
  "completed": true
}
```
- Response (200): `data.roadmap` — roadmap with updated skill `completed` state

### PATCH /roadmaps/:id/task-progress (protected)
- Params: `id` (path)
- Body:

```json
{
  "phaseIndex": 0,
  "skillIndex": 1,
  "taskIndex": 2,
  "completed": true
}
```
- Response (200): `data.roadmap` — roadmap with updated task `completed` state

---

## Progress

Base path: `/progress` (protected)

### GET /progress/summary
- Response (200): `data.summary` — aggregated progress (totals and percentages)

### GET /progress
- Response (200): `data.progress` — array of progress objects for all roadmaps for the user

### GET /progress/:roadmapId
- Params: `roadmapId` (path) — roadmap id (MongoId)
- Response (200): `data.progress` — progress object for the specified roadmap

### POST /progress/sync/:roadmapId
- Params: `roadmapId` (path)
- Body: none
- Response (200): `data.progress` — synced/updated progress object

---

## Quizzes

Base path: `/quizzes` (protected)

### GET /quizzes/:roadmapId/phase/:phaseNumber
- Purpose: Fetch a randomized question set for a quiz attempt. Correct answers are never included.
- Params:
  - `roadmapId` (path) — roadmap id (MongoId)
  - `phaseNumber` (path) — phase number (positive integer)
- Response (200):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Quiz questions fetched successfully",
  "data": {
    "roadmapId": "...",
    "phaseNumber": 2,
    "phaseTitle": "JavaScript & TypeScript",
    "passingScore": 70,
    "totalQuestions": 15,
    "attemptNumber": 1,
    "questions": [
      {
        "id": 12,
        "questionType": "mcq",
        "questionText": "What is the output of...",
        "options": ["A", "B", "C", "D"]
      }
    ],
    "startedAt": "2026-07-16T20:44:32.000Z"
  }
}
```

### POST /quizzes/:roadmapId/phase/:phaseNumber/submit
- Purpose: Submit answers for grading, persist attempt results, and unlock the next phase if passed.
- Params:
  - `roadmapId` (path) — roadmap id (MongoId)
  - `phaseNumber` (path) — phase number (positive integer)
- Body:
```json
{
  "startedAt": "2026-07-16T20:44:32.000Z",
  "answers": [
    {
      "questionId": 12,
      "userAnswer": "A",
      "questionType": "mcq",
      "_correctAnswer": "A",
      "_explanation": "...",
      "_topic": "...",
      "questionText": "..."
    }
  ]
}
```
- Response (200):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Quiz passed with 80%! Next phase unlocked 🎉",
  "data": {
    "result": {
      "userId": "...",
      "roadmapId": "...",
      "phaseNumber": 2,
      "attemptNumber": 1,
      "totalQuestions": 15,
      "correctAnswers": 12,
      "score": 80,
      "passingScore": 70,
      "passed": true,
      "startedAt": "...",
      "completedAt": "...",
      "studySuggestions": []
    },
    "passed": true,
    "score": 80,
    "correctAnswers": 12,
    "totalQuestions": 15,
    "passingScore": 70,
    "studySuggestions": [],
    "nextPhaseUnlocked": true,
    "activePhaseNumber": 3,
    "durationFormatted": "1m 15s"
  }
}
```

### GET /quizzes/:roadmapId/phase/:phaseNumber/results
- Purpose: Fetch attempt history for a phase quiz.
- Params:
  - `roadmapId` (path) — roadmap id (MongoId)
  - `phaseNumber` (path) — phase number (positive integer)
- Response (200):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Quiz results fetched successfully",
  "data": {
    "phaseNumber": 2,
    "phaseTitle": "JavaScript & TypeScript",
    "passingScore": 70,
    "totalAttempts": 1,
    "hasPassed": true,
    "bestScore": 80,
    "canRetake": true,
    "retakeAvailableAt": null,
    "attempts": [
      {
        "_id": "...",
        "userId": "...",
        "roadmapId": "...",
        "phaseNumber": 2,
        "attemptNumber": 1,
        "totalQuestions": 15,
        "correctAnswers": 12,
        "score": 80,
        "passingScore": 70,
        "passed": true,
        "startedAt": "...",
        "completedAt": "..."
      }
    ]
  }
}
```

### GET /quizzes/:roadmapId/phase/:phaseNumber/retake-status
- Purpose: Check eligibility to take/retake a phase quiz (gates "Start Quiz" button).
- Params:
  - `roadmapId` (path) — roadmap id (MongoId)
  - `phaseNumber` (path) — phase number (positive integer)
- Response (200):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Retake status fetched",
  "data": {
    "canTake": false,
    "reason": "cooldown",
    "message": "You must wait 1440 more minute(s) before retaking.",
    "retakeAvailableAt": "2026-07-17T20:44:32.000Z",
    "minutesRemaining": 1440,
    "attemptCount": 1,
    "lastScore": 50,
    "studySuggestions": [
      "Review ES6+ Features",
      "Build small async examples"
    ]
  }
}
```

---

## Daily Tasks

Base path: `/tasks` (protected)

### GET /tasks/today
- Purpose: Retrieve today's tasks for the user (automatically triggers AI task generation if none exist).
- Query Params:
  - `roadmapId` (optional) — filter tasks to a specific roadmap (MongoId)
- Response (200):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Today's tasks fetched successfully",
  "data": {
    "tasks": [
      {
        "_id": "...",
        "userId": "...",
        "roadmapId": "...",
        "phaseNumber": 2,
        "taskType": "reading",
        "title": "TypeScript Handbook — Basic Types",
        "description": "Cover chapters 1–3 focusing on primitive types and interfaces.",
        "resourceUrl": "https://www.typescriptlang.org/docs/handbook/",
        "estimatedMinutes": 30,
        "xpReward": 10,
        "status": "pending",
        "assignedDate": "2026-07-16T00:00:00.000Z",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "summary": {
      "total": 5,
      "completed": 0,
      "skipped": 0,
      "pending": 5,
      "xpEarned": 0
    }
  }
}
```

### PATCH /tasks/:id/complete
- Purpose: Mark a task as completed. Awards XP to the user, updates streak, and syncs progress history.
- Params:
  - `id` (path) — task id (MongoId)
- Response (200):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Task completed! +10 XP",
  "data": {
    "task": {
      "_id": "...",
      "status": "completed",
      "completedAt": "..."
    },
    "xpEarned": 10,
    "streak": 8
  }
}
```

### PATCH /tasks/:id/skip
- Purpose: Skip a task.
- Params:
  - `id` (path) — task id (MongoId)
- Body:
```json
{
  "reason": "too-easy"
}
```
- Response (200):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Task skipped",
  "data": {
    "task": {
      "_id": "...",
      "status": "skipped",
      "skipReason": "too-easy"
    }
  }
}
```

### GET /tasks/history
- Purpose: Retrieve per-day task completion summaries for a date range (used by calendar dashboard).
- Query Params (Required):
  - `startDate` (e.g., `2026-07-01`)
  - `endDate` (e.g., `2026-07-07`)
- Response (200):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Task history fetched successfully",
  "data": {
    "history": [
      {
        "date": "2026-07-01",
        "totalTasks": 5,
        "completedTasks": 3,
        "skippedTasks": 1,
        "pendingTasks": 1,
        "xpEarned": 50,
        "status": "partial"
      }
    ]
  }
}
```

---

## Known Gaps & Client Requirements

The following features/APIs are requested by the mobile app UI/UX, but represent gaps or cross-service considerations:

### 1. Auth Password Reset (Missing on Server)
- **UI Screen**: `ForgotPasswordScreen` (sends a reset email link).
- **Server State**: Validation chains (`forgotPasswordValidator`, `resetPasswordValidator`, `changePasswordValidator`) exist in `auth.validators.js`, but no routes or controller actions are mapped on the Node.js Express server.
- **Proposed Endpoints**:
  - `POST /auth/forgot-password` (Body: `{ email }`)
  - `POST /auth/reset-password` (Body: `{ password, confirmPassword }` + token verification)
  - `POST /auth/change-password` (Body: `{ currentPassword, newPassword }` - protected)

### 2. Skills & Resources (Laravel Service)
- **UI Navigation**: Commented-out route `/resources` in mobile app `router.dart` and quick actions on the dashboard.
- **Laravel Implementation**: The Laravel backend (`http://localhost:8000/api`) hosts the master catalog of skills and learning resources:
  - `GET /skills` — Get all skills
  - `GET /skills/{id}` — Get skill detail
  - `GET /resources` — Browse & filter learning materials
  - `GET /resources/recommended` — Get top rated resources
  - `POST /resources/{id}/rate` — Rate a resource (1-5 stars)
- **Express Gateway Proxy Gap**: The Node.js Express app does not currently proxy or map these routes. For a unified endpoint, the client must either connect directly to Laravel (`http://localhost:8000/api`) or Express must act as a reverse proxy gateway.


---

