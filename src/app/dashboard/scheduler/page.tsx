"use client";

import React, { useState, useEffect } from "react";
import { getAllEvents } from "../actions";
import { getAllAvailabilities } from "../faculty/actions";
import { getAllPreferences } from "../students/actions";
import { runSchedulerAction } from "./actions";

export default function SchedulerPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState("");
    const [professors, setProfessors] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

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

    const handleRunScheduler = () => {
        // Scheduler is disabled
        setError('The scheduler is temporarily disabled.');
    };

    const confirmRunScheduler = async () => {
        setShowConfirm(false);
        setError('The scheduler is temporarily disabled.');
    };

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
                    disabled
                    title="The scheduler is temporarily disabled."
                    style={{ cursor: 'not-allowed', opacity: 0.6 }}
                >
                    Scheduler Disabled
                </button>
            </div>
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
            {showConfirm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-semibold mb-4">Confirm Run Scheduler</h3>
                        <p className="mb-6">Are you sure you want to run the scheduler for this event?</p>
                        <div className="flex justify-end gap-3">
                            <button className="secondary-btn" onClick={() => setShowConfirm(false)}>Cancel</button>
                            <button className="primary-btn" onClick={confirmRunScheduler}>Yes, Run</button>
                        </div>
                    </div>
                </div>
            )}
            {isLoading && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-20 z-40">
                    <div className="bg-white rounded-full p-6 shadow-lg flex items-center gap-3">
                        <svg className="animate-spin h-6 w-6 text-northwestern-purple" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        <span className="font-medium">Running scheduler...</span>
                    </div>
                </div>
            )}
            {success && (
                <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
                    Scheduler triggered!
                </div>
            )}
            {result && (
                <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
                    <div className="font-semibold mb-1">Scheduler Result</div>
                    <div>Meetings scheduled: <span className="font-bold">{result.meetings.length}</span></div>
                    <div>Unmatched students: <span className="font-bold">{result.unmatchedStudents.length}</span></div>
                    <div>Unmatched professors: <span className="font-bold">{result.unmatchedProfessors.length}</span></div>
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-red-700">
                    Error: {error}
                </div>
            )}
        </div>
    );
} 