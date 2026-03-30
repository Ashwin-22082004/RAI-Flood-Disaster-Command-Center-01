from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import random
import time

from rai_agent_controller import RAIAgentController
from alert_manager import alert_system

app = FastAPI(title="RAI Flood Disaster Command Center API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "ALIVE_AND_WELL_RAI_FLOOD_PROJECT"}

# Global instances
agent = RAIAgentController()

# Simulation State State
sim_state = {
    "is_running": False,
    "scenario": "Kerala", # Default scenario
    "speed": 1.0,
    "last_update": None,
    "data": None
}

def generate_environmental_data(scenario="Kerala"):
    # Scenario biases
    if scenario == "Kerala":
        rain_range = (150.0, 300.0)
        river_range = (300.0, 700.0)
        dam_mult = 1.2
    elif scenario == "Uttarakhand":
        rain_range = (100.0, 400.0) # Flash floods
        river_range = (200.0, 900.0)
        dam_mult = 0.8 # Less dams, more natural rivers
    else: # Himachal
        rain_range = (80.0, 250.0)
        river_range = (150.0, 600.0)
        dam_mult = 1.0

    return {
        "rainfall": random.uniform(*rain_range), # mm
        "river_discharge": round(random.uniform(*river_range), 2), # cubic m/s
        "dam_level": round(random.uniform(50.0, 110.0) * dam_mult, 2),
        "dam_capacity": 100.0,
        "season": random.choice(["Monsoon", "Monsoon", "Summer"]) # Bias towards monsoon
    }

def get_available_resources():
    return {
        "rescue_teams": random.randint(5, 15),
        "boats": random.randint(10, 25),
        "helicopters": random.randint(1, 5),
        "medical_units": random.randint(4, 12),
        "vehicles": random.randint(15, 30),
        "food": random.randint(1000, 5000)
    }

@app.get("/api/simulation/start")
def start_simulation(scenario: str = "Kerala", speed: float = 1.0):
    if not sim_state["is_running"]:
        alert_system.trigger_system_alert("System Alerts", "Simulation Started", "Info")
        alert_system.trigger_system_alert("System Alerts", f"Scenario loaded: {scenario}", "Info")
    sim_state["is_running"] = True
    sim_state["scenario"] = scenario
    sim_state["speed"] = speed
    return {"status": "Simulation started", "scenario": scenario, "speed": speed}

@app.get("/api/simulation/settings")
def update_settings(scenario: str = "Kerala", speed: float = 1.0):
    sim_state["scenario"] = scenario
    sim_state["speed"] = speed
    return {"status": "Settings updated", "scenario": scenario, "speed": speed}

@app.get("/api/simulation/stop")
def stop_simulation():
    if sim_state["is_running"]:
        alert_system.trigger_system_alert("System Alerts", "Simulation Stopped", "Warning")
    sim_state["is_running"] = False
    return {"status": "Simulation stopped"}

@app.get("/api/simulation/status")
def get_status():
    if not sim_state["is_running"] and sim_state["data"] is None:
        # Initial boot state
        env_data = generate_environmental_data(sim_state["scenario"])
        resources = get_available_resources()
        sim_state["data"] = agent.run_simulation_cycle(env_data, resources)
        sim_state["data"]["env_data"] = env_data
        
    elif sim_state["is_running"]:
        # Run new cycle
        env_data = generate_environmental_data(sim_state["scenario"])
        resources = get_available_resources()
        sim_state["data"] = agent.run_simulation_cycle(env_data, resources)
        sim_state["data"]["env_data"] = env_data

    # Append current global scenario and alerts
    response = {
        "is_running": sim_state["is_running"],
        "scenario": sim_state["scenario"],
        "speed": sim_state["speed"],
        "dashboard_data": sim_state["data"],
        "new_alerts": alert_system.get_latest_alerts_and_clear(),
        "alert_history": alert_system.get_alert_history()
    }
    return response

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
