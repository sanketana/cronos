"use client";
import React from 'react';
import EventModalButton from '../EventModalButton';
import EventModal from '../EventModal';
import DeleteEventButton from './DeleteEventButton';
import { updateEvent } from '../actions';
import { useRouter } from 'next/navigation';

interface Event {
    id: string;
    name: string;
    date: string;
    slot_len: number;
    status: string;
    created_at: string;
    start_time?: string;
    end_time?: string;
    available_slots?: string;
}

// Add a helper function to format time to AM/PM
function formatTimeAMPM(timeStr?: string) {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':');
    let h = parseInt(hour, 10);
    const m = minute;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
}

export default function EventsTableClient({ events }: { events: Event[] }) {
    const [editEvent, setEditEvent] = React.useState<Event | null>(null);
    const router = useRouter();

    async function handleEditSubmit(formData: FormData) {
        await updateEvent(formData);
        setEditEvent(null);
        router.refresh();
    }

    return (
        <div>
            <EventModalButton />
            {editEvent && (
                <EventModal
                    isOpen={!!editEvent}
                    onClose={() => setEditEvent(null)}
                    onSubmit={handleEditSubmit}
                    initialValues={editEvent}
                    submitLabel="Update"
                />
            )}
            
            {/* Event Lifecycle Information */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">📋 Event Lifecycle</h3>
                <div className="space-y-2 text-sm text-blue-700">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-800">CREATED</span>
                        <span className="text-blue-600">→ Event is created and configured</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-800">COLLECTING_AVAIL</span>
                        <span className="text-blue-600">→ Faculty and students submit availability</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-800">SCHEDULING</span>
                        <span className="text-blue-600">→ Algorithm runs to create meetings</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-700">PUBLISHED</span>
                        <span className="text-green-600">→ Meetings are visible to participants</span>
                    </div>
                </div>
                <p className="text-xs text-blue-600 mt-3 italic">
                    💡 Tip: Use the &quot;Edit&quot; button to change an event&apos;s status and move it through the lifecycle
                </p>
            </div>
            
            {events.length === 0 ? (
                <div>No events found or error loading events. Check server logs for details.</div>
            ) : (
                <table className="events-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Date</th>
                            <th>Event Timings</th>
                            <th>Sessions</th>
                            <th>Slot Length</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((event: Event) => {
                            let dateStr = '';
                            // Format date for display
                            try {
                                const dateObj = new Date(event.date ?? '');
                                dateStr = isNaN(dateObj.getTime())
                                    ? String(event.date)
                                    : dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
                            } catch {
                                dateStr = String(event.date);
                            }
                            
                            // Format date for edit (YYYY-MM-DD format for HTML date input)
                            let dateForEdit = '';
                            try {
                                const dateObj = new Date(event.date ?? '');
                                if (!isNaN(dateObj.getTime())) {
                                    // Use local date methods to avoid timezone issues
                                    const year = dateObj.getFullYear();
                                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                                    const day = String(dateObj.getDate()).padStart(2, '0');
                                    dateForEdit = `${year}-${month}-${day}`;
                                } else {
                                    dateForEdit = event.date || '';
                                }
                            } catch {
                                dateForEdit = event.date || '';
                            }
                            
                            return (
                                <tr key={event.id}>
                                    <td>{event.name}</td>
                                    <td>{dateStr}</td>
                                    <td>{formatTimeAMPM(event.start_time)} - {formatTimeAMPM(event.end_time)}</td>
                                    <td>{Array.isArray(event.available_slots) ? event.available_slots.join(', ') : (event.available_slots || '')}</td>
                                    <td>{event.slot_len} min</td>
                                    <td>{event.status}</td>
                                    <td>
                                        <button className="secondary-btn" style={{ marginRight: '0.5rem' }} onClick={() => setEditEvent({ ...event, date: dateForEdit })}>Edit</button>
                                        <DeleteEventButton eventId={event.id} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
} 