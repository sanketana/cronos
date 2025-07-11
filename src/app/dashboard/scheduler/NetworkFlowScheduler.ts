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
        // Build a layered graph with (student, professor) pair nodes to enforce only one meeting per pair
        // Nodes: source, students, (student,professor) pairs, (student,professor,slot) triplets, professors, sink
        const source = 0;
        let nodeIdx = 1;
        const studentNodes: Record<string, number> = {};
        for (const s of input.students) studentNodes[s.id] = nodeIdx++;
        // (student, professor) pair nodes
        type Pair = { studentId: string; professorId: string };
        const pairKeys: string[] = [];
        const pairNodes: Record<string, number> = {};
        for (const student of input.students) {
            for (const professorId of student.preferences) {
                const key = `${student.id}|${professorId}`;
                if (!(key in pairNodes)) {
                    pairNodes[key] = nodeIdx++;
                    pairKeys.push(key);
                }
            }
        }
        // (student, professor, slot) triplet nodes
        type Triplet = { studentId: string; professorId: string; slot: string };
        const triplets: Triplet[] = [];
        const tripletNodes: Record<string, number> = {};
        for (const student of input.students) {
            for (const professorId of student.preferences) {
                const professor = input.professors.find(p => p.id === professorId);
                if (!professor) continue;
                const commonSlots = student.availableSlots.filter(slot => professor.availableSlots.includes(slot));
                for (const slot of commonSlots) {
                    const key = `${student.id}|${professorId}|${slot}`;
                    tripletNodes[key] = nodeIdx++;
                    triplets.push({ studentId: student.id, professorId, slot });
                }
            }
        }
        const professorNodes: Record<string, number> = {};
        for (const p of input.professors) professorNodes[p.id] = nodeIdx++;
        const sink = nodeIdx++;
        // Build graph
        const N = nodeIdx;
        const graph: Edge[][] = Array.from({ length: N }, () => []);
        // source -> students
        for (const s of input.students) {
            this.addEdge(graph, source, studentNodes[s.id], input.professors.length); // as many as preferences
        }
        // students -> (student,professor) pairs
        for (const key of pairKeys) {
            const [studentId, professorId] = key.split('|');
            this.addEdge(graph, studentNodes[studentId], pairNodes[key], 1); // only one meeting per pair
        }
        // (student,professor) pair -> (student,professor,slot) triplets
        for (const t of triplets) {
            const pairKey = `${t.studentId}|${t.professorId}`;
            const tripletKey = `${t.studentId}|${t.professorId}|${t.slot}`;
            this.addEdge(graph, pairNodes[pairKey], tripletNodes[tripletKey], 1);
        }
        // (student,professor,slot) triplet -> professor
        for (const t of triplets) {
            const tripletKey = `${t.studentId}|${t.professorId}|${t.slot}`;
            const pIdx = professorNodes[t.professorId];
            this.addEdge(graph, tripletNodes[tripletKey], pIdx, 1);
        }
        // professors -> sink
        for (const p of input.professors) {
            this.addEdge(graph, professorNodes[p.id], sink, input.students.length); // as many as students
        }
        // Edmonds-Karp
        let flow = 0;
        const parent: { v: number; e: number }[] = Array(N);
        while (this.bfs(graph, source, sink, parent)) {
            // Find min capacity along the path
            let pathCap = Infinity;
            for (let v = sink; v !== source;) {
                const u = parent[v].v;
                const eIdx = parent[v].e;
                pathCap = Math.min(pathCap, graph[u][eIdx].cap);
                v = u;
            }
            // Update capacities
            for (let v = sink; v !== source;) {
                const u = parent[v].v;
                const eIdx = parent[v].e;
                graph[u][eIdx].cap -= pathCap;
                const rev = graph[u][eIdx].rev;
                graph[v][rev].cap += pathCap;
                v = u;
            }
            flow += pathCap;
        }
        // Extract matches
        const meetings: ScheduledMeeting[] = [];
        for (const t of triplets) {
            const pairKey = `${t.studentId}|${t.professorId}`;
            const tripletKey = `${t.studentId}|${t.professorId}|${t.slot}`;
            // Find the edge from pairNode to tripletNode
            const edge = graph[pairNodes[pairKey]].find(e => e.to === tripletNodes[tripletKey]);
            if (edge && edge.cap === 0) { // used
                meetings.push({
                    eventId: input.eventId,
                    professorId: t.professorId,
                    studentId: t.studentId,
                    slot: t.slot,
                });
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