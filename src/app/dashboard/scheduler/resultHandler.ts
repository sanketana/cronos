'use server';
import { ScheduledMeeting } from './IMatchingAlgorithm';
import { Client } from 'pg';

export async function saveMeetings(meetings: ScheduledMeeting[], runId: number) {
    if (!meetings.length) return;
    const eventId = meetings[0].eventId;
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    // Fetch event date for this eventId
    const eventRes = await client.query('SELECT date FROM events WHERE id = $1', [eventId]);
    if (!eventRes.rows.length) throw new Error('Event not found');
    const eventDate = eventRes.rows[0].date; // e.g., '2024-07-10'
    // Remove existing meetings for this event and runId
    await client.query('DELETE FROM meetings WHERE event_id = $1 AND run_id = $2', [eventId, runId]);
    // Helper to parse slot string to timestamps
    function parseSlotToTimestamps(eventDate: string, slot: string) {
        const [start, end] = slot.split('-').map(s => s.trim());
        const starts_at = new Date(`${eventDate}T${start}:00Z`);
        const ends_at = new Date(`${eventDate}T${end}:00Z`);
        return { starts_at, ends_at };
    }
    // Insert new meetings
    for (const m of meetings) {
        // Ensure eventDate is just YYYY-MM-DD
        const eventDateStr = typeof eventDate === 'string'
            ? eventDate.slice(0, 10)
            : eventDate instanceof Date
                ? eventDate.toISOString().slice(0, 10)
                : '';
        const { starts_at, ends_at } = parseSlotToTimestamps(eventDateStr, m.slot);
        if (isNaN(starts_at.getTime()) || isNaN(ends_at.getTime())) {
            throw new Error(`Invalid slot or event date: eventDate=${eventDateStr}, slot=${m.slot}`);
        }
        await client.query(
            'INSERT INTO meetings (event_id, faculty_id, student_id, start_time, end_time, source, run_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [m.eventId, m.professorId, m.studentId, starts_at, ends_at, 'AUTO', runId]
        );
    }
    await client.end();
} 