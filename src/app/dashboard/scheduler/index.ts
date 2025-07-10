'use server';
import { prepareMatchingInput } from './dataPreparation';
import { NetworkFlowScheduler } from './NetworkFlowScheduler';
import { saveMeetings } from './resultHandler';
import { MatchingResult } from './IMatchingAlgorithm';
import { Client } from 'pg';

export async function runScheduler(eventId: string): Promise<MatchingResult> {
    // Insert a new scheduler_runs row
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    const runRes = await client.query(
        'INSERT INTO scheduler_runs (algorithm, triggered_by) VALUES ($1, $2) RETURNING id',
        ['NetworkFlow', null]
    );
    const runId = runRes.rows[0].id;
    await client.end();

    const input = await prepareMatchingInput(eventId);
    const scheduler = new NetworkFlowScheduler();
    const result = await scheduler.computeMatches(input);
    await saveMeetings(result.meetings, runId);
    return result;
} 