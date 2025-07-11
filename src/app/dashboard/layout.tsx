"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './dashboard-sidebar.css';

const allSidebarItems = [
    { label: 'Dashboard Home', href: '/dashboard', roles: ['admin', 'faculty', 'student'] },
    { label: 'Events', href: '/dashboard/events', roles: ['admin'] },
    { label: 'Faculty', href: '/dashboard/faculty', roles: ['admin'] },
    { label: 'Students', href: '/dashboard/students', roles: ['admin'] },
    { label: 'Scheduler', href: '/dashboard/scheduler', roles: ['admin'] },
    { label: 'Meetings', href: '/dashboard/meetings', roles: ['admin'] },
    { label: 'Housekeeping', href: '/dashboard/housekeeping', roles: ['admin'] },
    // Self-serve links for faculty and students
    { label: 'My Availability', href: '/dashboard/faculty', roles: ['faculty'] },
    { label: 'My Preferences', href: '/dashboard/students', roles: ['student'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRole() {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) throw new Error('Not authenticated');
                const data = await res.json();
                setRole(data.role);
            } catch {
                setRole(null);
            } finally {
                setLoading(false);
            }
        }
        fetchRole();
    }, []);

    if (loading) {
        return <div className="dashboard-layout"><main className="dashboard-main">Loading...</main></div>;
    }

    // Only show sidebar items for the user's role
    const sidebarItems = allSidebarItems.filter(item => role && item.roles.includes(role));

    return (
        <div className="dashboard-layout">
            {/* Burger menu button for mobile */}
            <button
                className="burger-menu-btn"
                aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={sidebarOpen}
                aria-controls="dashboard-sidebar"
                onClick={() => setSidebarOpen((open) => !open)}
            >
                {sidebarOpen ? (
                    <span aria-hidden="true">&times;</span>
                ) : (
                    <span aria-hidden="true">&#9776;</span>
                )}
            </button>
            {/* Sidebar overlay for mobile */}
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
            <nav
                id="dashboard-sidebar"
                className={`dashboard-sidebar${sidebarOpen ? ' open' : ''}`}
                aria-label="Dashboard navigation"
            >
                <div className="sidebar-title">Chronos</div>
                <ul className="sidebar-list">
                    {sidebarItems.map(item => (
                        <li key={item.href} className="sidebar-list-item">
                            <Link href={item.href} className="sidebar-link" onClick={() => setSidebarOpen(false)}>{item.label}</Link>
                        </li>
                    ))}
                </ul>
                <form method="POST" action="/logout" className="sidebar-logout-form">
                    <button type="submit" className="sidebar-logout-btn">Logout</button>
                </form>
            </nav>
            <main className="dashboard-main">
                {children}
            </main>
        </div>
    );
} 