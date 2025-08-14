# Meetings CRUD Operations

## Overview

The meetings page now supports full CRUD (Create, Read, Update, Delete) operations for admin and superadmin users, similar to the faculty and students pages.

## Features

### 🔐 **Role-Based Access Control**
- **Admin and Superadmin**: Full CRUD access (Create, Edit, Delete meetings)
- **Faculty and Students**: Read-only access (view meetings only)

### ➕ **Create Meeting**
- **Button**: "+ Create New Meeting" (visible to admin/superadmin only)
- **Modal**: AddEditMeetingModal with form fields:
  - Event selection (dropdown)
  - Faculty selection (dropdown)
  - Student selection (dropdown)
  - Start time (datetime-local input)
  - End time (datetime-local input)
  - Source (Manual/Auto dropdown)

### ✏️ **Edit Meeting**
- **Button**: "Edit" button in Actions column (visible to admin/superadmin only)
- **Modal**: Same AddEditMeetingModal with pre-filled values
- **Fields**: All meeting properties can be modified

### 🗑️ **Delete Meeting**
- **Button**: "Delete" button in Actions column (visible to admin/superadmin only)
- **Confirmation**: Browser confirmation dialog before deletion
- **Cascade**: Direct deletion from database

### 📊 **Enhanced Table**
- **Actions Column**: Added for admin/superadmin users
- **Responsive**: Column span adjusts based on user role
- **Filtering**: All existing filters maintained

## Implementation Details

### Files Created/Modified:

1. **`actions.ts`** - Server actions for CRUD operations:
   - `createMeeting()` - Create new meeting
   - `updateMeeting()` - Update existing meeting
   - `deleteMeeting()` - Delete meeting

2. **`AddEditMeetingModal.tsx`** - Modal component for create/edit:
   - Form validation
   - Dropdown selections for event, faculty, student
   - Datetime inputs for start/end times
   - Source selection

3. **`MeetingsTabsClient.tsx`** - Enhanced with CRUD functionality:
   - Role-based conditional rendering
   - Modal state management
   - CRUD handler functions
   - Actions column in table

### Database Operations:

- **Create**: `INSERT INTO meetings (event_id, faculty_id, student_id, start_time, end_time, source)`
- **Update**: `UPDATE meetings SET ... WHERE id = ?`
- **Delete**: `DELETE FROM meetings WHERE id = ?`

### Security Features:

- **Role Validation**: Only admin/superadmin can perform CRUD operations
- **Input Validation**: Required field validation on both client and server
- **Confirmation**: Delete operations require user confirmation

## Usage

### For Admin/Superadmin Users:

1. **Create Meeting**:
   - Click "+ Create New Meeting" button
   - Fill in all required fields in the modal
   - Click "Create Meeting"

2. **Edit Meeting**:
   - Click "Edit" button in the Actions column
   - Modify fields in the modal
   - Click "Update Meeting"

3. **Delete Meeting**:
   - Click "Delete" button in the Actions column
   - Confirm deletion in the browser dialog

### For Faculty/Students:

- View meetings in read-only mode
- Use existing filtering capabilities
- Export meetings to Excel

## Technical Notes

- **Time Format**: Uses `datetime-local` input for better user experience
- **Timezone Handling**: Consistent with the date timezone fix
- **State Management**: Uses React state and transitions for smooth UX
- **Error Handling**: Form validation and server error handling
- **Responsive Design**: Maintains existing responsive table layout

## Future Enhancements

1. **Bulk Operations**: Bulk create/edit/delete meetings
2. **Advanced Validation**: Check for scheduling conflicts
3. **Audit Trail**: Track who created/modified meetings
4. **Import/Export**: Enhanced import/export functionality
5. **Calendar View**: Visual calendar interface for meetings
