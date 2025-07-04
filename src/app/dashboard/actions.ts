"use server";
import { Client } from 'pg';
import { revalidatePath } from 'next/cache';

export async function createEvent(formData: FormData) {
  const name = formData.get('name') as string;
  const date = formData.get('date') as string;
  const slotLen = Number(formData.get('slotLen'));
  const status = formData.get('status') as string;
  const startTime = formData.get('start_time') as string; // time string
  const endTime = formData.get('end_time') as string; // time string
  if (!name || !date || !slotLen || !status || !startTime || !endTime) {
    throw new Error('Missing required fields');
  }
  const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
  await client.connect();
  await client.query(
    'INSERT INTO events (name, date, slot_len, status, start_time, end_time) VALUES ($1, $2, $3, $4, $5, $6)',
    [name, date, slotLen, status, startTime, endTime]
  );
  await client.end();
  revalidatePath('/dashboard');
}

export async function deleteEvent(id: string) {
  if (!id) throw new Error('Missing event id');
  const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
  await client.connect();
  await client.query('DELETE FROM events WHERE id = $1', [id]);
  await client.end();
  revalidatePath('/dashboard/events');
}

export async function updateEvent(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const date = formData.get('date') as string;
  const slotLen = Number(formData.get('slotLen'));
  const status = formData.get('status') as string;
  const startTime = formData.get('start_time') as string; // time string
  const endTime = formData.get('end_time') as string; // time string
  if (!id || !name || !date || !slotLen || !status || !startTime || !endTime) {
    throw new Error('Missing required fields');
  }
  const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
  await client.connect();
  await client.query(
    'UPDATE events SET name = $1, date = $2, slot_len = $3, status = $4, start_time = $5, end_time = $6 WHERE id = $7',
    [name, date, slotLen, status, startTime, endTime, id]
  );
  await client.end();
  revalidatePath('/dashboard/events');
}

export async function getAllEvents() {
  const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
  await client.connect();
  const result = await client.query('SELECT id, name, date, slot_len, status, start_time, end_time FROM events ORDER BY date DESC');
  await client.end();
  return result.rows;
} 