// ARM Loan Forecaster Application
// Handles all loan calculations, UI updates, and data persistence

class LoanCalculator {
    constructor() {
        this.data = this.loadData();
        this.chart = null;
        this.initializeUI();
        this.attachEventListeners();
        this.calculate();
    }

    // Initialize UI with saved or default data
    initializeUI() {
        // Set default start date if not exists
        if (!this.data.startDate) {
            this.data.startDate = new Date().toISOString().split('T')[0];
        }
        
        // Set default extra monthly start date to today
        if (!this.data.extraMonthlyStartDate) {
            this.data.extraMonthlyStartDate = new Date().toISOString().split('T')[0];
        }

        // Populate basic fields
        document.getElementById('startDate').value = this.data.startDate || '';
        document.getElementById('loanAmount').value = this.data.loanAmount || '';
        document.getElementById('startingRate').value = this.data.startingRate || '';
        document.getElementById('loanTerm').value = this.data.loanTerm || '';
        document.getElementById('extraMonthlyAmount').value = this.data.extraMonthlyAmount || '';
        document.getElementById('extraMonthlyStartDate').value = this.data.extraMonthlyStartDate || '';

        // Populate rate changes
        this.data.rateChanges = this.data.rateChanges || [];
        this.renderRateChanges();

        // Populate one-time payments
        this.data.oneTimePayments = this.data.oneTimePayments || [];
        this.renderOneTimePayments();
    }

    // Load data from localStorage
    loadData() {
        const saved = localStorage.getItem('armLoanData');
        return saved ? JSON.parse(saved) : {};
    }

    // Save data to localStorage
    saveData() {
        localStorage.setItem('armLoanData', JSON.stringify(this.data));
    }

    // Attach event listeners
    attachEventListeners() {
        // Basic inputs
        document.getElementById('startDate').addEventListener('change', (e) => {
            this.data.startDate = e.target.value;
            this.saveData();
            this.calculate();
        });

        document.getElementById('loanAmount').addEventListener('input', (e) => {
            this.data.loanAmount = parseFloat(e.target.value) || 0;
            this.saveData();
            this.calculate();
        });

        document.getElementById('startingRate').addEventListener('input', (e) => {
            this.data.startingRate = parseFloat(e.target.value) || 0;
            this.saveData();
            this.calculate();
        });

        document.getElementById('loanTerm').addEventListener('input', (e) => {
            this.data.loanTerm = parseFloat(e.target.value) || 0;
            this.saveData();
            this.calculate();
        });

        document.getElementById('extraMonthlyAmount').addEventListener('input', (e) => {
            this.data.extraMonthlyAmount = parseFloat(e.target.value) || 0;
            this.saveData();
            this.calculate();
        });

        document.getElementById('extraMonthlyStartDate').addEventListener('change', (e) => {
            this.data.extraMonthlyStartDate = e.target.value;
            this.saveData();
            this.calculate();
        });

        // Add rate change button
        document.getElementById('addRateChange').addEventListener('click', () => {
            this.addRateChange();
        });

        // Add one-time payment button
        document.getElementById('addOneTimePayment').addEventListener('click', () => {
            this.addOneTimePayment();
        });

        // Reset buttons
        document.getElementById('resetModifications').addEventListener('click', () => {
            this.resetModifications();
        });

        document.getElementById('resetAll').addEventListener('click', () => {
            this.resetAll();
        });
    }

    // Render rate changes list
    renderRateChanges() {
        const container = document.getElementById('rateChangesList');
        container.innerHTML = '';

        this.data.rateChanges.forEach((change, index) => {
            const div = document.createElement('div');
            div.className = 'flex gap-2 items-start p-3 bg-gray-50 rounded';
            div.innerHTML = `
                <div class="flex-1 space-y-2">
                    <input type="number" 
                           value="${change.yearsFromStart || ''}" 
                           placeholder="Years from start"
                           class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                           data-index="${index}"
                           data-field="yearsFromStart">
                    <input type="number" 
                           value="${change.newRate || ''}" 
                           placeholder="New rate %"
                           step="0.01"
                           class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                           data-index="${index}"
                           data-field="newRate">
                </div>
                <button class="text-red-600 hover:text-red-800 mt-1" data-index="${index}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            `;

            // Add event listeners for inputs
            div.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const idx = parseInt(e.target.dataset.index);
                    const field = e.target.dataset.field;
                    this.data.rateChanges[idx][field] = parseFloat(e.target.value) || 0;
                    this.saveData();
                    this.calculate();
                });
            });

            // Add event listener for delete button
            div.querySelector('button').addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                this.data.rateChanges.splice(idx, 1);
                this.saveData();
                this.renderRateChanges();
                this.calculate();
            });

            container.appendChild(div);
        });
    }

    // Add new rate change
    addRateChange() {
        this.data.rateChanges.push({ yearsFromStart: 0, newRate: 0 });
        this.saveData();
        this.renderRateChanges();
    }

    // Render one-time payments list
    renderOneTimePayments() {
        const container = document.getElementById('oneTimePaymentsList');
        container.innerHTML = '';

        this.data.oneTimePayments.forEach((payment, index) => {
            const div = document.createElement('div');
            div.className = 'flex gap-2 items-start p-3 bg-gray-50 rounded';
            div.innerHTML = `
                <div class="flex-1 space-y-2">
                    <input type="date" 
                           value="${payment.date || ''}" 
                           class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                           data-index="${index}"
                           data-field="date">
                    <input type="number" 
                           value="${payment.amount || ''}" 
                           placeholder="Amount $"
                           class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                           data-index="${index}"
                           data-field="amount">
                </div>
                <button class="text-red-600 hover:text-red-800 mt-1" data-index="${index}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            `;

            // Add event listeners for inputs
            div.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const idx = parseInt(e.target.dataset.index);
                    const field = e.target.dataset.field;
                    if (field === 'date') {
                        this.data.oneTimePayments[idx][field] = e.target.value;
                    } else {
                        this.data.oneTimePayments[idx][field] = parseFloat(e.target.value) || 0;
                    }
                    this.saveData();
                    this.calculate();
                });
            });

            // Add event listener for delete button
            div.querySelector('button').addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                this.data.oneTimePayments.splice(idx, 1);
                this.saveData();
                this.renderOneTimePayments();
                this.calculate();
            });

            container.appendChild(div);
        });
    }

    // Add new one-time payment
    addOneTimePayment() {
        const today = new Date().toISOString().split('T')[0];
        this.data.oneTimePayments.push({ date: today, amount: 0 });
        this.saveData();
        this.renderOneTimePayments();
    }

    // Reset modifications only (keep loan details)
    resetModifications() {
        this.data.oneTimePayments = [];
        this.data.extraMonthlyAmount = 0;
        this.data.extraMonthlyStartDate = new Date().toISOString().split('T')[0];
        
        document.getElementById('extraMonthlyAmount').value = '';
        document.getElementById('extraMonthlyStartDate').value = this.data.extraMonthlyStartDate;
        
        this.saveData();
        this.renderOneTimePayments();
        this.calculate();
    }

    // Reset everything
    resetAll() {
        if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
            this.data = {
                startDate: new Date().toISOString().split('T')[0],
                extraMonthlyStartDate: new Date().toISOString().split('T')[0]
            };
            this.saveData();
            this.initializeUI();
            this.calculate();
        }
    }

    // Calculate monthly payment for a given principal, rate, and term
    calculateMonthlyPayment(principal, annualRate, months) {
        if (annualRate === 0) {
            return principal / months;
        }
        const monthlyRate = annualRate / 100 / 12;
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
               (Math.pow(1 + monthlyRate, months) - 1);
    }

    // Get interest rate for a given month (0-indexed, so month 0 is the first payment)
    getInterestRateForMonth(month) {
        // month is 0-indexed (month 0 = payment #1, month 59 = payment #60)
        // Rate change at "5 years" means it takes effect starting at payment #60 (month index 59)
        const paymentNumber = month + 1;
        
        // Sort rate changes by years
        const sortedChanges = [...(this.data.rateChanges || [])]
            .filter(c => c.yearsFromStart && c.newRate)
            .sort((a, b) => a.yearsFromStart - b.yearsFromStart);

        // Find applicable rate
        let currentRate = this.data.startingRate || 0;
        for (const change of sortedChanges) {
            // Rate change at year X means it applies starting at payment (X * 12)
            // e.g., year 5 = starting at payment 60
            const changeAtPayment = change.yearsFromStart * 12;
            if (paymentNumber >= changeAtPayment) {
                currentRate = change.newRate;
            } else {
                break;
            }
        }

        return currentRate;
    }

    // Main calculation function
    calculate() {
        // Validate inputs
        if (!this.data.loanAmount || !this.data.startingRate || !this.data.loanTerm || !this.data.startDate) {
            this.clearOutputs();
            return;
        }

        const totalMonths = this.data.loanTerm * 12;
        const startDate = new Date(this.data.startDate);
        const extraStartDate = new Date(this.data.extraMonthlyStartDate || this.data.startDate);

        // Calculate original schedule (without modifications)
        const originalSchedule = this.calculateSchedule(
            this.data.loanAmount,
            totalMonths,
            startDate,
            [],
            0,
            null
        );

        // Calculate modified schedule (with one-time payments and extra monthly)
        const modifiedSchedule = this.calculateSchedule(
            this.data.loanAmount,
            totalMonths,
            startDate,
            this.data.oneTimePayments || [],
            this.data.extraMonthlyAmount || 0,
            extraStartDate
        );

        // Update UI
        this.updateOutputs(originalSchedule, modifiedSchedule);
        this.updateChart(originalSchedule, modifiedSchedule);
        this.updateAmortizationTable(modifiedSchedule);
    }

    // Calculate amortization schedule
    calculateSchedule(principal, totalMonths, startDate, oneTimePayments, extraMonthly, extraStartDate) {
        const schedule = [];
        let balance = principal;
        let totalInterestPaid = 0;
        let month = 0;
        let lastRate = -1;
        let currentMonthlyPayment = 0;

        while (balance > 0.01 && month < totalMonths * 2) { // Max 2x original term to prevent infinite loop
            const currentDate = new Date(startDate);
            currentDate.setMonth(currentDate.getMonth() + month);

            // Get current interest rate
            const currentRate = this.getInterestRateForMonth(month);
            const monthlyRate = currentRate / 100 / 12;

            // Check if we need to recalculate payment due to rate change
            const isRateChange = (month === 0 || currentRate !== lastRate);
            if (isRateChange) {
                // Recalculate payment to maintain original term end date
                const remainingMonths = totalMonths - month;
                currentMonthlyPayment = this.calculateMonthlyPayment(balance, currentRate, remainingMonths);
                lastRate = currentRate;
            }

            // Calculate interest for this period
            const interestPayment = balance * monthlyRate;

            // Calculate principal payment from regular payment
            let principalPayment = currentMonthlyPayment - interestPayment;

            // Add extra monthly payment if applicable
            let extraPayment = 0;
            if (extraMonthly && extraStartDate && currentDate >= extraStartDate) {
                extraPayment = extraMonthly;
            }

            // Check for one-time payments on this date
            const dateString = currentDate.toISOString().split('T')[0];
            const oneTimePayment = oneTimePayments
                .filter(p => p.date === dateString && p.amount > 0)
                .reduce((sum, p) => sum + p.amount, 0);

            extraPayment += oneTimePayment;

            // Total payment towards principal (extra payments go directly to principal)
            const totalPrincipalPayment = principalPayment + extraPayment;

            // Ensure we don't overpay
            if (totalPrincipalPayment >= balance) {
                // Final payment
                principalPayment = balance;
                const actualPayment = principalPayment + interestPayment;
                schedule.push({
                    month: month + 1,
                    date: new Date(currentDate),
                    payment: actualPayment,
                    principal: principalPayment,
                    interest: interestPayment,
                    extraPayment: 0, // Already included in the adjusted payment
                    balance: 0,
                    rate: currentRate,
                    isRateChange: isRateChange
                });
                totalInterestPaid += interestPayment;
                break;
            }

            balance -= totalPrincipalPayment;
            totalInterestPaid += interestPayment;

            schedule.push({
                month: month + 1,
                date: new Date(currentDate),
                payment: currentMonthlyPayment,
                principal: principalPayment,
                interest: interestPayment,
                extraPayment: extraPayment,
                balance: Math.max(0, balance),
                rate: currentRate,
                isRateChange: isRateChange
            });

            month++;
        }

        return {
            schedule: schedule,
            totalInterest: totalInterestPaid,
            totalPayments: schedule.reduce((sum, p) => sum + p.payment + p.extraPayment, 0),
            monthsToPayoff: schedule.length,
            finalDate: schedule.length > 0 ? schedule[schedule.length - 1].date : null
        };
    }

    // Helper to get the rate change month identifier
    getRateChangeMonthForMonth(month) {
        const yearsFromStart = month / 12;
        const sortedChanges = [...this.data.rateChanges]
            .filter(c => c.yearsFromStart && c.newRate)
            .sort((a, b) => a.yearsFromStart - b.yearsFromStart);

        for (let i = sortedChanges.length - 1; i >= 0; i--) {
            if (yearsFromStart >= sortedChanges[i].yearsFromStart) {
                return sortedChanges[i].yearsFromStart;
            }
        }
        return 0;
    }

    // Update output displays
    updateOutputs(original, modified) {
        const basePayment = modified.schedule.length > 0 ? modified.schedule[0].payment : 0;
        
        document.getElementById('monthlyPayment').textContent = this.formatCurrency(basePayment);
        document.getElementById('totalCost').textContent = this.formatCurrency(
            this.data.loanAmount + modified.totalInterest
        );
        document.getElementById('totalInterest').textContent = this.formatCurrency(modified.totalInterest);

        if (modified.finalDate) {
            document.getElementById('payoffDate').textContent = this.formatDate(modified.finalDate);
            const years = Math.floor(modified.monthsToPayoff / 12);
            const months = modified.monthsToPayoff % 12;
            document.getElementById('payoffTime').textContent = `${years} years, ${months} months`;
        } else {
            document.getElementById('payoffDate').textContent = '-';
            document.getElementById('payoffTime').textContent = '-';
        }

        // Show rate change summary
        this.updateRateChangeSummary(modified);

        // Show savings if there are modifications
        const hasModifications = (this.data.extraMonthlyAmount > 0) || 
                                 (this.data.oneTimePayments && this.data.oneTimePayments.length > 0);

        if (hasModifications && original.schedule.length > 0 && modified.schedule.length > 0) {
            const interestSaved = original.totalInterest - modified.totalInterest;
            const monthsSaved = original.monthsToPayoff - modified.monthsToPayoff;
            
            document.getElementById('savingsSection').classList.remove('hidden');
            document.getElementById('interestSaved').textContent = this.formatCurrency(Math.max(0, interestSaved));
            
            const yearsSaved = Math.floor(monthsSaved / 12);
            const monthsRemaining = monthsSaved % 12;
            let timeSavedText = '';
            if (yearsSaved > 0) {
                timeSavedText = `${yearsSaved} year${yearsSaved > 1 ? 's' : ''}`;
                if (monthsRemaining > 0) {
                    timeSavedText += `, ${monthsRemaining} month${monthsRemaining > 1 ? 's' : ''}`;
                }
            } else {
                timeSavedText = `${monthsSaved} month${monthsSaved > 1 ? 's' : ''}`;
            }
            document.getElementById('timeSaved').textContent = timeSavedText;
        } else {
            document.getElementById('savingsSection').classList.add('hidden');
        }
    }

    // Update rate change summary
    updateRateChangeSummary(modified) {
        const summaryContainer = document.getElementById('rateChangeSummaryContent');
        const summarySection = document.getElementById('rateChangeSummary');

        // Build a list of all rate periods
        const ratePeriods = [];
        
        // Add initial rate
        if (modified.schedule.length > 0) {
            const firstPayment = modified.schedule[0];
            ratePeriods.push({
                date: firstPayment.date,
                month: 1,
                rate: this.data.startingRate,
                payment: firstPayment.payment,
                isInitial: true
            });
        }

        // Add all rate changes from the schedule that are marked as rate changes
        const rateChangePayments = modified.schedule.filter(p => p.isRateChange && p.month > 1);
        
        rateChangePayments.forEach(payment => {
            ratePeriods.push({
                date: payment.date,
                month: payment.month,
                rate: payment.rate,
                payment: payment.payment,
                isInitial: false
            });
        });

        if (ratePeriods.length > 0) {
            summarySection.classList.remove('hidden');
            summaryContainer.innerHTML = '';

            ratePeriods.forEach((period, index) => {
                const div = document.createElement('div');
                const borderColor = period.isInitial ? 'border-green-500' : 'border-blue-500';
                const labelText = period.isInitial ? 'Starting Payment:' : 'New Payment:';
                
                div.className = `flex items-center justify-between p-3 bg-white rounded border-l-4 ${borderColor}`;
                div.innerHTML = `
                    <div>
                        <p class="text-sm font-semibold text-gray-900">
                            ${this.formatDate(period.date)} (Month ${period.month})
                            ${period.isInitial ? '<span class="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Initial</span>' : ''}
                        </p>
                        <p class="text-xs text-gray-600">Rate: ${period.rate.toFixed(2)}%</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-600">${labelText}</p>
                        <p class="text-lg font-bold ${period.isInitial ? 'text-green-900' : 'text-blue-900'}">${this.formatCurrency(period.payment)}</p>
                    </div>
                `;
                summaryContainer.appendChild(div);
            });
        } else {
            summarySection.classList.add('hidden');
        }
    }

    // Update chart
    updateChart(original, modified) {
        // Destroy existing chart first
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        const ctx = document.getElementById('loanChart');
        if (!ctx) return;

        // Prepare data - sample every N months for better performance
        const sampleRate = Math.max(1, Math.floor(Math.max(original.schedule.length, modified.schedule.length) / 200));
        
        const originalData = original.schedule
            .filter((_, i) => i % sampleRate === 0 || i === original.schedule.length - 1)
            .map(p => ({
                x: p.date.getTime(),
                y: p.balance
            }));

        const modifiedData = modified.schedule
            .filter((_, i) => i % sampleRate === 0 || i === modified.schedule.length - 1)
            .map(p => ({
                x: p.date.getTime(),
                y: p.balance
            }));

        this.chart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Original Loan',
                        data: originalData,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.1,
                        pointRadius: 0,
                        borderWidth: 2
                    },
                    {
                        label: 'Modified Loan',
                        data: modifiedData,
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.1,
                        pointRadius: 0,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            title: (tooltipItems) => {
                                const date = new Date(tooltipItems[0].parsed.x);
                                return this.formatDate(date);
                            },
                            label: (context) => {
                                return context.dataset.label + ': ' + this.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'year',
                            displayFormats: {
                                year: 'MMM-yyyy'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Balance ($)'
                        },
                        ticks: {
                            callback: (value) => {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // Update amortization table
    updateAmortizationTable(schedule) {
        const tbody = document.getElementById('amortizationTable');
        tbody.innerHTML = '';

        const totalPayments = schedule.schedule.length;
        let displaySchedule = [];

        if (totalPayments <= 60) {
            // For loans 5 years or less, show every month
            displaySchedule = schedule.schedule;
        } else if (totalPayments <= 120) {
            // For loans 5-10 years, show first 12, then every 6 months, then last 12
            const firstMonths = schedule.schedule.slice(0, 12);
            const lastMonths = schedule.schedule.slice(-12);
            const middleMonths = schedule.schedule.slice(12, -12).filter((_, i) => i % 6 === 5);
            const rateChangeMonths = schedule.schedule.filter(p => p.isRateChange && p.month > 12 && p.month < totalPayments - 12);
            
            const allMonths = [...firstMonths, ...rateChangeMonths, ...middleMonths, ...lastMonths];
            displaySchedule = Array.from(new Map(allMonths.map(p => [p.month, p])).values())
                .sort((a, b) => a.month - b.month);
        } else {
            // For loans over 10 years, show first year, then annually, then last year
            const firstYear = schedule.schedule.slice(0, 12);
            const lastYear = schedule.schedule.slice(-12);
            const middleMonths = schedule.schedule.slice(12, -12).filter((_, i) => (i + 1) % 12 === 0);
            const rateChangeMonths = schedule.schedule.filter(p => p.isRateChange && p.month > 12 && p.month < totalPayments - 12);
            
            const allMonths = [...firstYear, ...rateChangeMonths, ...middleMonths, ...lastYear];
            displaySchedule = Array.from(new Map(allMonths.map(p => [p.month, p])).values())
                .sort((a, b) => a.month - b.month);
        }

        displaySchedule.forEach((payment, index) => {
            // Add separator row if there's a big gap from the previous payment
            if (index > 0 && payment.month - displaySchedule[index - 1].month > 1) {
                const gapRow = document.createElement('tr');
                gapRow.className = 'bg-gray-100';
                gapRow.innerHTML = `
                    <td colspan="8" class="px-4 py-2 text-center text-xs text-gray-500 italic">
                        ... ${payment.month - displaySchedule[index - 1].month - 1} payments omitted ...
                    </td>
                `;
                tbody.appendChild(gapRow);
            }

            const hasExtra = payment.extraPayment > 0;
            const isRateChange = payment.isRateChange && payment.month > 1;
            
            let rowClass = 'hover:bg-gray-100';
            if (isRateChange) {
                rowClass += ' bg-blue-50 border-l-4 border-blue-500';
            } else if (hasExtra) {
                rowClass += ' bg-green-50';
            }
            
            const row = document.createElement('tr');
            row.className = rowClass;
            
            row.innerHTML = `
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    ${payment.month}
                    ${isRateChange ? '<span class="ml-1 text-blue-600 font-bold" title="Rate Change">★</span>' : ''}
                </td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${this.formatDate(payment.date)}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm ${isRateChange ? 'font-bold text-blue-900' : 'text-gray-900'}">
                    ${this.formatCurrency(payment.payment)}
                    ${isRateChange ? '<span class="ml-1 text-xs text-blue-600">NEW</span>' : ''}
                </td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${this.formatCurrency(payment.principal)}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${this.formatCurrency(payment.interest)}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm font-semibold ${hasExtra ? 'text-green-600' : 'text-gray-400'}">
                    ${hasExtra ? this.formatCurrency(payment.extraPayment) : '-'}
                </td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${this.formatCurrency(payment.balance)}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm ${isRateChange ? 'font-bold text-blue-900' : 'text-gray-600'}">
                    ${payment.rate.toFixed(2)}%
                    ${isRateChange ? '<span class="ml-1 text-xs text-blue-600">↑</span>' : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Clear outputs when inputs are invalid
    clearOutputs() {
        document.getElementById('monthlyPayment').textContent = '$0';
        document.getElementById('totalCost').textContent = '$0';
        document.getElementById('totalInterest').textContent = '$0';
        document.getElementById('payoffDate').textContent = '-';
        document.getElementById('payoffTime').textContent = '-';
        document.getElementById('savingsSection').classList.add('hidden');
        document.getElementById('rateChangeSummary').classList.add('hidden');
        document.getElementById('amortizationTable').innerHTML = '';
        
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Format date
    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short'
        }).format(date);
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new LoanCalculator();
});
