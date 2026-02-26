import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { email, password, name } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: "Email already registered" }, { status: 409 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const newUser = await User.create({
            email,
            password: hashedPassword,
            name: name || email.split("@")[0],
        });

        return NextResponse.json({
            success: true,
            user: { id: newUser._id, email: newUser.email, name: newUser.name }
        });

    } catch (e: any) {
        console.error("Registration Error:", e);
        return NextResponse.json({ error: "Registration failed" }, { status: 500 });
    }
}
