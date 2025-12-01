import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    }
}

let cached = global.mongooseCache;

if(!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
    if(!MONGODB_URI) {
        throw new Error(
            'Missing MONGODB_URI environment variable. Please set it in your .env.local file. ' +
            'Format: mongodb+srv://username:password@cluster.mongodb.net/dbname'
        );
    }

    if(cached.conn) return cached.conn;

    if(!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false })
            .then((mongoose) => {
                console.log(`✅ MongoDB connected (${process.env.NODE_ENV})`);
                return mongoose;
            })
            .catch((err) => {
                console.error('❌ MongoDB connection failed:', err.message);
                throw new Error(
                    `Failed to connect to MongoDB:\n` +
                    `• Check MONGODB_URI format: mongodb+srv://user:pass@cluster.mongodb.net/dbname\n` +
                    `• Verify MongoDB cluster is running\n` +
                    `• Check network access in MongoDB Atlas\n` +
                    `Error: ${err.message}`
                );
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        cached.promise = null;
        throw err;
    }

    return cached.conn;
}
