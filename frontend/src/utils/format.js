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
