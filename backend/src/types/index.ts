export interface UserSession {
  userId: number;
  email: string;
}

export interface PanenPayload {
  komoditas: string;
  jumlah: number;
  satuan: string;
  tanggalPanen: string;
}
