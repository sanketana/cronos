"use server";
import { Client } from 'pg';
import { revalidatePath } from 'next/cache';

export async function createEvent(formData: FormData) {
  const name = formData.get('name') as string;
  const date = formData.get('date') as string;
  const slotLen = Number(formData.get('slotLen'));
  const status = formData.get('status') as string;
  if (!name || !date || !slotLen || !status) {
    throw new Error('Missing required fields');
  }
  const client = new Client({ connectionString: process.env.POSTGRES_URL });
  await client.connect();
  await client.query(
    'INSERT INTO events (name, date, slot_len, status) VALUES ($1, $2, $3, $4)',
    [name, date, slotLen, status]
  );
  await client.end();
  revalidatePath('/dashboard');
} 