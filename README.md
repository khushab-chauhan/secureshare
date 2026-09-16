# 🛡️ SecureShare — Enterprise Document Management System

> **A high-performance, cloud-native document storage, sharing, and collaboration platform built with modern distributed systems architecture.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 📌 Overview

**SecureShare** is an enterprise-grade Document Management System (similar to Google Drive and Dropbox) engineered to handle secure file storage, recursive folder management, granular access control, asynchronous background processing, and full-text document search.

It is architected following industry-standard **Clean Layered Architecture** and **Twelve-Factor App** principles to demonstrate real-world, production-ready full-stack and distributed backend engineering.

---

## 🏗️ Architecture & Key Engineering Highlights

```
+------------------+          +-----------------------+          +------------------------+
| React TypeScript | -------> | Nginx (Reverse Proxy) | -------> | FastAPI API Server     |
| Client (SPA)     |          | (Port 80/443)         |          | (Async Python 3.11)    |
+------------------+          +-----------------------+          +------------------------+
         |                                                                    |
         | (Direct-to-S3 Upload via Presigned PUT)                            |
         v                                                                    v
+------------------+                                             +------------------------+
| AWS S3 / MinIO   | <------------------------------------------ | PostgreSQL 16          |
| (Object Storage) |                                             | (Metadata, ACL, Trees) |
+------------------+                                             +------------------------+
                                                                              |
                                                                              v
                                                                 +------------------------+
                                                                 | RabbitMQ + Celery      |
                                                                 | (Async Worker Nodes)   |
                                                                 +------------------------+
                                                                              |
                                                                 +------------+-----------+
                                                                 |                        |
                                                                 v                        v
                                                        +------------------+    +------------------+
                                                        | Thumbnails &     |    | Elasticsearch 8  |
                                                        | Malware Scan     |    | (Full-Text Search|
                                                        +------------------+    +------------------+
```

### 💎 Key Technical Features

1. **Direct-to-S3 Presigned Uploads**:
   - Eliminates backend server memory/RAM saturation when uploading files (>100MB).
   - The backend signs short-lived AWS S3 / MinIO presigned PUT URLs, enabling the browser to stream files directly to cloud storage.
2. **Materialized Path Folder Hierarchy**:
   - Supports unlimited nested folder depth in PostgreSQL.
   - Breadcrumb retrieval, subtree moves, and size calculations execute in single indexed queries without slow recursive SQL (`WITH RECURSIVE`).
3. **Immutable File Versioning & Content Deduplication**:
   - Every file modification maintains full version history with SHA-256 hash tracking to eliminate duplicate binary storage.
4. **Asynchronous Processing Pipeline**:
   - Celery workers powered by RabbitMQ generate image/PDF thumbnails, run file inspection, and index document text out-of-band.
5. **Zero-Trust Security & RBAC**:
   - Short-lived JWT access tokens with Redis refresh token rotation & revocation blacklist.
   - Granular Object Access Control (`OWNER`, `EDITOR`, `COMMENTER`, `VIEWER`).
   - Time-limited, password-protected public share links with UUIDv7 IDOR-immune identifiers.

---

## 📂 Project Structure

```text
secureshare/
├── backend/            # FastAPI REST API, SQLAlchemy 2.0 ORM, Pydantic v2 schemas
│   ├── app/
│   │   ├── api/        # REST API route controllers
│   │   ├── core/       # Security, DB connections, configs
│   │   ├── models/     # Database models
│   │   ├── schemas/    # DTO validation schemas
│   │   ├── services/   # Business logic & S3 storage handlers
│   │   └── workers/    # Celery tasks (Thumbnails, scanning, search indexing)
│   └── tests/          # Pytest unit & integration test suites
├── frontend/           # React 18 + TypeScript + TailwindCSS Single Page App
├── infra/              # Docker Compose stack (PostgreSQL, Redis, RabbitMQ, MinIO)
├── docs/               # Implementation specs & architecture decisions
├── scripts/            # Database initialization and maintenance scripts
└── .github/workflows/  # Automated CI/CD testing and build pipelines
```

---

## 🚀 Quick Start (Local Setup)

### 1. Clone the repository
```bash
git clone https://github.com/YantraDesignIT01/secureshare.git
cd secureshare
```

### 2. Configure Environment
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Start Infrastructure via Docker
```bash
docker compose -f infra/docker-compose.yml up -d
```

---

## 📜 License
This project is open-source under the [MIT License](LICENSE).
