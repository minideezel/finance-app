// Real Estate Investment Calculator
// Handles investment analysis, tax benefit modeling (STR loophole), and visualization

class RealEstateCalculator {
    constructor() {
        this.data = this.loadData();
        this.chart = null;
        this.initializeUI();
        this.attachEventListeners();
        this.calculate();
    }

    // Load data from localStorage
    loadData() {
        const saved = localStorage.getItem('realEstateData');
        return saved ? JSON.parse(saved) : {};
    }

    // Save data to localStorage
    saveData() {
        localStorage.setItem('realEstateData', JSON.stringify(this.data));
    }

    // Initialize UI with saved or default data
    initializeUI() {
        // Defaults
        const defaults = {
            purchasePrice: 500000,
            downPaymentPercent: 20,
            interestRate: 6.5,
            loanTerm: 30,
            closingCosts: 10000,
            
            monthlyRent: 4500,
            vacancyRate: 5,
            propertyTaxRate: 1.2, // Annual %
            insurance: 1200, // Annual $
            hoa: 0, // Monthly
            maintenanceRate: 5, // % of rent
            managementRate: 0, // % of rent
            capexRate: 5, // % of rent
            
            marginalTaxRate: 32, // %
            landValuePercent: 20, // %
            depreciationTerm: 27.5, // years (27.5 res, 39 comm)
            bonusDepreciationEligible: 100000, // $ amount allocated to 5/15yr property (Cost Seg)
            bonusDepreciationRate: 60, // % allowed in current year
            
            appreciationRate: 3, // %
            rentIncreaseRate: 3, // %
            holdingPeriod: 10 // years
        };

        // Merge saved data with defaults
        this.data = { ...defaults, ...this.data };

        // Set values to inputs
        const inputs = [
            'purchasePrice', 'downPaymentPercent', 'interestRate', 'loanTerm', 'closingCosts',
            'monthlyRent', 'vacancyRate', 'propertyTaxRate', 'insurance', 'hoa',
            'maintenanceRate', 'managementRate', 'capexRate',
            'marginalTaxRate', 'landValuePercent', 'depreciationTerm', 
            'bonusDepreciationEligible', 'bonusDepreciationRate',
            'appreciationRate', 'rentIncreaseRate', 'holdingPeriod'
        ];

        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = this.data[id];
        });
    }

    attachEventListeners() {
        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                this.data[e.target.id] = isNaN(val) ? 0 : val;
                this.saveData();
                this.calculate();
            });
        });
    }

    calculate() {
        // --- 1. Finance ---
        const purchasePrice = this.data.purchasePrice;
        const downPayment = purchasePrice * (this.data.downPaymentPercent / 100);
        const loanAmount = purchasePrice - downPayment;
        const monthlyRate = (this.data.interestRate / 100) / 12;
        const numPayments = this.data.loanTerm * 12;
        
        let monthlyPI = 0;
        if (monthlyRate > 0) {
            monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
        } else {
            monthlyPI = loanAmount / numPayments;
        }

        const totalCashNeeded = downPayment + this.data.closingCosts;

        // --- 2. Income & Expenses (Monthly Year 1) ---
        const grossRent = this.data.monthlyRent;
        const vacancyLoss = grossRent * (this.data.vacancyRate / 100);
        const effectiveGrossIncome = grossRent - vacancyLoss;

        const propertyTaxMonthly = (purchasePrice * (this.data.propertyTaxRate / 100)) / 12;
        const insuranceMonthly = this.data.insurance / 12;
        const hoa = this.data.hoa;
        const maintenance = effectiveGrossIncome * (this.data.maintenanceRate / 100);
        const management = effectiveGrossIncome * (this.data.managementRate / 100);
        const capex = effectiveGrossIncome * (this.data.capexRate / 100);

        const totalOperatingExpenses = propertyTaxMonthly + insuranceMonthly + hoa + maintenance + management + capex;
        const noi = effectiveGrossIncome - totalOperatingExpenses;
        const cashFlow = noi - monthlyPI;
        const annualCashFlow = cashFlow * 12;
        const cashOnCash = (annualCashFlow / totalCashNeeded) * 100;

        // --- 3. Tax Benefits (STR Loophole / Bonus Depr) ---
        const landValue = purchasePrice * (this.data.landValuePercent / 100);
        const buildingValue = purchasePrice - landValue;
        
        // Depreciation Base Calculation
        // If we do a cost seg, we strip out the bonus eligible amount from the standard depreciation basis
        // Standard Basis = Building Value - Bonus Eligible Amount
        const bonusEligibleAmount = this.data.bonusDepreciationEligible;
        const standardDepreciationBasis = Math.max(0, buildingValue - bonusEligibleAmount);
        
        const annualStandardDepreciation = standardDepreciationBasis / this.data.depreciationTerm;
        const year1BonusDepreciation = bonusEligibleAmount * (this.data.bonusDepreciationRate / 100);
        
        const totalYear1Depreciation = annualStandardDepreciation + year1BonusDepreciation;

        // Taxable Income (Paper Loss)
        // Cash Flow is not Taxable Income. Taxable Income = NOI - Interest - Depreciation
        // Interest for Year 1 (Approximate for simple view, or calculate exact amortization)
        let year1Interest = 0;
        let balance = loanAmount;
        for(let i=0; i<12; i++) {
            const interest = balance * monthlyRate;
            year1Interest += interest;
            const principal = monthlyPI - interest;
            balance -= principal;
        }

        const annualNOI = noi * 12;
        const taxableIncome = annualNOI - year1Interest - totalYear1Depreciation;
        const taxSavings = taxableIncome < 0 ? (Math.abs(taxableIncome) * (this.data.marginalTaxRate / 100)) : 0;
        const totalYear1Return = annualCashFlow + taxSavings;
        const roiYear1 = (totalYear1Return / totalCashNeeded) * 100;

        // Update UI Outputs
        this.updateOutput('out_monthlyPI', monthlyPI, {style: 'currency'});
        this.updateOutput('out_totalCashNeeded', totalCashNeeded, {style: 'currency'});
        this.updateOutput('out_noi', annualNOI, {style: 'currency'});
        this.updateOutput('out_cashFlow', annualCashFlow, {style: 'currency'});
        this.updateOutput('out_coc', cashOnCash, {suffix: '%', fixed: 2});
        this.updateOutput('out_totalDepreciation', totalYear1Depreciation, {style: 'currency'});
        this.updateOutput('out_taxableIncome', taxableIncome, {style: 'currency'});
        this.updateOutput('out_taxSavings', taxSavings, {style: 'currency'});
        this.updateOutput('out_roiYear1', roiYear1, {suffix: '%', fixed: 2});

        // Update Tooltips dynamic data (Calculations)
        this.updateTooltipData({
            monthlyPICheck: `Loan: ${this.formatCurrency(loanAmount)} @ ${this.data.interestRate}%`,
            depreciationCalc: `Basis: ${this.formatCurrency(buildingValue)} | Bonus: ${this.formatCurrency(year1BonusDepreciation)} | Std: ${this.formatCurrency(annualStandardDepreciation)}`,
            taxSavingsCalc: `(${this.formatCurrency(taxableIncome)} Loss) × ${this.data.marginalTaxRate}% Rate`
        });

        this.updateChart(loanAmount, purchasePrice, monthlyPI);
    }

    updateOutput(id, value, options = {}) {
        const el = document.getElementById(id);
        if (!el) return;
        
        if (options.style === 'currency') {
            el.innerText = this.formatCurrency(value);
        } else {
            el.innerText = value.toFixed(options.fixed || 0) + (options.suffix || '');
        }
        
        // Color coding for negative/positive
        if (id !== 'out_monthlyPI' && id !== 'out_totalCashNeeded' && id !== 'out_totalDepreciation') {
             if (value < 0) el.classList.add('text-red-600');
             else el.classList.remove('text-red-600');
        }
    }

    formatCurrency(val) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    }

    updateTooltipData(data) {
        // Find elements with specific data-calc-id and update their title/dataset
        for (const [key, value] of Object.entries(data)) {
            const el = document.querySelector(`[data-calc-id="${key}"]`);
            if (el) el.innerText = value;
        }
    }

    updateChart(initialLoan, initialValue, monthlyPI) {
        const ctx = document.getElementById('projectionChart');
        if (!ctx) return;

        const years = this.data.holdingPeriod;
        const labels = Array.from({length: years + 1}, (_, i) => `Year ${i}`);
        
        let propertyValue = initialValue;
        let loanBalance = initialLoan;
        let cumulativeCashFlow = 0;
        let cumulativeTaxSavings = 0;
        
        // Arrays for chart
        const equityData = [initialValue - initialLoan];
        const cashFlowData = [0];
        // We will track equity + accumulated cash benefits
        
        const monthlyRate = (this.data.interestRate / 100) / 12;

        let currentRent = this.data.monthlyRent;
        // Simple linear projection for chart
        for (let year = 1; year <= years; year++) {
            // Update Property Value
            propertyValue = propertyValue * (1 + this.data.appreciationRate / 100);
            
            // Update Loan Balance
            let yearInterest = 0;
            for(let m=0; m<12; m++){
                const interest = loanBalance * monthlyRate;
                yearInterest += interest;
                const principal = monthlyPI - interest;
                loanBalance = Math.max(0, loanBalance - principal);
            }

            // Update Cash Flow (Simplify: Grow expenses same as rent for rough projection or keep fixed? Usually expenses grow. Let's grow NOI by rent increase rate for simplicity)
            // Recalculate NOI based on rent growth
            // Gross Rent increases
            currentRent = currentRent * (1 + this.data.rentIncreaseRate / 100);
            
            // Re-calc year's cash flow roughly
            // Note: In strict accounting, fixed costs (mortgage) stay flat, while variable costs rise.
            // For this chart: We just show Accumulated Wealth (Equity) vs Accumulated Cash.
            
            // Correct Equity
            const equity = propertyValue - loanBalance;
            equityData.push(equity);
            
            // Note: This is an approximation for the chart
            cashFlowData.push(equity); // Placeholder, actually let's just show Equity Growth vs Loan Paydown
        }

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Projected Equity',
                        data: equityData,
                        borderColor: 'rgb(37, 99, 235)',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `Wealth Projection Over ${years} Years`
                    },
                    tooltip: {
                         callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return '$' + value / 1000 + 'k';
                            }
                        }
                    }
                }
            }
        });
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    new RealEstateCalculator();
});
