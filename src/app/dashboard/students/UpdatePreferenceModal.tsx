"use client";
import React, { useEffect, useState } from "react";
import { getAllEvents } from "../actions";
import { upsertPreference } from "./actions";
import { getAvailableFacultyForEvent } from "../faculty/actions";
import { getAllPreferences } from "./actions";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    student: { id: string; name: string };
}

export default function UpdatePreferenceModal({ isOpen, onClose, student }: Props) {
    const [eventId, setEventId] = useState("");
    const [professors, setProfessors] = useState<{ id: string; name: string }[]>([]);
    const [professorChoices, setProfessorChoices] = useState<(string | null)[]>([null, null, null, null, null]);
    const [events, setEvents] = useState<{ id: string; name: string; date: string; start_time: string; end_time: string; slot_len: number }[]>([]);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [allSlots, setAllSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
    const [studentPrefs, setStudentPrefs] = useState<Record<string, string[]>>({});

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

    // Helper to get time slots for an event
    function getTimeSlots(start: string, end: string, slotLen: number): string[] {
        const slots: string[] = [];
        let [h, m] = start.split(":").map(Number);
        let [eh, em] = end.split(":").map(Number);
        let cur = h * 60 + m;
        const endMin = eh * 60 + em;
        while (cur + slotLen <= endMin) {
            const sh = String(Math.floor(cur / 60)).padStart(2, "0");
            const sm = String(cur % 60).padStart(2, "0");
            const ehh = String(Math.floor((cur + slotLen) / 60)).padStart(2, "0");
            const emm = String((cur + slotLen) % 60).padStart(2, "0");
            slots.push(`${sh}:${sm}-${ehh}:${emm}`);
            cur += slotLen;
        }
        return slots;
    }

    // Prefetch all preferences for this student when modal opens
    useEffect(() => {
        async function fetchPrefs() {
            if (isOpen && student.id) {
                const allPrefs = await getAllPreferences();
                const prefMap: Record<string, string[]> = {};
                for (const row of allPrefs) {
                    if (row.student_id === student.id && row.unavailable_slots) {
                        prefMap[row.event_id] = Array.isArray(row.unavailable_slots) ? row.unavailable_slots : [];
                    }
                }
                setStudentPrefs(prefMap);
            }
        }
        fetchPrefs();
    }, [isOpen, student.id]);

    // When event changes, set up slots and prefill unavailable slots
    useEffect(() => {
        if (!eventId) return;
        const ev = events.find(e => e.id === eventId);
        if (ev && ev.start_time && ev.end_time && ev.slot_len) {
            setAllSlots(getTimeSlots(ev.start_time, ev.end_time, ev.slot_len));
        } else {
            setAllSlots([]);
        }
        setUnavailableSlots(studentPrefs[eventId] || []);
        setSelectedSlot("");
    }, [eventId, events, studentPrefs]);

    function handleProfessorChange(idx: number, value: string) {
        setProfessorChoices(prev => {
            const updated = [...prev];
            updated[idx] = value || null;
            return updated;
        });
    }

    function addSlot() {
        if (selectedSlot && !unavailableSlots.includes(selectedSlot)) {
            setUnavailableSlots(prev => [...prev, selectedSlot]);
            setSelectedSlot("");
        }
    }

    function removeSlot(slot: string) {
        setUnavailableSlots(prev => prev.filter(s => s !== slot));
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
        try {
            await upsertPreference({
                studentId: student.id,
                eventId,
                professorIds: selected,
                preferences: notes,
                unavailableSlots,
            });
            setLoading(false);
            onClose();
            window.location.reload();
        } catch (err: any) {
            setLoading(false);
            setError(err?.message || 'Failed to save. Please try again.');
        }
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
                        <label className="form-label">Unavailable Slots</label>
                        <div className="flex flex-col md:flex-row md:items-end gap-2">
                            <div className="flex-1">
                                <select className="form-input rounded-md border-gray-300 focus:border-nw-purple focus:ring-nw-purple" value={selectedSlot} onChange={e => setSelectedSlot(e.target.value)}>
                                    <option value="">Select Slot</option>
                                    {allSlots.filter(slot => !unavailableSlots.includes(slot)).map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="button" className="primary-btn h-10 px-4 rounded-md" onClick={addSlot} disabled={!selectedSlot}>Add</button>
                        </div>
                        <div className="flex flex-col gap-2 mt-2 w-full">
                            {unavailableSlots.length === 0 && <span className="text-xs text-gray-500">No slots selected</span>}
                            {unavailableSlots.map(slot => (
                                <span key={slot} className="flex items-center bg-red-100 text-red-800 rounded-full px-3 py-1 text-xs font-semibold shadow-sm w-fit">
                                    {slot}
                                    <button type="button" className="ml-2 bg-northwestern-purple hover:bg-northwestern-dark-purple text-white rounded-full p-0.5 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-northwestern-purple" onClick={() => removeSlot(slot)} aria-label={`Remove slot ${slot}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </span>
                            ))}
                        </div>
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