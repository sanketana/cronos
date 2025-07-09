'use server';
import { Client } from 'pg';

export async function createStudent(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const department = formData.get('department') as string;
    if (!name || !email) throw new Error('Name and email are required');
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    await client.query(
        'INSERT INTO users (name, email, department, role, status) VALUES ($1, $2, $3, $4, $5)',
        [name, email, department, 'student', 'active']
    );
    await client.end();
}

export async function updateStudent(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const department = formData.get('department') as string;
    const status = formData.get('status') as string;
    if (!id || !name || !email) throw new Error('ID, name, and email are required');
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    await client.query(
        'UPDATE users SET name = $1, email = $2, department = $3, status = $4 WHERE id = $5 AND role = $6',
        [name, email, department, status, id, 'student']
    );
    await client.end();
}

export async function deleteStudent(id: string) {
    if (!id) throw new Error('ID is required');
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    await client.query('DELETE FROM users WHERE id = $1 AND role = $2', [id, 'student']);
    await client.end();
}

export async function upsertPreference({ studentId, eventId, professorIds, preferences, unavailableSlots }: { studentId: string; eventId: string; professorIds: string[]; preferences: string; unavailableSlots: string[] }) {
    if (!studentId || !eventId || !professorIds || professorIds.length < 3 || professorIds.length > 5) throw new Error('Must select 3-5 professors');
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    await client.query(
        `INSERT INTO preferences (student_id, event_id, professor_ids, preferences, available_slots, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (student_id, event_id)
         DO UPDATE SET professor_ids = $3, preferences = $4, available_slots = $5, updated_at = NOW()`,
        [studentId, eventId, JSON.stringify(professorIds), preferences, unavailableSlots]
    );
    await client.end();
}

export async function getAllPreferences() {
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query(`
        SELECT p.id, p.student_id, s.name as student_name, s.email as student_email, s.department as student_department, p.event_id, e.name as event_name, e.date as event_date, p.professor_ids, p.preferences, p.available_slots, p.updated_at
        FROM preferences p
        JOIN users s ON p.student_id = s.id
        JOIN events e ON p.event_id = e.id
        ORDER BY p.updated_at DESC
    `);
    await client.end();
    return result.rows;
} 