'use server';

import {connectToDatabase} from "@/database/mongoose";

export const getAllUsersForNewsEmail = async () => {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if(!db) throw new Error('Mongoose connection not connected');

        const users = await db.collection('user').find(
            {
                email: { $exists: true, $ne: null },
                $and: [
                    {
                        $or: [
                            { isSubscribed: { $exists: false } },
                            { isSubscribed: true }
                        ]
                    },
                    {
                        $or: [
                            { emailNotifications: { $exists: false } },
                            { emailNotifications: true }
                        ]
                    }
                ]
            },
            { projection: { _id: 1, id: 1, email: 1, name: 1, country:1, emailNotifications: 1, isSubscribed: 1 }}
        ).toArray();

        return users.filter((user) => user.email && user.name).map((user) => ({
            id: user.id || user._id?.toString() || '',
            email: user.email,
            name: user.name
        }))
    } catch (e) {
        console.error('Error fetching users for news email:', e)
        return []
    }
}

export const getUserCountryByUserId = async (userId: string): Promise<string | null> => {
    if (!userId) return null;
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error("Mongoose connection not connected");

        const user = await db.collection("user").findOne(
            {
                $or: [{ id: userId }, { _id: userId }],
            },
            { projection: { country: 1 } }
        );

        const country = typeof user?.country === "string" ? user.country.trim() : "";
        return country || null;
    } catch (e) {
        console.error("Error fetching user country:", e);
        return null;
    }
}
