import { eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { provinces, cities, productCategories } from '../db/schema';

export async function getAllProvinces() {
    return db.select({ id: provinces.id, name: provinces.name }).from(provinces).orderBy(provinces.name);
}

export async function getAllProductCategories() {
    return db
        .select({ id: productCategories.id, name: productCategories.name, parentId: productCategories.parentId })
        .from(productCategories)
        .where(isNull(productCategories.deletedAt))
        .orderBy(productCategories.name);
}

export async function getAllCities() {
    return db
        .select({ id: cities.id, name: cities.name, provinceId: cities.provinceId })
        .from(cities)
        .orderBy(cities.name);
}

export async function getCitiesByProvince(provinceId: number) {
    return db
        .select({ id: cities.id, name: cities.name })
        .from(cities)
        .where(eq(cities.provinceId, provinceId))
        .orderBy(cities.name);
}
