'use server';
import { runScheduler } from './index';
import { MatchingResult } from './IMatchingAlgorithm';

export async function runSchedulerAction(eventId: string, algorithm: string = 'NetworkFlow'): Promise<MatchingResult> {
    return await runScheduler(eventId, algorithm);
} 