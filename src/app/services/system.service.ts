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

export interface AllSystemStats {
    systemInfo: SystemInfo;
    cpu: CpuInfo;
    memory: MemoryInfo;
    uptime: UptimeInfo;
    networkInterfaces: number;
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

    getNetworkInfo(): Observable<any> {
        return this.http.get(`${this.baseUrl}/network`);
    }

    getAllStats(): Observable<AllSystemStats> {
        return this.http.get<AllSystemStats>(`${this.baseUrl}/all`);
    }

    // Poll for stats every 5 seconds
    pollStats(intervalMs: number = 5000): Observable<AllSystemStats> {
        return interval(intervalMs).pipe(
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
}
