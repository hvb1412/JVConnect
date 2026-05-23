import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testEmail() {
    console.log("Testing email with:");
    console.log("Host:", 'smtp-relay.brevo.com');
    console.log("User:", process.env.BREVO_LOGIN);
    console.log("Pass:", process.env.BREVO_PASS ? "*****" : "MISSING");
    console.log("Sender:", process.env.BREVO_USER);
    
    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.BREVO_LOGIN,
            pass: process.env.BREVO_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        const info = await transporter.sendMail({
            from: `"${process.env.BREVO_SENDER_NAME}" <${process.env.BREVO_USER}>`,
            to: process.env.BREVO_USER, // Send to self
            subject: "Test Brevo SMTP",
            text: "Hello world?",
        });
        console.log("Success! Message ID:", info.messageId);
    } catch (err) {
        console.error("Error:", err);
    }
}

testEmail();
