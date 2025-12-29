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

import { SystemService, AllSystemStats } from '../../services/system.service';
import { HeaderComponent } from '../header/header.component';
import { MetricsSummaryComponent } from '../metrics-summary/metrics-summary.component';

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
        HeaderComponent,
        MetricsSummaryComponent
    ],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
    private systemService = inject(SystemService);
    private subscription?: Subscription;

    stats = signal<AllSystemStats | null>(null);
    isLoading = signal<boolean>(true);
    error = signal<string | null>(null);

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

    memoryChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#fff'
                }
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        return `${context.label}: ${context.parsed} GB`;
                    }
                }
            }
        }
    };

    uptimeFormatted = computed(() => {
        const currentStats = this.stats();
        if (!currentStats) return 'N/A';

        const { days, hours, minutes, seconds } = currentStats.uptime.formatted;
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    });

    ngOnInit(): void {
        this.loadStats();
        this.startPolling();
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
        document.body.classList.toggle('dark-mode', enabled);
    }
}
