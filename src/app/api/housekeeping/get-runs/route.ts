import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

export async function GET() {
    try {
        const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL, ssl: { rejectUnauthorized: false } });
        await client.connect();
        const result = await client.query('SELECT id, run_time, algorithm, triggered_by FROM scheduler_runs ORDER BY run_time DESC');
        await client.end();
        return NextResponse.json({ runs: result.rows });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to fetch runs" }, { status: 500 });
    }
} 