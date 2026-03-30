def allocate_resources(ranked_zones: list, available_resources: dict):
    """
    Allocate: rescue teams, boats, medical units, relief materials, helicopters, vehicles, food
    Based on vulnerability score and severity level.
    Ensures fairness by prioritizing the most vulnerable first.
    """
    # Deep copy available resources so we can decrement them
    current_resources = {k: v for k, v in available_resources.items()}
    
    allocation_plan = []
    
    for zone in ranked_zones:
        zone_name = zone["zone_name"]
        allocations = {
            "rescue_teams": 0,
            "boats": 0,
            "helicopters": 0,
            "medical_units": 0,
            "vehicles": 0,
            "food": 0
        }
        
        # Calculate needs based on vulnerability score
        v_score = zone.get("vulnerability_score", 0)
        
        # Need multipliers
        if v_score > 80:
            need_mult = 3
        elif v_score > 50:
            need_mult = 2
        else:
            need_mult = 1
            
        # Allocate rescue teams
        teams_needed = min(current_resources.get("rescue_teams", 0), 2 * need_mult)
        allocations["rescue_teams"] = teams_needed
        current_resources["rescue_teams"] = current_resources.get("rescue_teams", 0) - teams_needed
        
        # Allocate boats
        boats_needed = min(current_resources.get("boats", 0), 3 * need_mult)
        allocations["boats"] = boats_needed
        current_resources["boats"] = current_resources.get("boats", 0) - boats_needed
        
        # Allocate helicopters
        heli_needed = min(current_resources.get("helicopters", 0), 1 * (need_mult - 1)) # Only high/med risk get heli
        allocations["helicopters"] = heli_needed
        current_resources["helicopters"] = current_resources.get("helicopters", 0) - heli_needed
        
        # Allocate medical units
        meds_needed = min(current_resources.get("medical_units", 0), 2 * need_mult)
        allocations["medical_units"] = meds_needed
        current_resources["medical_units"] = current_resources.get("medical_units", 0) - meds_needed
        
        # Allocate vehicles
        vehicles_needed = min(current_resources.get("vehicles", 0), 2 * need_mult)
        allocations["vehicles"] = vehicles_needed
        current_resources["vehicles"] = current_resources.get("vehicles", 0) - vehicles_needed
        
        # Allocate food
        food_needed = min(current_resources.get("food", 0), 500 * need_mult)
        allocations["food"] = food_needed
        current_resources["food"] = current_resources.get("food", 0) - food_needed
        
        allocation_plan.append({
            "zone_name": zone_name,
            "allocated_resources": allocations
        })
        
    return allocation_plan
