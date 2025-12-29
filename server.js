const express = require('express');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to format bytes to GB/MB
function formatBytes(bytes) {
  const gb = bytes / (1024 ** 3);
  return gb.toFixed(2);
}

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return { days, hours, minutes, seconds: secs };
}

// API Routes

// Get basic system information
app.get('/api/system/info', (req, res) => {
  const systemInfo = {
    platform: os.platform(),
    type: os.type(),
    release: os.release(),
    hostname: os.hostname(),
    architecture: os.arch(),
    homeDirectory: os.homedir(),
    tmpDirectory: os.tmpdir()
  };
  res.json(systemInfo);
});

// Get CPU information
app.get('/api/system/cpu', (req, res) => {
  const cpus = os.cpus();
  const cpuInfo = {
    model: cpus[0].model,
    cores: cpus.length,
    speed: cpus[0].speed,
    details: cpus.map((cpu, index) => ({
      core: index,
      model: cpu.model,
      speed: cpu.speed,
      times: cpu.times
    }))
  };
  res.json(cpuInfo);
});

// Get memory information
app.get('/api/system/memory', (req, res) => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  
  const memoryInfo = {
    total: totalMemory,
    free: freeMemory,
    used: usedMemory,
    usedPercentage: ((usedMemory / totalMemory) * 100).toFixed(2),
    totalGB: formatBytes(totalMemory),
    freeGB: formatBytes(freeMemory),
    usedGB: formatBytes(usedMemory)
  };
  res.json(memoryInfo);
});

// Get system uptime
app.get('/api/system/uptime', (req, res) => {
  const uptimeSeconds = os.uptime();
  const uptimeInfo = {
    seconds: uptimeSeconds,
    formatted: formatUptime(uptimeSeconds)
  };
  res.json(uptimeInfo);
});

// Get network interfaces
app.get('/api/system/network', (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  const formattedInterfaces = {};
  
  for (const [name, interfaces] of Object.entries(networkInterfaces)) {
    formattedInterfaces[name] = interfaces.map(iface => ({
      address: iface.address,
      netmask: iface.netmask,
      family: iface.family,
      mac: iface.mac,
      internal: iface.internal
    }));
  }
  
  res.json(formattedInterfaces);
});

// Get all system stats
app.get('/api/system/all', (req, res) => {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const uptimeSeconds = os.uptime();
  const networkInterfaces = os.networkInterfaces();
  
  const allStats = {
    systemInfo: {
      platform: os.platform(),
      type: os.type(),
      release: os.release(),
      hostname: os.hostname(),
      architecture: os.arch(),
      homeDirectory: os.homedir()
    },
    cpu: {
      model: cpus[0].model,
      cores: cpus.length,
      speed: cpus[0].speed
    },
    memory: {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usedPercentage: ((usedMemory / totalMemory) * 100).toFixed(2),
      totalGB: formatBytes(totalMemory),
      freeGB: formatBytes(freeMemory),
      usedGB: formatBytes(usedMemory)
    },
    uptime: {
      seconds: uptimeSeconds,
      formatted: formatUptime(uptimeSeconds)
    },
    networkInterfaces: Object.keys(networkInterfaces).length,
    timestamp: new Date().toISOString()
  };
  
  res.json(allStats);
});

// Start server
app.listen(PORT, () => {
  console.log(`System Stats API Server running on http://localhost:${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  - GET /api/system/info`);
  console.log(`  - GET /api/system/cpu`);
  console.log(`  - GET /api/system/memory`);
  console.log(`  - GET /api/system/uptime`);
  console.log(`  - GET /api/system/network`);
  console.log(`  - GET /api/system/all`);
});
