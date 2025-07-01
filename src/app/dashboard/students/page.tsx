import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Client } from 'pg';
import React from 'react';
import StudentsTableClient from './StudentsTableClient';

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

export default async function StudentsPage() {
    const students = await getStudentsWithAuth();
    return (
        <div>
            <h1 className="dashboard-title">Students</h1>
            <StudentsTableClient students={students} />
        </div>
    );
} 