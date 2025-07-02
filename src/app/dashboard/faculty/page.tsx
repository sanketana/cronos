import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Client } from 'pg';
import FacultyTableClient from './FacultyTableClient';
import AvailabilitiesTableClient from './AvailabilitiesTableClient';
import { getAllAvailabilities } from './actions';
import FacultyTabsClient from './FacultyTabsClient';

interface Faculty {
    id: string;
    name: string;
    email: string;
    department: string;
    status: string;
    created_at: string;
}

async function getFacultyWithAuth() {
    const cookieStore = await cookies();
    const session = cookieStore.get('chronos_session');
    if (!session) {
        redirect('/login');
    }
    let faculty: Faculty[] = [];
    try {
        const client = new Client({
            connectionString: process.env.NEON_POSTGRES_URL,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();
        const result = await client.query<Faculty>(
            'SELECT id, name, email, department, status, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
            ['faculty']
        );
        faculty = result.rows;
        await client.end();
    } catch (err: unknown) {
        if (typeof err === 'object' && err !== null) {
            console.error('FacultyPage error:', err);
        } else {
            console.error('FacultyPage error:', err);
        }
    }
    return faculty;
}

export default async function FacultyPage() {
    const faculty = await getFacultyWithAuth();
    const availabilities = await getAllAvailabilities();
    return <FacultyTabsClient faculty={faculty} availabilities={availabilities} />;
} 