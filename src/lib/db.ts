import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
}

declare global {
    var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

// CHỈ DÙNG NAMED EXPORT Ở ĐÂY
export async function connectDB() {
    if (!MONGODB_URI) {
        throw new Error("Please define MONGODB_URI inside .env.local");
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = { bufferCommands: false };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
            // Logic logging theo kế hoạch của bạn
            const isProd = MONGODB_URI.includes("mongodb+srv");
            console.log(`🚀 FocusFlow connected to ${isProd ? "Remote (Atlas)" : "Local"} Database`);

            return mongooseInstance.connection;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}