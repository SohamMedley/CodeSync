# CodeSync — Real-Time Collaborative Code Editor

CodeSync is a **real-time collaborative code editor** with AI-powered assistance, Firebase integration, and live multi-user editing.  
It’s built for developers who want to **code together, anywhere, anytime**.

---

## 🚀 Features

- **Real-time Collaboration** — Multiple users can edit simultaneously  
- **AI Integration** — Groq API for code completion and explanations  
- **File Management** — Create, delete, and organize files/folders  
- **Syntax Highlighting** — Monaco Editor for a VS Code-like feel  
- **Live Cursors** — See exactly where teammates are typing  
- **Room System** — Private rooms for secure team collaboration  
- **Responsive Design** — Works seamlessly on desktop & mobile  
- **Firebase Integration** — User authentication & data persistence  

---

## 📂 Project Structure

```plaintext
CodeSync/
├── backend/
│   ├── app.py                  # FastAPI backend server
│   ├── websocket_handler.py    # Handles real-time events
│   ├── groq_service.py         # AI code assistance
│   ├── firebase_service.py     # Firebase authentication & storage
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── index.html               # Main UI
│   ├── css/
│   │   ├── style.css
│   │   └── editor.css
│   ├── js/
│   │   ├── main.js
│   │   ├── editor.js
│   │   ├── collaboration.js
│   │   ├── firebase-config.js
│   │   └── groq-service.js
│   └── assets/                  # Static assets (icons, images, etc.)
└── run.ps1                      # PowerShell startup script
```

---

## ⚙️ Setup Guide

### 1️⃣ Clone the repository
```powershell
git clone https://github.com/yourusername/CodeSync.git
cd CodeSync
```

### 2️⃣ Create a virtual environment
```powershell
python -m venv venv
.
env\Scripts\Activate.ps1
```

### 3️⃣ Install backend dependencies
```powershell
pip install -r backend/requirements.txt
```

### 4️⃣ Start the backend server
```powershell
python backend/app.py
```

### 5️⃣ Open the frontend
- **Option A:** Open `frontend/index.html` directly in your browser  
- **Option B:** Run a local server:
```powershell
cd frontend
python -m http.server 8000
```

---

## 🛠 Usage Instructions

1. Start the application using the PowerShell script or manual commands  
2. Enter your **username** (max 20 characters)  
3. Enter a **Room ID** (leave empty to create a new one)  
4. Click **"Join Room"** to start collaborating  
5. Use the **file explorer** to create/manage files  
6. Click the **AI tools** buttons for code completion & explanations  
7. Code together in real-time with your team  

---

## 📌 Tech Stack

**Frontend**: HTML, CSS, JavaScript, Monaco Editor  
**Backend**: Python (FastAPI, WebSockets)  
**AI**: Groq API  
**Database/Auth**: Firebase  
**Hosting**: Local / Deployable on Render, Vercel, Netlify  

---

## 📄 License

This project is licensed under the MIT License — feel free to fork, modify, and use it.

---
