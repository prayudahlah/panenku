export function success(data: any, message = 'OK') {
  return { success: true, message, data };
}

export function error(message: string, status = 400) {
  return { success: false, message };
}
