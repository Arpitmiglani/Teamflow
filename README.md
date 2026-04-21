# TeamFlow – Workforce Management System

## 📌 Overview

TeamFlow is a custom-built workforce management application developed for internal use within the Techno Experts company. It streamlines daily operations by enabling efficient task assignment, real-time attendance tracking, and seamless communication between managers and employees.

The system integrates WhatsApp notifications to ensure employees receive instant updates on assigned tasks and attendance activities, while managers gain full visibility through a centralized dashboard.

---

## 🚀 Features

* 📋 Task Assignment & Tracking
* 📍 Attendance Check-in / Check-out System
* 📲 WhatsApp Notifications (via n8n automation)
* 👤 Role-Based Access (Admin / Manager / Employee)
* 📊 Real-Time Dashboard
* 🔄 Event-Based Automation using Webhooks
* 🌐 Mobile-First UI (PWA Ready)

---

## 🧠 System Architecture

Frontend (React)
→ Supabase (Database & Auth)
→ Webhook (Event Trigger)
→ n8n (Automation Engine)
→ WhatsApp Cloud API (Notifications)

---

## 🛠 Tech Stack

* Frontend: React (TypeScript)
* Backend: Supabase (PostgreSQL + Auth)
* Automation: n8n
* Messaging: WhatsApp Business Cloud API
* Deployment: Vercel / Netlify

---

## ⚙️ Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/your-username/teamflow.git
cd teamflow
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

---

### 4. Run Development Server

```bash
npm run dev
```

---

## 🔗 n8n Integration

* Webhook receives events from the app

* Supported events:

  * `task_created`
  * `attendance_checked_in`

* n8n processes events and triggers WhatsApp notifications using HTTP requests.

---

## 📲 WhatsApp Integration

* Uses WhatsApp Business Cloud API
* Requires:

  * Phone Number ID
  * Permanent Access Token
  * Approved Message Templates

---

## 🔒 Security Notes

* Keep API keys secure using environment variables
* Do not expose tokens or webhook URLs publicly
* Recommended to keep repository private

---

## 🎯 Use Case

Built for Techno Experts to:

* Improve workforce coordination
* Replace manual processes
* Enable real-time communication
* Increase team productivity

---

## 🚧 Future Improvements

* Task reminders & delay alerts
* Performance tracking
* Manager insights dashboard
* Multi-team support

---

## 👨‍💻 Author

Developed for Techno Experts (Internal Use)

---
