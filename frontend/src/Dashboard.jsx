import React, { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:8000/api/simulation';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [scenario, setScenario] = useState("Kerala");
  const [speed, setSpeed] = useState(1.0);
  
  // Phase 3: Alerts & Audio State
  const [activeToasts, setActiveToasts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  const playSound = (severity) => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (severity === "Critical") {
        osc.type = "sawtooth";
        // Siren effect
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.2);
        osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.start(); osc.stop(ctx.currentTime + 0.8);
      } else if (severity === "Warning") {
        osc.type = "square";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      } else { // Info
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      }
    } catch(e) { console.warn("Audioplay error", e) }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      const json = await res.json();
      setIsRunning(json.is_running);
      if (json.dashboard_data) setData(json.dashboard_data);
      if (json.scenario) setScenario(json.scenario);
      if (json.speed) setSpeed(json.speed);
      
      // Phase 3: Alert Logic
      if (json.alert_history) setAlertHistory(json.alert_history);
      
      if (json.new_alerts && json.new_alerts.length > 0) {
        let hasCritical = false;
        json.new_alerts.forEach(alert => {
          if (alert.severity === "Critical") hasCritical = true;
          playSound(alert.severity);
          
          // Add to Toast list
          setActiveToasts(prev => [...prev, alert]);
          // Auto remove after 5s
          setTimeout(() => {
            setActiveToasts(prev => prev.filter(t => t.id !== alert.id));
          }, 5000);
        });
        
        if (hasCritical) {
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 500);
        }
      }

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const pollRate = Math.max(300, 3000 / speed);
    const interval = setInterval(() => {
      if (isRunning) fetchStatus();
    }, pollRate);
    return () => clearInterval(interval);
  }, [isRunning, speed]);

  const toggleSimulation = async () => {
    try {
      if (isRunning) {
        await fetch(`${API_BASE}/stop`);
        setIsRunning(false);
      } else {
        await fetch(`${API_BASE}/start?scenario=${scenario}&speed=${speed}`);
        setIsRunning(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSettingsChange = async (newScen, newSpeed) => {
    setScenario(newScen);
    setSpeed(newSpeed);
    if (isRunning) {
      await fetch(`${API_BASE}/settings?scenario=${newScen}&speed=${newSpeed}`);
    }
  };

  // Data mapping
  const dam = data?.dam_status || {};
  const vuln = data?.vulnerability_ranking || [];
  const logPlan = data?.logistics_plan?.delivery_routes || [];
  const floodZones = data?.flood_status?.affected_zones || [];
  const allocations = data?.resource_allocation || [];
  const drones = data?.drone_system || { active_drones: 0, total_drones: 50, battery_avg: 100, fleet: [], live_logs: [] };

  return (
    <div className={`app-container ${screenShake ? 'shake-effect' : ''}`}>
      
      {/* Toast Notification Container */}
      <div className="toast-container">
        {activeToasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.severity}`}>
             <div className="toast-icon">
               {toast.severity === 'Critical' ? '🚨' : toast.severity === 'Warning' ? '⚠️' : 'ℹ️'}
             </div>
             <div className="toast-content">
               <span className="toast-title">{toast.category}</span>
               <span className="toast-msg">{toast.message}</span>
             </div>
          </div>
        ))}
      </div>

      <div className="top-banner">
        <div className="banner-left">
          <h1 className="banner-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--accent-red)'}}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            RAI Flood Disaster Command Center
          </h1>
          <div className={`system-status ${!isRunning ? 'offline' : ''}`}>
            <span className={`status-dot ${isRunning ? 'status-green' : 'status-red'}`}></span>
            COMMAND CENTER {isRunning ? 'ACTIVE' : 'STANDBY'}
          </div>
        </div>
        
        <div className="controls">
          <button 
            className="btn" 
            style={{background: 'transparent', border: '1px solid var(--border-color)', color: 'white'}}
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? '🔇 Unmute' : '🔊 Mute'}
          </button>
          <select 
            className="control-select" 
            value={scenario} 
            onChange={(e) => handleSettingsChange(e.target.value, speed)}
            disabled={isRunning}
          >
            <option value="Kerala">Scenario: Kerala</option>
            <option value="Uttarakhand">Scenario: Uttarakhand</option>
            <option value="Himachal">Scenario: Himachal</option>
          </select>
          <select 
            className="control-select" 
            value={speed} 
            onChange={(e) => handleSettingsChange(scenario, parseFloat(e.target.value))}
          >
            <option value="0.5">Speed: 0.5x</option>
            <option value="1.0">Speed: 1.0x</option>
            <option value="2.0">Speed: 2.0x</option>
            <option value="5.0">Speed: 5.0x</option>
          </select>
          <button className="btn btn-danger" onClick={toggleSimulation}>
            {isRunning ? 'Halt Simulation' : 'Run Disaster Simulation'}
          </button>
        </div>
      </div>

      <div className="main-grid">
        
        {/* PANEL 1: Map (Spans 2 cols, 2 rows) */}
        <div className="glass-panel map-panel">
          <div className="map-header">
            <div className="panel-title" style={{margin: 0}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              Live Operations Command Map
            </div>
            <div className="map-status">
              <span className={`status-dot ${isRunning ? 'status-red animate-pulse' : 'status-dot'} `} style={{background: isRunning ? 'var(--accent-red)' : 'var(--text-secondary)'}}></span>
              {isRunning ? 'LIVE SIMULATION ACTIVE' : 'OFFLINE'}
            </div>
          </div>
          
          <div className="map-area">
            {isRunning && floodZones.map((z, i) => {
              const pos = [{top: '30%', left: '40%'}, {top: '60%', left: '70%'}, {top: '20%', left: '60%'}, {top: '70%', left: '30%'}];
              const size = z.severity_score > 75 ? 140 : 80;
              const color = z.severity_score > 80 ? '#ef4444' : z.severity_score > 50 ? '#eab308' : '#10b981';
              return (
                <div key={`zone-${i}`} style={{
                  position: 'absolute',
                  ...pos[i%4],
                  width: size,
                  height: size,
                  background: `${color}33`,
                  border: `1px solid ${color}88`,
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{width: 8, height: 8, background: color, borderRadius: '50%'}}></div>
                </div>
              );
            })}

            {/* Evacuation Flow Animations */}
            {isRunning && (
              <svg className="evac-line">
                <path className="evac-path" d="M 40% 30% L 60% 20% L 70% 60%" />
                <path className="evac-path" d="M 30% 70% L 40% 30%" />
              </svg>
            )}

            {/* Drone Animations */}
            {isRunning && drones.fleet.map((d, i) => {
              if (d.status !== "Active") return null;
              // Map lat/long (mock scale) to % for CSS
              const top = 100 - ((d.location.lat - 8) / (31 - 8) * 100);
              const left = ((d.location.lng - 70) / (85 - 70) * 100);
              return (
                <svg key={`drone-${i}`} className="drone-icon" style={{top: `${top}%`, left: `${left}%`}} viewBox="0 0 24 24">
                  <path d="M12 2L2 22h20L12 2z"/>
                </svg>
              );
            })}

            <div className="map-legend">
              <div className="legend-item"><div className="legend-color" style={{background: '#ef4444'}}></div> High Risk Flood</div>
              <div className="legend-item"><div className="legend-color" style={{background: '#eab308'}}></div> Medium Risk Flood</div>
              <div className="legend-item"><div className="legend-color" style={{background: '#10b981'}}></div> Safe Zone / Base</div>
              <div className="legend-item"><div className="legend-color" style={{background: '#a855f7'}}></div> Autonomous Drone</div>
            </div>
          </div>
        </div>

        {/* ROW 1, COL 3: Dam Monitor */}
        <div className="glass-panel side-panel">
          <div className="panel-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Dam Water Monitor
          </div>
          <div className="subtitle">IDUKKI RESERVOIR CONTROL</div>
          <div className="monitor-bar-container">
            <div 
              className="monitor-bar-fill" 
              style={{width: `${dam.current_level ? Math.min((dam.current_level / dam.safe_capacity) * 100, 100) : 0}%`, background: dam.decision === 'Emergency Release' ? 'rgba(239, 68, 68, 0.8)' : 'linear-gradient(90deg, rgba(59, 130, 246, 0.8), rgba(59, 130, 246, 0.4))'}}
            ></div>
            <div style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:600}}>
               {dam.current_level ? `${dam.current_level.toFixed(1)} / ${dam.safe_capacity.toFixed(0)}` : 'AWAITING DATA'}
            </div>
          </div>
          {isRunning && (
            <div className="flex-col" style={{marginTop: 'auto'}}>
               <div className="data-row"><span className="data-label">Forecast Rain</span><span className="data-value">{dam.forecast_rainfall?.toFixed(1)} mm</span></div>
               <div className="data-row"><span className="data-label">AI Decision</span><span className="data-value" style={{color: '#a855f7'}}>{dam.decision}</span></div>
            </div>
          )}
        </div>

        {/* ROW 1, COL 4: Autonomous Drones */}
        <div className="glass-panel side-panel">
          <div className="panel-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22l10-20 10 20H2z"/></svg>
            Autonomous Drone Units
          </div>
          {!isRunning && <div className="subtitle">System Offline</div>}
          {isRunning && (
            <div className="flex-col" style={{gap: '10px'}}>
              <div style={{display:'flex', gap: '10px'}}>
                <div style={{flex: 1, background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', textAlign: 'center'}}>
                   <div style={{fontSize: '1.5rem', color: '#a855f7', fontWeight: 700}}>{drones.active_drones}</div>
                   <div className="subtitle">ACTIVE</div>
                </div>
                <div style={{flex: 1, background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', textAlign: 'center'}}>
                   <div style={{fontSize: '1.5rem', color: '#10b981', fontWeight: 700}}>{drones.total_drones}</div>
                   <div className="subtitle">TOTAL</div>
                </div>
              </div>
              <div className="terminal-log">
                {drones.live_logs.slice().reverse().map((log, i) => (
                  <div key={i} className="log-entry">&gt; {log}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ROW 2, COL 3: Damage Assessment */}
        <div className="glass-panel side-panel">
          <div className="panel-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            Damage Assessment
          </div>
          {!isRunning && <div className="subtitle">System Offline</div>}
          {isRunning && vuln.slice(0, 3).map((v, i) => (
            <div key={i} style={{marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
              <div className="data-label" style={{color: '#3b82f6', marginBottom: 4}}>{v.zone_name}</div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                <span>Infra Damage:</span>
                <span style={{color: '#ef4444', fontWeight: 600}}>{v.damage_assessment.infrastructure_damage_pct}%</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                <span>Affected Pop:</span>
                <span style={{color: '#f8fafc'}}>{v.damage_assessment.affected_population.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ROW 2, COL 4 (NEW): Real-Time Alert History */}
        <div className="glass-panel side-panel">
          <div className="panel-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            Live Alert History
          </div>
          <div className="terminal-log" style={{height: '100%', flex: 1, borderColor: 'rgba(239, 68, 68, 0.2)'}}>
             {!alertHistory.length && <div style={{color: 'var(--text-secondary)'}}>No alerts recorded.</div>}
             {alertHistory.slice().reverse().map((alrt, i) => (
               <div key={i} className="log-entry" style={{
                 color: alrt.severity === 'Critical' ? '#ef4444' : alrt.severity === 'Warning' ? '#f59e0b' : '#3b82f6',
                 borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px', marginBottom: '4px'
               }}>
                 <span style={{color: '#94a3b8', fontSize: '0.7rem'}}>[{alrt.timestamp}]</span> {alrt.message}
               </div>
             ))}
          </div>
        </div>

        {/* ROW 3, COL 1-2: Ethical Resource Deployment Table (Spans 2 cols) */}
        <div className="glass-panel side-panel" style={{gridColumn: 'span 2'}}>
          <div className="panel-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            Ethical Resource Deployment
          </div>
          {!isRunning && <div className="subtitle">System Offline</div>}
          {isRunning && (
            <table className="resource-table">
              <thead>
                <tr>
                  <th>District</th>
                  <th>Boats</th>
                  <th>Helicopters</th>
                  <th>Medical Units</th>
                  <th>Rescue Teams</th>
                  <th>Vehicles</th>
                  <th>Food Rations</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((alloc, i) => (
                  <tr key={i}>
                    <td style={{fontWeight: 600, color: '#3b82f6'}}>{alloc.zone_name}</td>
                    <td>{alloc.allocated_resources.boats}</td>
                    <td>{alloc.allocated_resources.helicopters}</td>
                    <td>{alloc.allocated_resources.medical_units}</td>
                    <td>{alloc.allocated_resources.rescue_teams}</td>
                    <td>{alloc.allocated_resources.vehicles}</td>
                    <td>{alloc.allocated_resources.food}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* ROW 4 (NEW): Vulnerability Panel */}
        {/* We shifted Vulnerability down because Alert History took its spot */}
        <div className="glass-panel side-panel" style={{gridColumn: 'span 2'}}>
          <div className="panel-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Population Vulnerability Matrix
          </div>
          <div className="flex-col" style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '15px'}}>
            {!isRunning && <div className="subtitle" style={{marginTop: 10}}>System Offline</div>}
            {isRunning && vuln.slice(0, 4).map((v, i) => (
              <div className="data-row" key={i} style={{flex: '1 1 45%', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)'}}>
                <div className="data-label">{v.zone_name}</div>
                <div className="data-value" style={{color: v.vulnerability_score > 80 ? '#ef4444' : '#3b82f6'}}>
                  {v.vulnerability_score.toFixed(1)} AI SCORE
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 4, COL 3-4: Supply Chain & AI Explanations */}
        <div className="glass-panel side-panel" style={{gridColumn: 'span 2'}}>
          <div className="panel-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            AI Agent Explanations & Logistics
          </div>
          {!isRunning && <div className="subtitle">System Offline</div>}
          {isRunning && (
            <div style={{display: 'flex', gap: '20px'}}>
              <div style={{flex: 1}}>
                <div className="subtitle" style={{marginBottom: 10}}>Reasoning Log</div>
                <div className="terminal-log" style={{height: '180px'}}>
                  {data?.ai_decision_logs?.slice().reverse().map((log, i) => (
                    <div key={i} className="log-entry" style={{color: '#f8fafc', marginBottom: 8}}>
                      <span style={{color: '#a855f7', fontWeight: 'bold'}}>[{log.module}]</span> {log.action}<br/>
                      <span style={{color: '#94a3b8'}}>&gt; {log.reasoning}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{flex: 1}}>
                <div className="subtitle" style={{marginBottom: 10}}>Supply Routing</div>
                <div className="flex-col">
                  {logPlan.slice(0, 3).map((route, i) => (
                    <div className="data-row" key={i} style={{padding: '8px 0'}}>
                      <div className="flex-col">
                        <div className="data-label">{route.target_zone}</div>
                        <div className="subtitle" style={{fontSize: '0.7rem', marginTop: 2}}>{route.source_warehouse} → ETA: {route.estimated_eta_hours}h</div>
                      </div>
                      <div className="data-value" style={{color: route.vehicle_dispatched ? '#10b981' : '#f59e0b', fontSize: '0.75rem', border: '1px solid', padding: '2px 6px', borderRadius: 4}}>
                        {route.vehicle_dispatched ? 'DISPATCHED' : 'PENDING'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
