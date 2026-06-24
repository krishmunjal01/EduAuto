# EduAuto 🚀
> "Not built as a project. Built as a product."

EduAuto is a **complete academic operating system**, built as a **workflow-driven SaaS platform**. Instead of offering isolated features like a typical CRUD application, it implements **connected workflows** where a single action triggers a full automated pipeline across the entire system.

## 🌟 The Problem
Most schools still operate on disconnected systems:
- Marks stored in Excel or calculated manually
- Attendance maintained in physical registers
- Timetables managed manually
- Parent communication done via WhatsApp or paper

This leads to high administrative overhead, frequent human errors, zero real-time visibility for parents, and no centralized data intelligence. 

**EduAuto solves this by reflecting real-world school operations through end-to-end process design.**

## ⚙️ Core Architecture

- **Multi-Tenant SaaS Design:** Each school operates as an independent tenant. All data is isolated using `school_id`, supporting scalability across multiple institutions from a single deployment.
- **Role-Based System (RBAC):** Secure access enforced using JWT-based authentication.
  - **Admin:** Full system control.
  - **Teacher:** Section-level operations.
  - **Parent:** Child-linked read access.
- **API-Driven Backend:** Node.js + Express backend powered by Prisma ORM for structured data access and REST APIs for all operations.
- **Real-Time Data Handling:** React frontend with React Query for caching, optimistic updates, and background refetching to ensure UI consistency.

## 🔥 Key Workflows & Features

### 1. OCR-Based Result Automation (Core Innovation)
Manual result entry is time-consuming and error-prone. We designed an OCR-powered pipeline with a human verification layer that **reduces manual effort by ~80%**.
- **Pipeline:** Image preprocessing ➔ OCR extraction of roll numbers & marks ➔ Mapping to student DB ➔ Editable verification UI ➔ Final approval & persistence.
- **Safety Design:** Built-in roll number validation. No automatic sending without teacher verification.

### 2. Global Student Identity System 🧾
Each student is assigned a unique ID (Format: `SCHOOLCODE_0001`). This prevents duplication, enables parent-student linking, and maintains identity across academic years.

### 3. Smart Timetable Engine 📅
Auto-generated timetables based on subjects & teacher availability with built-in conflict detection and a date-scoped substitution system (prevents permanent schedule corruption).

### 4. Smart Attendance System 📍
Designed based on actual school operations with daily attendance (single entry per day), "Mark All Present" optimization, admin-controlled correction system, and real-time parent notifications.

### 5. Structured Leave Management ✏️
Parents apply for student leave, teachers apply for personal leave, and admins approve/reject. All requests follow a defined workflow with status tracking and notification triggers.

### 6. Unified Notification Engine 🔔
Role-based alerts:
- **Parents:** Results, attendance alerts.
- **Teachers:** Approvals, schedule updates.
- **Admin:** System-level alerts.

### 7. Audit Logging System 📊
Every action (e.g., Result uploads, Attendance changes) is tracked for full transparency, accountability, and debugging support.

## 🚀 Future Scope
- WhatsApp API integration
- AI-based performance analytics
- Mobile applications
- Advanced dashboards

---
*EduAuto is a production-oriented system built to solve real institutional problems, demonstrating system design thinking, real-world problem understanding, and scalable architecture decisions.*
