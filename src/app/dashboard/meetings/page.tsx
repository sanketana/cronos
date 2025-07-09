import MeetingsTabsClient from './MeetingsTabsClient';
import { Client } from 'pg';

async function getMeetings() {
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query(`
        SELECT m.*, e.name as event_name, u1.name as faculty_name, u2.name as student_name
        FROM meetings m
        JOIN events e ON m.event_id = e.id
        JOIN users u1 ON m.faculty_id = u1.id
        JOIN users u2 ON m.student_id = u2.id
        ORDER BY m.start_time, m.event_id
    `);
    await client.end();
    // Map professor_id to faculty_id in returned objects for compatibility
    return result.rows.map(row => ({
        ...row,
        professor_id: row.faculty_id, // for compatibility with frontend
        professor_name: row.faculty_name,
    }));
}

async function getProfessors() {
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query('SELECT id, name FROM users WHERE role = $1', ['faculty']);
    await client.end();
    return result.rows;
}

async function getStudents() {
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query('SELECT id, name FROM users WHERE role = $1', ['student']);
    await client.end();
    return result.rows;
}

async function getEvents() {
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query('SELECT id, name FROM events');
    await client.end();
    return result.rows;
}

export default async function MeetingsPage() {
    const [meetings, professors, students, events] = await Promise.all([
        getMeetings(),
        getProfessors(),
        getStudents(),
        getEvents()
    ]);
    return <MeetingsTabsClient meetings={meetings} professors={professors} students={students} events={events} />;
} 