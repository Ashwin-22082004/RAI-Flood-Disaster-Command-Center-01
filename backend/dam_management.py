def calculate_safe_release(current_level: float, forecast_rainfall: float, safe_capacity: float, season: str = "Monsoon"):
    """
    Continuously monitor dam reservoir levels and predict safe release.
    SafeRelease = CurrentLevel + ForecastRainfall - SafeReservoirCapacity
    """
    safe_release = current_level + forecast_rainfall - safe_capacity
    
    decision = "No Release"
    if season == "Monsoon":
        if safe_release > safe_capacity * 0.2:
            decision = "Emergency Release"
        elif safe_release > 0:
            decision = "Controlled Release"
    elif season == "Summer":
        # Conserve water explicitly
        if safe_release > safe_capacity * 0.4:
            decision = "Controlled Release"
        else:
            safe_release = 0 # No release to conserve
    else: # Winter
        if safe_release > 0:
            decision = "Controlled Release"

    # Floor safe_release to 0
    safe_release = max(0, safe_release)
    
    return {
        "current_level": current_level,
        "forecast_rainfall": forecast_rainfall,
        "safe_capacity": safe_capacity,
        "recommended_release": round(safe_release, 2),
        "decision": decision
    }
