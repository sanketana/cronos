"use client";
import React, { useState, useEffect } from "react";
import { getAllEvents } from "../actions";
import { upsertAvailability } from "./actions";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    faculty: { id: string; name: string };
    onSubmit: (data: { eventId: string; slots: string; preferences: string }) => void;
}

export default function UpdateAvailabilityModal({ isOpen, onClose, faculty, onSubmit }: Props) {
    const [eventId, setEventId] = useState("");
    const [slots, setSlots] = useState("");
    const [preferences, setPreferences] = useState("");
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState<{ id: string; name: string; date: string; status: string }[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);

    useEffect(() => {
        async function fetchEvents() {
            setEventsLoading(true);
            const data = await getAllEvents();
            setEvents(data);
            setEventsLoading(false);
        }
        if (isOpen) fetchEvents();
    }, [isOpen]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        await upsertAvailability({
            facultyId: faculty.id,
            eventId,
            slots,
            preferences,
        });
        setLoading(false);
        onClose();
        window.location.reload();
    }

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ minWidth: 320, maxWidth: 400 }}>
                <h2 className="modal-title">Update Availability for {faculty.name}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Event</label>
                        <select
                            className="form-input"
                            value={eventId}
                            onChange={e => setEventId(e.target.value)}
                            required
                            disabled={eventsLoading}
                        >
                            <option value="">{eventsLoading ? "Loading events..." : "Select Event"}</option>
                            {events.map(ev => (
                                <option key={ev.id} value={ev.id}>
                                    {ev.name} ({typeof ev.date === 'string' ? ev.date.slice(0, 10) : new Date(ev.date).toISOString().slice(0, 10)})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Available Time Ranges</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="e.g. 09:00 - 10:30, 13:00 - 14:30"
                            value={slots}
                            onChange={e => setSlots(e.target.value)}
                            required
                        />
                        <div className="text-xs text-gray-500 mt-1">Enter one or more time ranges, separated by commas. Example: 09:00 - 10:30, 13:00 - 14:30</div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Preferences / Notes</label>
                        <textarea
                            className="form-input"
                            value={preferences}
                            onChange={e => setPreferences(e.target.value)}
                            rows={2}
                            placeholder="Optional notes or preferences"
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className="primary-btn" disabled={loading || !eventId || !slots}>{loading ? "Saving..." : "Save"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
} 