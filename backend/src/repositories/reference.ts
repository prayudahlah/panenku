import { eq } from 'drizzle-orm';
import { db } from '../db';
import { provinces, cities } from '../db/schema';

export async function getAllProvinces() {
    return db.select({ id: provinces.id, name: provinces.name }).from(provinces).orderBy(provinces.name);
}

export async function getCitiesByProvince(provinceId: number) {
    return db
        .select({ id: cities.id, name: cities.name })
        .from(cities)
        .where(eq(cities.provinceId, provinceId))
        .orderBy(cities.name);
}
