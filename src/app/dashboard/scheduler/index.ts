'use server';
import { prepareMatchingInput } from './dataPreparation';
import { DummyScheduler } from './DummyScheduler';
import { saveMeetings } from './resultHandler';
import { MatchingResult } from './IMatchingAlgorithm';

export async function runScheduler(eventId: string): Promise<MatchingResult> {
    const input = await prepareMatchingInput(eventId);
    const scheduler = new DummyScheduler();
    const result = await scheduler.computeMatches(input);
    await saveMeetings(result.meetings);
    return result;
} 