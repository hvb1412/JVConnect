import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testApi() {
    try {
        // Register
        console.log("1. Registering...");
        const regRes = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            })
        });
        console.log("Register response:", await regRes.json());

        // We need to get the OTP from the database because it was sent to email.
        await mongoose.connect(process.env.MONGO_URI);
        const user = await mongoose.model('User', new mongoose.Schema({ email: String, otp: String }), 'users').findOne({ email: 'test@example.com' });
        
        console.log("2. Found OTP in DB:", user.otp);

        // Verify
        console.log("3. Verifying...");
        const verRes = await fetch('http://localhost:5000/api/auth/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                otp: user.otp
            })
        });
        const verData = await verRes.json();
        console.log("Verify token:", verData.data?.token);

        console.log("4. Login...");
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        console.log("Login token:", loginData.data?.token);

        console.log("5. Fetching me with verify token...");
        const meRes1 = await fetch('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${verData.data?.token}` }
        });
        console.log("Me response 1:", await meRes1.json());

        console.log("6. Fetching me with login token...");
        const meRes2 = await fetch('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${loginData.data?.token}` }
        });
        console.log("Me response 2:", await meRes2.json());

        // Clean up
        await mongoose.model('User').deleteOne({ email: 'test@example.com' });
        mongoose.disconnect();
    } catch (e) {
        console.error("Error:", e);
    }
}

testApi();
