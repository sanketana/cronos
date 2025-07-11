'use server';
import { prepareMatchingInput } from './dataPreparation';
import { GreedyScheduler } from './GreedyScheduler';
import { NetworkFlowScheduler } from './NetworkFlowScheduler';
import { saveMeetings } from './resultHandler';
import { MatchingResult, IMatchingAlgorithm } from './IMatchingAlgorithm';
import { Client } from 'pg';

export async function runScheduler(eventId: string, algorithm: string = 'Greedy'): Promise<MatchingResult> {
    // Insert a new scheduler_runs row
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    const runRes = await client.query(
        'INSERT INTO scheduler_runs (algorithm, triggered_by) VALUES ($1, $2) RETURNING id',
        [algorithm, null]
    );
    const runId = runRes.rows[0].id;
    await client.end();

    const input = await prepareMatchingInput(eventId);
    let scheduler: IMatchingAlgorithm;
    switch (algorithm) {
        case 'NetworkFlow':
            scheduler = new NetworkFlowScheduler();
            break;
        case 'Greedy':
        default:
            scheduler = new GreedyScheduler();
            break;
    }
    const result = await scheduler.computeMatches(input);
    await saveMeetings(result.meetings, runId);
    return result;
} 
