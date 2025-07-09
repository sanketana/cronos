"use client";
import React, { useState, useEffect, useRef } from "react";
import { getAllEvents } from "../actions";
import { upsertAvailability, getAvailability, getAllAvailabilitiesForFaculty } from "./actions";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    faculty: { id: string; name: string };
    onSubmit: (data: { eventId: string; slots: string[]; preferences: string }) => void;
}

function getTimeSlots(start: string, end: string, slotLen: number): string[] {
    // start, end: "HH:mm", slotLen: minutes
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

function formatTime12h(timeStr: string) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(":");
    let hour = parseInt(h, 10);
    const minute = parseInt(m, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

// Helper to generate slots within a range
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

export default function UpdateAvailabilityModal({ isOpen, onClose, faculty, onSubmit }: Props) {
    const [eventId, setEventId] = useState("");
    const [events, setEvents] = useState<any[]>([]);
    const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
    const [slotLen, setSlotLen] = useState(30);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [allSlots, setAllSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [facultyAvailabilities, setFacultyAvailabilities] = useState<Record<string, string[]>>({});
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const selectAllRef = useRef<HTMLInputElement>(null);

    // Prefetch all events on mount (not just when modal opens)
    useEffect(() => {
        async function fetchEvents() {
            const eventsData = await getAllEvents();
            setEvents(eventsData);
        }
        fetchEvents();
    }, []);

    // Prefetch all availabilities for this faculty when modal opens
    useEffect(() => {
        async function fetchAvailabilities() {
            if (isOpen && faculty.id) {
                const allAvail = await getAllAvailabilitiesForFaculty(faculty.id);
                const availMap: Record<string, string[]> = {};
                for (const row of allAvail) {
                    availMap[row.event_id] = Array.isArray(row.unavailable_slots) ? row.unavailable_slots : [];
                }
                setFacultyAvailabilities(availMap);
            }
        }
        fetchAvailabilities();
    }, [isOpen, faculty.id]);

    useEffect(() => {
        if (!eventId) return;
        const ev = events.find(e => e.id === eventId);
        if (ev) {
            setSlotLen(ev.slot_len || 30);
            setStartTime(ev.start_time || "");
            setEndTime(ev.end_time || "");
            setEventDate(typeof ev.date === 'string' ? ev.date.slice(0, 10) : ev.date instanceof Date ? ev.date.toISOString().slice(0, 10) : '');
            let slotsFromEvent: string[] = [];
            if (ev.available_slots && ev.available_slots.length > 0) {
                let ranges: string[];
                if (Array.isArray(ev.available_slots)) {
                    ranges = ev.available_slots;
                } else if (typeof ev.available_slots === 'string') {
                    try {
                        // Try to parse as JSON array
                        ranges = JSON.parse(ev.available_slots);
                        if (!Array.isArray(ranges)) {
                            ranges = ev.available_slots.split(',').map((s: string) => s.trim()).filter(Boolean);
                        }
                    } catch {
                        ranges = ev.available_slots.split(',').map((s: string) => s.trim()).filter(Boolean);
                    }
                } else {
                    ranges = [];
                }
                slotsFromEvent = getSlotsFromRanges(ranges, ev.slot_len);
            } else {
                slotsFromEvent = getTimeSlots(ev.start_time, ev.end_time, ev.slot_len);
            }
            setAllSlots(slotsFromEvent);
            setSelectedSlot("");
            setAvailableSlots(slotsFromEvent); // select all by default
        }
    }, [eventId, facultyAvailabilities, events]);

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = availableSlots.length > 0 && availableSlots.length < allSlots.length;
        }
    }, [availableSlots, allSlots]);

    useEffect(() => {
        if (isOpen) {
            setStartTime("");
            setEndTime("");
        }
    }, [isOpen]);

    function handleSlotToggle(slot: string) {
        setAvailableSlots(prev => prev.includes(slot)
            ? prev.filter(s => s !== slot)
            : [...prev, slot]
        );
    }

    function handleSave() {
        if (!eventId) return;
        setLoading(true);
        upsertAvailability({ facultyId: faculty.id, eventId, slots: availableSlots, preferences: "" })
            .then(() => {
                setLoading(false);
                onSubmit({ eventId, slots: availableSlots, preferences: "" });
                onClose();
            })
            .catch(e => {
                setError(e.message || "Failed to save");
                setLoading(false);
            });
    }

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ minWidth: 360, maxWidth: 540, minHeight: 700, maxHeight: 900, background: 'var(--northwestern-surface)' }}>
                <h2 className="modal-title mb-4">Update Availability for <span className="text-nw-purple font-semibold">{faculty.name}</span></h2>
                <div className="space-y-4">
                    <div className="form-group">
                        <label className="form-label font-bold">Select Event</label>
                        <select className="form-input rounded-md border-gray-300 focus:border-nw-purple focus:ring-nw-purple" value={eventId} onChange={e => setEventId(e.target.value)} required>
                            <option value="">Select Event</option>
                            {events.map(ev => (
                                <option key={ev.id} value={ev.id}>
                                    {ev.name} (
                                    {typeof ev.date === 'string'
                                        ? ev.date.slice(0, 10)
                                        : ev.date instanceof Date
                                            ? ev.date.toISOString().slice(0, 10)
                                            : ''}
                                    )
                                </option>
                            ))}
                        </select>
                    </div>
                    {eventId && (
                        <>
                            <div className="form-group bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                                <div className="flex flex-col md:flex-row md:items-center md:gap-6 text-sm text-gray-700 dark:text-gray-200">
                                    <div><b>Event Timings:</b> {formatTime12h(startTime)} - {formatTime12h(endTime)}</div>
                                    <div><b>Slot Length:</b> {slotLen} min</div>
                                </div>
                            </div>
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
                                    <div className="flex flex-col gap-2 w-full" style={{ maxHeight: 500, overflowY: 'auto' }}>
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
                    {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
                    <div className="modal-actions flex justify-end gap-2 mt-4">
                        <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="button" className="primary-btn" onClick={handleSave} disabled={loading || !eventId}>{loading ? "Saving..." : "Save"}</button>
                    </div>
                </div>
            </div>
        </div>
    );
} 