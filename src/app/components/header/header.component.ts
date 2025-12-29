import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG Imports
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-header',
    imports: [
        CommonModule,
        FormsModule,
        ToolbarModule,
        ButtonModule,
        BadgeModule,
        SelectButtonModule,
        ToggleSwitchModule
    ],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css']
})
export class HeaderComponent {
    // Inputs
    systemHealth = input<number>(100);
    lastUpdate = input<string>('');
    isLoading = input<boolean>(false);

    // Outputs
    refresh = output<void>();
    refreshRateChange = output<number>();
    darkModeToggle = output<boolean>();

    // Local state
    selectedRefreshRate = 5000;
    isDarkMode = false;

    refreshRateOptions = [
        { label: '2s', value: 2000 },
        { label: '5s', value: 5000 },
        { label: '10s', value: 10000 },
        { label: '30s', value: 30000 }
    ];

    // Computed health status
    healthStatus = computed(() => {
        const health = this.systemHealth();
        if (health >= 85) return { label: 'Excellent', severity: 'success' };
        if (health >= 70) return { label: 'Good', severity: 'info' };
        if (health >= 50) return { label: 'Warning', severity: 'warn' };
        return { label: 'Critical', severity: 'danger' };
    });

    onRefresh(): void {
        this.refresh.emit();
    }

    onRefreshRateChange(): void {
        this.refreshRateChange.emit(this.selectedRefreshRate);
    }

    onDarkModeToggle(): void {
        this.darkModeToggle.emit(this.isDarkMode);
    }
}
