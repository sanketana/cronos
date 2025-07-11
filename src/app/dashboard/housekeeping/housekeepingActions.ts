'use server';
import { Client } from 'pg';

export async function deleteMeetingsByRunId(runId: number): Promise<number> {
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    const res = await client.query('DELETE FROM meetings WHERE run_id = $1 RETURNING id', [runId]);
    await client.end();
    return res.rowCount || 0;
}

export async function getAllSchedulerRuns(): Promise<{ id: number; run_time: string; }[]> {
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    const res = await client.query('SELECT id, run_time FROM scheduler_runs ORDER BY run_time DESC');
    await client.end();
    return res.rows;
}

export async function getMeetingCountByRunId(runId: number): Promise<number> {
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    const res = await client.query('SELECT COUNT(*) FROM meetings WHERE run_id = $1', [runId]);
    await client.end();
    return Number(res.rows[0]?.count || 0);
}

export async function deleteAllMeetings(): Promise<number> {
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    const res = await client.query('DELETE FROM meetings RETURNING id');
    await client.end();
    return res.rowCount || 0;
} 