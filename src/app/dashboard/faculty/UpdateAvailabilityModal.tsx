"use client";
import React, { useState, useEffect } from "react";
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

export default function UpdateAvailabilityModal({ isOpen, onClose, faculty, onSubmit }: Props) {
    const [eventId, setEventId] = useState("");
    const [events, setEvents] = useState<any[]>([]);
    const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
    const [slotLen, setSlotLen] = useState(30);
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("17:00");
    const [eventDate, setEventDate] = useState("");
    const [allSlots, setAllSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [facultyAvailabilities, setFacultyAvailabilities] = useState<Record<string, string[]>>({});

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
            setStartTime(ev.start_time || "09:00");
            setEndTime(ev.end_time || "17:00");
            setEventDate(typeof ev.date === 'string' ? ev.date.slice(0, 10) : ev.date instanceof Date ? ev.date.toISOString().slice(0, 10) : '');
            setAllSlots(getTimeSlots(ev.start_time, ev.end_time, ev.slot_len));
            setSelectedSlot("");
            // Use prefetched facultyAvailabilities
            setUnavailableSlots(facultyAvailabilities[ev.id] || []);
        }
    }, [eventId, facultyAvailabilities, events]);

    function addSlot() {
        if (selectedSlot && !unavailableSlots.includes(selectedSlot)) {
            setUnavailableSlots(prev => [...prev, selectedSlot]);
            setSelectedSlot("");
        }
    }

    function removeSlot(slot: string) {
        setUnavailableSlots(prev => prev.filter(s => s !== slot));
    }

    function handleSave() {
        if (!eventId) return;
        setLoading(true);
        upsertAvailability({ facultyId: faculty.id, eventId, slots: unavailableSlots, preferences: "" })
            .then(() => {
                setLoading(false);
                onSubmit({ eventId, slots: unavailableSlots, preferences: "" });
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
            <div className="modal" style={{ minWidth: 360, maxWidth: 540, background: 'var(--northwestern-surface)' }}>
                <h2 className="modal-title mb-4">Update Unavailability for <span className="text-nw-purple font-semibold">{faculty.name}</span></h2>
                <div className="space-y-4">
                    <div className="form-group">
                        <label className="form-label font-medium">Event</label>
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
                                <label className="form-label font-medium mb-1">Event Timings</label>
                                <div className="flex flex-col md:flex-row md:items-center md:gap-6 text-sm text-gray-700 dark:text-gray-200">
                                    <div>Date: <b>{eventDate}</b></div>
                                    <div>Start: <b>{formatTime12h(startTime)}</b></div>
                                    <div>End: <b>{formatTime12h(endTime)}</b></div>
                                    <div>Slot Length: <b>{slotLen} min</b></div>
                                </div>
                            </div>
                            <div className="form-group flex flex-col md:flex-row md:items-end gap-2">
                                <div className="flex-1">
                                    <label className="form-label font-medium">Add Unavailable Slot</label>
                                    <select className="form-input rounded-md border-gray-300 focus:border-nw-purple focus:ring-nw-purple" value={selectedSlot} onChange={e => setSelectedSlot(e.target.value)}>
                                        <option value="">Select Slot</option>
                                        {allSlots.filter(slot => !unavailableSlots.includes(slot)).map(slot => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                </div>
                                <button type="button" className="primary-btn h-10 px-4 rounded-md" onClick={addSlot} disabled={!selectedSlot}>Add</button>
                            </div>
                            {/* Unavailable slots on next line, not inline with dropdown */}
                            <div className="form-group mt-2">
                                <label className="form-label font-medium">Unavailable Slots</label>
                                <div className="flex flex-col gap-2 mt-1 w-full">
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