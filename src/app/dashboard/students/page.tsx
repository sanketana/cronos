import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Client } from 'pg';
import StudentsTabsClient from './StudentsTabsClient';
import { getAllPreferences } from './actions';

interface Student {
    id: string;
    name: string;
    email: string;
    department: string;
    status: string;
    created_at: string;
}

async function getStudentsWithAuth() {
    const cookieStore = await cookies();
    const session = cookieStore.get('chronos_session');
    if (!session) {
        redirect('/login');
    }
    let students: Student[] = [];
    try {
        const client = new Client({
            connectionString: process.env.NEON_POSTGRES_URL,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();
        const result = await client.query<Student>(
            'SELECT id, name, email, department, status, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
            ['student']
        );
        students = result.rows;
        await client.end();
    } catch (err: unknown) {
        if (typeof err === 'object' && err !== null) {
            console.error('StudentsPage error:', err);
        } else {
            console.error('StudentsPage error:', err);
        }
    }
    return students;
}

async function getFaculty() {
    let faculty: { id: string; name: string }[] = [];
    try {
        const client = new Client({
            connectionString: process.env.NEON_POSTGRES_URL,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();
        const result = await client.query('SELECT id, name FROM users WHERE role = $1', ['faculty']);
        faculty = result.rows;
        await client.end();
    } catch (err: unknown) {
        console.error('getFaculty error:', err);
    }
    return faculty;
}

export default async function StudentsPage() {
    const students = await getStudentsWithAuth();
    const preferences = await getAllPreferences();
    const faculty = await getFaculty();
    return <StudentsTabsClient students={students} preferences={preferences} faculty={faculty} />;
} 