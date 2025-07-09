'use server';
import { ScheduledMeeting } from './IMatchingAlgorithm';
import { Client } from 'pg';

export async function saveMeetings(meetings: ScheduledMeeting[]) {
    if (!meetings.length) return;
    const eventId = meetings[0].eventId;
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    // Remove existing meetings for this event
    await client.query('DELETE FROM meetings WHERE event_id = $1', [eventId]);
    // Insert new meetings
    for (const m of meetings) {
        await client.query(
            'INSERT INTO meetings (event_id, professor_id, student_id, slot) VALUES ($1, $2, $3, $4)',
            [m.eventId, m.professorId, m.studentId, m.slot]
        );
    }
    await client.end();
} 