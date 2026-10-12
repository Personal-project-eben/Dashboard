import nodemailer from "nodemailer";

let transporter;

export async function initEmailTransporter() {
    // Si la configuration SMTP personnalisée est définie dans .env
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        const isGmail = process.env.SMTP_HOST.includes("gmail");
        const port = Number(process.env.SMTP_PORT) || (isGmail ? 465 : 587);

        transporter = nodemailer.createTransport(
            isGmail
                ? {
                      service: "gmail",
                      auth: {
                          user: process.env.SMTP_USER,
                          pass: process.env.SMTP_PASS,
                      },
                      connectionTimeout: 10000,
                      greetingTimeout: 10000,
                      socketTimeout: 15000,
                  }
                : {
                      host: process.env.SMTP_HOST,
                      port: port,
                      secure: port === 465,
                      auth: {
                          user: process.env.SMTP_USER,
                          pass: process.env.SMTP_PASS,
                      },
                      connectionTimeout: 10000,
                      greetingTimeout: 10000,
                      socketTimeout: 15000,
                  }
        );
        console.log(`[email] Configured SMTP transporter (isGmail: ${isGmail}, port: ${port}).`);
    } else {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });
        console.log(`[email] Configured test Ethereal SMTP transporter. Test account: ${testAccount.user}`);
    }
}

export async function sendConfirmationEmail(toEmail, confirmToken) {
    if (!transporter) {
        await initEmailTransporter();
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const confirmUrl = `${frontendUrl}/confirm?token=${confirmToken}`;

    const info = await transporter.sendMail({
        from: `"Dashboard Project" <${process.env.SMTP_USER || 'noreply@dashboard.local'}>`, // sender address
        to: toEmail, // list of receivers
        subject: "Confirmez votre compte Dashboard", // Subject line
        text: `Bienvenue ! Veuillez confirmer votre compte en cliquant sur ce lien : ${confirmUrl}`, // plain text body
        html: `<p>Bienvenue !</p><p>Veuillez confirmer votre compte en cliquant sur le lien ci-dessous :</p><p><a href="${confirmUrl}">Confirmer mon compte</a></p>`, // html body
    });

    console.log(`[email] Confirmation email sent to ${toEmail}. Message ID: ${info.messageId}`);
    // Affiche l'URL du faux email Ethereal si utilisé
    if (info.messageId && !process.env.SMTP_HOST) {
        console.log(`[email] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
}
