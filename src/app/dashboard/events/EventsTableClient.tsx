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
                            <th>Slot Length</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((event: Event) => {
                            let dateStr = '';
                            let createdAtStr = '';
                            try {
                                const dateObj = new Date(event.date ?? '');
                                dateStr = isNaN(dateObj.getTime()) ? String(event.date) : dateObj.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' });
                            } catch {
                                dateStr = String(event.date);
                            }
                            try {
                                const createdAtObj = new Date(event.created_at ?? '');
                                createdAtStr = isNaN(createdAtObj.getTime()) ? String(event.created_at) : createdAtObj.toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                            } catch {
                                createdAtStr = String(event.created_at);
                            }
                            return (
                                <tr key={event.id}>
                                    <td>{event.name}</td>
                                    <td>{dateStr}</td>
                                    <td>{event.slot_len} min</td>
                                    <td>{event.status}</td>
                                    <td>{createdAtStr}</td>
                                    <td>
                                        <button className="secondary-btn" style={{ marginRight: '0.5rem' }} onClick={() => setEditEvent(event)}>Edit</button>
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