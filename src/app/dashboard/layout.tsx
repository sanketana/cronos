"use client";
import React, { useState } from 'react';
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
    const [sidebarOpen, setSidebarOpen] = useState(false);
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