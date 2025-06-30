import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Client } from 'pg';
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
    const cookieStore = await cookies();
    const session = cookieStore.get('chronos_session');
    if (!session) {
        redirect('/login');
    }

    let events: Event[] = [];
    try {
        const client = new Client({ connectionString: process.env.POSTGRES_URL });
        await client.connect();
        const result = await client.query<Event>('SELECT * FROM events ORDER BY created_at DESC');
        events = result.rows;
        await client.end();
    } catch (err: any) {
        console.error('DashboardPage error:', {
            message: err?.message,
            stack: err?.stack,
            code: err?.code,
            detail: err?.detail,
            hint: err?.hint,
            err
        });
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-8">
            <h1 className="text-3xl font-bold text-northwestern-purple mb-4">Chronos Dashboard</h1>
            <p className="text-gray-900 dark:text-gray-300 mb-8">Welcome, Admin! Here you can manage events, availabilities, and preferences.</p>
            <EventModalButton />
            <div className="bg-northwestern-purple text-white p-4 mb-4">Test Northwestern Purple</div>
            <h2 className="text-xl font-bold mt-8 mb-4">Events</h2>
            {events.length === 0 ? (
                <div>No events found or error loading events. Check server logs for details.</div>
            ) : (
                <ul className="space-y-2">
                    {events.map((event: Event) => {
                        let dateStr: string = '';
                        let createdAtStr: string = '';
                        try {
                            const dateObj = new Date(event.date ?? '');
                            dateStr = isNaN(dateObj.getTime()) ? String(event.date) : dateObj.toISOString().slice(0, 10);
                        } catch {
                            dateStr = String(event.date);
                        }
                        try {
                            const createdAtObj = new Date(event.created_at ?? '');
                            createdAtStr = isNaN(createdAtObj.getTime()) ? String(event.created_at) : createdAtObj.toLocaleString();
                        } catch {
                            createdAtStr = String(event.created_at);
                        }
                        return (
                            <li key={event.id} className="p-4 rounded bg-gray-100 dark:bg-gray-800">
                                <div className="font-semibold text-northwestern-purple">{event.name}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    {dateStr} &nbsp;&bull;&nbsp;{event.slot_len} min slots &bull; {event.status}
                                    <br />
                                    {createdAtStr}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
} 