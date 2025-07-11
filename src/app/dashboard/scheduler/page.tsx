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
    const [scheduling, setScheduling] = useState(false); // NEW: scheduling state
    const [result, setResult] = useState<any | null>(null); // Store full result object
    const [selectedAlgorithm, setSelectedAlgorithm] = useState('Greedy');
    const [logs, setLogs] = useState<string[]>([]); // For user-friendly logs

    // Algorithm descriptions
    const algorithmDescriptions: Record<string, string> = {
        Greedy: 'Fast, simple, good for most cases.',
        NetworkFlow: 'Optimal matching using advanced graph theory. Guarantees the maximum number of unique student-professor meetings, but may be slower for very large datasets.'
    };

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

    // Helper to map IDs to names
    function getStudentName(id: string) {
        const s = students.find((s: any) => s.id === id);
        return s ? s.name : id;
    }
    function getProfessorName(id: string) {
        const p = professors.find((p: any) => p.id === id);
        return p ? p.name : id;
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Scheduler</h1>
            {/* Spinner overlay when scheduling */}
            {scheduling && (
                <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                    <div className="w-full max-w-lg bg-white bg-opacity-90 rounded shadow p-4 mt-2">
                        <ul className="text-sm text-gray-700 max-h-40 overflow-y-auto">
                            {logs.length === 0 ? null : logs.map((log, i) => <li key={i}>{log}</li>)}
                        </ul>
                    </div>
                </div>
            )}
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
                <div>
                    <label className="block mb-2 font-medium">Select Algorithm</label>
                    <select
                        className="form-input"
                        value={selectedAlgorithm}
                        onChange={e => setSelectedAlgorithm(e.target.value)}
                    >
                        <option value="Greedy">🏃‍♂️ Greedy Algorithm (fast, simple, good for most cases)</option>
                        <option value="NetworkFlow">🧠 Network Flow Algorithm (optimal, best matching, slower for large data)</option>
                    </select>
                </div>
                <button
                    className="primary-btn px-6 py-2 rounded disabled:opacity-50 mt-4 md:mt-0 flex items-center gap-2"
                    disabled={!selectedEvent || loadingData || scheduling}
                    onClick={async () => {
                        setResult(null);
                        setLogs([]);
                        setScheduling(true);
                        try {
                            // Do not show 'Scheduler started...' log to user
                            const res = await runSchedulerAction(selectedEvent, selectedAlgorithm);
                            if ((res as any)?.logs && Array.isArray((res as any).logs)) {
                                setLogs((res as any).logs);
                            } else {
                                setLogs(logs => [...logs, 'Scheduler completed.']);
                            }
                            setResult(res);
                        } catch (err) {
                            setLogs(logs => [...logs, 'Error running scheduler.']);
                            setResult({ error: 'Error running scheduler.' });
                        } finally {
                            setScheduling(false);
                        }
                    }}
                    title={selectedEvent ? 'Run the scheduler for the selected event' : 'Select an event to enable'}
                    style={{ cursor: !selectedEvent || loadingData || scheduling ? 'not-allowed' : 'pointer', opacity: !selectedEvent || loadingData || scheduling ? 0.6 : 1 }}
                >
                    {scheduling && (
                        <span className="animate-spin mr-1" role="img" aria-label="Loading">⏳</span>
                    )}
                    {scheduling ? 'Scheduling...' : 'Run Scheduler'}
                </button>
            </div>
            {/* Scheduler report in rotated table format (metrics as rows) */}
            {result && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                    {result.error ? (
                        <div className="text-red-700 font-semibold">{result.error}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-[350px] text-sm" style={{ borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr>
                                        <td className="py-1 pr-4 pl-2 font-semibold text-gray-700 text-left align-top" style={{ borderBottom: '1px solid #eee', minWidth: '180px' }}>
                                            Status
                                        </td>
                                        <td className={`py-1 pl-2 text-left align-top ${result.error ? "text-red-700 font-semibold" : "text-green-700 font-semibold"}`} style={{ borderBottom: '1px solid #eee' }}>
                                            {result.error ? 'Error' : 'Success'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-1 pr-4 pl-2 font-semibold text-gray-700 text-left align-top" style={{ borderBottom: '1px solid #eee' }}>
                                            Total Meetings Scheduled
                                        </td>
                                        <td className="py-1 pl-2 text-green-900 text-left align-top" style={{ borderBottom: '1px solid #eee' }}>
                                            {result.meetings.length}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-1 pr-4 pl-2 font-semibold text-gray-700 text-left align-top" style={{ borderBottom: '1px solid #eee' }}>
                                            Time Taken (seconds)
                                        </td>
                                        <td className="py-1 pl-2 text-blue-900 text-left align-top" style={{ borderBottom: '1px solid #eee' }}>
                                            {typeof result.timeTakenSeconds === 'number' ? result.timeTakenSeconds.toFixed(2) : '-'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-1 pr-4 pl-2 font-semibold text-gray-700 text-left align-top" style={{ borderBottom: '1px solid #eee' }}>
                                            Unmatched Students
                                        </td>
                                        <td className="py-1 pl-2 text-yellow-900 text-left align-top" style={{ borderBottom: '1px solid #eee' }}>
                                            {result.unmatchedStudents?.length > 0 ? result.unmatchedStudents.map(getStudentName).join(', ') : 'None'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-1 pr-4 pl-2 font-semibold text-gray-700 text-left align-top">
                                            Unmatched Professors
                                        </td>
                                        <td className="py-1 pl-2 text-yellow-900 text-left align-top">
                                            {result.unmatchedProfessors?.length > 0 ? result.unmatchedProfessors.map(getProfessorName).join(', ') : 'None'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            {selectedEvent && (
                <>
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