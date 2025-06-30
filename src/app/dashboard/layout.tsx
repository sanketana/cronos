import React from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <nav className="w-full flex justify-end p-4 bg-northwestern-purple">
                <form method="POST" action="/logout">
                    <button
                        type="submit"
                        className="bg-northwestern-dark text-white px-4 py-2 rounded hover:bg-northwestern-accent transition-colors font-semibold"
                    >
                        Logout
                    </button>
                </form>
            </nav>
            <main>{children}</main>
        </div>
    );
} 