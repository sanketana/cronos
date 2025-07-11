import { IMatchingAlgorithm, MatchingInput, MatchingResult, ScheduledMeeting } from './IMatchingAlgorithm';

export class GreedyScheduler implements IMatchingAlgorithm {
    async computeMatches(input: MatchingInput): Promise<MatchingResult> {
        // Greedy matching: for each student, for each preferred professor, schedule in first available slot
        const meetings: ScheduledMeeting[] = [];
        const usedSlots = new Set<string>(); // key: studentId|slot or professorId|slot
        for (const student of input.students) {
            for (const professorId of student.preferences) {
                // Find the professor object
                const professor = input.professors.find(p => p.id === professorId);
                if (!professor) continue;
                // Find the first slot where both are available and neither is booked
                const commonSlots = student.availableSlots.filter(slot => professor.availableSlots.includes(slot));
                let scheduled = false;
                for (const slot of commonSlots) {
                    const studentSlotKey = `${student.id}|${slot}`;
                    const professorSlotKey = `${professor.id}|${slot}`;
                    if (!usedSlots.has(studentSlotKey) && !usedSlots.has(professorSlotKey)) {
                        meetings.push({
                            eventId: input.eventId,
                            professorId: professor.id,
                            studentId: student.id,
                            slot,
                        });
                        usedSlots.add(studentSlotKey);
                        usedSlots.add(professorSlotKey);
                        scheduled = true;
                        break; // Only one meeting per student-professor pair
                    }
                }
            }
        }
        const matchedStudentIds = new Set(meetings.map(m => m.studentId));
        const matchedProfessorIds = new Set(meetings.map(m => m.professorId));
        const unmatchedStudents = input.students.map(s => s.id).filter(id => !matchedStudentIds.has(id));
        const unmatchedProfessors = input.professors.map(p => p.id).filter(id => !matchedProfessorIds.has(id));
        return { meetings, unmatchedStudents, unmatchedProfessors };
    }
} 