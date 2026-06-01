import { eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { provinces, cities, productCategories, units } from '../db/schema';

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

export async function getAllUnits() {
    return db
        .select({ id: units.id, name: units.name })
        .from(units)
        .where(isNull(units.deletedAt))
        .orderBy(units.name);
}

export async function getCitiesByProvince(provinceId: number) {
    return db
        .select({ id: cities.id, name: cities.name })
        .from(cities)
        .where(eq(cities.provinceId, provinceId))
        .orderBy(cities.name);
}
