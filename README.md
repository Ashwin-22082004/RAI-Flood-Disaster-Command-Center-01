# RAI Flood Disaster Command Center

This repository houses the entire **Responsible AI-Driven Flood Disaster Management Agent** ecosystem, including both the Frontend Dashboard and the Backend AI Simulation Engine.

The system serves as an intelligent, real-time command center designed to detect floods, manage dam water levels, assess regional vulnerabilities, and ethically allocate humanitarian resources based on multi-agent decision models.

---

## 🏗️ Project Structure

The project is split into two main architectures: a Python/FastAPI backend and a React/Vite frontend.

```text
📦 Agent Ai (Root Directory)
 ┣ 📂 backend/               # AI Simulation & API Engine
 ┃ ┣ 📜 app.py               # Main FastAPI server entry point
 ┃ ┣ 📜 flood_detection.py   # Hydrological flood risk algorithms
 ┃ ┣ 📜 dam_management.py    # Reservoir capacity & release logic
 ┃ ┣ 📜 vulnerability_model.py # Socio-economic risk scoring
 ┃ ┣ 📜 resource_allocator.py # AI resource distribution model
 ┃ ┣ 📜 logistics_optimizer.py # Delivery routing
 ┃ ┣ 📜 drone_module.py      # Autonomous drone simulation logic
 ┃ ┣ 📜 alert_manager.py     # Real-time event logging
 ┃ ┗ 📜 rai_agent_controller.py # Master AI orchestrator
 ┃
 ┣ 📂 frontend/              # Interactive Web Dashboard
 ┃ ┣ 📂 src/
 ┃ ┃ ┣ 📜 App.jsx            # Main React Component
 ┃ ┃ ┣ 📜 Dashboard.jsx      # Core UI Dashboard interface
 ┃ ┃ ┣ 📜 main.jsx           # React DOM renderer
 ┃ ┃ ┗ ... (assets, css)
 ┃ ┣ 📜 package.json         # Node.js dependencies
 ┃ ┣ 📜 vite.config.js       # Vite bundler configuration
 ┃ ┗ 📜 README.md            # This documentation file
 ┃
 ┗ 📜 Agent.md               # Original project spec & blueprint
```

---

## ⚙️ Technology Stack & Versions

To ensure full compatibility, ensure your environment matches the following versions:

### Frontend
- **Node.js**: `v18.x` or higher (v20+ recommended)
- **Package Manager**: `npm` (v9.x+) or `yarn`
- **React**: `^19.2.4`
- **React DOM**: `^19.2.4`
- **Vite (Bundler)**: `^8.0.1`

### Backend
- **Python**: `3.9`, `3.10`, or `3.11` (Do not use < 3.9)
- **FastAPI**: Backend web framework
- **Uvicorn**: ASGI Server for FastAPI
- **Pydantic**: Data validation

*(Note: TailwindCSS and Charting libraries like Recharts may be used in the functional React components).*

---

## 🚀 Installation & Setup Guide

You must run both the backend API and the frontend dashboard concurrently for the simulation to function.

### Step 1: Backend Setup (Python)

Open a terminal and navigate to the root directory `Agent Ai`.

1. **Navigate to the Backend**:
   ```bash
   cd backend
   ```
2. **Create a Virtual Environment** (Highly Recommended):
   ```bash
   python -m venv venv
   ```
3. **Activate the Virtual Environment**:
   - **Windows**: `venv\Scripts\activate`
   - **Mac/Linux**: `source venv/bin/activate`
4. **Install Dependencies**:
   ```bash
   pip install fastapi uvicorn pydantic
   ```
5. **Start the API Server**:
   ```bash
   python app.py
   ```
   *(The server will start on `http://localhost:8000` or `http://0.0.0.0:8000`)*

### Step 2: Frontend Setup (React + Vite)

Open a **new, separate terminal** and navigate to the root directory `Agent Ai`.

1. **Navigate to the Frontend**:
   ```bash
   cd frontend
   ```
2. **Install Node Modules**:
   ```bash
   npm install
   ```
3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   *(The Vite server will start on `http://localhost:5173`. Open this URL in your web browser).*

---

## 🧠 Simulation Modules & Data Flow

When the simulation runs, the following cycle occurs every tick:

1. **Data Generation**: `app.py` generates environment metrics (rain, river discharge) based on the active scenario (e.g., Kerala, Uttarakhand).
2. **Flood Detection**: `flood_detection.py` processes rain/river data to classify districts as Low, Medium, or High risk.
3. **Dam Management**: `dam_management.py` calculates reservoir capacity and dictates controlled or emergency water releases.
4. **Vulnerability Assessment**: `vulnerability_model.py` merges flood risk with socio-economic factors to pinpoint priority populations.
5. **Resource Allocation**: `resource_allocator.py` fairly distributes vehicles, helicopters, medical teams, and drones to maximum-need sectors based on RAI ethics.
6. **Dashboard Update**: `app.py` bundles all outcomes and serves them via the `/api/simulation/status` API endpoint, which is polled by the React frontend.

---
*Built as part of the Responsible AI-Driven Flood Disaster Management project.*
