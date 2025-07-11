import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

export async function POST(req: NextRequest) {
    try {
        const { runId } = await req.json();
        if (!runId) {
            return NextResponse.json({ error: "Missing runId" }, { status: 400 });
        }
        const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL, ssl: { rejectUnauthorized: false } });
        await client.connect();
        const result = await client.query("DELETE FROM meetings WHERE run_id = $1", [runId]);
        await client.end();
        return NextResponse.json({ deletedCount: result.rowCount });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to delete meetings" }, { status: 500 });
    }
} 