"use client";
import React, { useEffect, useState } from "react";
import { getAllEvents } from "../actions";
import { upsertPreference } from "./actions";
import { getAvailableFacultyForEvent } from "../faculty/actions";
import { getAllPreferences } from "./actions";
import { useRef } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    student: { id: string; name: string };
}

export default function UpdatePreferenceModal({ isOpen, onClose, student }: Props) {
    const [eventId, setEventId] = useState("");
    const [professors, setProfessors] = useState<{ id: string; name: string }[]>([]);
    const [professorChoices, setProfessorChoices] = useState<(string | null)[]>([null, null, null, null, null]);
    const [events, setEvents] = useState<{ id: string; name: string; date: string; start_time: string; end_time: string; slot_len: number; available_slots?: string }[]>([]);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [allSlots, setAllSlots] = useState<string[]>([]);
    const [studentPrefs, setStudentPrefs] = useState<Record<string, string[]>>({});
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [tab, setTab] = useState<'preferences' | 'slots'>('preferences');
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const errorPopupRef = useRef<HTMLDivElement>(null);
    const selectAllRef = useRef<HTMLInputElement>(null);

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

    // Helper to generate slots within a range (copied from faculty modal)
    function getSlotsFromRanges(ranges: string[], slotLen: number): string[] {
        const slots: string[] = [];
        for (const range of ranges) {
            const [start, end] = range.split('-').map(s => s.trim());
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

    // When event changes, set up slots and prefill available slots
    useEffect(() => {
        if (!eventId) return;
        const ev = events.find(e => e.id === eventId);
        if (ev && ev.slot_len) {
            let ranges: string[] = [];
            if (ev.available_slots && ev.available_slots.length > 0) {
                if (Array.isArray(ev.available_slots)) {
                    ranges = ev.available_slots;
                } else if (typeof ev.available_slots === 'string') {
                    try {
                        ranges = JSON.parse(ev.available_slots);
                        if (!Array.isArray(ranges)) {
                            ranges = ev.available_slots.split(',').map((s: string) => s.trim()).filter(Boolean);
                        }
                    } catch {
                        ranges = ev.available_slots.split(',').map((s: string) => s.trim()).filter(Boolean);
                    }
                }
            }
            const slotsFromEvent = getSlotsFromRanges(ranges, ev.slot_len);
            setAllSlots(slotsFromEvent);
            setAvailableSlots(slotsFromEvent); // select all by default
        } else {
            setAllSlots([]);
            setAvailableSlots([]);
        }
    }, [eventId, events]);

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = availableSlots.length > 0 && availableSlots.length < allSlots.length;
        }
    }, [availableSlots, allSlots]);

    function handleProfessorChange(idx: number, value: string) {
        setProfessorChoices(prev => {
            const updated = [...prev];
            updated[idx] = value || null;
            return updated;
        });
    }

    function handleSlotToggle(slot: string) {
        setAvailableSlots(prev => prev.includes(slot)
            ? prev.filter(s => s !== slot)
            : [...prev, slot]
        );
    }

    function canProceedToSlots() {
        const selected = professorChoices.filter(Boolean) as string[];
        if (selected.length < 3) return false;
        if (new Set(selected).size !== selected.length) return false;
        return true;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const selected = professorChoices.filter(Boolean) as string[];
        if (selected.length < 3) {
            setError("Please select at least 3 unique professors.");
            setShowErrorPopup(true);
            setTab('preferences');
            return;
        }
        if (new Set(selected).size !== selected.length) {
            setError("No duplicate professors allowed.");
            setShowErrorPopup(true);
            setTab('preferences');
            return;
        }
        setLoading(true);
        try {
            await upsertPreference({
                studentId: student.id,
                eventId,
                professorIds: selected,
                preferences: notes,
                unavailableSlots: availableSlots, // send as availableSlots
            });
            setLoading(false);
            onClose();
            window.location.reload();
        } catch (err: any) {
            setLoading(false);
            setError(err?.message || 'Failed to save. Please try again.');
            setShowErrorPopup(true);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ minWidth: 340, maxWidth: 540, minHeight: 900, maxHeight: 1100, overflowY: 'auto' }}>
                <h2 className="modal-title">Update Preference for {student.name}</h2>
                {error && <div className="text-red-600 text-sm mb-2 font-semibold">{error}</div>}
                <div className="form-group">
                    <label className="form-label">Event</label>
                    <select className="form-input" value={eventId} onChange={e => setEventId(e.target.value)} required>
                        <option value="">Select Event</option>
                        {events.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.name} ({typeof ev.date === 'string' ? ev.date.slice(0, 10) : new Date(ev.date).toISOString().slice(0, 10)})</option>
                        ))}
                    </select>
                </div>
                <div className="tabs flex mb-4">
                    <button
                        className={`tab-btn flex-1${tab === 'preferences' ? ' active-tab' : ''}`}
                        type="button"
                        onClick={() => setTab('preferences')}
                    >
                        Select your Professor preference
                    </button>
                    <button
                        className={`tab-btn flex-1${tab === 'slots' ? ' active-tab' : ''}`}
                        type="button"
                        onClick={() => setTab('slots')}
                    >
                        Available Slots
                    </button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 700, maxHeight: 900 }}>
                    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', overflow: 'visible' }}>
                        {tab === 'preferences' && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Select your Professor preference</label>
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
                                                <option value="" disabled>Select Professor</option>
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
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes (optional)</label>
                                    <textarea
                                        className="form-input"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Optional notes or preferences"
                                        rows={2}
                                    />
                                </div>
                            </>
                        )}
                        {tab === 'slots' && (
                            <>
                                <div className="form-group mt-2">
                                    <div className="font-bold text-gray-800 mb-3" style={{ fontWeight: 700 }}>I am available at below slots</div>
                                    <div className="w-full">
                                        <div className="flex items-center mb-3 p-3 rounded border-2 border-nw-purple bg-white shadow" style={{ position: 'relative', zIndex: 2 }}>
                                            <input
                                                type="checkbox"
                                                id="selectAllSlots"
                                                ref={selectAllRef}
                                                checked={availableSlots.length === allSlots.length && allSlots.length > 0}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        setAvailableSlots(allSlots);
                                                    } else {
                                                        setAvailableSlots([]);
                                                    }
                                                }}
                                                aria-checked={availableSlots.length > 0 && availableSlots.length < allSlots.length ? 'mixed' : availableSlots.length === allSlots.length}
                                            />
                                            <label htmlFor="selectAllSlots" className="ml-2 font-bold cursor-pointer text-nw-purple" style={{ letterSpacing: 1 }}>Select/Deselect All</label>
                                        </div>
                                        <hr className="mb-2 border-t-2 border-nw-purple" />
                                        <div className="flex flex-col gap-2 w-full" style={{ maxHeight: 700, overflowY: 'auto' }}>
                                            {allSlots.map((slot: string, idx: number) => (
                                                <label
                                                    key={slot}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded w-full ${idx % 2 === 0 ? 'bg-gray-100 dark:bg-gray-700' : 'bg-purple-50 dark:bg-gray-800'}`}
                                                    style={{ marginBottom: 4, display: 'block', border: '1px solid #e5e7eb' }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={availableSlots.includes(slot)}
                                                        onChange={() => handleSlotToggle(slot)}
                                                    />
                                                    <span>{slot}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="modal-actions flex justify-end gap-2 mt-4">
                        <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className="primary-btn" disabled={loading}>Save</button>
                    </div>
                </form>
                {/* Error Popup */}
                {showErrorPopup && (
                    <div ref={errorPopupRef} className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-white border border-red-400 rounded-lg shadow-lg p-6 max-w-xs w-full flex flex-col items-center">
                            <div className="text-red-600 font-semibold mb-2">{error}</div>
                            <button className="primary-btn mt-2" onClick={() => setShowErrorPopup(false)}>OK</button>
                        </div>
                        <div className="fixed inset-0 bg-black opacity-30 z-40" onClick={() => setShowErrorPopup(false)} />
                    </div>
                )}
            </div>
        </div>
    );
}

/* Add this CSS to your global or component CSS:
.tab-btn.active-tab {
  background: #ede9fe;
  color: #5a3696;
  font-weight: bold;
  border-bottom: 2px solid #5a3696;
}
.tab-btn:hover {
  color: #fff !important;
  background: #5a3696 !important;
}
*/ 