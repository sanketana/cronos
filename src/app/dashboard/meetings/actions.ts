'use server';
import { Client } from 'pg';
import { revalidatePath } from 'next/cache';

export async function createMeeting(formData: FormData) {
    const eventId = formData.get('event_id') as string;
    const facultyId = formData.get('faculty_id') as string;
    const studentId = formData.get('student_id') as string;
    const startTime = formData.get('start_time') as string;
    const endTime = formData.get('end_time') as string;
    const source = formData.get('source') as string || 'MANUAL';

    if (!eventId || !facultyId || !studentId || !startTime || !endTime) {
        throw new Error('Missing required fields');
    }

    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    
    try {
        await client.query(
            'INSERT INTO meetings (event_id, faculty_id, student_id, start_time, end_time, source) VALUES ($1, $2, $3, $4, $5, $6)',
            [eventId, facultyId, studentId, startTime, endTime, source]
        );
    } finally {
        await client.end();
    }
    
    revalidatePath('/dashboard/meetings');
}

export async function updateMeeting(formData: FormData) {
    const id = formData.get('id') as string;
    const eventId = formData.get('event_id') as string;
    const facultyId = formData.get('faculty_id') as string;
    const studentId = formData.get('student_id') as string;
    const startTime = formData.get('start_time') as string;
    const endTime = formData.get('end_time') as string;

    if (!id || !eventId || !facultyId || !studentId || !startTime || !endTime) {
        throw new Error('Missing required fields');
    }

    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    
    try {
        await client.query(
            'UPDATE meetings SET event_id = $1, faculty_id = $2, student_id = $3, start_time = $4, end_time = $5 WHERE id = $6',
            [eventId, facultyId, studentId, startTime, endTime, id]
        );
    } finally {
        await client.end();
    }
    
    revalidatePath('/dashboard/meetings');
}

export async function deleteMeeting(id: string) {
    if (!id) throw new Error('Missing meeting id');

    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    
    try {
        await client.query('DELETE FROM meetings WHERE id = $1', [id]);
    } finally {
        await client.end();
    }
    
    revalidatePath('/dashboard/meetings');
}
