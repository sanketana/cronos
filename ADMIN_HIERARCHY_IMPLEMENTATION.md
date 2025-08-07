# Hierarchical Admin System Implementation

## Overview
This implementation adds a hierarchical admin system with two roles:
- **Superadmin**: Can manage all system functionality including creating/managing other admins
- **Admin**: Regular admin with standard system management capabilities

## Key Features

### 1. Role Hierarchy
- **Superadmin**: Full access to all features + admin management
- **Admin**: Standard admin access (events, faculty, students, scheduler, etc.)
- **Faculty/Student**: Unchanged access levels

### 2. New Administration Module
- **Location**: `/dashboard/administration`
- **Access**: Superadmin only
- **Features**:
  - View all admin users in a table
  - Add new admin users
  - Edit existing admin users
  - Delete admin users
  - Bulk upload admin users via CSV

### 3. Access Control
- Regular admins cannot see the "Administration" tab
- Superadmins can access all existing admin functionality
- All existing admin pages now support both `admin` and `superadmin` roles

## Implementation Details

### Database Changes
- No schema changes required
- Existing `users` table supports the new `superadmin` role
- Migration script available to upgrade existing admin to superadmin

### New Files Created
1. `src/app/dashboard/administration/actions.ts` - Server actions for admin management
2. `src/app/dashboard/administration/page.tsx` - Main administration page
3. `src/app/dashboard/administration/AdministrationTableClient.tsx` - Table component
4. `src/app/dashboard/administration/AddEditAdminModal.tsx` - Add/edit modal
5. `src/app/dashboard/administration/BulkUploadAdminModal.tsx` - Bulk upload modal
6. `migrations/upgrade_admin_to_superadmin.sql` - Database migration script

### Updated Files
1. `src/app/dashboard/layout.tsx` - Added superadmin role support and administration tab
2. `src/app/login/page.tsx` - Updated login redirect logic for superadmin
3. `src/app/northwestern-colors.css` - Added new CSS classes for admin management UI

## Setup Instructions

### 1. Database Migration
Run the migration script to upgrade your existing admin to superadmin:

```sql
-- Connect to your database and run:
UPDATE users 
SET role = 'superadmin' 
WHERE role = 'admin' 
AND id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1);
```

### 2. Deploy Changes
Deploy the new files and updated files to your application.

### 3. Test the System
1. Login with your superadmin account
2. Verify you can see the "Administration" tab in the sidebar
3. Test creating, editing, and deleting admin users
4. Test bulk upload functionality
5. Verify regular admin users cannot access the administration page

## Usage Guide

### Creating New Admins
1. Navigate to Administration page (superadmin only)
2. Click "Add Admin" button
3. Fill in the required fields:
   - **Name**: Full name of the admin
   - **Email**: Email address (must be unique)
   - **Department**: Optional department name
4. Click "Create"
5. New admin will be created with default password (from `DEFAULT_USER_PASSWORD` env var)

### Bulk Upload Admins
1. Navigate to Administration page
2. Click "Bulk Upload" button
3. Download the CSV template
4. Fill in the template with admin data:
   - `name` (required)
   - `email` (required)
   - `department` (optional)
5. Upload the CSV file
6. Review results and errors

### Managing Existing Admins
1. View all admins in the table
2. Click "Edit" to modify admin details
3. Click "Delete" to remove an admin (with confirmation)
4. Status can be set to "Active" or "Inactive"

## Security Considerations

### Access Control
- Only superadmin can access the administration page
- Regular admins are redirected to dashboard if they try to access administration
- All admin management operations are server-side validated

### Password Management
- New admins are created with the default password from environment variables
- Admins should change their password on first login
- Password reset functionality should be implemented for production use

### Data Validation
- Email uniqueness is enforced at the database level
- Required fields are validated on both client and server
- Bulk upload includes comprehensive error handling

## Future Enhancements

1. **Password Reset**: Implement password reset functionality for admins
2. **Audit Logging**: Track admin creation, modification, and deletion
3. **Role Permissions**: Granular permissions system for different admin capabilities
4. **Email Notifications**: Notify new admins of their account creation
5. **Admin Activity**: Track admin login and activity patterns

## Troubleshooting

### Common Issues

1. **"Administration tab not visible"**
   - Ensure your user has `superadmin` role in the database
   - Check that the migration script was run successfully

2. **"Cannot access administration page"**
   - Verify your session contains the correct role
   - Check browser console for any JavaScript errors

3. **"Bulk upload failing"**
   - Ensure CSV format matches the template
   - Check that email addresses are unique
   - Verify all required fields are present

4. **"Styling issues"**
   - Ensure all CSS files are properly loaded
   - Check that northwestern-colors.css is included in the layout

### Database Verification
To verify the setup, run these queries:

```sql
-- Check current admin users
SELECT id, name, email, role FROM users WHERE role IN ('admin', 'superadmin');

-- Verify superadmin exists
SELECT COUNT(*) FROM users WHERE role = 'superadmin';
```

## Support
For issues or questions about this implementation, refer to the code comments and this documentation. The implementation follows the existing patterns in the codebase for consistency and maintainability. 