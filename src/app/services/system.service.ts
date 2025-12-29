import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

export interface SystemInfo {
    platform: string;
    type: string;
    release: string;
    hostname: string;
    architecture: string;
    homeDirectory: string;
}

export interface CpuInfo {
    model: string;
    cores: number;
    speed: number;
    usage?: number;
}

export interface MemoryInfo {
    total: number;
    free: number;
    used: number;
    usedPercentage: string;
    totalGB: string;
    freeGB: string;
    usedGB: string;
}

export interface UptimeInfo {
    seconds: number;
    formatted: {
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    };
}

export interface LoadAverage {
    '1min': string;
    '5min': string;
    '15min': string;
}

export interface DiskInfo {
    total: number;
    used: number;
    free: number;
    usedPercentage: string;
    totalGB: string;
    usedGB: string;
    freeGB: string;
    note?: string;
}

export interface NetworkInterface {
    name: string;
    address: string;
    netmask: string;
    family: string;
    mac: string;
    internal: boolean;
    cidr: string;
}

export interface NetworkInfo {
    interfaces: NetworkInterface[];
    count: number;
}

export interface SystemHealth {
    score: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    metrics: {
        memoryUsage: string;
        cpuUsage: number;
    };
}

export interface HistoricalDataPoint {
    cpuUsage: number;
    memoryUsage: number;
    loadAvg: number;
    timestamp: string;
}

export interface HistoricalData {
    data: HistoricalDataPoint[];
    count: number;
    maxPoints: number;
}

export interface ProcessInfo {
    pid: number;
    name: string;
    cpu: string;
    mem: string;
    status: string;
    user: string;
}

export interface AllSystemStats {
    systemInfo: SystemInfo;
    cpu: CpuInfo;
    memory: MemoryInfo;
    uptime: UptimeInfo;
    loadAverage: LoadAverage;
    networkInterfaces: number;
    health: number;
    disk: {
        totalGB: string;
        usedGB: string;
        freeGB: string;
        usedPercentage: string;
    } | null;
    history: HistoricalDataPoint[];
    processes?: Partial<ProcessInfo>[];
    timestamp: string;
}

@Injectable({
    providedIn: 'root'
})
export class SystemService {
    private http = inject(HttpClient);
    private baseUrl = '/api/system';

    // Signals for reactive state
    systemStats = signal<AllSystemStats | null>(null);
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);
    refreshRate = signal<number>(5000); // Default 5 seconds

    getSystemInfo(): Observable<SystemInfo> {
        return this.http.get<SystemInfo>(`${this.baseUrl}/info`);
    }

    getCpuInfo(): Observable<CpuInfo> {
        return this.http.get<CpuInfo>(`${this.baseUrl}/cpu`);
    }

    getMemoryInfo(): Observable<MemoryInfo> {
        return this.http.get<MemoryInfo>(`${this.baseUrl}/memory`);
    }

    getUptimeInfo(): Observable<UptimeInfo> {
        return this.http.get<UptimeInfo>(`${this.baseUrl}/uptime`);
    }

    getLoadAverage(): Observable<{ average: LoadAverage; cores: number }> {
        return this.http.get<{ average: LoadAverage; cores: number }>(`${this.baseUrl}/load`);
    }

    getDiskInfo(): Observable<DiskInfo> {
        return this.http.get<DiskInfo>(`${this.baseUrl}/disk`);
    }

    getNetworkInfo(): Observable<NetworkInfo> {
        return this.http.get<NetworkInfo>(`${this.baseUrl}/network`);
    }

    getSystemHealth(): Observable<SystemHealth> {
        return this.http.get<SystemHealth>(`${this.baseUrl}/health`);
    }

    getHistoricalData(): Observable<HistoricalData> {
        return this.http.get<HistoricalData>(`${this.baseUrl}/history`);
    }

    getProcesses(): Observable<ProcessInfo[]> {
        return this.http.get<ProcessInfo[]>(`${this.baseUrl}/processes`);
    }

    getAllStats(): Observable<AllSystemStats> {
        return this.http.get<AllSystemStats>(`${this.baseUrl}/all`);
    }

    // Poll for stats with configurable interval
    pollStats(intervalMs?: number): Observable<AllSystemStats> {
        const interval$ = intervalMs ?? this.refreshRate();
        return interval(interval$).pipe(
            startWith(0),
            switchMap(() => this.getAllStats())
        );
    }

    // Fetch stats once and update signal
    fetchStats(): void {
        this.isLoading.set(true);
        this.error.set(null);

        this.getAllStats().subscribe({
            next: (stats) => {
                this.systemStats.set(stats);
                this.isLoading.set(false);
            },
            error: (err) => {
                this.error.set('Failed to fetch system stats');
                this.isLoading.set(false);
                console.error('Error fetching system stats:', err);
            }
        });
    }

    // Set refresh rate
    setRefreshRate(ms: number): void {
        this.refreshRate.set(ms);
    }
}
