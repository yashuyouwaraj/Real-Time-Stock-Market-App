import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAuth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const Layout = async ({ children }: { children : React.ReactNode }) => {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if(!session?.user) redirect('/sign-in');

    const user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
    }

    return (
        <main className="min-h-screen text-gray-400 flex flex-col">
            <Header user={user} />

            <div className="container py-10 flex-1">
                {children}
            </div>
            <Footer userEmail={user.email} />
        </main>
    )
}
export default Layout
