import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendResetEmail(to: string, token: string) {
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: 'Reset Password - Panenku',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #16a34a;">Panenku</h2>
                <p>Kami menerima permintaan reset password akun Anda.</p>
                <p>Klik tombol di bawah untuk mereset password:</p>
                <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                    Reset Password
                </a>
                <p style="color: #666; font-size: 13px;">Link berlaku selama 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.</p>
                <p style="color: #666; font-size: 13px;">Atau salin link berikut: <br/>${resetLink}</p>
            </div>
        `,
    });
}
