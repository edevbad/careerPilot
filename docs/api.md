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

