import datetime

from flood_detection import detect_flood_zones
from dam_management import calculate_safe_release
from vulnerability_model import analyze_vulnerabilities
from resource_allocator import allocate_resources
from logistics_optimizer import optimize_logistics
from drone_module import DroneSystem

class RAIAgentController:
    def __init__(self):
        self.decision_logs = []
        self.drone_system = DroneSystem(total_drones=50)
        
    def log_decision(self, module, action, reasoning):
        log_entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "module": module,
            "action": action,
            "reasoning": reasoning,
            "rai_principle_applied": "Transparency & Accountability"
        }
        self.decision_logs.append(log_entry)
        
    def run_simulation_cycle(self, env_data: dict, available_resources: dict):
        """
        Runs a full cycle of the disaster management AI agent.
        """
        
        # 1. Flood Detection
        flood_result = detect_flood_zones(
            rainfall=env_data.get("rainfall", 0),
            river_discharge=env_data.get("river_discharge", 0)
        )
        affected_zones = flood_result["affected_zones"]
        self.log_decision("Flood Detection", f"Detected {len(affected_zones)} affected zones.", "Based on multi-modal climate and sensor data thresholds.")
        
        # 2. Dam Management
        dam_result = calculate_safe_release(
            current_level=env_data.get("dam_level", 0),
            forecast_rainfall=env_data.get("rainfall", 0),
            safe_capacity=env_data.get("dam_capacity", 100),
            season=env_data.get("season", "Monsoon")
        )
        self.log_decision("Dam Management", dam_result["decision"], f"Evaluated safety capacity vs incoming rainfall ({dam_result['recommended_release']} release units required).")
        
        # 3. Vulnerability Analysis
        ranked_vulnerabilities = analyze_vulnerabilities(affected_zones)
        self.log_decision("Vulnerability Analysis", "Ranked regions by risk score.", "Formula combining severity, population, medical access, and infra damage.")
        
        # 4. Resource Allocation
        allocations = allocate_resources(ranked_vulnerabilities, available_resources)
        self.log_decision("Resource Allocation", "Fairly distributed resources.", "Prioritized high-vulnerability regions first, guaranteeing medical and rescue units to most critical zones.")
        
        # 5. Logistics Optimization
        logistics = optimize_logistics(allocations)
        self.log_decision("Logistics Optimization", "Calculated optimal supply routes.", "Minimized ETA using mock shortest-path routing.")
        
        # 6. Deploy Drones
        drones_deployed = self.drone_system.deploy_drones(flood_result, allocations)
        drone_status = self.drone_system.update_status()
        self.log_decision("Autonomous Drone Fleet", f"Deployed {drones_deployed} additional drones for active surveillance.", "Severe flooding and low accessibility detected in priority zones.")
        
        # Compile total output
        return {
            "flood_status": flood_result,
            "dam_status": dam_result,
            "vulnerability_ranking": ranked_vulnerabilities,
            "resource_allocation": allocations,
            "logistics_plan": logistics,
            "drone_system": drone_status,
            "ai_decision_logs": self.decision_logs[-10:] # Return last 10 logs
        }
