import "~/styles/globals.css";

import { type Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import { TRPCReactProvider } from "~/trpc/react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";
import { auth } from "~/server/better-auth";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { AppSidebar } from "~/components/sidebar";
export const metadata: Metadata = {
    title: "CRM - Contact Management",
    description: "Contact-focused CRM built with T3 Stack",
    icons: [{ rel: "icon", url: "/favicon.ico" }],
};

async function Header() {
    const session = await getSession();
    const user = session?.user;

    return (
        <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4 z-10">
            <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                </div>
                <div className="flex items-center gap-4">

                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2 px-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>
                                            {user.name?.charAt(0).toUpperCase() ?? "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden sm:inline text-sm">{user.name}</span>
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href="/profile">Profile</Link>
                                </DropdownMenuItem>

                                <DropdownMenuItem asChild>
                                    <form>
                                        <button
                                            formAction={async () => {
                                                "use server";
                                                await auth.api.signOut({
                                                    headers: await headers(),
                                                });
                                                redirect("/");
                                            }}
                                        >
                                            Sign out
                                        </button>
                                    </form>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild variant="default">
                            <Link href="/">Sign in</Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={GeistSans.className} suppressHydrationWarning>
            <body>
                <TRPCReactProvider>
                    <SidebarProvider>
                        <AppSidebar />
                        <SidebarInset>
                            <Header />
                            <ThemeProvider
                                attribute="class"
                                defaultTheme="dark"
                                enableSystem={false}
                            >
                                {children}
                            </ThemeProvider>
                        </SidebarInset>
                    </SidebarProvider>
                </TRPCReactProvider>
            </body>
        </html>
    );
}
