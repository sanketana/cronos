import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const runId = searchParams.get("runId");
        if (!runId) {
            return NextResponse.json({ error: "Missing runId" }, { status: 400 });
        }
        const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL, ssl: { rejectUnauthorized: false } });
        await client.connect();
        const result = await client.query("SELECT COUNT(*) FROM meetings WHERE run_id = $1", [runId]);
        await client.end();
        return NextResponse.json({ count: parseInt(result.rows[0].count, 10) });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to fetch meeting count" }, { status: 500 });
    }
} 