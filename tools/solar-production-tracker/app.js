// Solar Production Tracker Application
// Handles CSV parsing, data persistence, calculations, and visualization

class SolarTracker {
    constructor() {
        this.data = this.loadData();
        this.chart = null;
        this.initializeUI();
        this.attachEventListeners();
        this.updateDisplay();
    }

    // Load data from localStorage
    loadData() {
        const saved = localStorage.getItem('solarProductionData');
        const defaults = {
            dailyProduction: {}, // { 'YYYY-MM-DD': kWh }
            startingRate: 0.15,
            rateChanges: [], // [{ date: 'YYYY-MM-DD', rate: 0.xx }]
            lastImportDate: null
        };
        
        if (saved) {
            const parsed = JSON.parse(saved);
            return { ...defaults, ...parsed };
        }
        return defaults;
    }

    // Save data to localStorage
    saveData() {
        localStorage.setItem('solarProductionData', JSON.stringify(this.data));
    }

    // Initialize UI with saved data
    initializeUI() {
        document.getElementById('startingRate').value = this.data.startingRate || 0.15;
        this.renderRateChanges();
        this.updateDataSummary();
    }

    // Attach event listeners
    attachEventListeners() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');

        // File drop events
        dropZone.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.csv')) {
                this.processFile(file);
            }
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processFile(file);
            }
        });

        // Clear data button
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all solar data? This cannot be undone.')) {
                this.data.dailyProduction = {};
                this.data.lastImportDate = null;
                this.saveData();
                this.updateDisplay();
                document.getElementById('fileInfo').classList.add('hidden');
            }
        });

        // Starting rate input
        document.getElementById('startingRate').addEventListener('input', (e) => {
            this.data.startingRate = parseFloat(e.target.value) || 0;
            this.saveData();
            this.updateDisplay();
        });

        // Add rate change button
        document.getElementById('addRateChange').addEventListener('click', () => {
            this.addRateChange();
        });

        // View mode change
        document.getElementById('viewMode').addEventListener('change', () => {
            this.updateChart();
        });

        // Reset zoom button - rebuild chart with proper aggregation for full view
        document.getElementById('resetZoom').addEventListener('click', () => {
            if (this.chart) {
                this.updateChart(); // Rebuild with correct aggregation for full data
            }
        });
    }

    // Process uploaded CSV file
    processFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            this.parseCSV(content);
            
            // Show file info
            document.getElementById('fileName').textContent = file.name;
            document.getElementById('fileInfo').classList.remove('hidden');
        };
        reader.readAsText(file);
    }

    // Parse CSV content from Sunny Boy inverter format
    parseCSV(content) {
        const lines = content.split(/\r?\n/);
        const dailyReadings = {};
        
        // Find the data start line (after headers)
        let dataStartIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(/^\d{2}\.\d{2}\.\d{4}/)) {
                dataStartIndex = i;
                break;
            }
        }

        // Parse each data line
        for (let i = dataStartIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(',');
            if (parts.length < 2) continue;

            // Parse date (DD.MM.YYYY HH:mm:ss format)
            const dateTimeMatch = parts[0].match(/(\d{2})\.(\d{2})\.(\d{4})/);
            if (!dateTimeMatch) continue;

            const [, day, month, year] = dateTimeMatch;
            const dateKey = `${year}-${month}-${day}`;

            // Get the cumulative Wh value (first numeric column after date)
            const whValue = parseFloat(parts[1]);
            if (isNaN(whValue) || parts[1] === 'NaN') continue;

            // Store the last reading for each day
            dailyReadings[dateKey] = whValue;
        }

        // Convert cumulative readings to daily production
        const sortedDates = Object.keys(dailyReadings).sort();
        const newDailyProduction = {};

        for (let i = 1; i < sortedDates.length; i++) {
            const currentDate = sortedDates[i];
            const previousDate = sortedDates[i - 1];
            const dailyWh = dailyReadings[currentDate] - dailyReadings[previousDate];
            
            // Convert Wh to kWh and only store positive values
            if (dailyWh > 0) {
                const dailyKwh = dailyWh / 1000;
                newDailyProduction[currentDate] = dailyKwh;
            }
        }

        // Merge with existing data (newer data overwrites older for same dates)
        this.data.dailyProduction = {
            ...this.data.dailyProduction,
            ...newDailyProduction
        };
        
        this.data.lastImportDate = new Date().toISOString();
        this.saveData();
        this.updateDisplay();

        // Show success message
        const newDays = Object.keys(newDailyProduction).length;
        alert(`Successfully imported ${newDays} days of production data.`);
    }

    // Get the electricity rate for a specific date
    getRateForDate(dateStr) {
        // Sort rate changes by date
        const sortedChanges = [...this.data.rateChanges].sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );

        let rate = this.data.startingRate;
        const targetDate = new Date(dateStr);

        for (const change of sortedChanges) {
            if (new Date(change.date) <= targetDate) {
                rate = change.rate;
            } else {
                break;
            }
        }

        return rate;
    }

    // Calculate total savings
    calculateTotalSavings() {
        let totalSavings = 0;
        for (const [date, kwh] of Object.entries(this.data.dailyProduction)) {
            const rate = this.getRateForDate(date);
            totalSavings += kwh * rate;
        }
        return totalSavings;
    }

    // Calculate total production
    calculateTotalProduction() {
        return Object.values(this.data.dailyProduction).reduce((sum, kwh) => sum + kwh, 0);
    }

    // Get monthly aggregated data
    getMonthlyData() {
        const monthlyData = {};
        
        for (const [date, kwh] of Object.entries(this.data.dailyProduction)) {
            const monthKey = date.substring(0, 7); // YYYY-MM
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { production: 0, savings: 0, days: 0, totalRate: 0 };
            }
            const rate = this.getRateForDate(date);
            monthlyData[monthKey].production += kwh;
            monthlyData[monthKey].savings += kwh * rate;
            monthlyData[monthKey].totalRate += rate;
            monthlyData[monthKey].days += 1;
        }

        // Calculate average rate for each month
        for (const month of Object.keys(monthlyData)) {
            monthlyData[month].avgRate = monthlyData[month].totalRate / monthlyData[month].days;
        }

        return monthlyData;
    }

    // Get yearly aggregated data
    getYearlyData() {
        const yearlyData = {};
        
        for (const [date, kwh] of Object.entries(this.data.dailyProduction)) {
            const yearKey = date.substring(0, 4); // YYYY
            if (!yearlyData[yearKey]) {
                yearlyData[yearKey] = { production: 0, savings: 0 };
            }
            const rate = this.getRateForDate(date);
            yearlyData[yearKey].production += kwh;
            yearlyData[yearKey].savings += kwh * rate;
        }

        return yearlyData;
    }

    // Add a rate change entry
    addRateChange() {
        const today = new Date().toISOString().split('T')[0];
        this.data.rateChanges.push({
            id: Date.now(),
            date: today,
            rate: this.data.startingRate
        });
        this.saveData();
        this.renderRateChanges();
    }

    // Remove a rate change entry
    removeRateChange(id) {
        this.data.rateChanges = this.data.rateChanges.filter(rc => rc.id !== id);
        this.saveData();
        this.renderRateChanges();
        this.updateDisplay();
    }

    // Render rate changes list
    renderRateChanges() {
        const container = document.getElementById('rateChangesList');
        container.innerHTML = '';

        const sortedChanges = [...this.data.rateChanges].sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );

        for (const change of sortedChanges) {
            const div = document.createElement('div');
            div.className = 'flex items-center gap-2 bg-gray-50 p-2 rounded-md';
            div.innerHTML = `
                <input type="date" value="${change.date}" 
                    class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    data-id="${change.id}" data-field="date">
                <span class="text-gray-500">$</span>
                <input type="number" value="${change.rate}" step="0.01" 
                    class="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    data-id="${change.id}" data-field="rate">
                <button class="text-red-600 hover:text-red-800 p-1" data-remove="${change.id}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            `;
            container.appendChild(div);

            // Attach event listeners
            div.querySelector('[data-field="date"]').addEventListener('change', (e) => {
                const rc = this.data.rateChanges.find(r => r.id === change.id);
                if (rc) {
                    rc.date = e.target.value;
                    this.saveData();
                    this.updateDisplay();
                }
            });

            div.querySelector('[data-field="rate"]').addEventListener('input', (e) => {
                const rc = this.data.rateChanges.find(r => r.id === change.id);
                if (rc) {
                    rc.rate = parseFloat(e.target.value) || 0;
                    this.saveData();
                    this.updateDisplay();
                }
            });

            div.querySelector('[data-remove]').addEventListener('click', () => {
                this.removeRateChange(change.id);
            });
        }
    }

    // Update data summary
    updateDataSummary() {
        const container = document.getElementById('dataSummary');
        const dates = Object.keys(this.data.dailyProduction).sort();
        
        if (dates.length === 0) {
            container.innerHTML = '<p>No data loaded</p>';
            return;
        }

        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];
        const totalDays = dates.length;

        container.innerHTML = `
            <p><strong>Date Range:</strong> ${this.formatDate(firstDate)} - ${this.formatDate(lastDate)}</p>
            <p><strong>Days with Data:</strong> ${totalDays}</p>
            <p><strong>Rate Changes:</strong> ${this.data.rateChanges.length}</p>
            ${this.data.lastImportDate ? `<p><strong>Last Import:</strong> ${new Date(this.data.lastImportDate).toLocaleString()}</p>` : ''}
        `;
    }

    // Format date for display
    formatDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    // Format month for display
    formatMonth(monthStr) {
        const [year, month] = monthStr.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }

    // Update all display elements
    updateDisplay() {
        this.updateStats();
        this.updateDataSummary();
        this.updateChart();
        this.updateMonthlyBreakdown();
    }

    // Update stats cards
    updateStats() {
        const totalProduction = this.calculateTotalProduction();
        const totalSavings = this.calculateTotalSavings();
        const days = Object.keys(this.data.dailyProduction).length;
        
        document.getElementById('totalProduction').textContent = `${totalProduction.toFixed(1)} kWh`;
        document.getElementById('totalSavings').textContent = `$${totalSavings.toFixed(2)}`;
        
        if (days > 0) {
            document.getElementById('avgDaily').textContent = `${(totalProduction / days).toFixed(1)} kWh`;
            document.getElementById('avgDailySavings').textContent = `$${(totalSavings / days).toFixed(2)}`;
        } else {
            document.getElementById('avgDaily').textContent = '0 kWh';
            document.getElementById('avgDailySavings').textContent = '$0.00';
        }
    }

    // Get raw daily data sorted by date
    getRawDailyData() {
        const sortedDates = Object.keys(this.data.dailyProduction).sort();
        return sortedDates.map(d => ({
            date: d,
            production: this.data.dailyProduction[d],
            savings: this.data.dailyProduction[d] * this.getRateForDate(d)
        }));
    }

    // Aggregate daily data into groups of N days
    aggregateByDays(data, daysPerGroup) {
        if (daysPerGroup <= 1 || data.length === 0) return data;
        
        const aggregated = [];
        for (let i = 0; i < data.length; i += daysPerGroup) {
            const group = data.slice(i, Math.min(i + daysPerGroup, data.length));
            const startDate = group[0].date;
            const endDate = group[group.length - 1].date;
            const totalProduction = group.reduce((sum, d) => sum + d.production, 0);
            const totalSavings = group.reduce((sum, d) => sum + d.savings, 0);
            
            aggregated.push({
                startDate,
                endDate,
                production: totalProduction,
                savings: totalSavings,
                days: group.length
            });
        }
        return aggregated;
    }

    // Format date range for aggregated groups
    formatDateRange(startDate, endDate, days) {
        if (days === 1) {
            return this.formatDate(startDate);
        }
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
        const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${startStr} - ${endStr}`;
    }

    // Get weekly aggregated data
    getWeeklyData() {
        const rawData = this.getRawDailyData();
        return this.aggregateByDays(rawData, 7);
    }

    // Update the chart
    updateChart() {
        const ctx = document.getElementById('productionChart').getContext('2d');
        const viewMode = document.getElementById('viewMode').value;
        const self = this;

        let labels, productionData, savingsData, tooltipData;

        if (viewMode === 'daily') {
            const rawData = this.getRawDailyData();
            labels = rawData.map(d => this.formatDate(d.date));
            productionData = rawData.map(d => d.production);
            savingsData = rawData.map(d => d.savings);
            tooltipData = rawData.map(d => ({ ...d, days: 1 }));
        } else if (viewMode === 'weekly') {
            const weeklyData = this.getWeeklyData();
            labels = weeklyData.map(d => this.formatDateRange(d.startDate, d.endDate, d.days));
            productionData = weeklyData.map(d => d.production);
            savingsData = weeklyData.map(d => d.savings);
            tooltipData = weeklyData;
        } else if (viewMode === 'monthly') {
            const monthlyData = this.getMonthlyData();
            const sortedMonths = Object.keys(monthlyData).sort();
            labels = sortedMonths.map(m => this.formatMonth(m));
            productionData = sortedMonths.map(m => monthlyData[m].production);
            savingsData = sortedMonths.map(m => monthlyData[m].savings);
            tooltipData = sortedMonths.map(m => ({ ...monthlyData[m], days: monthlyData[m].days }));
        } else { // yearly
            const yearlyData = this.getYearlyData();
            const sortedYears = Object.keys(yearlyData).sort();
            labels = sortedYears;
            productionData = sortedYears.map(y => yearlyData[y].production);
            savingsData = sortedYears.map(y => yearlyData[y].savings);
            tooltipData = null;
        }

        if (this.chart) {
            this.chart.destroy();
        }

        // Store tooltip data for dynamic updates
        this.currentTooltipData = tooltipData;

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Energy Production (kWh)',
                    data: productionData,
                    backgroundColor: 'rgba(34, 197, 94, 0.7)',
                    borderColor: 'rgb(34, 197, 94)',
                    borderWidth: 1,
                    yAxisID: 'y'
                }, {
                    label: 'Cost Savings ($)',
                    data: savingsData,
                    type: 'line',
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    const tooltipInfo = self.currentTooltipData?.[context.dataIndex];
                                    const days = tooltipInfo?.days;
                                    const daysStr = days && days > 1 ? ` (${days} days)` : '';
                                    return `Production: ${context.parsed.y.toFixed(2)} kWh${daysStr}`;
                                } else {
                                    return `Savings: $${context.parsed.y.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                                speed: 0.05,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x',
                        },
                        limits: {
                            x: { minRange: 5 }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            autoSkip: true,
                            maxTicksLimit: 20
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Energy (kWh)'
                        },
                        beginAtZero: true
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Savings ($)'
                        },
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }

    // Update monthly breakdown table
    updateMonthlyBreakdown() {
        const tbody = document.getElementById('monthlyBreakdown');
        const monthlyData = this.getMonthlyData();
        const sortedMonths = Object.keys(monthlyData).sort().reverse(); // Most recent first

        if (sortedMonths.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-3 text-center text-gray-500">No data available</td></tr>';
            return;
        }

        tbody.innerHTML = sortedMonths.map(month => {
            const data = monthlyData[month];
            return `
                <tr>
                    <td class="px-4 py-3 text-sm text-gray-900">${this.formatMonth(month)}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 text-right">${data.production.toFixed(1)}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 text-right">$${data.avgRate.toFixed(3)}</td>
                    <td class="px-4 py-3 text-sm text-green-600 font-medium text-right">$${data.savings.toFixed(2)}</td>
                </tr>
            `;
        }).join('');
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SolarTracker();
});
