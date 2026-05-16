# Finotes

Finotes is a clean, modern, full-stack collaborative notes application featuring a sleek, minimalist dark-themed user interface. It allows users to securely capture ideas, manage drafts through automatic version tracking, and collaborate safely with specific viewer or editor access controls.

---

## ✨ Features

### 👤 Secure Authentication
* Rigid user registration and login endpoints using password hashing.
* Secure, stateless session handling via JWT (JSON Web Tokens).

### 📝 Complete Notes Management (CRUD)
* Create, view, update, and delete rich notes instantly.
* Clean, distraction-free workspace styled with a premium dark theme.

### 🛡️ Advanced Feature: Collaborative RBAC Sharing
Instead of simple note-sharing, Finotes implements real-world **Role-Based Access Control (RBAC)**:
* **Viewer (Read-Only):** Shared users can read the note, but text inputs are completely locked, and editing/saving capabilities are stripped from the UI to protect data boundaries.
* **Editor (Read & Write):** Shared users can actively edit, save, and contribute to the note.
* **Real-Time Feel:** Includes a non-blocking background polling mechanism that automatically checks for incoming shares every 30 seconds.

### 🔔 Live Notification Inbox
* A glowing, interactive notification bell built into the navigation header.
* Instantly alerts users when someone shares a note with them, highlighting their assigned role (Viewer/Editor) and allowing them to jump straight to the workspace in one click.

### ⏳ Automatic Revision History
* Every single note modification automatically captures a timestamped version snapshot.
* Allows owners and editors to view past drafts and seamlessly restore the note to any prior point in time.

---

## 🛠️ Tech Stack

* **Backend:** FastAPI (Python), Pydantic (Data validation), PyJWT (Token security)
* **Frontend:** React, Vite, TypeScript, TanStack Query (State management & polling), Framer Motion (Micro-animations)
* **Database:** SQLAlchemy 2.0 ORM with local SQLite for development and PostgreSQL support for live deployment.

---

## 📦 Project Structure

```text
├── backend/      # FastAPI application logic, schemas, models, and tests
├── frontend/     # Vite + React interface and API client handles
├── .gitignore    # Safe configuration preventing accidental credential uploads
└── README.md     # Project documentation
