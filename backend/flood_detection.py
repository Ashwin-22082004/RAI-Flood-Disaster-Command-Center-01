import random

def detect_flood_zones(rainfall: float, river_discharge: float):
    """
    Detects flood-prone zones based on rainfall and river discharge.
    Classifies severity as low, medium, or high.
    """
    # Mock data for demonstration
    zones = ["District Alpha", "District Beta", "District Gamma", "District Delta"]
    
    # Calculate a base severity score (0 to 100)
    base_score = (rainfall * 0.6) + (river_discharge * 0.4)
    
    affected_zones = []
    
    for zone in zones:
        # Add random variations for each district
        severity_score = min(100, max(0, base_score + random.uniform(-15.0, 15.0)))
        
        severity_label = "Low"
        if severity_score > 75:
            severity_label = "High"
        elif severity_score > 40:
            severity_label = "Medium"
        
        if severity_score > 20:
             affected_zones.append({
                 "zone_name": zone,
                 "severity_score": round(severity_score, 2),
                 "severity_label": severity_label,
                 "boundaries_km2": round(severity_score * 0.5, 2)
             })

    return {"affected_zones": affected_zones}
