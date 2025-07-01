import React from 'react';
import Link from 'next/link';
import './dashboard-sidebar.css';

const sidebarItems = [
    { label: 'Dashboard Home', href: '/dashboard' },
    { label: 'Events', href: '/dashboard/events' },
    { label: 'Faculty', href: '/dashboard/faculty' },
    { label: 'Students', href: '/dashboard/students' },
    { label: 'Schedules', href: '/dashboard/schedules' },
    { label: 'Forms & Links', href: '/dashboard/forms' },
    { label: 'Settings', href: '/dashboard/settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="dashboard-layout">
            <nav className="dashboard-sidebar" aria-label="Dashboard navigation">
                <div className="sidebar-title">Chronos</div>
                <ul className="sidebar-list">
                    {sidebarItems.map(item => (
                        <li key={item.href} className="sidebar-list-item">
                            <Link href={item.href} className="sidebar-link">{item.label}</Link>
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