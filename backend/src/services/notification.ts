import { notificationRepo } from '../repositories';
import * as sseService from './sse';

export async function create(
    userId: number,
    title: string,
    message: string | null,
    type: string,
    referenceType?: string | null,
    referenceId?: number | null,
) {
    const result = await notificationRepo.create({
        userId,
        title,
        message,
        type,
        referenceType: referenceType ?? null,
        referenceId: referenceId ?? null,
    });

    await sseService.push(userId, {
        id: result.id,
        title,
        message,
        type,
        referenceType: referenceType ?? null,
        referenceId: referenceId ?? null,
        isRead: false,
        createdAt: result.createdAt,
    });
}

export async function list(userId: number, page = 1, limit = 20) {
    return notificationRepo.list(userId, page, limit);
}

export async function getUnreadCount(userId: number) {
    return notificationRepo.getUnreadCount(userId);
}

export async function markAsRead(id: number, userId: number) {
    return notificationRepo.markAsRead(id, userId);
}

export async function markAllAsRead(userId: number) {
    return notificationRepo.markAllAsRead(userId);
}
