'use server';

import {getAuth} from "@/lib/better-auth/auth";
import {headers} from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try {
        const auth = await getAuth();
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } })

        if(response?.error) {
            const errorMsg = response.error.message || 'Sign up failed';
            console.error('Sign up error:', errorMsg);
            return { success: false, error: errorMsg }
        }

        if(response) {
            // Lazy import to avoid loading inngest/functions during build
            try {
                const { inngest } = await import("@/lib/inngest/client");
                await inngest.send({
                    name: 'app/user.created',
                    data: { email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry }
                })
            } catch (inngestError) {
                console.error('Inngest send failed:', inngestError);
                // Don't fail signup if inngest fails, just log it
            }
        }

        return { success: true, data: response }
    } catch (e) {
        let errorMessage = 'Sign up failed';
        if (e instanceof Error) {
            errorMessage = e.message;
            if (e.message.includes('MONGODB_URI')) {
                errorMessage = 'Database not configured. Please set MONGODB_URI in environment variables.';
            }
            if (e.message.includes('MongoDB connection')) {
                errorMessage = 'Unable to connect to database. Check your MONGODB_URI and MongoDB Atlas settings.';
            }
        }
        console.error('Sign up error:', e)
        return { success: false, error: errorMessage }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const auth = await getAuth();
        const response = await auth.api.signInEmail({ body: { email, password } })

        if(response?.error) {
            const errorMsg = response.error.message || 'Sign in failed';
            console.error('Sign in error:', errorMsg);
            return { success: false, error: errorMsg }
        }

        return { success: true, data: response }
    } catch (e) {
        let errorMessage = 'Sign in failed';
        if (e instanceof Error) {
            errorMessage = e.message;
            if (e.message.includes('MONGODB_URI')) {
                errorMessage = 'Database not configured. Please set MONGODB_URI in environment variables.';
            }
            if (e.message.includes('MongoDB connection')) {
                errorMessage = 'Unable to connect to database. Check your MONGODB_URI and MongoDB Atlas settings.';
            }
            if (e.message.includes('Invalid credentials') || e.message.includes('user not found')) {
                errorMessage = 'Invalid email or password.';
            }
        }
        console.error('Sign in error:', e)
        return { success: false, error: errorMessage }
    }
}

export const signOut = async () => {
    try {
        const auth = await getAuth();
        await auth.api.signOut({ headers: await headers() });
        return { success: true }
    } catch (e) {
        let errorMessage = 'Sign out failed';
        if (e instanceof Error) {
            errorMessage = e.message;
            if (e.message.includes('MONGODB_URI')) {
                errorMessage = 'Database not configured.';
            }
            if (e.message.includes('MongoDB connection')) {
                errorMessage = 'Unable to connect to database.';
            }
        }
        console.error('Sign out error:', e)
        return { success: false, error: errorMessage }
    }
}
