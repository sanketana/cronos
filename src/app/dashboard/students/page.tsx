import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Client } from 'pg';
import StudentsTabsClient from './StudentsTabsClient';

async function getSessionUser() {
    const cookieStore = await cookies();
    const session = cookieStore.get('chronos_session');
    if (!session) return null;
    try {
        return JSON.parse(session.value);
    } catch {
        return null;
    }
}

async function getStudentData(user: unknown) {
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    let students = [];
    let preferences = [];
    let faculty = [];
    if (user && typeof user === 'object' && (user as { role?: string }).role === 'student') {
        // Only fetch this student's data and preferences, with joins for names/emails
        const studentRes = await client.query('SELECT * FROM users WHERE id = $1', [(user as { userId: string }).userId]);
        students = studentRes.rows;
        const prefRes = await client.query(`
            SELECT p.*, u.name as student_name, u.email as student_email, e.name as event_name, e.date::text as event_date
            FROM preferences p
            LEFT JOIN users u ON p.student_id = u.id
            LEFT JOIN events e ON p.event_id = e.id
            WHERE p.student_id = $1
        `, [(user as { userId: string }).userId]);
        preferences = prefRes.rows;
    } else {
        // Admin: fetch all, with joins for names/emails
        const studentRes = await client.query('SELECT * FROM users WHERE role = $1', ['student']);
        students = studentRes.rows;
        const prefRes = await client.query(`
            SELECT p.*, u.name as student_name, u.email as student_email, e.name as event_name, e.date::text as event_date
            FROM preferences p
            LEFT JOIN users u ON p.student_id = u.id
            LEFT JOIN events e ON p.event_id = e.id
        `);
        preferences = prefRes.rows;
    }
    // Faculty list for preferences modal
    const facultyRes = await client.query('SELECT id, name FROM users WHERE role = $1', ['faculty']);
    faculty = facultyRes.rows;
    await client.end();
    return { students, preferences, faculty };
}

async function getStudentMeetings(user: unknown) {
    if (!user || typeof user !== 'object' || !(user as { userId?: string }).userId) return [];
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    const result = await client.query(`
        SELECT m.*, e.name as event_name, u1.name as faculty_name, u2.name as student_name
        FROM meetings m
        JOIN events e ON m.event_id = e.id
        JOIN users u1 ON m.faculty_id = u1.id
        JOIN users u2 ON m.student_id = u2.id
        WHERE m.student_id = $1
        ORDER BY m.start_time, m.event_id
    `, [(user as { userId: string }).userId]);
    await client.end();
    return result.rows.map(row => ({
        ...row,
        professor_id: row.faculty_id, // for compatibility
        professor_name: row.faculty_name,
    }));
}

export default async function StudentsDashboard() {
    const user = await getSessionUser();
    if (!user) redirect('/login');
    const { students, preferences, faculty } = await getStudentData(user);
    return <StudentsTabsClient students={students} preferences={preferences} faculty={faculty} />;
} 