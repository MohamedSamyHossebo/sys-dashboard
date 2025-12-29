const express = require('express');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Historical data storage (in-memory, last 20 data points)
const historicalData = [];
const MAX_HISTORY = 20;

// Previous CPU times for usage calculation
let previousCpuTimes = null;

// Helper function to format bytes to GB
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

// Calculate CPU usage percentage
function getCpuUsage() {
  const cpus = os.cpus();

  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach(cpu => {
    for (let type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;

  if (previousCpuTimes) {
    const idleDifference = idle - previousCpuTimes.idle;
    const totalDifference = total - previousCpuTimes.total;
    const percentageCpu = 100 - ~~(100 * idleDifference / totalDifference);

    previousCpuTimes = { idle, total };
    return percentageCpu;
  } else {
    previousCpuTimes = { idle, total };
    return 0;
  }
}

// Calculate system health score (0-100)
function getSystemHealth(memoryUsage, cpuUsage, diskUsage = 0) {
  let score = 100;

  // Memory weight: 40%
  if (memoryUsage > 90) score -= 40;
  else if (memoryUsage > 75) score -= 30;
  else if (memoryUsage > 60) score -= 15;
  else if (memoryUsage > 50) score -= 5;

  // CPU weight: 40%
  if (cpuUsage > 90) score -= 40;
  else if (cpuUsage > 75) score -= 30;
  else if (cpuUsage > 60) score -= 15;
  else if (cpuUsage > 50) score -= 5;

  // Disk weight: 20%
  if (diskUsage > 90) score -= 20;
  else if (diskUsage > 75) score -= 15;
  else if (diskUsage > 60) score -= 7;

  return Math.max(0, score);
}

// Store historical data point
function storeHistoricalData(data) {
  historicalData.push({
    ...data,
    timestamp: new Date().toISOString()
  });

  // Keep only last MAX_HISTORY points
  if (historicalData.length > MAX_HISTORY) {
    historicalData.shift();
  }
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

// Get CPU information with usage
app.get('/api/system/cpu', (req, res) => {
  const cpus = os.cpus();
  const cpuUsage = getCpuUsage();

  const cpuInfo = {
    model: cpus[0].model,
    cores: cpus.length,
    speed: cpus[0].speed,
    usage: cpuUsage,
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

// Get load average (Unix-like systems)
app.get('/api/system/load', (req, res) => {
  const loadAvg = os.loadavg();
  res.json({
    average: {
      '1min': loadAvg[0].toFixed(2),
      '5min': loadAvg[1].toFixed(2),
      '15min': loadAvg[2].toFixed(2)
    },
    cores: os.cpus().length
  });
});

// Get disk usage (estimated based on memory as proxy - limited by os module)
app.get('/api/system/disk', (req, res) => {
  // Note: os module doesn't provide disk info, this is a mock/estimation
  // For real disk info, you'd need the 'systeminformation' package
  const totalMemory = os.totalmem();
  const estimatedDisk = totalMemory * 10; // Rough estimation
  const estimatedUsed = estimatedDisk * 0.65; // Assume 65% used
  const estimatedFree = estimatedDisk - estimatedUsed;

  res.json({
    total: estimatedDisk,
    used: estimatedUsed,
    free: estimatedFree,
    usedPercentage: ((estimatedUsed / estimatedDisk) * 100).toFixed(2),
    totalGB: formatBytes(estimatedDisk),
    usedGB: formatBytes(estimatedUsed),
    freeGB: formatBytes(estimatedFree),
    note: 'Estimated values - install systeminformation package for accurate disk data'
  });
});

// Get network interfaces with enhanced info
app.get('/api/system/network', (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  const formattedInterfaces = [];

  for (const [name, interfaces] of Object.entries(networkInterfaces)) {
    interfaces.forEach(iface => {
      formattedInterfaces.push({
        name: name,
        address: iface.address,
        netmask: iface.netmask,
        family: iface.family,
        mac: iface.mac,
        internal: iface.internal,
        cidr: iface.cidr
      });
    });
  }

  res.json({
    interfaces: formattedInterfaces,
    count: formattedInterfaces.length
  });
});

// Get system health score
app.get('/api/system/health', (req, res) => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  const cpuUsage = getCpuUsage();

  const health = getSystemHealth(memoryUsage, cpuUsage);

  let status = 'excellent';
  if (health < 50) status = 'critical';
  else if (health < 70) status = 'warning';
  else if (health < 85) status = 'good';

  res.json({
    score: health,
    status: status,
    metrics: {
      memoryUsage: memoryUsage.toFixed(2),
      cpuUsage: cpuUsage
    }
  });
});

// Get historical data
app.get('/api/system/history', (req, res) => {
  res.json({
    data: historicalData,
    count: historicalData.length,
    maxPoints: MAX_HISTORY
  });
});

// Get all system stats (enhanced)
app.get('/api/system/all', (req, res) => {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  const uptimeSeconds = os.uptime();
  const networkInterfaces = os.networkInterfaces();
  const cpuUsage = getCpuUsage();
  const loadAvg = os.loadavg();

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
      speed: cpus[0].speed,
      usage: cpuUsage
    },
    memory: {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usedPercentage: memoryUsage.toFixed(2),
      totalGB: formatBytes(totalMemory),
      freeGB: formatBytes(freeMemory),
      usedGB: formatBytes(usedMemory)
    },
    uptime: {
      seconds: uptimeSeconds,
      formatted: formatUptime(uptimeSeconds)
    },
    loadAverage: {
      '1min': loadAvg[0].toFixed(2),
      '5min': loadAvg[1].toFixed(2),
      '15min': loadAvg[2].toFixed(2)
    },
    networkInterfaces: Object.keys(networkInterfaces).length,
    health: getSystemHealth(memoryUsage, cpuUsage),
    timestamp: new Date().toISOString()
  };

  // Store in historical data
  storeHistoricalData({
    cpuUsage,
    memoryUsage: parseFloat(memoryUsage.toFixed(2)),
    loadAvg: parseFloat(loadAvg[0].toFixed(2))
  });

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
  console.log(`  - GET /api/system/load`);
  console.log(`  - GET /api/system/disk`);
  console.log(`  - GET /api/system/network`);
  console.log(`  - GET /api/system/health`);
  console.log(`  - GET /api/system/history`);
  console.log(`  - GET /api/system/all`);
});
