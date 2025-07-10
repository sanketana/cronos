"use client";

import React, { useState, useEffect } from "react";
import { getAllEvents } from "../actions";
import { getAllAvailabilities } from "../faculty/actions";
import { getAllPreferences } from "../students/actions";
import { runSchedulerAction } from './actions';

export default function SchedulerPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState("");
    const [professors, setProfessors] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [result, setResult] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoadingData(true);
            const [eventsData, availabilities, preferences] = await Promise.all([
                getAllEvents(),
                getAllAvailabilities(),
                getAllPreferences(),
            ]);
            setEvents(eventsData);
            (window as any).__availabilities = availabilities;
            (window as any).__preferences = preferences;
            setLoadingData(false);
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (!selectedEvent) {
            setProfessors([]);
            setStudents([]);
            return;
        }
        const availabilities = (window as any).__availabilities || [];
        const eventProfs = availabilities
            .filter((a: any) => a.event_id === selectedEvent)
            .map((a: any) => {
                console.log('Professor available_slots:', a.available_slots);
                return {
                    id: a.faculty_id,
                    name: a.faculty_name,
                    email: a.faculty_email,
                    department: a.faculty_department || "-",
                    available_slots: a.available_slots ? (typeof a.available_slots === 'string' ? JSON.parse(a.available_slots) : a.available_slots) : [],
                };
            });
        setProfessors(eventProfs);
        const preferences = (window as any).__preferences || [];
        const eventStudents = preferences
            .filter((p: any) => p.event_id === selectedEvent)
            .map((p: any) => {
                console.log('Student available_slots:', p.available_slots);
                return {
                    id: p.student_id,
                    name: p.student_name,
                    email: p.student_email,
                    department: p.student_department || "-",
                    available_slots: p.available_slots ? (typeof p.available_slots === 'string' ? JSON.parse(p.available_slots) : p.available_slots) : [],
                };
            });
        setStudents(eventStudents);
    }, [selectedEvent]);

    // Helper to format a time string (e.g., '09:00') to '9 AM' or '3:30 PM'
    function formatSlotTime(timeStr: string) {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':');
        let hour = parseInt(h);
        const minute = parseInt(m);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        if (minute === 0) {
            return `${hour} ${ampm}`;
        } else {
            return `${hour}:${m} ${ampm}`;
        }
    }

    function formatSlotRange(slot: string) {
        const [start, end] = slot.split('-');
        return `${formatSlotTime(start)} - ${formatSlotTime(end)}`;
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Scheduler</h1>
            <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
                <div className="flex-1">
                    <label className="block mb-2 font-medium">Select Event</label>
                    {loadingData ? (
                        <div className="text-gray-500">Loading events...</div>
                    ) : (
                        <select
                            className="form-input w-full max-w-md"
                            value={selectedEvent}
                            onChange={e => setSelectedEvent(e.target.value)}
                        >
                            <option value="">-- Select an event --</option>
                            {events.map(ev => (
                                <option key={ev.id} value={ev.id}>
                                    {ev.name} ({ev.date ? new Date(ev.date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }) : ""})
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <button
                    className="primary-btn px-6 py-2 rounded disabled:opacity-50 mt-4 md:mt-0"
                    disabled={!selectedEvent || loadingData}
                    onClick={async () => {
                        setResult(null);
                        try {
                            const res = await runSchedulerAction(selectedEvent);
                            setResult(
                                `Scheduled ${res.meetings.length} meeting(s). ` +
                                (res.unmatchedStudents.length ? `Unmatched students: ${res.unmatchedStudents.join(', ')}. ` : '') +
                                (res.unmatchedProfessors.length ? `Unmatched professors: ${res.unmatchedProfessors.join(', ')}.` : '')
                            );
                        } catch (err) {
                            setResult('Error running scheduler.');
                        }
                    }}
                    title={selectedEvent ? 'Run the scheduler for the selected event' : 'Select an event to enable'}
                    style={{ cursor: !selectedEvent || loadingData ? 'not-allowed' : 'pointer', opacity: !selectedEvent || loadingData ? 0.6 : 1 }}
                >
                    Run Scheduler
                </button>
            </div>
            {result && (
                <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
                    {result}
                </div>
            )}
            {selectedEvent && (
                <>
                    {(() => {
                        const event = events.find(e => e.id === selectedEvent);
                        if (!event) return null;
                        return (
                            <div className="flex justify-center">
                                <div className="text-lg font-semibold text-gray-900 mb-8">
                                    Event Time: {formatSlotTime(event.start_time)} - {formatSlotTime(event.end_time)}
                                </div>
                            </div>
                        );
                    })()}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Professors</h2>
                            <div className="bg-white rounded-lg shadow p-0 overflow-x-auto">
                                <table className="events-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Department</th>
                                            <th>Available Slots</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {professors.length === 0 ? (
                                            <tr><td colSpan={4} className="text-gray-400">No professors found</td></tr>
                                        ) : (
                                            professors.map(p => (
                                                <tr key={p.id}>
                                                    <td>{p.name}</td>
                                                    <td>{p.email}</td>
                                                    <td>{p.department}</td>
                                                    <td>
                                                        <span className="text-xs text-green-800 font-semibold">
                                                            {Array.isArray(p.available_slots) ? p.available_slots.length : (p.available_slots ? JSON.parse(p.available_slots).length : 0)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Students</h2>
                            <div className="bg-white rounded-lg shadow p-0 overflow-x-auto">
                                <table className="events-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Department</th>
                                            <th>Available Slots</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.length === 0 ? (
                                            <tr><td colSpan={4} className="text-gray-400">No students found</td></tr>
                                        ) : (
                                            students.map(s => (
                                                <tr key={s.id}>
                                                    <td>{s.name}</td>
                                                    <td>{s.email}</td>
                                                    <td>{s.department}</td>
                                                    <td>
                                                        <span className="text-xs text-green-800 font-semibold">
                                                            {Array.isArray(s.available_slots) ? s.available_slots.length : (s.available_slots ? JSON.parse(s.available_slots).length : 0)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
} 