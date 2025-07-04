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
            {events.length === 0 ? (
                <div>No events found or error loading events. Check server logs for details.</div>
            ) : (
                <table className="events-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Date</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Slot Length</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((event: Event) => {
                            let dateStr = '';
                            let startTimeStr = event.start_time ? event.start_time.slice(0, 5) : '';
                            let endTimeStr = event.end_time ? event.end_time.slice(0, 5) : '';
                            let dateForEdit = (event.date && event.date.length >= 10) ? event.date.slice(0, 10) : '';
                            try {
                                const dateObj = new Date(event.date ?? '');
                                dateStr = isNaN(dateObj.getTime()) ? String(event.date) : dateObj.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' });
                            } catch {
                                dateStr = String(event.date);
                            }
                            return (
                                <tr key={event.id}>
                                    <td>{event.name}</td>
                                    <td>{dateStr}</td>
                                    <td>{startTimeStr}</td>
                                    <td>{endTimeStr}</td>
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