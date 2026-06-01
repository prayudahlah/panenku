const clients = new Map<number, Set<ReadableStreamDefaultController>>();

export function addClient(userId: number, controller: ReadableStreamDefaultController) {
    if (!clients.has(userId)) clients.set(userId, new Set());
    clients.get(userId)!.add(controller);
}

export function removeClient(userId: number, controller: ReadableStreamDefaultController) {
    const set = clients.get(userId);
    if (!set) return;
    set.delete(controller);
    if (set.size === 0) clients.delete(userId);
}

export async function push(userId: number, data: Record<string, unknown>) {
    const set = clients.get(userId);
    if (!set) return;
    const message = `event: notification\ndata: ${JSON.stringify(data)}\n\n`;
    const encoded = new TextEncoder().encode(message);
    for (const c of set) {
        try {
            c.enqueue(encoded);
        } catch {
            removeClient(userId, c);
        }
    }
}
