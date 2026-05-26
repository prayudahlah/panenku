import { Elysia } from 'elysia';
import { rekapPanen, laporanHarian, laporanBulanan } from '../controllers/laporan';

export const laporanRoutes = (app: Elysia) =>
  app.group('/laporan', (group) =>
    group
      .use(rekapPanen)
      .use(laporanHarian)
      .use(laporanBulanan)
  );
