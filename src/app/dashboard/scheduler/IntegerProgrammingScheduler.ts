import { IMatchingAlgorithm, MatchingInput, MatchingResult, ScheduledMeeting } from './IMatchingAlgorithm';

// Define types for the solver
interface OptimizationModel {
    optimize: string;
    opType: string;
    constraints: Record<string, { max?: number; min?: number; equal?: number }>;
    variables: Record<string, Record<string, number>>;
    ints: Record<string, number>;
}

interface SolverSolution {
    [key: string]: number;
}

export class IntegerProgrammingScheduler implements IMatchingAlgorithm {
    async computeMatches(input: MatchingInput): Promise<MatchingResult> {
        console.log('[IntegerProgrammingScheduler] Starting integer programming matching algorithm');

        const startTime = Date.now();

        // Create the optimization model
        const model = this.createOptimizationModel(input);

        console.log(`[IntegerProgrammingScheduler] Created model with ${Object.keys(model.variables).length} variables`);

        // Solve the optimization problem
        const SolverModule = await import('javascript-lp-solver');
        const solver = SolverModule.default;
        const solution = solver.Solve(model) as SolverSolution;

        const endTime = Date.now();
        const timeTaken = (endTime - startTime) / 1000;

        console.log(`[IntegerProgrammingScheduler] Solver completed in ${timeTaken.toFixed(2)} seconds`);
        console.log(`[IntegerProgrammingScheduler] Solver result:`, solution);

        // Extract meetings from the solution
        const meetings = this.extractMeetingsFromSolution(solution, input);

        // Calculate unmatched participants
        const matchedStudentIds = new Set(meetings.map(m => m.studentId));
        const matchedProfessorIds = new Set(meetings.map(m => m.professorId));
        const unmatchedStudents = input.students.map(s => s.id).filter(id => !matchedStudentIds.has(id));
        const unmatchedProfessors = input.professors.map(p => p.id).filter(id => !matchedProfessorIds.has(id));

        console.log(`[IntegerProgrammingScheduler] Finished. Scheduled ${meetings.length} meetings. Unmatched students: ${unmatchedStudents.join(', ')}. Unmatched professors: ${unmatchedProfessors.join(', ')}`);

        return {
            meetings,
            unmatchedStudents,
            unmatchedProfessors,
            timeTakenSeconds: timeTaken
        };
    }

    private createOptimizationModel(input: MatchingInput): OptimizationModel {
        const model: OptimizationModel = {
            optimize: "objective",
            opType: "max",
            constraints: {},
            variables: {},
            ints: {}
        };

        // Create variables for each valid (student, professor, slot) combination
        const validCombinations: Array<{ studentId: string, professorId: string, slot: string, preferenceRank: number }> = [];

        for (const student of input.students) {
            for (let prefIndex = 0; prefIndex < student.preferences.length; prefIndex++) {
                const professorId = student.preferences[prefIndex];
                const professor = input.professors.find(p => p.id === professorId);

                if (!professor) continue;

                // Find common available slots
                const commonSlots = student.availableSlots.filter(slot =>
                    professor.availableSlots.includes(slot)
                );

                for (const slot of commonSlots) {
                    validCombinations.push({
                        studentId: student.id,
                        professorId,
                        slot,
                        preferenceRank: prefIndex
                    });
                }
            }
        }

        console.log(`[IntegerProgrammingScheduler] Found ${validCombinations.length} valid combinations`);

        // Create variables and objective function
        const objectiveTerms: string[] = [];

        for (const combo of validCombinations) {
            const varName = `x_${combo.studentId}_${combo.professorId}_${combo.slot.replace(/[:-]/g, '_')}`;

            // Add to variables (binary: 0 or 1)
            model.variables[varName] = {};

            // Mark as integer variable
            model.ints[varName] = 1;

            objectiveTerms.push(varName);
        }

        // Set up objective function properly
        for (const combo of validCombinations) {
            const varName = `x_${combo.studentId}_${combo.professorId}_${combo.slot.replace(/[:-]/g, '_')}`;
            const weight = this.calculatePreferenceWeight(combo.preferenceRank, input.students[0].preferences.length);
            model.variables[varName].objective = weight;
        }

        // Constraint 1: Each student can have at most one meeting per time slot
        for (const student of input.students) {
            for (const slot of input.slots) {
                const constraintName = `student_${student.id}_slot_${slot.replace(/[:-]/g, '_')}`;
                model.constraints[constraintName] = { max: 1 };

                // Find all variables for this student-slot combination
                for (const combo of validCombinations) {
                    if (combo.studentId === student.id && combo.slot === slot) {
                        const varName = `x_${combo.studentId}_${combo.professorId}_${combo.slot.replace(/[:-]/g, '_')}`;
                        model.variables[varName][constraintName] = 1;
                    }
                }
            }
        }

        // Constraint 2: Each professor can have at most one meeting per time slot
        for (const professor of input.professors) {
            for (const slot of input.slots) {
                const constraintName = `professor_${professor.id}_slot_${slot.replace(/[:-]/g, '_')}`;
                model.constraints[constraintName] = { max: 1 };

                // Find all variables for this professor-slot combination
                for (const combo of validCombinations) {
                    if (combo.professorId === professor.id && combo.slot === slot) {
                        const varName = `x_${combo.studentId}_${combo.professorId}_${combo.slot.replace(/[:-]/g, '_')}`;
                        model.variables[varName][constraintName] = 1;
                    }
                }
            }
        }

        // Constraint 3: Each student can meet each professor at most once
        for (const student of input.students) {
            for (const professor of input.professors) {
                const constraintName = `student_${student.id}_professor_${professor.id}`;
                model.constraints[constraintName] = { max: 1 };

                // Find all variables for this student-professor combination
                for (const combo of validCombinations) {
                    if (combo.studentId === student.id && combo.professorId === professor.id) {
                        const varName = `x_${combo.studentId}_${combo.professorId}_${combo.slot.replace(/[:-]/g, '_')}`;
                        model.variables[varName][constraintName] = 1;
                    }
                }
            }
        }

        return model;
    }

    private calculatePreferenceWeight(preferenceRank: number, totalPreferences: number): number {
        // Higher weight for higher preference (lower rank)
        // Use exponential decay: weight = base^(totalPreferences - rank - 1)
        const base = 2;
        return Math.pow(base, totalPreferences - preferenceRank - 1);
    }

    private extractMeetingsFromSolution(solution: SolverSolution, input: MatchingInput): ScheduledMeeting[] {
        const meetings: ScheduledMeeting[] = [];

        // Extract all variables that are set to 1 (meaning a meeting is scheduled)
        for (const [varName, value] of Object.entries(solution)) {
            if (varName.startsWith('x_') && value === 1) {
                // Parse variable name: x_studentId_professorId_slot
                const parts = varName.substring(2).split('_');

                // The slot is the last 4 parts: HH_MM_HH_MM
                // We need to reconstruct it as HH:MM-HH:MM
                const slotParts = parts.slice(-4);
                const slot = `${slotParts[0]}:${slotParts[1]}-${slotParts[2]}:${slotParts[3]}`;

                // The professor ID is the part before the slot
                const professorId = parts[parts.length - 5];

                // The student ID is everything before the professor ID
                const studentId = parts.slice(0, -5).join('_');

                meetings.push({
                    eventId: input.eventId,
                    professorId,
                    studentId,
                    slot
                });

                console.log(`[IntegerProgrammingScheduler] Scheduled meeting: student ${studentId} with professor ${professorId} at slot ${slot}`);
            }
        }

        return meetings;
    }
} 