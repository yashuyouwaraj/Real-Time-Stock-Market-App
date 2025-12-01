'use server';

import {getAuth} from "@/lib/better-auth/auth";
import {headers} from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try {
        const auth = await getAuth();
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } })

        if(response?.error) {
            return { success: false, error: response.error.message || 'Sign up failed' }
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
        const errorMessage = e instanceof Error ? e.message : 'Sign up failed';
        console.error('Sign up error:', e)
        return { success: false, error: errorMessage }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const auth = await getAuth();
        const response = await auth.api.signInEmail({ body: { email, password } })

        if(response?.error) {
            return { success: false, error: response.error.message || 'Sign in failed' }
        }

        return { success: true, data: response }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Sign in failed';
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
        const errorMessage = e instanceof Error ? e.message : 'Sign out failed';
        console.error('Sign out error:', e)
        return { success: false, error: errorMessage }
    }
}
