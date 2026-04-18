class EmergencyFundCalculator {
    constructor() {
        this.initializeForm();
        this.setupEventListeners();
    }

    initializeForm() {
        this.form = {
            monthlyExpense: document.getElementById('monthlyExpense'),
            dependents: document.getElementById('dependents'),
            currentFund: document.getElementById('currentFund'),
            monthlyInvestment: document.getElementById('monthlyInvestment'),
            returnRate: document.getElementById('returnRate'),
            calculateBtn: document.getElementById('calculateBtn'),
            result: document.getElementById('result')
        };
    }

    setupEventListeners() {
        ['monthlyExpense', 'currentFund', 'monthlyInvestment'].forEach(field => {
            const input = this.form[field];
            if (input) {
                input.addEventListener('input', (e) => this.handleNumberInput(e));
            }
        });

        this.form.calculateBtn.addEventListener('click', () => this.calculate());
    }

    handleNumberInput(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value) {
            value = this.formatNumber(value);
        }
        e.target.value = value;
    }

    formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    unformatNumber(value) {
        return value ? value.replace(/\./g, '') : '0';
    }

    // Simulasi bulanan sampai akumulasi mencapai totalRequired (maks. maxMonths).
    simulateMonthsToGoal(currentFund, monthlyInvestment, monthlyRate, totalRequired, maxMonths = 600) {
        let accumulated = currentFund;
        let months = 0;
        while (accumulated < totalRequired && months < maxMonths) {
            accumulated += monthlyInvestment;
            accumulated *= (1 + monthlyRate);
            months++;
        }

        const principalAmount = currentFund + monthlyInvestment * months;
        const futureValue = accumulated;
        const interestAmount = futureValue - principalAmount;

        return {
            months,
            futureValue,
            principalAmount,
            interestAmount
        };
    }

    calculate() {
        try {
            const monthlyExpense = parseInt(this.unformatNumber(this.form.monthlyExpense.value), 10);
            const dependents = parseInt(this.form.dependents.value, 10) || 0;
            const currentFund = parseInt(this.unformatNumber(this.form.currentFund.value), 10);
            const monthlyInvestment = parseInt(this.unformatNumber(this.form.monthlyInvestment.value), 10);
            const returnRate = parseFloat(this.form.returnRate.value) || 0;

            if (!monthlyExpense || monthlyExpense <= 0) {
                alert('Mohon isi pengeluaran wajib bulanan dengan benar.');
                return;
            }

            const emergencyMonths = dependents > 0 ? 6 : 3;
            const totalRequired = monthlyExpense * emergencyMonths;
            const monthlyRate = returnRate / 100 / 12;

            const sim = this.simulateMonthsToGoal(
                currentFund,
                monthlyInvestment,
                monthlyRate,
                totalRequired
            );

            const result = {
                totalRequired,
                emergencyMonths,
                currentFund,
                futureValue: sim.futureValue,
                monthlyInvestment,
                monthsSimulated: sim.months,
                principalAmount: sim.principalAmount,
                interestAmount: sim.interestAmount
            };

            this.displayResults(result);
            this.form.result.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan dalam perhitungan. Pastikan semua input sudah benar.');
        }
    }

    displayResults(result) {
        const hintEl = document.getElementById('emergencyMonthsHint');
        if (hintEl) {
            hintEl.textContent =
                result.emergencyMonths === 6
                    ? 'Dasar hitung: 6 bulan pengeluaran wajib (ada tanggungan).'
                    : 'Dasar hitung: 3 bulan pengeluaran wajib (tanpa tanggungan).';
        }

        document.getElementById('totalRequired').textContent = this.formatNumber(Math.round(result.totalRequired));
        document.getElementById('principalAmount').textContent =
            'Rp ' + this.formatNumber(Math.round(result.principalAmount));
        document.getElementById('interestAmount').textContent =
            'Rp ' + this.formatNumber(Math.round(result.interestAmount));
        document.getElementById('totalAmount').textContent =
            'Rp ' + this.formatNumber(Math.round(result.futureValue));

        const principal = result.principalAmount;
        const interest = result.interestAmount;
        const total = principal + interest;
        const principalPercentage = total > 0 ? (principal / total) * 100 : 0;

        const pieChart = document.getElementById('investmentPieChart');
        pieChart.style.setProperty('--principal-degree', `${principalPercentage}%`);

        const savingAllocation = Math.round(result.totalRequired * 0.5);
        const investmentAllocation = Math.round(result.totalRequired * 0.5);
        document.getElementById('savingAmount').textContent = this.formatNumber(savingAllocation);
        document.getElementById('investmentAmount').textContent = this.formatNumber(investmentAllocation);

        const difference = result.futureValue - result.totalRequired;
        const isTargetAchieved = difference >= 0;

        const recommendationsList = document.getElementById('recommendationsList');
        const recommendationTitle = document.getElementById('recommendationTitle');

        if (!recommendationsList || !recommendationTitle) {
            console.error('Element recommendationsList atau recommendationTitle tidak ditemukan');
            return;
        }

        recommendationsList.innerHTML = '';

        if (isTargetAchieved) {
            recommendationTitle.style.display = 'none';
            recommendationsList.style.display = 'none';
        } else {
            recommendationTitle.style.display = 'block';
            recommendationsList.style.display = 'block';

            const shortfall = Math.abs(difference);
            const m = result.monthsSimulated;
            const additionalMonthlyNeeded =
                m > 0 && m < 600 ? Math.ceil(shortfall / m) : Math.ceil(shortfall / 12);

            const recommendationsHTML = `
                <div class="recommendation-item orange">
                    <p>⚠️ Target dana darurat belum tercapai. Kekurangan: Rp ${this.formatNumber(Math.round(shortfall))}</p>
                </div>
                <div class="recommendation-item blue">
                    <p>✓ Tambahkan investasi bulanan sebesar Rp ${this.formatNumber(additionalMonthlyNeeded)} untuk mendekati target</p>
                </div>
                <div class="recommendation-item purple">
                    <p>✓ Pertimbangkan untuk:</p>
                    <ul class="excess-recommendations">
                        <li>Mengurangi pengeluaran tidak penting</li>
                        <li>Mencari penghasilan tambahan</li>
                        <li>Menaikkan nominal tabungan secara bertahap</li>
                    </ul>
                </div>
                <div class="recommendation-item teal">
                    <p>✓ Prioritaskan membangun dana darurat sebelum investasi lainnya</p>
                </div>
                <div class="recommendation-item green">
                    <p>✓ Pilih instrumen investasi aman seperti:</p>
                    <ul class="excess-recommendations">
                        <li>Deposito</li>
                        <li>Tabungan Berjangka</li>
                        <li>Reksadana Pasar Uang</li>
                        <li>Reksadana Pendapatan Tetap</li>
                        <li>Emas</li>
                    </ul>
                </div>`;

            recommendationsList.innerHTML = recommendationsHTML;
        }

        this.form.result.style.display = 'block';
        this.updateProgressBar(result);

        const monthsNeeded = result.monthsSimulated;
        const today = new Date();
        const targetDate = new Date();
        targetDate.setMonth(today.getMonth() + monthsNeeded);

        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const durationText =
            monthsNeeded >= 12
                ? `${Math.floor(monthsNeeded / 12)} tahun${monthsNeeded % 12 > 0 ? ` ${monthsNeeded % 12} bulan` : ''}`
                : `${monthsNeeded} bulan`;

        document.getElementById('savingDuration').textContent = durationText;
        document.getElementById('targetDate').textContent = targetDate.toLocaleDateString('id-ID', options);
    }

    updateProgressBar(result) {
        const progress = (result.futureValue / result.totalRequired) * 100;
        const progressBar = document.getElementById('durationProgress');

        progressBar.style.width = Math.min(100, progress) + '%';
        progressBar.setAttribute(
            'data-tooltip',
            `Rp ${this.formatNumber(Math.round(result.futureValue))} dari Rp ${this.formatNumber(Math.round(result.totalRequired))}`
        );

        document.getElementById('startPoint').textContent = 'Rp 0';
        document.getElementById('targetPoint').textContent =
            'Rp ' + this.formatNumber(Math.round(result.totalRequired));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new EmergencyFundCalculator();
});
