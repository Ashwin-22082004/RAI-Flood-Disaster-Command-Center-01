import random
import datetime
from alert_manager import alert_system

class DroneSystem:
    def __init__(self, total_drones=30):
        self.total_drones = total_drones
        self.drones = []
        for i in range(1, total_drones + 1):
            self.drones.append({
                "id": f"D-{i:03d}",
                "status": "Standby",
                "battery": random.randint(70, 100),
                "mission": None,
                "target_zone": None,
                "location": {"lat": 0.0, "lng": 0.0},
                "log": []
            })
        self.global_logs = []

    def log_event(self, drone_id, event):
        timestamp = datetime.datetime.now().strftime("%T")
        msg = f"[{timestamp}] {drone_id}: {event}"
        self.global_logs.append(msg)
        
    def deploy_drones(self, flood_status, allocations):
        """
        IF FloodSeverity HIGH AND Accessibility LOW
        -> Deploy drone immediately
        """
        # Collect affected zones and priorities
        zones = flood_status.get("affected_zones", [])
        
        assigned_count = 0
        for zone in zones:
            if zone["severity_score"] > 60:
                # Deploy 2-4 drones per critical zone
                needed = random.randint(2, 4)
                for _ in range(needed):
                    # Find standby drone
                    drone = next((d for d in self.drones if d["status"] == "Standby"), None)
                    if drone:
                        self.assign_mission(drone, zone["zone_name"], "Area Surveillance")
                        assigned_count += 1
                        
        self.simulate_movement()
        return assigned_count

    def assign_mission(self, drone, zone, mission_type):
        drone["status"] = "Active"
        drone["mission"] = mission_type
        drone["target_zone"] = zone
        drone["location"] = {"lat": random.uniform(8.0, 31.0), "lng": random.uniform(70.0, 85.0)}
        self.log_event(drone["id"], f"Deployed to {zone} for {mission_type}.")
        
        # Trigger Frontend Alert with Cooldown
        alert_system.trigger_event_alert("Drone Alerts", f"Drone Deployed - Region {zone}", "Info", cooldown_id=f"deploy_{drone['id']}")
        # Reset battery state tracker
        alert_system.trigger_state_alert("Drone Alerts", None, None, entity_id=f"battery_{drone['id']}", new_state="Normal")
        
    def detect_victims(self, drone):
        if random.random() > 0.8:
            lat_off = random.uniform(-0.01, 0.01)
            lng_off = random.uniform(-0.01, 0.01)
            self.log_event(drone["id"], f"Victim detected at ({round(drone['location']['lat']+lat_off, 4)}, {round(drone['location']['lng']+lng_off, 4)}). Sending coords.")
            
            # Trigger Frontend Alert with Cooldown
            alert_system.trigger_event_alert("Rescue Alerts", f"Victim Detected by {drone['id']} at ({round(drone['location']['lat'], 2)}, {round(drone['location']['lng'], 2)})", "Warning", cooldown_id=f"victim_{drone['id']}")
            return True
        return False
        
    def simulate_movement(self):
        """ Update positions, battery, and missions for active drones """
        for d in self.drones:
            if d["status"] == "Active":
                # Battery drain
                d["battery"] -= random.randint(1, 4)
                
                # Move slightly
                d["location"]["lat"] += random.uniform(-0.005, 0.005)
                d["location"]["lng"] += random.uniform(-0.005, 0.005)
                
                # Check events
                if d["mission"] == "Area Surveillance":
                    if self.detect_victims(d):
                        d["mission"] = "Medical Delivery"
                elif d["mission"] == "Medical Delivery":
                    if random.random() > 0.5:
                        self.log_event(d["id"], "Medical kit delivered successfully.")
                        d["mission"] = "Area Surveillance"
                        
                # Return to base if battery low
                if d["battery"] < 20 and d["status"] != "Returning":
                    self.log_event(d["id"], "Battery critical. Returning to base.")
                    d["status"] = "Returning"
                    
                    # Trigger Frontend Alert
                    alert_system.trigger_state_alert("Drone Alerts", f"Drone Battery Low ({d['battery']}%) - {d['id']} Returning", "Warning", entity_id=f"battery_{d['id']}", new_state="Low")
                    
            elif d["status"] == "Returning":
                d["battery"] -= random.randint(1, 2)
                if d["battery"] <= 5 or random.random() > 0.7:
                    d["status"] = "Charging"
                    d["battery"] = 5
                    self.log_event(d["id"], "Arrived at base. Charging started.")
                    
            elif d["status"] == "Charging":
                d["battery"] += random.randint(10, 20)
                if d["battery"] >= 95:
                    d["battery"] = 100
                    d["status"] = "Standby"
                    self.log_event(d["id"], "Fully charged and ready.")

    def update_status(self):
        active_count = sum(1 for d in self.drones if d["status"] == "Active")
        returning_count = sum(1 for d in self.drones if d["status"] == "Returning")
        charging_count = sum(1 for d in self.drones if d["status"] == "Charging")
        
        return {
            "total_drones": self.total_drones,
            "active_drones": active_count,
            "returning_drones": returning_count,
            "charging_drones": charging_count,
            "fleet": self.drones,
            "live_logs": self.global_logs[-20:] # Return last 20 logs
        }
