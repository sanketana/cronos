'use server';
import { Client } from 'pg';

export async function createFaculty(formData: FormData) {
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
        [name, email, department, 'faculty', 'active']
    );
    await client.end();
}

export async function updateFaculty(formData: FormData) {
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
        [name, email, department, status, id, 'faculty']
    );
    await client.end();
}

export async function deleteFaculty(id: string) {
    if (!id) throw new Error('ID is required');
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    await client.query('DELETE FROM users WHERE id = $1 AND role = $2', [id, 'faculty']);
    await client.end();
}

export async function upsertAvailability({ facultyId, eventId, slots, preferences }: { facultyId: string; eventId: string; slots: string; preferences: string }) {
    if (!facultyId || !eventId || !slots) throw new Error('Missing required fields');
    // Parse slots: '09:00 - 10:30, 13:00 - 14:30' => ["09:00 - 10:30", "13:00 - 14:30"]
    const slotArr = slots.split(',').map(s => s.trim()).filter(Boolean);
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    await client.query(
        `INSERT INTO availabilities (faculty_id, event_id, available_slots, preferences, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (faculty_id, event_id)
         DO UPDATE SET available_slots = $3, preferences = $4, updated_at = NOW()`,
        [facultyId, eventId, JSON.stringify(slotArr), preferences]
    );
    await client.end();
}

export async function getAllAvailabilities() {
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query(`
        SELECT a.id, a.faculty_id, u.name as faculty_name, u.email as faculty_email, a.event_id, e.name as event_name, e.date as event_date, a.available_slots, a.preferences, a.updated_at
        FROM availabilities a
        JOIN users u ON a.faculty_id = u.id
        JOIN events e ON a.event_id = e.id
        ORDER BY a.updated_at DESC
    `);
    await client.end();
    return result.rows;
}

export async function getAvailableFacultyForEvent(eventId: string) {
    if (!eventId) throw new Error('Missing eventId');
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query(`
        SELECT DISTINCT u.id, u.name
        FROM availabilities a
        JOIN users u ON a.faculty_id = u.id
        WHERE a.event_id = $1
        ORDER BY u.name ASC
    `, [eventId]);
    await client.end();
    return result.rows;
} 