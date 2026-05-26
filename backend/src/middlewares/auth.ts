export const isAuthenticated = (app: any) =>
    app.derive(({ session }: any) => {
        const userId = session.get('userId');
        return {
            user: userId
                ? { id: userId, email: session.get('email'), role: session.get('role') }
                : null,
        };
    });
