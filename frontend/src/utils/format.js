export function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID');
}

export function formatDateTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('id-ID');
}

export function formatNumber(num) {
    if (num == null || isNaN(num)) return '0';
    return new Intl.NumberFormat('id-ID').format(num);
}

export function formatDecimal(num) {
    if (num == null || isNaN(num)) return '0,00';
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

export function formatCurrency(num) {
    if (num == null || isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(num);
}
