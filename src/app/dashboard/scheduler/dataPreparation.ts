'use server';
import { MatchingInput } from './IMatchingAlgorithm';
import { getAllEvents } from '../actions';
import { getAllAvailabilities } from '../faculty/actions';
import { getAllPreferences } from '../students/actions';

// Helper to generate all slots for an event
function generateSlots(startTime: string, endTime: string, slotLen: number): string[] {
    const slots: string[] = [];
    let [h, m] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    while (h < endH || (h === endH && m < endM)) {
        const start = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        let nextM = m + slotLen;
        let nextH = h;
        if (nextM >= 60) {
            nextH += Math.floor(nextM / 60);
            nextM = nextM % 60;
        }
        const end = `${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`;
        slots.push(`${start}-${end}`);
        h = nextH;
        m = nextM;
    }
    return slots;
}

export async function prepareMatchingInput(eventId: string): Promise<MatchingInput> {
    // Fetch all data
    const [events, availabilities, preferences] = await Promise.all([
        getAllEvents(),
        getAllAvailabilities(),
        getAllPreferences(),
    ]);
    const event = events.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');
    const slots = generateSlots(event.start_time, event.end_time, event.slot_len);

    // Professors
    const professors = availabilities
        .filter((a: unknown) => (a as { event_id: string }).event_id === eventId)
        .map((a: unknown) => {
            const av = a as { faculty_id: string; available_slots?: string[] | string };
            let availableSlots: string[] = [];
            if (av.available_slots) {
                availableSlots = typeof av.available_slots === 'string' ? JSON.parse(av.available_slots) : av.available_slots;
            }
            return {
                id: av.faculty_id,
                availableSlots,
            };
        });

    // Students
    const students = preferences
        .filter((p: any) => p.event_id === eventId)
        .map((p: any) => {
            let availableSlots: string[] = [];
            if (p.available_slots) {
                availableSlots = typeof p.available_slots === 'string' ? JSON.parse(p.available_slots) : p.available_slots;
            }
            return {
                id: p.student_id,
                preferences: (typeof p.professor_ids === 'string' ? JSON.parse(p.professor_ids) : p.professor_ids) as string[],
                availableSlots,
            };
        });

    return {
        eventId,
        slots,
        professors,
        students,
    };
} 