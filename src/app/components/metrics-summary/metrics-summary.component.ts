import { Component, input, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';

import { SystemService, HistoricalDataPoint } from '../../services/system.service';

@Component({
    selector: 'app-metrics-summary',
    imports: [CommonModule, CardModule, TagModule, ChartModule],
    templateUrl: './metrics-summary.component.html',
    styleUrls: ['./metrics-summary.component.css']
})
export class MetricsSummaryComponent implements OnInit, OnDestroy {
    private systemService = inject(SystemService);
    private subscription?: Subscription;

    // Historical data for sparklines
    historicalData: HistoricalDataPoint[] = [];

    // Chart options for sparklines
    sparklineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        },
        scales: {
            x: { display: false },
            y: { display: false }
        },
        elements: {
            line: {
                borderWidth: 2,
                tension: 0.4
            },
            point: { radius: 0 }
        }
    };

    // CPU Sparkline chart data
    cpuChartData = computed(() => {
        if (this.historicalData.length === 0) return null;

        return {
            labels: this.historicalData.map((_, i) => i),
            datasets: [{
                data: this.historicalData.map(d => d.cpuUsage),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true
            }]
        };
    });

    // Memory Sparkline chart data
    memoryChartData = computed(() => {
        if (this.historicalData.length === 0) return null;

        return {
            labels: this.historicalData.map((_, i) => i),
            datasets: [{
                data: this.historicalData.map(d => d.memoryUsage),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true
            }]
        };
    });

    ngOnInit(): void {
        this.loadHistoricalData();

        // Refresh every 5 seconds
        this.subscription = interval(5000).subscribe(() => {
            this.loadHistoricalData();
        });
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    loadHistoricalData(): void {
        this.systemService.getHistoricalData().subscribe({
            next: (data) => {
                this.historicalData = data.data;
            },
            error: (err) => console.error('Error loading historical data:', err)
        });
    }

    // Inputs
    cpuCores = input<number>(0);
    memoryUsage = input<string>('0');
    diskUsage = input<string>('0');
    uptime = input<string>('');
    networkCount = input<number>(0);
    health = input<number>(100);
}
