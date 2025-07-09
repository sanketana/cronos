import React from 'react';
import StudentsTabsClient from './StudentsTabsClient';
import { getAllPreferences } from './actions';
import { Client } from 'pg';

async function getAllStudents() {
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const result = await client.query('SELECT id, name, email, department, status, created_at FROM users WHERE role = $1 ORDER BY created_at DESC', ['student']);
    await client.end();
    return result.rows;
}

async function getAllFaculty() {
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const result = await client.query('SELECT id, name FROM users WHERE role = $1', ['faculty']);
    await client.end();
    return result.rows;
}

export default async function StudentsDashboard() {
    const students = await getAllStudents();
    const preferences = await getAllPreferences();
    const faculty = await getAllFaculty();
    return <StudentsTabsClient students={students} preferences={preferences} faculty={faculty} />;
} 