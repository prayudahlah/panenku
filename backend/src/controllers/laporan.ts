import { Elysia } from 'elysia';

export const rekapPanen = (app: Elysia) =>
  app.get('/laporan/rekap', async ({ query }) => {
    return { message: 'Rekap panen endpoint placeholder' };
  });

export const laporanHarian = (app: Elysia) =>
  app.get('/laporan/harian', async ({ query }) => {
    return { message: 'Laporan harian endpoint placeholder' };
  });

export const laporanBulanan = (app: Elysia) =>
  app.get('/laporan/bulanan', async ({ query }) => {
    return { message: 'Laporan bulanan endpoint placeholder' };
  });
