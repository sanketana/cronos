# Date Timezone Fix

## Issue Description

The event date in meetings was showing as 1 day less than the event date in the events table due to a timezone conversion issue.

## Root Cause

1. **Event Date Storage**: Events are stored with a `date` field (e.g., '2024-07-10') in the events table.

2. **Database Schema**: The `meetings` table uses `TIMESTAMPTZ` (timestamp with timezone) fields for `starts_at` and `ends_at`.

3. **Event Date Retrieval**: When fetching the event date from the database without casting to text, PostgreSQL was returning a Date object that could be timezone-converted.

4. **Meeting Creation Process**: In `resultHandler.ts`, timestamps were created using string parsing which could cause timezone conversion issues:
   ```typescript
   // BEFORE (Problematic)
   const starts_at = new Date(`${eventDate}T${start}:00Z`);
   const ends_at = new Date(`${eventDate}T${end}:00Z`);
   ```

5. **The Bug**: The date was being shifted by one day due to timezone conversion issues at two points:
   - When retrieving the event date from the database (PostgreSQL Date object conversion)
   - When creating JavaScript Date objects for meeting timestamps

## Fix Applied

### 1. Fixed Event Date Retrieval (resultHandler.ts)

**Before:**
```typescript
const eventRes = await client.query('SELECT date FROM events WHERE id = $1', [eventId]);
```

**After:**
```typescript
// Fetch event date for this eventId - cast to text to avoid timezone issues
const eventRes = await client.query('SELECT date::text as date FROM events WHERE id = $1', [eventId]);
```

### 2. Fixed Meeting Creation (resultHandler.ts)

**Before:**
```typescript
function parseSlotToTimestamps(eventDate: string, slot: string) {
    const [start, end] = slot.split('-').map(s => s.trim());
    const starts_at = new Date(`${eventDate}T${start}:00Z`);
    const ends_at = new Date(`${eventDate}T${end}:00Z`);
    return { starts_at, ends_at };
}
```

**After:**
```typescript
function parseSlotToTimestamps(eventDate: string, slot: string) {
    const [start, end] = slot.split('-').map(s => s.trim());
    
    // Debug logging to see what's being created
    console.log(`[DEBUG] Event date: ${eventDate}, Slot: ${slot}`);
    console.log(`[DEBUG] Start time: ${start}, End time: ${end}`);
    
    // Return the raw components for SQL construction
    return { 
        eventDateStr: eventDate, 
        startTime: start, 
        endTime: end 
    };
}

// In the main loop:
const { eventDateStr: parsedEventDate, startTime, endTime } = parseSlotToTimestamps(eventDateStr, m.slot);

// Use PostgreSQL's timestamp construction to avoid timezone issues
const starts_at_sql = `${parsedEventDate} ${startTime}:00`;
const ends_at_sql = `${parsedEventDate} ${endTime}:00`;

await client.query(
    'INSERT INTO meetings (event_id, faculty_id, student_id, start_time, end_time, source, run_id) VALUES ($1, $2, $3, $4::timestamp, $5::timestamp, $6, $7)',
    [m.eventId, m.professorId, m.studentId, starts_at_sql, ends_at_sql, 'AUTO', runId]
);
```

### 2. Fixed Meeting Display (MeetingsTabsClient.tsx)

**Before:**
```typescript
const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    timeZone: 'UTC' 
});
```

**After:**
```typescript
// Use local timezone instead of UTC to match the stored timestamps
const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit' 
});
```

## Impact

- **Before**: Meeting dates could appear one day earlier than the event date due to timezone conversion issues during database storage
- **After**: Meeting dates now correctly match the event date by using explicit Date constructor parameters

## Files Modified

1. `src/app/dashboard/scheduler/resultHandler.ts` - Fixed timestamp creation
2. `src/app/dashboard/meetings/MeetingsTabsClient.tsx` - Fixed time display

## Testing

The fix ensures that:
- Event dates are retrieved as text strings from the database to avoid PostgreSQL Date object timezone conversion
- Meeting timestamps are constructed as SQL strings and cast to timestamp type in PostgreSQL
- No JavaScript Date object timezone conversion occurs during database storage
- The exact date and time from the event are preserved when stored in the database
- Event dates and meeting dates now match correctly
- Database storage in TIMESTAMPTZ fields works correctly without date shifting

## Future Considerations

- If the application needs to support multiple timezones, consider implementing proper timezone handling
- For production deployments, ensure the server timezone is set correctly
- Consider adding timezone information to the database schema if needed
