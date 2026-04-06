# 📚 Virtual Study Hub

A full-stack collaborative study platform built with **React**, **Node.js + Express**, **MongoDB**, and **Socket.io**.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🔐 **JWT Auth** | Secure register/login with bcrypt password hashing |
| 🏠 **Study Rooms** | Create/join rooms by subject, public or private |
| 💬 **Real-time Chat** | Socket.io powered live messaging with typing indicators |
| ⏱ **Pomodoro Timer** | Configurable focus/break timer with audio bell |
| 📊 **Analytics Dashboard** | Chart.js bar + doughnut charts for study habits |
| 📝 **Notes & Resources** | Upload files, share links, write notes with likes |
| 🏆 **Leaderboard** | Weekly/all-time rankings with podium display |
| 🔥 **Streak Tracking** | Daily study streaks with badge rewards |
| 🌙 **Dark/Light Mode** | Full theme toggle with CSS variables |
| 🎖 **Badges** | Auto-awarded achievements for milestones |

---

## 🛠 Tech Stack

**Frontend**
- React 18 + React Router v6
- Socket.io Client
- Chart.js + react-chartjs-2
- Lucide React icons
- react-hot-toast
- Axios

**Backend**
- Node.js + Express
- Socket.io Server
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- bcrypt (`bcryptjs`)
- Multer (file uploads)

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

---

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd virtual-study-hub
```

---

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/virtual-study-hub
JWT_SECRET=your_super_secret_key_here
CLIENT_URL=http://localhost:3000
```

Create the uploads folder:
```bash
mkdir uploads
```

Start the backend:
```bash
npm run dev      # development (nodemon)
npm start        # production
```

The API will run at `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env` (optional — proxied by default):
```
REACT_APP_API_URL=http://localhost:5000
```

Start the frontend:
```bash
npm start
```

App runs at `http://localhost:3000`

---

## 📁 Project Structure

```
virtual-study-hub/
├── backend/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── middleware/
│   │   └── auth.js             # JWT protect middleware
│   ├── models/
│   │   ├── User.js             # User schema (bcrypt, JWT, streaks)
│   │   ├── Room.js             # Study room + chat messages
│   │   ├── Session.js          # Study sessions (pomodoro stats)
│   │   └── Note.js             # Notes / resources / file uploads
│   ├── routes/
│   │   ├── auth.js             # POST /register, /login, GET /me
│   │   ├── rooms.js            # CRUD rooms + join/leave
│   │   ├── sessions.js         # Start/end sessions + analytics
│   │   ├── notes.js            # Notes CRUD + file upload
│   │   ├── users.js            # Profile update
│   │   └── leaderboard.js      # Rankings
│   ├── socket/
│   │   └── socketHandler.js    # Socket.io events (chat, presence, pomodoro sync)
│   ├── uploads/                # Multer file storage
│   ├── server.js               # App entry point
│   └── .env.example
│
└── frontend/
    └── src/
        ├── context/
        │   ├── AuthContext.js      # JWT auth state
        │   ├── SocketContext.js    # Socket.io client
        │   └── ThemeContext.js     # Dark/light mode
        ├── pages/
        │   ├── LandingPage.js      # Marketing homepage
        │   ├── LoginPage.js        # Auth form
        │   ├── RegisterPage.js     # Registration + strength meter
        │   ├── DashboardPage.js    # Stats + charts + quick actions
        │   ├── RoomsPage.js        # Room browser + creation
        │   ├── StudyRoomPage.js    # Live chat + member list
        │   ├── PomodoroPage.js     # SVG timer + stats
        │   ├── NotesPage.js        # Resource library
        │   ├── LeaderboardPage.js  # Podium + rankings table
        │   └── ProfilePage.js      # Profile + preferences
        ├── components/
        │   └── Layout/
        │       ├── Sidebar.js      # Navigation
        │       └── AppLayout.js    # Page wrapper
        ├── utils/
        │   └── api.js              # Axios instance
        └── styles/
            └── globals.css         # Design system + CSS variables
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, receive JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/preferences` | Update preferences |
| POST | `/api/auth/logout` | Logout |

### Rooms
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/rooms` | List public rooms |
| POST | `/api/rooms` | Create a room |
| GET | `/api/rooms/:id` | Get room + messages |
| POST | `/api/rooms/:id/join` | Join a room |
| DELETE | `/api/rooms/:id/leave` | Leave a room |
| GET | `/api/rooms/my/rooms` | Get user's rooms |

### Sessions
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sessions/start` | Start study session |
| PUT | `/api/sessions/:id/end` | End session + update stats |
| GET | `/api/sessions/history` | Session history |
| GET | `/api/sessions/analytics` | Chart data (daily, subjects) |

### Notes
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notes` | List notes |
| POST | `/api/notes` | Create note / upload file |
| PUT | `/api/notes/:id/like` | Toggle like |
| DELETE | `/api/notes/:id` | Delete own note |

### Leaderboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/leaderboard?type=weekly` | Rankings (weekly/all/streak/sessions) |

---

## 🔴 Socket.io Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `join_room` | `{ roomId }` | Join a study room |
| `leave_room` | `{ roomId }` | Leave a study room |
| `send_message` | `{ roomId, content }` | Send chat message |
| `typing_start` | `{ roomId }` | Start typing indicator |
| `typing_stop` | `{ roomId }` | Stop typing indicator |
| `pomodoro_sync` | `{ roomId, timerState }` | Sync timer to room |
| `session_start` | `{ roomId }` | Notify session started |
| `session_end` | `{ roomId, duration }` | Notify session ended |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `room_message` | `{ username, content, type, timestamp }` | New message (text or system) |
| `active_users_update` | `{ activeUsers }` | Updated online users list |
| `user_joined` | `{ userId, username }` | User joined room |
| `user_left` | `{ userId, username }` | User left room |
| `user_typing` | `{ userId, username }` | Someone is typing |
| `user_stop_typing` | `{ userId }` | Stopped typing |
| `group_pomodoro_start` | `{ settings, startedBy }` | Group timer initiated |

---

## 🎖 Badge System

Badges are automatically awarded when milestones are hit:

| Badge | Condition | Icon |
|---|---|---|
| First Step | Complete first session | 🎯 |
| Dedicated | Complete 10 sessions | 📚 |
| Scholar | Complete 50 sessions | 🎓 |
| Week Warrior | 7-day streak | 🔥 |
| Monthly Master | 30-day streak | ⚡ |
| Ten Hour Club | Study 10 hours total | ⏰ |

---

## 🌙 Theme System

The entire UI uses CSS custom properties for seamless dark/light mode:

```css
:root { /* dark theme */ }
[data-theme="light"] { /* light theme overrides */ }
```

Toggled via `ThemeContext` → persisted in `localStorage`.

---

## 🚀 Deployment

**Backend (e.g. Railway / Render)**
```bash
# Set environment variables in your host dashboard:
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_production_secret
CLIENT_URL=https://your-frontend.vercel.app
```

**Frontend (e.g. Vercel)**
```bash
# Set build environment variable:
REACT_APP_API_URL=https://your-backend.railway.app
```

---

## 📝 License

MIT — free for academic use, portfolio, or learning.
