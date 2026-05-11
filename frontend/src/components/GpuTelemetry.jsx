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

function sourceLabel(source) {
  return source?.name || "GPU Source";
}

function GpuTelemetry({ summary: providedSummary }) {
  const [summary, setSummary] = useState(providedSummary || null);

  useEffect(() => {
    if (providedSummary) {
      setSummary(providedSummary);
      return undefined;
    }

    fetchGpuSummary();
    const timer = setInterval(fetchGpuSummary, 15000);
    return () => clearInterval(timer);
  }, [providedSummary]);

  async function fetchGpuSummary() {
    try {
      const res = await axios.get(`http://${window.location.hostname}:4000/api/gpu/summary`);
      setSummary(res.data);
    } catch {
      setSummary({ enabled: false });
    }
  }

  const availableSources = Object.entries(summary?.sources || {})
    .filter(([, source]) => source.enabled && source.gpus?.length);

  if (!summary?.enabled || availableSources.length === 0) {
    return null;
  }

  return (
    <section id="gpu" className="section">
      <div className="section-header">
        <div>
          <h2>GPU Telemetry</h2>
          <span>Read-only accelerator status across configured sources</span>
        </div>
      </div>

      <div className="cards">
        {availableSources.flatMap(([sourceKey, source]) => (
          source.gpus.map(gpu => (
            <div className="service-card" key={`${sourceKey}-${gpu.index}-${gpu.name}`}>
              <div className="card-top">
                <div>
                  <h3>{gpu.name}</h3>
                  <p>
                    {sourceLabel(source)} - Temp {gpu.temperatureC ?? "N/A"}C - Load {gpu.utilizationPercent ?? "N/A"}% - VRAM {formatMemory(gpu)}
                  </p>
                </div>
                <div className={`status-dot ${source.connected ? "online" : "offline"}`} />
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
          ))
        ))}
      </div>
    </section>
  );
}

export default GpuTelemetry;
