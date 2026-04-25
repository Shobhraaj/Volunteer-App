#  AI-Powered Volunteer Coordination Platform

A production-ready full-stack application that uses **AI and data analytics** to match volunteers to tasks optimally, predict volunteer behavior, and improve NGO operational efficiency.

---

## Key Features

### AI / ML Features
- **Smart Matching Algorithm** — weighted scoring (skills 40%, location 20%, availability 20%, reliability 20%)
- **Volunteer Reliability Prediction** — Logistic Regression on historical attendance data
- **Task Recommendation Engine** — content-based filtering using skills, interests, past activity
- **Demand Forecasting** — Linear Regression predicting future volunteer needs
- **Analytics Dashboard** — engagement trends, completion rates, skill demand, drop-off patterns

### Volunteer Features
- JWT-based authentication
- Profile with skills, interests, availability, location
- AI-powered task recommendations
- Apply to tasks & track participation history
- Gamified progress (points + milestone badges)

### Organizer Features
- Create & manage tasks (skills, urgency, location, slots)
- View AI-ranked volunteers with score breakdowns
- Assign or auto-assign top-matched volunteers
- Monitor task progress with visual indicators

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy ORM |
| **Database** | PostgreSQL |
| **AI/ML** | Scikit-learn, Pandas, NumPy |
| **Frontend** | React 18, Vite, Recharts |
| **Auth** | JWT (python-jose), bcrypt |

---

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### 1️  Database Setup

```bash
# Create the PostgreSQL database
psql -U postgres
CREATE DATABASE volunteer_platform;
\q
```

### 2️  Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# (Optional) Edit config — set DATABASE_URL if needed
# Default: postgresql://postgres:postgres@localhost:5432/volunteer_platform

# Start the API server (auto-creates tables)
uvicorn main:app --reload --port 8000

# (In another terminal) Seed demo data
python seed_data.py
```

The API will be running at `http://localhost:8000`
Swagger docs at `http://localhost:8000/docs`

### 3️  Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend will be at `http://localhost:5173`

### 4️  Demo Login

| Role | Email | Password |
|------|-------|----------|
| Organizer | organizer1@ngo.org | password123 |
| Volunteer | volunteer1@mail.com | password123 |

---

## Folder Structure

```
backend/
├── main.py                 # FastAPI entry point
├── config.py               # Environment configuration
├── database.py             # SQLAlchemy engine & session
├── seed_data.py            # Demo data seeder
├── models/                 # ORM models (User, Task, Participation, Badge)
├── schemas/                # Pydantic request/response schemas
├── routes/                 # API route handlers
├── services/               # Business logic layer
│   ├── auth_service.py     # JWT + password hashing
│   ├── matching_service.py # Weighted scoring algorithm
│   ├── recommendation_service.py  # Task recommendations
│   ├── analytics_service.py       # Dashboard aggregation
│   └── gamification_service.py    # Points & badges
└── ml/                     # Machine Learning
    ├── reliability_model.py   # Logistic Regression
    ├── demand_forecasting.py  # Linear Regression
    └── train_models.py        # CLI model trainer

frontend/
├── src/
│   ├── App.jsx             # Router & layout
│   ├── App.css             # Design system
│   ├── api.js              # API helper with JWT
│   ├── context/            # Auth context
│   ├── components/         # Reusable UI components
│   └── pages/              # Page components
│       ├── Login.jsx
│       ├── Register.jsx
│       ├── VolunteerDashboard.jsx
│       ├── OrganizerDashboard.jsx
│       ├── TaskDetail.jsx
│       ├── Profile.jsx
│       └── AnalyticsDashboard.jsx
```

---

## AI Algorithm Details

### Smart Matching
```
Match Score = (0.4 × Skill Match) + (0.2 × Location Proximity) + (0.2 × Availability Match) + (0.2 × Reliability Score)
```
- **Skill Match**: Jaccard overlap between volunteer skills and task requirements
- **Location Proximity**: Haversine distance; ≤5km → 1.0, ≥50km → 0.0, linear interpolation
- **Availability Match**: Day-of-week alignment with task schedule
- **Reliability Score**: Historical completion / (completion + no-show)

### Reliability Prediction (Logistic Regression)
Features: `total_completed`, `total_no_shows`, `total_cancelled`, `completion_ratio`, `avg_match_score`, `days_since_joined`
Target: `will_show_up` (binary)

### Demand Forecasting (Linear Regression)
Monthly time-series of task creation and volunteer participation, projected 3 months forward.

---

## Future Improvements

1. **Collaborative Filtering** — recommend tasks based on similar volunteers' preferences
2. **NLP for Task Matching** — use sentence embeddings to match task descriptions with volunteer bios
3. **Real-time Notifications** — WebSocket-based alerts for new matches and task updates
4. **Mobile App** — React Native version for on-the-go volunteering
5. **Geospatial Search** — PostGIS integration for radius-based task discovery
6. **A/B Testing** — experiment with different matching weight configurations
7. **Automated Reports** — weekly email digests for organizers with AI insights

## Scaling Strategy

1. **Microservices** — split auth, matching, analytics into separate deployable services
2. **Redis Caching** — cache match scores and dashboard data
3. **Celery + RabbitMQ** — async task processing for ML training and notification delivery
4. **Kubernetes** — container orchestration for horizontal scaling
5. **CDN + SSR** — Next.js for improved SEO and performance
6. **Read Replicas** — PostgreSQL read replicas for analytics queries
7. **Feature Store** — centralized ML feature management for model retraining
