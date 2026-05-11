const AI_TARGETS = [
  "Ollama",
  "OpenWebUI",
  "n8n",
  "AI Dashboard"
];

function findService(services, target) {
  const normalized = target.toLowerCase();
  return services.find(service => service.name.toLowerCase() === normalized);
}

function statusText(service) {
  if (!service) return "unavailable";
  return service.status || "unknown";
}

function latencyText(service) {
  if (!service) return "Not configured";
  return service.latency ? `${service.latency} ms` : "No response";
}

function AiStackOverview({ services }) {
  const aiServices = AI_TARGETS.map(name => {
    const service = findService(services, name);
    return {
      name,
      service,
      status: statusText(service)
    };
  });

  const online = aiServices.filter(item => item.status === "online").length;
  const unavailable = aiServices.length - online;

  return (
    <section id="ai" className="section">
      <div className="section-header">
        <div>
          <h2>AI Stack Overview</h2>
          <span>Read-only status for local AI tools and automation services</span>
        </div>
        <span>{online} online / {unavailable} unavailable</span>
      </div>

      <div className="cards">
        {aiServices.map(item => {
          const service = item.service;
          const onlineStatus = item.status === "online";

          return (
            <a
              className={`service-card ${onlineStatus ? "" : "is-offline"}`}
              href={service?.url || "#ai"}
              target={service?.url ? "_blank" : undefined}
              rel={service?.url ? "noreferrer" : undefined}
              key={item.name}
            >
              <div className="card-top">
                <div>
                  <h3>{item.name}</h3>
                  <p>
                    {service?.url || "Service not configured in dashboard services"}
                  </p>
                </div>
                <div className={`status-dot ${onlineStatus ? "online" : "offline"}`} />
              </div>

              <div className="card-bottom">
                <span className={onlineStatus ? "ok" : "bad"}>
                  {item.status}
                </span>
                <span>{latencyText(service)}</span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

export default AiStackOverview;
