"use client";
import React from "react";

interface Preference {
    id: string;
    student_id: string;
    student_name: string;
    student_email: string;
    event_id: string;
    event_name: string;
    event_date: string;
    professor_ids: string[];
    preferences: string;
    updated_at: string;
    available_slots?: string[];
}

interface Faculty {
    id: string;
    name: string;
}

// For now, just show professor_ids as comma-separated IDs. Later, can map to names if needed.
export default function PreferencesTableClient({ preferences, faculty }: { preferences: Preference[]; faculty: Faculty[] }) {
    // Create a map for quick lookup
    const facultyMap = React.useMemo(() => {
        const map: Record<string, string> = {};
        faculty.forEach(f => { map[f.id] = f.name; });
        return map;
    }, [faculty]);

    // Filter state
    const [studentFilter, setStudentFilter] = React.useState("");
    const [professorFilter, setProfessorFilter] = React.useState("");
    const [eventFilter, setEventFilter] = React.useState("");

    // Unique event names for dropdown
    const eventNames = React.useMemo(() => {
        const set = new Set<string>();
        preferences.forEach(p => set.add(p.event_name));
        return Array.from(set);
    }, [preferences]);

    // Filtered preferences
    const filtered = React.useMemo(() => {
        return preferences.filter(p => {
            // Student filter (name or email)
            const studentMatch = studentFilter.trim() === "" ||
                p.student_name.toLowerCase().includes(studentFilter.toLowerCase()) ||
                p.student_email.toLowerCase().includes(studentFilter.toLowerCase());
            // Event filter
            const eventMatch = eventFilter.trim() === "" || p.event_name === eventFilter;
            // Professor filter (pattern search)
            let professorMatch = true;
            if (professorFilter.trim() !== "") {
                const profNames = Array.isArray(p.professor_ids)
                    ? p.professor_ids.map(id => facultyMap[id] || id)
                    : [];
                professorMatch = profNames.some(name => name.toLowerCase().includes(professorFilter.toLowerCase()));
            }
            return studentMatch && eventMatch && professorMatch;
        });
    }, [preferences, studentFilter, professorFilter, eventFilter, facultyMap]);

    return (
        <div>
            <div className="w-full flex flex-wrap md:flex-nowrap gap-4 items-end bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
                <input
                    className="form-input"
                    style={{ minWidth: 180 }}
                    placeholder="Filter by student name or email"
                    value={studentFilter}
                    onChange={e => setStudentFilter(e.target.value)}
                />
                <input
                    className="form-input"
                    style={{ minWidth: 180 }}
                    placeholder="Filter by professor name"
                    value={professorFilter}
                    onChange={e => setProfessorFilter(e.target.value)}
                />
                <select
                    className="form-input"
                    style={{ minWidth: 180 }}
                    value={eventFilter}
                    onChange={e => setEventFilter(e.target.value)}
                >
                    <option value="">All Events</option>
                    {eventNames.map(ev => (
                        <option key={ev} value={ev}>{ev}</option>
                    ))}
                </select>
            </div>
            <table className="events-table">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Email</th>
                        <th>Event</th>
                        <th>Event Date</th>
                        <th>Professor Preference</th>
                        <th>Available Slots</th>
                        <th>Notes</th>
                        <th>Last Updated</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.length === 0 ? (
                        <tr><td colSpan={8}>No preferences found.</td></tr>
                    ) : (
                        filtered.map(p => (
                            <tr key={p.id}>
                                <td>{p.student_name}</td>
                                <td>{p.student_email}</td>
                                <td>{p.event_name}</td>
                                <td>{typeof p.event_date === 'string' ? p.event_date.slice(0, 10) : new Date(p.event_date).toISOString().slice(0, 10)}</td>
                                <td>{Array.isArray(p.professor_ids)
                                    ? p.professor_ids.map(id => facultyMap[id] || id).join(", ")
                                    : p.professor_ids}
                                </td>
                                <td>{Array.isArray(p.available_slots) ? p.available_slots.join(", ") : (p.available_slots || "-")}</td>
                                <td>{p.preferences || '-'}</td>
                                <td>{typeof p.updated_at === 'string' ? p.updated_at.slice(0, 16).replace('T', ' ') : new Date(p.updated_at).toLocaleString()}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
} 