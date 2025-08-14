"use client";
import React, { useState } from "react";

interface Meeting {
    id: string;
    event_id: string;
    faculty_id: string;
    student_id: string;
    slot: string;
    event_name: string;
    faculty_name: string;
    student_name: string;
    start_time?: string;
    end_time?: string;
    // ...other fields
    professor_id?: string;
    professor_name?: string;
    run_id?: number; // Added run_id to the interface
}

interface User { id: string; name: string; }
interface Event { id: string; name: string; }
interface RunMeta {
    id: number;
    run_time: string;
    algorithm: string;
    triggered_by: string | null;
}

export default function MeetingsTabsClient({ meetings, professors, students, events, runs }: {
    meetings: Meeting[];
    professors: User[];
    students: User[];
    events: Event[];
    runs: RunMeta[];
}) {
    // Single-select filter state
    const [runIdFilter, setRunIdFilter] = useState('');
    const [eventFilter, setEventFilter] = useState('');
    const [facultyFilter, setFacultyFilter] = useState('');
    const [studentFilter, setStudentFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [slotFilter, setSlotFilter] = useState('');

    // Helper to format date and slot
    function formatDate(dateStr?: string) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
    }
    function formatSlot(startStr?: string, endStr?: string) {
        if (!startStr || !endStr) return '';
        const start = new Date(startStr);
        const end = new Date(endStr);
        // Use local timezone instead of UTC to match the stored timestamps
        const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return `${formatTime(start)} - ${formatTime(end)}`;
    }

    // Unique dates and slots for filters
    const uniqueDates = Array.from(new Set(meetings.map(m => formatDate(m.start_time)))).filter(Boolean);
    const uniqueSlots = Array.from(new Set(meetings.map(m => formatSlot(m.start_time, m.end_time)))).filter(Boolean);

    // Sort meetings by run_id descending before filtering
    const sortedMeetings = [...meetings].sort((a, b) => (b.run_id || 0) - (a.run_id || 0));
    const filteredMeetings = sortedMeetings.filter(m => {
        const runMatch = !runIdFilter || String(m.run_id) === runIdFilter;
        const eventMatch = !eventFilter || m.event_id === eventFilter;
        const facultyMatch = !facultyFilter || m.faculty_id === facultyFilter;
        const studentMatch = !studentFilter || m.student_id === studentFilter;
        const dateMatch = !dateFilter || formatDate(m.start_time) === dateFilter;
        const slotMatch = !slotFilter || formatSlot(m.start_time, m.end_time) === slotFilter;
        return runMatch && eventMatch && facultyMatch && studentMatch && dateMatch && slotMatch;
    });

    function handleExportExcel() {
        const exportData = filteredMeetings.map(m => ({
            Event: m.event_name,
            Faculty: m.faculty_name,
            Student: m.student_name,
            Date: formatDate(m.start_time),
            Slot: formatSlot(m.start_time, m.end_time),
        }));
        if (exportData.length === 0) return;
        const headers = Object.keys(exportData[0]);
        const csvRows = [
            headers.join(','),
            ...exportData.map(row => headers.map(field => `"${((row as Record<string, string>)[field] ?? '').toString().replace(/"/g, '""')}"`).join(',')),
        ];
        const csvString = csvRows.join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'meetings.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    return (
        <div>
            <h1 className="dashboard-title">Meetings</h1>
            <button
                className="primary-btn export-btn"
                onClick={handleExportExcel}
            >
                Export as Excel
            </button>
            <div style={{ marginTop: '1.5rem' }}>
                <div>
                    <table className="events-table">
                        <thead>
                            <tr className="filter-row">
                                <th className="run-id-col">
                                    <select className="filter-select" value={runIdFilter} onChange={e => setRunIdFilter(e.target.value)}>
                                        <option value="">Run ID</option>
                                        {runs.map(run => (
                                            <option key={run.id} value={run.id}>
                                                {`#${run.id} | ${run.algorithm} | ${new Date(run.run_time).toLocaleString()}`}
                                            </option>
                                        ))}
                                    </select>
                                </th>
                                <th>
                                    <select className="filter-select" value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
                                        <option value="">Event</option>
                                        {events.map(ev => (
                                            <option key={ev.id} value={ev.id}>{ev.name}</option>
                                        ))}
                                    </select>
                                </th>
                                <th>
                                    <select className="filter-select" value={facultyFilter} onChange={e => setFacultyFilter(e.target.value)}>
                                        <option value="">Faculty</option>
                                        {professors.map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </th>
                                <th>
                                    <select className="filter-select" value={studentFilter} onChange={e => setStudentFilter(e.target.value)}>
                                        <option value="">Student</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </th>
                                <th>
                                    <select className="filter-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                                        <option value="">Date</option>
                                        {uniqueDates.map(date => (
                                            <option key={date} value={date}>{date}</option>
                                        ))}
                                    </select>
                                </th>
                                <th>
                                    <select className="filter-select" value={slotFilter} onChange={e => setSlotFilter(e.target.value)}>
                                        <option value="">Slot</option>
                                        {uniqueSlots.map(slot => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMeetings.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        {meetings.length === 0 ? (
                                            <div className="text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-center">
                                                <strong>No meetings available.</strong><br />
                                                Meetings are only visible for events that are in &quot;Published&quot; status.
                                            </div>
                                        ) : (
                                            <div className="text-gray-500 text-center">No meetings match the selected filters.</div>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filteredMeetings.map(m => (
                                    <tr key={m.id}>
                                        <td className="run-id-col">{m.run_id}</td>
                                        <td>{m.event_name}</td>
                                        <td>{m.faculty_name}</td>
                                        <td>{m.student_name}</td>
                                        <td>{formatDate(m.start_time)}</td>
                                        <td>{formatSlot(m.start_time, m.end_time)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
} 