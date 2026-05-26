export function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID');
}

export function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}
