import { catalogRepo } from '../repositories';

export const list = async (filters: {
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
}) => {
    return catalogRepo.list(filters);
};
