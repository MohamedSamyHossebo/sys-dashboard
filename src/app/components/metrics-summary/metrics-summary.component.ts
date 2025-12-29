import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

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
export class MetricsSummaryComponent {
    private systemService = inject(SystemService);


    // Chart options for sparklines
    sparklineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
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
        const stats = this.systemService.systemStats();
        if (!stats || !stats.history || stats.history.length === 0) return null;

        const history = stats.history;

        return {
            labels: history.map((_, i) => i),
            datasets: [{
                data: history.map(d => d.cpuUsage),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true
            }]
        };
    });

    // Memory Sparkline chart data
    memoryChartData = computed(() => {
        const stats = this.systemService.systemStats();
        if (!stats || !stats.history || stats.history.length === 0) return null;

        const history = stats.history;

        return {
            labels: history.map((_, i) => i),
            datasets: [{
                data: history.map(d => d.memoryUsage),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true
            }]
        };
    });


    // Inputs
    cpuCores = input<number>(0);
    memoryUsage = input<string>('0');
    diskUsage = input<string>('0');
    uptime = input<string>('');
    networkCount = input<number>(0);
    health = input<number>(100);
}
