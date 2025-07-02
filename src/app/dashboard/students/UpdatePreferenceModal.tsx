"use client";
import React, { useEffect, useState } from "react";
import { getAllEvents } from "../actions";
import { upsertPreference } from "./actions";
import { getAvailableFacultyForEvent } from "../faculty/actions";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    student: { id: string; name: string };
}

export default function UpdatePreferenceModal({ isOpen, onClose, student }: Props) {
    const [eventId, setEventId] = useState("");
    const [professors, setProfessors] = useState<{ id: string; name: string }[]>([]);
    const [professorChoices, setProfessorChoices] = useState<(string | null)[]>([null, null, null, null, null]);
    const [events, setEvents] = useState<{ id: string; name: string; date: string }[]>([]);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            const eventsData = await getAllEvents();
            setEvents(eventsData);
        }
        if (isOpen) fetchData();
    }, [isOpen]);

    useEffect(() => {
        async function fetchAvailableFaculty() {
            if (eventId) {
                const available = await getAvailableFacultyForEvent(eventId);
                setProfessors(available);
                setProfessorChoices([null, null, null, null, null]);
            } else {
                setProfessors([]);
                setProfessorChoices([null, null, null, null, null]);
            }
        }
        fetchAvailableFaculty();
    }, [eventId]);

    function handleProfessorChange(idx: number, value: string) {
        setProfessorChoices(prev => {
            const updated = [...prev];
            updated[idx] = value || null;
            return updated;
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const selected = professorChoices.filter(Boolean) as string[];
        if (selected.length < 3) {
            setError("Select at least 3 professors.");
            return;
        }
        if (new Set(selected).size !== selected.length) {
            setError("No duplicate professors allowed.");
            return;
        }
        setLoading(true);
        await upsertPreference({
            studentId: student.id,
            eventId,
            professorIds: selected,
            preferences: notes,
        });
        setLoading(false);
        onClose();
        window.location.reload();
    }

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ minWidth: 340, maxWidth: 480 }}>
                <h2 className="modal-title">Update Preference for {student.name}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Event</label>
                        <select className="form-input" value={eventId} onChange={e => setEventId(e.target.value)} required>
                            <option value="">Select Event</option>
                            {events.map(ev => (
                                <option key={ev.id} value={ev.id}>{ev.name} ({typeof ev.date === 'string' ? ev.date.slice(0, 10) : new Date(ev.date).toISOString().slice(0, 10)})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Professor Preferences</label>
                        {[0, 1, 2, 3, 4].map(idx => (
                            <div key={idx} style={{ marginBottom: 8 }}>
                                <label className="form-label">
                                    Preference {idx + 1} {idx >= 3 ? <span className="text-xs text-gray-500">(optional)</span> : null}
                                </label>
                                <select
                                    className="form-input"
                                    value={professorChoices[idx] || ""}
                                    onChange={e => handleProfessorChange(idx, e.target.value)}
                                    required={idx < 3}
                                    disabled={!eventId || professors.length === 0}
                                >
                                    <option value="">Select Professor</option>
                                    {professors
                                        .filter(p =>
                                            // Only show professors not already selected in other dropdowns
                                            !professorChoices.includes(p.id) || professorChoices[idx] === p.id
                                        )
                                        .map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                </select>
                            </div>
                        ))}
                        <div className="text-xs text-gray-500 mt-1">Select at least 3 professors. No duplicates allowed. Professors shown are only those available for the selected event.</div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Notes (optional)</label>
                        <textarea className="form-input" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional notes or preferences" />
                    </div>
                    {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
                    <div className="modal-actions">
                        <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className="primary-btn" disabled={loading || !eventId || professorChoices.filter(Boolean).length < 3}>{loading ? "Saving..." : "Save"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
} 