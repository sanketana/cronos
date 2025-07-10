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
        // Build bipartite graph: source -> student-slot -> professor-slot -> sink
        // Map nodes to indices
        const studentSlotNodes: { key: string, studentId: string, slot: string, idx: number }[] = [];
        const professorSlotNodes: { key: string, professorId: string, slot: string, idx: number }[] = [];
        const studentSlotKeyToIdx = new Map<string, number>();
        const professorSlotKeyToIdx = new Map<string, number>();
        let idx = 0;
        // Student-slot nodes
        for (const student of input.students) {
            for (const slot of student.availableSlots) {
                const key = `${student.id}|${slot}`;
                studentSlotNodes.push({ key, studentId: student.id, slot, idx });
                studentSlotKeyToIdx.set(key, idx);
                idx++;
            }
        }
        // Professor-slot nodes
        for (const professor of input.professors) {
            for (const slot of professor.availableSlots) {
                const key = `${professor.id}|${slot}`;
                professorSlotNodes.push({ key, professorId: professor.id, slot, idx });
                professorSlotKeyToIdx.set(key, idx);
                idx++;
            }
        }
        const source = idx++;
        const sink = idx++;
        const N = idx;
        // Build graph
        const graph: Edge[][] = Array.from({ length: N }, () => []);
        // Source -> student-slot (cap 1)
        for (const node of studentSlotNodes) {
            this.addEdge(graph, source, node.idx, 1);
        }
        // Professor-slot -> sink (cap 1)
        for (const node of professorSlotNodes) {
            this.addEdge(graph, node.idx, sink, 1);
        }
        // Student-slot -> professor-slot (if preferred and both available in slot)
        for (const sNode of studentSlotNodes) {
            const student = input.students.find(s => s.id === sNode.studentId)!;
            for (const professorId of student.preferences) {
                const pKey = `${professorId}|${sNode.slot}`;
                const pIdx = professorSlotKeyToIdx.get(pKey);
                if (pIdx !== undefined) {
                    this.addEdge(graph, sNode.idx, pIdx, 1, { studentId: sNode.studentId, professorId, slot: sNode.slot });
                }
            }
        }
        // Edmonds-Karp
        const parent: { v: number, e: number }[] = Array(N);
        let flow = 0;
        while (this.bfs(graph, source, sink, parent)) {
            let pathCap = Infinity;
            let v = sink;
            while (v !== source) {
                const { v: u, e } = parent[v];
                pathCap = Math.min(pathCap, graph[u][e].cap);
                v = u;
            }
            v = sink;
            while (v !== source) {
                const { v: u, e } = parent[v];
                graph[u][e].cap -= pathCap;
                graph[v][graph[u][e].rev].cap += pathCap;
                v = u;
            }
            flow += pathCap;
        }
        // Extract matches
        const meetings: ScheduledMeeting[] = [];
        for (const sNode of studentSlotNodes) {
            for (const edge of graph[sNode.idx]) {
                if (edge.originalCap === 1 && edge.cap === 0 && edge.meta) {
                    meetings.push({
                        eventId: input.eventId,
                        professorId: edge.meta.professorId,
                        studentId: edge.meta.studentId,
                        slot: edge.meta.slot,
                    });
                }
            }
        }
        // Unmatched students/professors
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