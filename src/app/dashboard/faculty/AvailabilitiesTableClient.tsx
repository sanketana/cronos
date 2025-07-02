"use client";
import React, { useState } from "react";

interface Availability {
    id: string;
    faculty_id: string;
    faculty_name: string;
    faculty_email: string;
    event_id: string;
    event_name: string;
    event_date: string;
    available_slots: string[];
    preferences: string;
    updated_at: string;
}

export default function AvailabilitiesTableClient({ availabilities }: { availabilities: Availability[] }) {
    const [facultyFilter, setFacultyFilter] = useState<string>("all");
    const [eventFilter, setEventFilter] = useState<string>("all");

    // Get unique faculty and event options
    const facultyOptions = Array.from(new Set(availabilities.map(a => `${a.faculty_id}::${a.faculty_name}`)))
        .map(str => {
            const [id, name] = str.split("::");
            return { id, name };
        });
    const eventOptions = Array.from(new Set(availabilities.map(a => `${a.event_id}::${a.event_name}`)))
        .map(str => {
            const [id, name] = str.split("::");
            return { id, name };
        });

    // Filtered availabilities
    const filtered = availabilities.filter(a =>
        (facultyFilter === "all" || a.faculty_id === facultyFilter) &&
        (eventFilter === "all" || a.event_id === eventFilter)
    );

    return (
        <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: 16 }}>
                <select className="form-input" value={facultyFilter} onChange={e => setFacultyFilter(e.target.value)}>
                    <option value="all">All Faculty</option>
                    {facultyOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                </select>
                <select className="form-input" value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
                    <option value="all">All Events</option>
                    {eventOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                </select>
            </div>
            <table className="events-table">
                <thead>
                    <tr>
                        <th>Faculty</th>
                        <th>Email</th>
                        <th>Event</th>
                        <th>Event Date</th>
                        <th>Available Slots</th>
                        <th>Preferences</th>
                        <th>Last Updated</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.length === 0 ? (
                        <tr><td colSpan={7}>No availabilities found.</td></tr>
                    ) : (
                        filtered.map(a => (
                            <tr key={a.id}>
                                <td>{a.faculty_name}</td>
                                <td>{a.faculty_email}</td>
                                <td>{a.event_name}</td>
                                <td>{typeof a.event_date === 'string' ? a.event_date.slice(0, 10) : new Date(a.event_date).toISOString().slice(0, 10)}</td>
                                <td>{Array.isArray(a.available_slots) ? a.available_slots.join(", ") : a.available_slots}</td>
                                <td>{a.preferences || '-'}</td>
                                <td>{typeof a.updated_at === 'string' ? a.updated_at.slice(0, 16).replace('T', ' ') : new Date(a.updated_at).toLocaleString()}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
} 