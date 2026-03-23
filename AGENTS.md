# AGENT.md — DriveMind

## 0. Project Objective

DriveMind is a web application based on a microservices architecture aimed at preparing users for the theoretical driving exam.

The system allows:

* Driving schools to manage students and assign driving licenses.
* Students to take DGT-style tests with 30 questions.
* Automatic test correction (fail if more than 3 mistakes).
* Visualization of performance statistics.
* Use of DriveMind Assistant: an AI-based assistant with persistent chat.

This document defines:

* System functional requirements
* Global architecture
* Technologies used
* Interfaces between components
* Data model
* Technical prototypes developed

Thus fulfilling Sprint 2 requirements and serving as a foundation for full system development.

---

## 1. System Requirements

### 1.1 Roles

* Student
* Driving school (administrator)

### 1.2 Main Functionalities

#### Authentication

* User login
* Session management using JWT

#### Student Management

* Student registration by driving schools
* Assignment of licenses (B, A1, etc.)

#### Test System

* Generation of 30-question tests
* Selection by:

  * license
  * topic
  * random
* Automatic correction
* Results visualization

#### Statistics

* Correct / incorrect answers
* Progress by topic
* Attempt history

#### DriveMind Assistant (AI)

* Chat accessible from menu
* Multiple conversations
* Message persistence
* Integration with external API (HuggingFace)

---

## 2. Technology Stack

* Frontend: React (Vite)
* Backend: FastAPI (REST microservices)
* Databases: PostgreSQL (database-per-service)
* Deployment: Docker Compose
* AI: HuggingFace Inference API

---

## 3. Global Architecture

### 3.1 Approach

Microservices-based architecture with domain separation:

* auth-service → user management
* core-service → main logic (tests, questions, statistics)
* ai-service → AI assistant


---

### 3.2 Services

#### auth-service

Responsibilities:

* authentication
* users
* driving schools
* student licenses

Database:

* auth-db

---

#### core-service

Responsibilities:

* question bank
* test generation
* correction
* statistics

Database:

* core-db

---

#### ai-service

Responsibilities:

* conversation management
* AI integration

Database:

* ai-db

---

### 3.3 Communication

* The frontend consumes REST APIs from the services
* Relationships between services are handled via IDs (logical references)
* Cross-service validations are performed at the application level

---

## 4. Business Rules

* All tests contain exactly 30 questions
* Fail condition if:
  wrong_count > 3
* A student can have multiple licenses
* The AI system is independent from the test system

---

## 5. Data Model

### 5.1 Auth DB

available in .opencode/skills/auth-db

---

### 5.2 Core DB

available in .opencode/skills/core-db

---

### 5.3 AI DB

available in .opencode/skills/ai-db

---

## 6. Interfaces (API) - Contract Definition

This section defines the API contracts to be implemented later. It is authoritative for how services should expose endpoints and payloads.

### 6.1 Global API Conventions

* Base path: `/v1` for all public endpoints.
* Media type: `application/json` for requests and responses.
* Naming: `snake_case` for all JSON fields.
* Dates: ISO 8601 with timezone, e.g. `2026-03-23T10:15:30Z`.
* IDs: UUID v4 for all public identifiers.
* Auth: JWT in `Authorization: Bearer <token>` header.
* Roles: `student`, `school_admin`, `system_admin`.
* Errors: RFC 7807 `application/problem+json` with optional `errors` list.
* Pagination: `limit` + `offset` with `total` in responses.
* Sorting: `sort=field` or `sort=-field` (descending).
* Filtering: simple query filters by field name.

Error schema (RFC 7807):

* `type`: URI identifying the error type.
* `title`: short, human readable.
* `status`: HTTP status code.
* `detail`: specific details.
* `instance`: request path or trace id.
* `errors`: list of `{field, message}` for validation.

Pagination response schema:

* `items`: array
* `total`: integer
* `limit`: integer
* `offset`: integer

### 6.2 Auth Service (auth-service)

Responsibilities: authentication, users, driving schools, student licenses.

#### Endpoints

* POST `/v1/auth/login`
  * Auth: none
  * Purpose: authenticate user and issue JWT.
  * Request: `{email, password}`
  * Response: `{access_token, token_type, expires_in, user}`
  * Errors: 401 invalid credentials, 422 validation

* GET `/v1/auth/me`
  * Auth: required
  * Purpose: return authenticated user profile.
  * Response: `{user}`

* POST `/v1/auth/students`
  * Auth: `school_admin`
  * Purpose: create a student under the admin's school.
  * Request: `{email, password, full_name, document_id, licenses[]}`
  * Response: `{student}`
  * Errors: 409 email already exists

* POST `/v1/auth/schools`
  * Auth: `system_admin`
  * Purpose: create a driving school and its admin account.
  * Request: `{email, password, name, tax_id?, address?, phone?}`
  * Response: `{school, admin_user}`
  * Errors: 409 email already exists

* GET `/v1/auth/schools`
  * Auth: `system_admin`
  * Purpose: list schools with pagination and filters.
  * Query: `limit`, `offset`, `sort`, optional filters (`name`, `active`)
  * Response: paginated `{items, total, limit, offset}`

* GET `/v1/auth/schools/{school_id}`
  * Auth: `system_admin`
  * Purpose: return details for one school.
  * Response: `{school}`

* PATCH `/v1/auth/schools/{school_id}`
  * Auth: `system_admin`
  * Purpose: update school attributes (name, status, contacts).
  * Request: `{name?, active?, address?, phone?}`
  * Response: `{school}`

* GET `/v1/auth/students`
  * Auth: `school_admin`
  * Purpose: list students for the admin's school with pagination and filters.
  * Query: `limit`, `offset`, `sort`, optional filters (`license`, `active`)
  * Response: paginated `{items, total, limit, offset}`

* GET `/v1/auth/students/{student_id}`
  * Auth: `school_admin`
  * Purpose: return details for one student.
  * Response: `{student}`

* PATCH `/v1/auth/students/{student_id}`
  * Auth: `school_admin`
  * Purpose: update student attributes (name, document, status).
  * Request: `{full_name?, document_id?, active?}`
  * Response: `{student}`

* POST `/v1/auth/students/{student_id}/licenses`
  * Auth: `school_admin`
  * Purpose: assign licenses to a student.
  * Request: `{license_codes[]}`
  * Response: `{student}`

* DELETE `/v1/auth/students/{student_id}/licenses/{license_code}`
  * Auth: `school_admin`
  * Purpose: revoke a specific license from a student.
  * Response: 204

#### Conceptual Schemas

* User: `{id, email, full_name, role, created_at, updated_at}`
* Student: `{id, email, full_name, document_id, licenses[], active, created_at, updated_at}`
* License: `{code, name}`
* School: `{id, name, email, tax_id?, address?, phone?, active, created_at, updated_at}`

### 6.3 Core Service (core-service)

Responsibilities: question bank, test generation, correction, statistics.

#### Endpoints

* GET `/v1/permits`
  * Auth: required
  * Response: `{items}` (list of licenses/permits)

* GET `/v1/topics`
  * Auth: required
  * Query: `permit_code` (optional)
  * Response: `{items}`

* GET `/v1/questions/random`
  * Auth: required
  * Query: `permit_code`, `topic_id` (optional), `count` (default 30)
  * Response: `{items}` (question list)

* POST `/v1/tests/generate`
  * Auth: required
  * Request: `{permit_code, topic_id?, mode, count?}` where mode in `license|topic|random|failed`
  * Response: `{test}` with 30 questions

* POST `/v1/tests/{test_id}/submit`
  * Auth: required
  * Request: `{answers[]}` where answer `{question_id, option_id}`
  * Response: `{result}` including `score`, `correct_count`, `wrong_count`, `passed`, `by_topic[]`

* GET `/v1/tests/{test_id}`
  * Auth: required
  * Response: `{test}` (test metadata and questions)

* GET `/v1/stats`
  * Auth: required
  * Query: `student_id` (optional, admin only), `permit_code` (optional)
  * Response: `{summary, by_topic[], history[], trend[], failed_distribution[]}`

#### Conceptual Schemas

* Question: `{id, text, options[], topic_id, permit_code}`
* Option: `{id, text, is_correct?}` (is_correct only internal, not exposed)
* Test: `{id, student_id, permit_code, topic_id?, created_at, questions[]}`
* Result: `{test_id, correct_count, wrong_count, passed, score, by_topic[]}`
* StatsSummary: `{total_tests, passed_tests, failed_tests, accuracy_pct}`
* StatsByTopic: `{topic_id, correct, wrong, accuracy_pct}`
* StatsHistory: `{test_id, created_at, passed, score, correct_count, wrong_count, accuracy_pct, permit_code?, topic_id?}`
* StatsTrend: `{period, tests, accuracy_pct}`
* FailedDistribution: `{topic_id, wrong_count}`

### 6.4 AI Service (ai-service)

Responsibilities: conversation management, AI integration, message persistence.

#### Endpoints

* POST `/v1/ai/conversations`
  * Auth: required
  * Request: `{title?}`
  * Response: `{conversation}`

* GET `/v1/ai/conversations`
  * Auth: required
  * Query: `limit`, `offset`, `sort`
  * Response: paginated `{items, total, limit, offset}`

* GET `/v1/ai/conversations/{conversation_id}`
  * Auth: required
  * Response: `{conversation, messages[]}`

* POST `/v1/ai/messages`
  * Auth: required
  * Request: `{conversation_id, content}`
  * Response: `{message, assistant_reply}`

* GET `/v1/ai/messages`
  * Auth: required
  * Query: `conversation_id`, `limit`, `offset`
  * Response: paginated `{items, total, limit, offset}`

#### Conceptual Schemas

* Conversation: `{id, user_id, title, created_at, updated_at}`
* Message: `{id, conversation_id, role, content, created_at}` (role in `user|assistant|system`)

---

## 8. Local Deployment

The system runs using Docker Compose, including:

* 3 PostgreSQL databases
* 3 microservices
* React frontend

Each service connects only to its own database.

---
