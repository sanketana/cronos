# Event Status Filtering Feature

## Overview
This feature restricts faculty and students to only select events that are in "COLLECTING_AVAIL" status when updating their availability and preferences.

## Problem Statement
Previously, faculty and students could select any event regardless of its status, which could lead to:
- Confusion about when to provide inputs
- Data collection happening at the wrong time in the workflow
- Inconsistent state management

## Solution
Implemented a status-based filtering system that ensures faculty and students can only interact with events that are actively collecting inputs.

## Changes Made

### 1. New Database Functions (`chronos/src/app/dashboard/actions.ts`)
- **`getEventsForInputCollection()`**: Returns only events with `COLLECTING_AVAIL` status
- **`getEventsForScheduling()`**: Returns only events with `SCHEDULING` status
- **`getEventsForMeetings()`**: Returns only events with `PUBLISHED` status
- **`getEventsByStatus(status)`**: Generic function to get events by any status
- **`getAllEvents()`**: Remains unchanged for admin use

### 2. Updated Faculty Modal (`chronos/src/app/dashboard/faculty/UpdateAvailabilityModal.tsx`)
- Changed from `getAllEvents()` to `getEventsForInputCollection()`
- Added user feedback when no events are available for input collection
- Shows clear message explaining that events must be in "Collecting Inputs" status

### 3. Updated Student Modal (`chronos/src/app/dashboard/students/UpdatePreferenceModal.tsx`)
- Changed from `getAllEvents()` to `getEventsForInputCollection()`
- Added user feedback when no events are available for input collection
- Shows clear message explaining that events must be in "Collecting Inputs" status

### 4. Updated Scheduler Page (`chronos/src/app/dashboard/scheduler/page.tsx`)
- Changed from `getAllEvents()` to `getEventsForScheduling()`
- Added user feedback when no events are available for scheduling
- Shows clear message explaining that events must be in "Scheduling" status

### 5. Updated Meetings Page (`chronos/src/app/dashboard/meetings/page.tsx`)
- Modified `getMeetings()` function to only return meetings for events with `PUBLISHED` status for faculty and students
- Updated `getEvents()` function to only return published events for faculty and students
- Added user feedback when no meetings are available
- Shows clear message explaining that meetings are only visible for published events

### 6. Updated Meetings Client (`chronos/src/app/dashboard/meetings/MeetingsTabsClient.tsx`)
- Added user feedback when no meetings are available
- Different messages for "no meetings at all" vs "no meetings match filters"

### 7. Documentation Updates
- Updated `README.md` with event status system documentation
- Created this implementation guide

## Event Status Workflow

```
CREATED → COLLECTING_AVAIL → SCHEDULING → PUBLISHED
   ↓           ↓                ↓           ↓
Admin    Faculty/Students   Scheduler   Published
creates   can provide       processes   schedule
event     inputs           matches     available
```

## Access Control Matrix

| User Type | Event Status Access | Purpose |
|-----------|-------------------|---------|
| Admin | All statuses | Full event management |
| Faculty | COLLECTING_AVAIL only | Provide availability |
| Student | COLLECTING_AVAIL only | Provide preferences |
| Scheduler | SCHEDULING only | Process scheduling |
| Faculty/Student | PUBLISHED only | View meetings |

## User Experience Improvements

### Before
- Faculty/students could select any event
- No clear indication of when to provide inputs
- Potential for data collection at wrong time

### After
- Faculty/students can only select events in "Collecting Inputs" status
- Scheduler can only select events in "Scheduling" status
- Faculty/students can only see meetings for events in "Published" status
- Clear feedback when no events are available
- Guided workflow that prevents confusion

## Testing Scenarios

1. **No Events in COLLECTING_AVAIL Status**
   - Faculty/student modals show informative message
   - No events appear in dropdown

2. **Events in COLLECTING_AVAIL Status**
   - Only those events appear in dropdown
   - Normal functionality preserved

3. **No Events in SCHEDULING Status**
   - Scheduler page shows informative message
   - No events appear in dropdown

4. **Events in SCHEDULING Status**
   - Only those events appear in scheduler dropdown
   - Normal scheduling functionality preserved

5. **Admin Access**
   - Admin can still see and manage all events
   - Event management continues to work with all events

6. **Status Transitions**
   - Events moved to COLLECTING_AVAIL become available to faculty/students
   - Events moved away from COLLECTING_AVAIL become unavailable
   - Events moved to SCHEDULING become available to scheduler
   - Events moved away from SCHEDULING become unavailable to scheduler
   - Events moved to PUBLISHED become available for meeting viewing
   - Events moved away from PUBLISHED become unavailable for meeting viewing

## Future Enhancements

1. **Status Change Notifications**: Notify faculty/students when events become available for input
2. **Deadline Management**: Add time-based restrictions within COLLECTING_AVAIL status
3. **Bulk Status Updates**: Allow admins to change multiple event statuses at once
4. **Audit Trail**: Track when events change status and who made the changes 