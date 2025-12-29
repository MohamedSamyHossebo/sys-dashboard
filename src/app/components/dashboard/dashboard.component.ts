import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';

import { SystemService, AllSystemStats } from '../../services/system.service';
import { HeaderComponent } from '../header/header.component';
import { MetricsSummaryComponent } from '../metrics-summary/metrics-summary.component';

// PrimeNG UI Modules
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';

export interface WidgetConfig {
    id: string;
    name: string;
    visible: boolean;
}

@Component({
    selector: 'app-dashboard',
    imports: [
        CommonModule,
        CardModule,
        ChartModule,
        ProgressBarModule,
        TagModule,
        PanelModule,
        ButtonModule,
        SkeletonModule,
        TableModule,
        MessageModule,
        DialogModule,
        CheckboxModule,
        FormsModule,
        HeaderComponent,
        MetricsSummaryComponent
    ],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
    private systemService = inject(SystemService);
    private subscription?: Subscription;

    isDarkMode = signal<boolean>(document.body.classList.contains('dark-mode'));
    stats = signal<AllSystemStats | null>(null);
    isLoading = signal<boolean>(true);
    error = signal<string | null>(null);

    // Widget Management
    showSettings = signal<boolean>(false);
    widgetSettings = signal<WidgetConfig[]>([
        { id: 'cpu-history', name: 'CPU Usage History', visible: true },
        { id: 'mem-history', name: 'Memory Usage History', visible: true },
        { id: 'mem-dist', name: 'Memory Distribution', visible: true },
        { id: 'processes', name: 'System Processes', visible: true },
        { id: 'uptime', name: 'System Uptime', visible: true }
    ]);

    // Computed values
    memoryChartData = computed(() => {
        const currentStats = this.stats();
        if (!currentStats) return null;

        return {
            labels: ['Used Memory', 'Free Memory'],
            datasets: [
                {
                    data: [
                        parseFloat(currentStats.memory.usedGB),
                        parseFloat(currentStats.memory.freeGB)
                    ],
                    backgroundColor: ['#FF6384', '#36A2EB'],
                    hoverBackgroundColor: ['#FF6384', '#36A2EB']
                }
            ]
        };
    });

    memoryChartOptions = computed(() => {
        const isDark = this.isDarkMode();
        const textColor = isDark ? '#e2e8f0' : '#1e293b';

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        padding: 20,
                        font: { size: 12, weight: 'bold' }
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    titleColor: isDark ? '#fff' : '#1e293b',
                    bodyColor: isDark ? '#e2e8f0' : '#475569',
                    borderColor: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: (context: any) => `${context.label}: ${context.parsed} GB`
                    }
                }
            }
        };
    });

    cpuHistoryChartData = computed(() => {
        const currentStats = this.stats();
        if (!currentStats || !currentStats.history) return null;

        const labels = currentStats.history.map((p: any) => new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        const data = currentStats.history.map((p: any) => p.cpuUsage);

        return {
            labels: labels,
            datasets: [
                {
                    label: 'CPU Usage (%)',
                    data: data,
                    fill: true,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6
                }
            ]
        };
    });

    cpuHistoryChartOptions = computed(() => {
        const isDark = this.isDarkMode();
        const textColor = isDark ? '#e2e8f0' : '#1e293b';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    titleColor: isDark ? '#fff' : '#1e293b',
                    bodyColor: isDark ? '#e2e8f0' : '#475569',
                    borderColor: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: { display: false },
                y: {
                    min: 0,
                    max: 100,
                    ticks: {
                        color: textColor,
                        stepSize: 20,
                        callback: (value: any) => value + '%'
                    },
                    grid: { color: gridColor }
                }
            }
        };
    });

    memoryHistoryChartData = computed(() => {
        const currentStats = this.stats();
        if (!currentStats || !currentStats.history) return null;

        const labels = currentStats.history.map((p: any) => new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        const data = currentStats.history.map((p: any) => p.memoryUsage);

        return {
            labels: labels,
            datasets: [
                {
                    label: 'Memory Usage (%)',
                    data: data,
                    fill: true,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6
                }
            ]
        };
    });

    memoryHistoryChartOptions = computed(() => {
        const isDark = this.isDarkMode();
        const textColor = isDark ? '#e2e8f0' : '#1e293b';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    titleColor: isDark ? '#fff' : '#1e293b',
                    bodyColor: isDark ? '#e2e8f0' : '#475569',
                    borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: { display: false },
                y: {
                    min: 0,
                    max: 100,
                    ticks: {
                        color: textColor,
                        stepSize: 20,
                        callback: (value: any) => value + '%'
                    },
                    grid: { color: gridColor }
                }
            }
        };
    });

    alerts = computed(() => {
        const currentStats = this.stats();
        if (!currentStats) return [];

        const activeAlerts: { severity: "error" | "warn" | "info" | "success" | "secondary" | "contrast"; summary: string; detail: string }[] = [];
        const cpuUsage = currentStats.cpu?.usage ?? 0;
        if (cpuUsage > 90) activeAlerts.push({ severity: 'error', summary: 'High CPU Usage', detail: `CPU is at ${cpuUsage}%` });
        else if (cpuUsage > 75) activeAlerts.push({ severity: 'warn', summary: 'Moderate CPU Load', detail: `CPU is at ${cpuUsage}%` });

        const memUsage = parseFloat(currentStats.memory.usedPercentage);
        if (memUsage > 90) activeAlerts.push({ severity: 'error', summary: 'High Memory Usage', detail: `Memory is at ${memUsage}%` });
        else if (memUsage > 80) activeAlerts.push({ severity: 'warn', summary: 'Memory Pressure', detail: `Memory is at ${memUsage}%` });

        if (currentStats.disk && parseFloat(currentStats.disk.usedPercentage) > 90) {
            activeAlerts.push({ severity: 'error', summary: 'Low Disk Space', detail: `Disk is ${currentStats.disk.usedPercentage}% full` });
        }

        return activeAlerts;
    });

    uptimeFormatted = computed(() => {
        const currentStats = this.stats();
        if (!currentStats) return 'N/A';

        const { days, hours, minutes, seconds } = currentStats.uptime.formatted;
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    });

    ngOnInit(): void {
        this.loadWidgetSettings();
        this.loadStats();
        this.startPolling();
    }

    loadWidgetSettings(): void {
        const saved = localStorage.getItem('dashboard_widgets');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Merge with default to ensure new widgets are included if added in code later
                const merged = this.widgetSettings().map(w => {
                    const match = parsed.find((p: any) => p.id === w.id);
                    return match ? { ...w, visible: match.visible } : w;
                });
                this.widgetSettings.set(merged);
            } catch (e) {
                console.error('Failed to load widget settings', e);
            }
        }
    }

    saveWidgetSettings(): void {
        localStorage.setItem('dashboard_widgets', JSON.stringify(this.widgetSettings()));
    }

    isWidgetVisible(id: string): boolean {
        return this.widgetSettings().find(w => w.id === id)?.visible ?? true;
    }

    toggleSettings(): void {
        this.showSettings.update(v => !v);
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    loadStats(): void {
        this.isLoading.set(true);
        this.systemService.getAllStats().subscribe({
            next: (data) => {
                this.stats.set(data);
                this.isLoading.set(false);
                this.error.set(null);
            },
            error: (err) => {
                this.error.set('Failed to load system statistics');
                this.isLoading.set(false);
                console.error('Error loading stats:', err);
            }
        });
    }

    startPolling(): void {
        this.subscription = this.systemService.pollStats(5000).subscribe({
            next: (data) => {
                this.stats.set(data);
                this.error.set(null);
            },
            error: (err) => {
                this.error.set('Connection lost');
                console.error('Polling error:', err);
            }
        });
    }

    refresh(): void {
        this.loadStats();
    }

    getMemoryUsageSeverity(): 'success' | 'info' | 'warn' | 'danger' {
        const currentStats = this.stats();
        if (!currentStats) return 'info';

        const usage = parseFloat(currentStats.memory.usedPercentage);
        if (usage < 50) return 'success';
        if (usage < 75) return 'info';
        if (usage < 90) return 'warn';
        return 'danger';
    }

    getMemoryUsageColor(): string {
        const currentStats = this.stats();
        if (!currentStats) return '#3B82F6';

        const usage = parseFloat(currentStats.memory.usedPercentage);
        if (usage < 50) return '#22C55E'; // success - green
        if (usage < 75) return '#3B82F6'; // info - blue
        if (usage < 90) return '#F59E0B'; // warn - orange
        return '#EF4444'; // danger - red
    }

    // Header event handlers
    onRefreshRateChange(rate: number): void {
        this.systemService.setRefreshRate(rate);
        this.ngOnDestroy(); // Clean up old subscription
        this.startPolling(); // Start with new rate
    }

    onDarkModeToggle(enabled: boolean): void {
        this.isDarkMode.set(enabled);
        document.body.classList.toggle('dark-mode', enabled);
    }
}
