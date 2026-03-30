import datetime
import time

class AlertManager:
    def __init__(self):
        self.alert_history = []
        self.active_alerts = []
        self.cooldowns = {}
        self.entity_states = {}
        
    def trigger_event_alert(self, category, msg, severity, cooldown_id, cooldown_sec=15):
        """
        For point-in-time events (e.g. Victim Detected, Drone Deployed).
        Enforces a cooldown to prevent spam.
        """
        now = time.time()
        if cooldown_id in self.cooldowns:
            if now - self.cooldowns[cooldown_id] < cooldown_sec:
                return # Cooldown is still active, ignore
                
        self.cooldowns[cooldown_id] = now
        self._add_alert(category, msg, severity)
        
    def trigger_state_alert(self, category, msg, severity, entity_id, new_state):
        """
        For continuous conditions (e.g. Dam Level, Flood Severity).
        Only triggers when transitioning to a NEW worse state, preventing continuous spam.
        """
        current_state = self.entity_states.get(entity_id, "Normal")
        
        if current_state != new_state:
            # We assume "Normal" does not require an alert, only Warning or Critical
            if new_state != "Normal" and msg is not None:
                self._add_alert(category, msg, severity)
            # Update tracked state
            self.entity_states[entity_id] = new_state

    def trigger_system_alert(self, category, msg, severity):
        """For non-spammy system events like Simulation Start"""
        self._add_alert(category, msg, severity)

    def _add_alert(self, category, msg, severity):
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        
        alert_obj = {
            "id": f"ALRT-{len(self.alert_history)}-{datetime.datetime.now().strftime('%f')}",
            "timestamp": timestamp,
            "category": category,
            "message": msg,
            "severity": severity
        }
        
        self.alert_history.append(alert_obj)
        self.active_alerts.append(alert_obj)
        
    def get_latest_alerts_and_clear(self):
        # Maximum of 1 alert per category per cycle to prevent overwhelming UI
        unique_categories = set()
        filtered_alerts = []
        
        for alert in self.active_alerts:
            if alert["category"] not in unique_categories:
                filtered_alerts.append(alert)
                unique_categories.add(alert["category"])
                
        self.active_alerts.clear()
        return filtered_alerts
        
    def get_alert_history(self):
        return self.alert_history[-30:]

# Global Singleton
alert_system = AlertManager()
