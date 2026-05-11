import { useEffect, useState } from "react";
import axios from "axios";

function formatMemory(gpu) {
  if (gpu.memoryUsedMB === null || gpu.memoryTotalMB === null) {
    return "Memory unavailable";
  }

  const usedGB = (gpu.memoryUsedMB / 1024).toFixed(1);
  const totalGB = (gpu.memoryTotalMB / 1024).toFixed(1);
  return `${usedGB} / ${totalGB} GB`;
}

function GpuTelemetry() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchGpuSummary();
    const timer = setInterval(fetchGpuSummary, 15000);
    return () => clearInterval(timer);
  }, []);

  async function fetchGpuSummary() {
    try {
      const res = await axios.get(`http://${window.location.hostname}:4000/api/gpu/summary`);
      setSummary(res.data);
    } catch {
      setSummary({ enabled: false });
    }
  }

  if (!summary?.enabled || !summary.gpus?.length) {
    return null;
  }

  return (
    <section id="gpu" className="section">
      <div className="section-header">
        <div>
          <h2>GPU Telemetry</h2>
          <span>Read-only accelerator status from nvidia-smi</span>
        </div>
      </div>

      <div className="cards">
        {summary.gpus.map(gpu => (
          <div className="service-card" key={`${gpu.index}-${gpu.name}`}>
            <div className="card-top">
              <div>
                <h3>{gpu.name}</h3>
                <p>
                  Temp {gpu.temperatureC ?? "N/A"}C • Load {gpu.utilizationPercent ?? "N/A"}% • VRAM {formatMemory(gpu)}
                </p>
              </div>
              <div className={`status-dot ${summary.connected ? "online" : "offline"}`} />
            </div>

            <div className="card-bottom">
              <span className="ok">read only</span>
              <span>
                {gpu.powerDrawW !== null && gpu.powerLimitW !== null
                  ? `${gpu.powerDrawW} / ${gpu.powerLimitW} W`
                  : "Power unavailable"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default GpuTelemetry;
