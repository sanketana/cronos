"use server";
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

export async function createEvent(formData: FormData) {
    const name = formData.get('name') as string;
    const date = formData.get('date') as string;
    const slotLen = Number(formData.get('slotLen'));
    const status = formData.get('status') as string;
    if (!name || !date || !slotLen || !status) {
        throw new Error('Missing required fields');
    }
    await sql`
    INSERT INTO events (name, date, slot_len, status)
    VALUES (${name}, ${date}, ${slotLen}, ${status})
  `;
    revalidatePath('/dashboard');
} 