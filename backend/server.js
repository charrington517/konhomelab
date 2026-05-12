const express = require("express");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");
const https = require("https");
const { execFile } = require("child_process");
const packageInfo = require("./package.json");
const testServiceRoutes = require('./routes/testService');

const app = express();
const PORT = 4000;
const startedAt = new Date();

app.use(cors());
app.use(express.json());
app.use('/api/test-service', testServiceRoutes);

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function loadConfig() {
  const raw = fs.readFileSync("/app/config/services.json");
  return JSON.parse(raw);
}

function pct(value) {
  if (value === undefined || value === null) return 0;
  return Math.round(value * 100);
}

function runCommand(command, args, timeout = 5000) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout }, (error, stdout, stderr) => {
      if (error) {
        error.stderr = stderr;
        reject(error);
        return;
      }

      resolve(stdout);
    });
  });
}

function parseNumber(value) {
  if (value === undefined || value === null || value === "" || value === "[N/A]") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

app.get("/api/platform/summary", (req, res) => {
  res.json({
    enabled: true,
    backend: {
      online: true,
      version: packageInfo.version || "unknown",
      commit: process.env.APP_COMMIT || process.env.GIT_COMMIT || null,
      uptimeSeconds: Math.floor(process.uptime()),
      startedAt: startedAt.toISOString(),
      nodeEnv: process.env.NODE_ENV || "unknown"
    },
    frontend: {
      expectedPort: 3000
    },
    api: {
      routeCount: 10,
      routes: [
        "/api/services",
        "/api/proxmox/summary",
        "/api/unraid/summary",
        "/api/media/summary",
        "/api/qbit/summary",
        "/api/prowlarr/summary",
        "/api/tdarr/summary",
        "/api/gpu/summary",
        "/api/network/summary",
        "/api/platform/summary"
      ]
    }
  });
});

app.get("/api/services", async (req, res) => {
  try {
    const data = loadConfig();

    const results = await Promise.all(
      data.services.map(async (service) => {
        const start = Date.now();

        try {
          await axios.get(service.url, {
            timeout: 3000,
            httpsAgent,
            validateStatus: () => true
          });

          return {
            ...service,
            status: "online",
            latency: Date.now() - start
          };
        } catch {
          return {
            ...service,
            status: "offline",
            latency: null
          };
        }
      })
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/proxmox/summary", async (req, res) => {
  try {
    const config = loadConfig();

    if (!config.proxmox || !config.proxmox.enabled) {
      return res.json({ enabled: false });
    }

    const { url, tokenId, tokenSecret } = config.proxmox;

    const headers = {
      Authorization: `PVEAPIToken=${tokenId}=${tokenSecret}`
    };

    const resourcesRes = await axios.get(`${url}/api2/json/cluster/resources`, {
      headers,
      httpsAgent,
      timeout: 5000
    });

    const resources = resourcesRes.data.data || [];

    const nodes = resources.filter(r => r.type === "node");
    const qemu = resources.filter(r => r.type === "qemu");
    const lxc = resources.filter(r => r.type === "lxc");
    const storage = resources.filter(r => r.type === "storage");

    const runningQemu = qemu.filter(v => v.status === "running").length;
    const runningLxc = lxc.filter(v => v.status === "running").length;

    const nodeStats = nodes.map(n => ({
      name: n.node,
      status: n.status,
      cpu: pct(n.cpu),
      memoryUsed: n.mem || 0,
      memoryTotal: n.maxmem || 0,
      memoryPercent: n.maxmem ? Math.round((n.mem / n.maxmem) * 100) : 0,
      diskUsed: n.disk || 0,
      diskTotal: n.maxdisk || 0,
      diskPercent: n.maxdisk ? Math.round((n.disk / n.maxdisk) * 100) : 0
    }));

    const guests = [...qemu, ...lxc].map(v => ({
      id: v.vmid,
      name: v.name || `VM ${v.vmid}`,
      node: v.node,
      type: v.type === "qemu" ? "VM" : "LXC",
      status: v.status,
      cpu: pct(v.cpu),
      memoryPercent: v.maxmem ? Math.round((v.mem / v.maxmem) * 100) : 0
    }));

    res.json({
      enabled: true,
      nodes: nodeStats,
      guests,
      storage: storage.map(s => ({
        name: s.storage,
        node: s.node,
        status: s.status,
        used: s.disk || 0,
        total: s.maxdisk || 0,
        percent: s.maxdisk ? Math.round((s.disk / s.maxdisk) * 100) : 0
      })),
      counts: {
        nodes: nodes.length,
        vms: qemu.length,
        lxc: lxc.length,
        runningVms: runningQemu,
        runningLxc
      }
    });
  } catch (err) {
    res.status(500).json({
      enabled: true,
      error: err.message
    });
  }
});

app.post("/api/unraid/test-query", async (req, res) => {
  try {
    const config = loadConfig();

    if (!config.unraid || !config.unraid.enabled) {
      return res.json({ enabled: false });
    }

    const query = req.body.query || "query { online }";

    const response = await axios.post(
      `${config.unraid.url}/graphql`,
      { query },
      {
        timeout: 6000,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.unraid.apiKey
        },
        httpsAgent,
        validateStatus: () => true
      }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.get("/api/unraid/summary", async (req, res) => {
  try {
    const config = loadConfig();

    if (!config.unraid || !config.unraid.enabled) {
      return res.json({ enabled: false });
    }

    const query = `
      query {
        online
        array {
          state
          capacity {
            disks { free total used }
            kilobytes { free total used }
          }
          disks { name status size temp }
          parities { name status size }
          caches { name status size temp }
        }
        docker {
          containers { names state image }
        }
      }
    `;

    const response = await axios.post(
      `${config.unraid.url}/graphql`,
      { query },
      {
        timeout: 6000,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.unraid.apiKey
        },
        httpsAgent,
        validateStatus: () => true
      }
    );

    if (response.data.errors) {
      return res.json({
        enabled: true,
        connected: false,
        error: response.data.errors.map(e => e.message).join(", ")
      });
    }

    const d = response.data.data;
    const containers = d.docker?.containers || [];
    const running = containers.filter(c => c.state === "RUNNING").length;
    const stopped = containers.filter(c => c.state !== "RUNNING").length;
    const kb = d.array?.capacity?.kilobytes || {};

    res.json({
      enabled: true,
      connected: true,
      online: d.online,
      array: {
        state: d.array?.state || "UNKNOWN",
        diskCount: d.array?.disks?.length || 0,
        disks: (d.array?.disks || []).map(disk => ({
          name: disk.name,
          status: disk.status,
          sizeGB: Math.round((disk.size || 0) / 1024 / 1024),
          temp: disk.temp
        })),
        parities: (d.array?.parities || []).map(p => ({
          name: p.name,
          status: p.status,
          sizeGB: Math.round((p.size || 0) / 1024 / 1024)
        })),
        caches: (d.array?.caches || []).map(c => ({
          name: c.name,
          status: c.status,
          sizeGB: Math.round((c.size || 0) / 1024 / 1024),
          temp: c.temp
        })),
        totalTB: ((parseInt(kb.total) || 0) / 1024 / 1024 / 1024).toFixed(1),
        usedTB: ((parseInt(kb.used) || 0) / 1024 / 1024 / 1024).toFixed(1),
        freeTB: ((parseInt(kb.free) || 0) / 1024 / 1024 / 1024).toFixed(1),
        usedPercent: kb.total ? Math.round((parseInt(kb.used) / parseInt(kb.total)) * 100) : 0
      },
      docker: {
        total: containers.length,
        running,
        stopped,
        containers: containers.map(c => ({
          name: (c.names[0] || "").replace(/^\//, ""),
          state: c.state,
          image: c.image
        }))
      }
    });
  } catch (err) {
    res.status(500).json({
      enabled: true,
      connected: false,
      error: err.message
    });
  }
});

app.get("/api/media/summary", async (req, res) => {
  try {
    const config = loadConfig();

    const result = {
      sonarr: { enabled: false },
      radarr: { enabled: false }
    };

    if (config.media?.sonarr?.enabled) {
      try {
        const base = config.media.sonarr.url;
        const key = config.media.sonarr.apiKey;

        const [queue, wanted, health, calendar] = await Promise.all([
          axios.get(`${base}/api/v3/queue`, { headers: { "X-Api-Key": key }, timeout: 6000 }),
          axios.get(`${base}/api/v3/wanted/missing?page=1&pageSize=10`, { headers: { "X-Api-Key": key }, timeout: 6000 }),
          axios.get(`${base}/api/v3/health`, { headers: { "X-Api-Key": key }, timeout: 6000 }),
          axios.get(`${base}/api/v3/calendar`, { headers: { "X-Api-Key": key }, timeout: 6000 })
        ]);

        result.sonarr = {
          enabled: true,
          connected: true,
          queueCount: queue.data?.records?.length || 0,
          missingCount: wanted.data?.totalRecords || 0,
          healthWarnings: health.data?.length || 0,
          upcomingCount: calendar.data?.length || 0
        };
      } catch (err) {
        result.sonarr = {
          enabled: true,
          connected: false,
          error: err.message
        };
      }
    }

    if (config.media?.radarr?.enabled) {
      try {
        const base = config.media.radarr.url;
        const key = config.media.radarr.apiKey;

        const [queue, wanted, health] = await Promise.all([
          axios.get(`${base}/api/v3/queue`, { headers: { "X-Api-Key": key }, timeout: 6000 }),
          axios.get(`${base}/api/v3/wanted/missing?page=1&pageSize=10`, { headers: { "X-Api-Key": key }, timeout: 6000 }),
          axios.get(`${base}/api/v3/health`, { headers: { "X-Api-Key": key }, timeout: 6000 })
        ]);

        result.radarr = {
          enabled: true,
          connected: true,
          queueCount: queue.data?.records?.length || 0,
          missingCount: wanted.data?.totalRecords || 0,
          healthWarnings: health.data?.length || 0
        };
      } catch (err) {
        result.radarr = {
          enabled: true,
          connected: false,
          error: err.message
        };
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/qbit/summary", async (req, res) => {
  try {
    const config = loadConfig();
    if (!config.qbittorrent || !config.qbittorrent.enabled) {
      return res.json({ enabled: false });
    }

    const qbit = config.qbittorrent;
    if (!qbit.username || !qbit.password || qbit.username.includes("YOUR_")) {
      return res.json({
        enabled: true,
        connected: false,
        setupNeeded: true,
        error: "qBittorrent username/password not configured"
      });
    }

    const login = await axios.post(
      `${qbit.url}/api/v2/auth/login`,
      new URLSearchParams({
        username: qbit.username,
        password: qbit.password
      }).toString(),
      {
        timeout: 6000,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        validateStatus: () => true
      }
    );

    const cookie = login.headers["set-cookie"];
    if (!cookie) {
      return res.json({
        enabled: true,
        connected: false,
        error: "qBittorrent login failed"
      });
    }

    const [transfer, torrents] = await Promise.all([
      axios.get(`${qbit.url}/api/v2/transfer/info`, {
        timeout: 6000,
        headers: { Cookie: cookie.join(";") }
      }),
      axios.get(`${qbit.url}/api/v2/torrents/info`, {
        timeout: 6000,
        headers: { Cookie: cookie.join(";") }
      })
    ]);

    const list = torrents.data || [];
    const downloading = list.filter(t => t.state?.includes("downloading")).length;
    const uploading = list.filter(t => t.state?.includes("uploading")).length;
    const paused = list.filter(t => t.state?.includes("paused")).length;
    const stalled = list.filter(t => t.state?.includes("stalled")).length;
    const errored = list.filter(t => t.state?.includes("error") || t.state === "missingFiles").length;

    res.json({
      enabled: true,
      connected: true,
      speeds: {
        download: transfer.data?.dl_info_speed || 0,
        upload: transfer.data?.up_info_speed || 0
      },
      counts: {
        total: list.length,
        downloading,
        uploading,
        paused,
        stalled,
        errored
      },
      torrents: list.slice(0, 12).map(t => ({
        name: t.name,
        state: t.state,
        category: t.category,
        progress: Math.round((t.progress || 0) * 100),
        downloadSpeed: t.dlspeed || 0,
        uploadSpeed: t.upspeed || 0
      }))
    });
  } catch (err) {
    res.status(500).json({
      enabled: true,
      connected: false,
      error: err.message
    });
  }
});

app.get("/api/prowlarr/summary", async (req, res) => {
  try {
    const config = loadConfig();
    if (!config.prowlarr || !config.prowlarr.enabled) {
      return res.json({ enabled: false });
    }

    const prowlarr = config.prowlarr;
    if (!prowlarr.apiKey || prowlarr.apiKey.includes("YOUR_")) {
      return res.json({
        enabled: true,
        connected: false,
        setupNeeded: true,
        error: "Prowlarr API key not configured"
      });
    }

    const [indexers, health] = await Promise.all([
      axios.get(`${prowlarr.url}/api/v1/indexer`, {
        timeout: 6000,
        headers: { "X-Api-Key": prowlarr.apiKey }
      }),
      axios.get(`${prowlarr.url}/api/v1/health`, {
        timeout: 6000,
        headers: { "X-Api-Key": prowlarr.apiKey }
      })
    ]);

    const indexerList = indexers.data || [];
    const enabledIndexers = indexerList.filter(i => i.enable).length;

    res.json({
      enabled: true,
      connected: true,
      counts: {
        indexers: indexerList.length,
        enabledIndexers,
        healthWarnings: health.data?.length || 0
      },
      indexers: indexerList.slice(0, 12).map(i => ({
        name: i.name,
        protocol: i.protocol,
        enabled: i.enable,
        priority: i.priority
      }))
    });
  } catch (err) {
    res.status(500).json({
      enabled: true,
      connected: false,
      error: err.message
    });
  }
});

app.get("/api/tdarr/summary", async (req, res) => {
  try {
    const config = loadConfig();

    if (!config.tdarr || !config.tdarr.enabled) {
      return res.json({ enabled: false });
    }

    const base = config.tdarr.url;

    async function tdarrGet(name, path) {
      try {
        const response = await axios.get(`${base}${path}`, {
          timeout: 6000,
          validateStatus: () => true
        });

        if (response.status >= 200 && response.status < 300) {
          return {
            name,
            path,
            ok: true,
            status: response.status,
            data: response.data
          };
        }

        return {
          name,
          path,
          ok: false,
          status: response.status,
          error: response.data?.message || response.statusText || "Endpoint unavailable"
        };
      } catch (err) {
        return {
          name,
          path,
          ok: false,
          error: err.message
        };
      }
    }

    function asArray(value) {
      if (Array.isArray(value)) return value;
      if (!value || typeof value !== "object") return [];

      const candidates = [
        value.nodes,
        value.workers,
        value.data,
        value.results,
        value.items,
        value.queue,
        value.jobs,
        value.transcodes
      ];

      return candidates.find(Array.isArray) || [];
    }

    function countFromPayload(payload, keys) {
      if (!payload || typeof payload !== "object") return null;

      for (const key of keys) {
        const value = payload[key];
        if (typeof value === "number") return value;
        if (Array.isArray(value)) return value.length;
      }

      return null;
    }

    const [status, stats, nodes, queue, jobs, workers, transcodes] = await Promise.all([
      tdarrGet("Status", "/api/v2/status"),
      tdarrGet("Stats", "/api/v2/stats"),
      tdarrGet("Nodes", "/api/v2/nodes"),
      tdarrGet("Queue", "/api/v2/queue"),
      tdarrGet("Jobs", "/api/v2/jobs"),
      tdarrGet("Workers", "/api/v2/workers"),
      tdarrGet("Transcodes", "/api/v2/transcodes")
    ]);

    const nodeList = asArray(nodes.data);
    const workerList = asArray(workers.data);
    const jobList = asArray(jobs.data);
    const transcodeList = asArray(transcodes.data);
    const queueList = asArray(queue.data);

    const activeWorkers = workerList.filter(worker => {
      const state = String(worker.status || worker.state || worker.activity || "").toLowerCase();
      return state.includes("active") || state.includes("running") || state.includes("transcod");
    }).length;

    const activeJobs = [
      countFromPayload(stats.data, ["activeJobs", "activeTranscodes", "active"]),
      transcodeList.length || null,
      jobList.filter(job => {
        const state = String(job.status || job.state || "").toLowerCase();
        return state.includes("active") || state.includes("running") || state.includes("transcod");
      }).length || null
    ].find(value => value !== null) || 0;

    const queueDepth = [
      countFromPayload(stats.data, ["queueDepth", "queued", "queue", "pending"]),
      countFromPayload(queue.data, ["queueDepth", "queued", "pending", "total"]),
      queueList.length || null
    ].find(value => value !== null) || 0;

    const endpointResults = [status, stats, nodes, queue, jobs, workers, transcodes];
    const warnings = endpointResults
      .filter(endpoint => !endpoint.ok)
      .map(endpoint => `${endpoint.name} endpoint unavailable${endpoint.status ? ` (${endpoint.status})` : ""}`);

    res.json({
      enabled: true,
      connected: status.ok,
      server: status.ok ? status.data : null,
      stats: stats.ok ? stats.data : null,
      nodes: nodeList,
      workers: workerList,
      jobs: jobList,
      transcodes: transcodeList,
      queue: queueList,
      counts: {
        nodes: nodeList.length,
        workers: workerList.length,
        activeWorkers,
        activeJobs,
        queueDepth
      },
      endpoints: endpointResults.map(endpoint => ({
        name: endpoint.name,
        path: endpoint.path,
        ok: endpoint.ok,
        status: endpoint.status || null,
        error: endpoint.error || null
      })),
      warnings
    });
  } catch (err) {
    res.json({
      enabled: true,
      connected: false,
      server: null,
      nodes: [],
      workers: [],
      jobs: [],
      transcodes: [],
      queue: [],
      counts: {
        nodes: 0,
        workers: 0,
        activeWorkers: 0,
        activeJobs: 0,
        queueDepth: 0
      },
      endpoints: [],
      warnings: ["Tdarr summary request failed"],
      error: err.message
    });
  }
});

app.get("/api/gpu/summary", async (req, res) => {
  const fields = [
    "index",
    "name",
    "temperature.gpu",
    "utilization.gpu",
    "memory.used",
    "memory.total",
    "power.draw",
    "power.limit"
  ];

  const unavailableSource = (name, reason) => ({
    name,
    enabled: false,
    connected: false,
    reason
  });

  try {
    const output = await runCommand("nvidia-smi", [
      `--query-gpu=${fields.join(",")}`,
      "--format=csv,noheader,nounits"
    ]);

    const gpus = output
      .trim()
      .split("\n")
      .map(line => line.split(",").map(part => part.trim()))
      .filter(parts => parts.length >= fields.length)
      .map(parts => {
        const memoryUsedMB = parseNumber(parts[4]);
        const memoryTotalMB = parseNumber(parts[5]);

        return {
          index: parseNumber(parts[0]),
          name: parts[1],
          temperatureC: parseNumber(parts[2]),
          utilizationPercent: parseNumber(parts[3]),
          memoryUsedMB,
          memoryTotalMB,
          memoryPercent: memoryUsedMB !== null && memoryTotalMB
            ? Math.round((memoryUsedMB / memoryTotalMB) * 100)
            : null,
          powerDrawW: parseNumber(parts[6]),
          powerLimitW: parseNumber(parts[7])
        };
      });

    const local = {
      name: "Local Dashboard LXC",
      enabled: gpus.length > 0,
      connected: gpus.length > 0,
      source: "nvidia-smi",
      gpus
    };

    const sources = {
      local,
      aiCore: unavailableSource("AI Core", "future source not configured"),
      unraidTdarr: unavailableSource("Unraid Tdarr", "future source not configured")
    };

    res.json({
      enabled: Object.values(sources).some(source => source.enabled),
      connected: Object.values(sources).some(source => source.connected),
      sources,
      gpus
    });
  } catch (err) {
    const unavailable = err.code === "ENOENT" || err.message.includes("nvidia-smi");
    const sources = {
      local: unavailableSource(
        "Local Dashboard LXC",
        unavailable ? "nvidia-smi unavailable" : err.message
      ),
      aiCore: unavailableSource("AI Core", "future source not configured"),
      unraidTdarr: unavailableSource("Unraid Tdarr", "future source not configured")
    };

    res.json({
      enabled: false,
      connected: false,
      sources,
      gpus: []
    });
  }
});

app.get("/api/network/summary", async (req, res) => {
  async function checkTarget(name, url) {
    const start = Date.now();

    try {
      const response = await axios.get(url, {
        timeout: 5000,
        httpsAgent,
        validateStatus: () => true
      });

      return {
        name,
        url,
        reachable: response.status >= 200 && response.status < 500,
        status: response.status,
        latency: Date.now() - start
      };
    } catch (err) {
      return {
        name,
        url,
        reachable: false,
        status: null,
        latency: null,
        error: err.message
      };
    }
  }

  const [wan, cloudflareTunnel] = await Promise.all([
    checkTarget("WAN", "https://1.1.1.1/cdn-cgi/trace"),
    checkTarget("Cloudflare Tunnel", "https://command.konhomelab.com")
  ]);

  res.json({
    enabled: true,
    wan,
    cloudflareTunnel,
    warnings: [wan, cloudflareTunnel]
      .filter(target => !target.reachable)
      .map(target => `${target.name} unreachable`)
  });
});

app.get('/api/config', (req, res) => {
  try {
    const config = loadConfig();
    const safeConfig = JSON.parse(JSON.stringify(config));
    if (safeConfig.proxmox?.tokenSecret) safeConfig.proxmox.tokenSecret = '********';
    if (safeConfig.unraid?.apiKey) safeConfig.unraid.apiKey = '********';
    if (safeConfig.media?.sonarr?.apiKey) safeConfig.media.sonarr.apiKey = '********';
    if (safeConfig.media?.radarr?.apiKey) safeConfig.media.radarr.apiKey = '********';
    if (safeConfig.prowlarr?.apiKey) safeConfig.prowlarr.apiKey = '********';
    if (safeConfig.qbittorrent?.password) safeConfig.qbittorrent.password = '********';
    res.json(safeConfig);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/config', (req, res) => {
  try {
    const configPath = '/app/config/services.json';
    const backupPath = `/app/config/services.json.bak-${Date.now()}`;
    const current = fs.readFileSync(configPath, 'utf8');
    fs.writeFileSync(backupPath, current);
    
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({ error: 'Invalid config payload' });
    }
    if (!Array.isArray(incoming.services)) {
      return res.status(400).json({ error: 'Config must include services array' });
    }
    
    fs.writeFileSync(configPath, JSON.stringify(incoming, null, 2));
    res.json({
      success: true,
      message: 'Config saved',
      backup: backupPath
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`KonHomeLab backend running on port ${PORT}`);
});
