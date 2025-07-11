import { IMatchingAlgorithm, MatchingInput, MatchingResult, ScheduledMeeting } from './IMatchingAlgorithm';

// Helper types for the graph
interface Edge {
    to: number;
    rev: number;
    cap: number;
    originalCap: number;
    meta?: any;
}

export class NetworkFlowScheduler implements IMatchingAlgorithm {
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

    private addEdge(graph: Edge[][], from: number, to: number, cap: number, meta?: any) {
        graph[from].push({ to, rev: graph[to].length, cap, originalCap: cap, meta });
        graph[to].push({ to: from, rev: graph[from].length - 1, cap: 0, originalCap: 0 });
    }

    private bfs(graph: Edge[][], s: number, t: number, parent: { v: number, e: number }[]): boolean {
        parent.fill(null as any);
        const queue: number[] = [s];
        parent[s] = { v: -1, e: -1 };
        while (queue.length) {
            const u = queue.shift()!;
            for (let i = 0; i < graph[u].length; ++i) {
                const e = graph[u][i];
                if (e.cap > 0 && parent[e.to] == null) {
                    parent[e.to] = { v: u, e: i };
                    if (e.to === t) return true;
                    queue.push(e.to);
                }
            }
        }
        return false;
    }
} 