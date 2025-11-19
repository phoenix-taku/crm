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

export async function Navbar() {
    const session = await getSession();
    const user = session?.user;

    return (
        <nav className="border-b bg-background">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">

                    {/* Brand */}
                    <Link href="/" className="text-xl font-bold">
                        CRM
                    </Link>

                    {/* Right Section */}
                    <div className="flex items-center gap-4">
                        {/* Dashboard link (only when logged in) */}
                        {user && (
                            <Link
                                href="/dashboard"
                                className="text-sm font-medium text-muted-foreground hover:text-foreground"
                            >
                                Dashboard
                            </Link>
                        )}

                        {user ? (
                            /* User Dropdown */
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
                            /* Sign-in Button */
                            <Button asChild variant="default">
                                <Link href="/">Sign in</Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
