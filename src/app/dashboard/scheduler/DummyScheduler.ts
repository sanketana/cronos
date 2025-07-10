import { IMatchingAlgorithm, MatchingInput, MatchingResult, ScheduledMeeting } from './IMatchingAlgorithm';

export class DummyScheduler implements IMatchingAlgorithm {
    async computeMatches(input: MatchingInput): Promise<MatchingResult> {
        // Very simple: pair the first student with the first professor in the first slot, if all exist
        const meetings: ScheduledMeeting[] = [];
        if (input.students.length && input.professors.length && input.slots.length) {
            meetings.push({
                eventId: input.eventId,
                professorId: input.professors[0].id,
                studentId: input.students[0].id,
                slot: input.slots[0],
            });
        }
        const unmatchedStudents = input.students.slice(1).map(s => s.id);
        const unmatchedProfessors = input.professors.slice(1).map(p => p.id);
        return { meetings, unmatchedStudents, unmatchedProfessors };
    }
} 