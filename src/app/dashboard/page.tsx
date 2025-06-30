import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sql } from '@vercel/postgres';
import EventModalButton from './EventModalButton';

interface Event {
    id: string;
    name: string;
    date: string;
    slot_len: number;
    status: string;
    created_at: string;
}

export default async function DashboardPage() {
    // Server-side session check
    const cookieStore = cookies();
    const session = cookieStore.get('chronos_session');
    if (!session) {
        redirect('/login');
    }

    // Fetch events from the database
    const { rows: events } = await sql<Event>`SELECT * FROM events ORDER BY created_at DESC`;

    return (
        <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-8">
            <h1 className="text-3xl font-bold text-northwestern-purple mb-4">Chronos Dashboard</h1>
            <p className="text-gray-900 dark:text-gray-300 mb-8">Welcome, Admin! Here you can manage events, availabilities, and preferences.</p>
            <EventModalButton />
            <div className="bg-northwestern-purple text-white p-4 mb-4">Test Northwestern Purple</div>
            <h2 className="text-xl font-bold mt-8 mb-4">Events</h2>
            {events.length === 0 ? (
                <div>No events found.</div>
            ) : (
                <ul className="space-y-2">
                    {events.map(event => (
                        <li key={event.id} className="p-4 rounded bg-gray-100 dark:bg-gray-800">
                            <div className="font-semibold text-northwestern-purple">{event.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{event.date} &bull; {event.slot_len} min slots &bull; {event.status}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
} 