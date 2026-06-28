# ☁️ CloudShaw

**CloudShaw** is a personal cloud media vault and social content management hub. Organize your photos and videos into platform-specific folders, add captions and hashtags, schedule posts, and track what's been uploaded — all from one sleek, dark-themed dashboard.

---

## ✨ Features

### Core
- 📂 **Folder Management** — Create, edit, and delete platform-specific media folders with custom colors
- 🖼️ **Media Upload** — Upload images and videos directly from your browser (stored locally via Multer)
- ✏️ **Content Metadata** — Add titles, captions, and hashtags to each media item
- ✅ **Upload Tracking** — Mark media as *Pending* or *Uploaded* to stay organized
- 📊 **Dashboard Stats** — See at a glance how many items are pending vs. uploaded across all folders
- 🌐 **Platform Support** — Instagram, YouTube, TikTok, X / Twitter, Facebook, LinkedIn, and Other
- 🎨 **Premium Dark UI** — Glassmorphism design with smooth animations and gradient accents

### New in v2
- 🔐 **JWT Authentication** — Secure register/login with bcrypt password hashing; each user sees only their own data
- 📊 **Analytics Dashboard** — Interactive charts (Recharts): 14-day activity area chart, platform donut chart, upload rate KPIs
- 🔍 **Global Search (Ctrl+K)** — Spotlight-style search across all folders and media with debounced queries
- ☑️ **Bulk Actions** — Select multiple media items to bulk mark as uploaded/pending or bulk delete
- 📅 **Content Calendar** — Monthly calendar view showing scheduled posts color-coded by platform
- 📤 **CSV Export** — Export all folder content as a spreadsheet (title, caption, hashtags, status, scheduled date)
- 🗓️ **Schedule Dates** — Set a target post date on any media item; shows up on the calendar
- 📋 **Copy-Ready Content** — One-click copy of caption, hashtags, or all content to clipboard

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Recharts, react-dropzone, Axios |
| Backend | Node.js, Express.js |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Database | MongoDB (Mongoose ODM) |
| File Storage | Multer (local disk) |
| Validation | express-validator |
| UI | react-hot-toast, @heroicons/react |

---

## 📁 Project Structure

```
CloudShaw/
├── cloudshaw-backend/
│   ├── middleware/
│   │   ├── auth.js         ← JWT protect middleware
│   │   └── upload.js       ← Multer file handler
│   ├── models/
│   │   ├── User.js         ← User schema + bcrypt
│   │   ├── Folder.js       ← Folder schema (userId scoped)
│   │   └── Media.js        ← Media schema + scheduledDate
│   ├── routes/
│   │   ├── auth.js         ← POST /register, POST /login, GET /me
│   │   ├── folders.js      ← CRUD folders (auth-protected)
│   │   ├── media.js        ← CRUD + bulk actions (auth-protected)
│   │   ├── analytics.js    ← Overview, platform breakdown, activity
│   │   └── search.js       ← Global cross-collection search
│   └── server.js
└── cloudshaw-frontend/
    └── src/
        ├── components/
        │   ├── AuthPage.jsx       ← Login / Register
        │   ├── Dashboard.jsx      ← Folder grid
        │   ├── FolderView.jsx     ← Media grid + bulk actions + CSV export
        │   ├── MediaModal.jsx     ← Edit metadata + scheduled date
        │   ├── AnalyticsPage.jsx  ← Charts + KPIs
        │   ├── CalendarView.jsx   ← Monthly content calendar
        │   ├── GlobalSearch.jsx   ← Ctrl+K spotlight search
        │   ├── FolderModal.jsx    ← Create/edit folder
        │   └── UploadModal.jsx    ← Upload files
        ├── contexts/
        │   └── AuthContext.jsx    ← Auth state + JWT management
        └── services/
            └── api.js             ← Axios + JWT interceptors + all APIs
```

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) — local or [MongoDB Atlas](https://www.mongodb.com/atlas/database) (free)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd CloudShaw
```

### 2. Set Up the Backend

```bash
cd cloudshaw-backend
npm install
```

Copy and configure env variables:

```bash
copy .env.example .env
```

Open `.env` and set your MongoDB URI and a strong JWT secret:

```env
PORT=5000
JWT_SECRET=your_secret_key_here_make_it_long
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb://localhost:27017/cloudshaw
```

Start the backend:

```bash
npm run dev
```

Backend runs at **http://localhost:5000**

### 3. Set Up the Frontend

```bash
cd cloudshaw-frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user (protected) |

### Folders (all protected)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/folders` | List all folders |
| POST | `/api/folders` | Create folder |
| PUT | `/api/folders/:id` | Update folder |
| DELETE | `/api/folders/:id` | Delete folder + media |

### Media (all protected)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/media/:folderId/upload` | Upload files |
| GET | `/api/media/:folderId` | List media in folder |
| PUT | `/api/media/item/:id` | Update metadata + schedule date |
| PATCH | `/api/media/item/:id/status` | Toggle status |
| PATCH | `/api/media/bulk` | Bulk status / delete |
| DELETE | `/api/media/item/:id` | Delete media |

### Analytics (protected)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/overview` | Total counts KPIs |
| GET | `/api/analytics/platform-breakdown` | Media by platform |
| GET | `/api/analytics/activity` | 14-day activity timeline |

### Search (protected)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/search?q=query` | Global search (folders + media) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is for personal and portfolio use. Feel free to fork and adapt for your own social media workflow!
