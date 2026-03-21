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

## 6. Interfaces (API)

### Auth Service

* POST /auth/login
* POST /auth/students
* GET /auth/me

---

### Core Service

* GET /permits
* GET /topics
* GET /questions/random
* POST /tests/generate
* POST /tests/{id}/submit
* GET /stats

---

### AI Service

* POST /ai/conversations
* GET /ai/conversations
* GET /ai/conversations/{id}
* POST /ai/messages

---

## 8. Local Deployment

The system runs using Docker Compose, including:

* 3 PostgreSQL databases
* 3 microservices
* React frontend

Each service connects only to its own database.

---