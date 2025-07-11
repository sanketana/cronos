"use client";
import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddEditFacultyModal from './AddEditFacultyModal';
import { createFaculty, updateFaculty, deleteFaculty } from './actions';
import UpdateAvailabilityModal from './UpdateAvailabilityModal';

export interface Faculty {
    id: string;
    name: string;
    email: string;
    department: string;
    status: string;
    created_at: string;
}

export default function FacultyTableClient({ faculty }: { faculty: Faculty[] }) {
    const [isModalOpen, setModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editFaculty, setEditFaculty] = useState<Faculty | null>(null);
    const [, startTransition] = useTransition();
    const router = useRouter();
    const [isAvailabilityModalOpen, setAvailabilityModalOpen] = useState(false);
    const [availabilityFaculty, setAvailabilityFaculty] = useState<Faculty | null>(null);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRole() {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) throw new Error('Not authenticated');
                const data = await res.json();
                setRole(data.role);
            } catch {
                setRole(null);
            }
        }
        fetchRole();
    }, []);

    function handleAddClick() {
        setEditFaculty(null);
        setIsEdit(false);
        setModalOpen(true);
    }

    function handleEditClick(faculty: Faculty) {
        setEditFaculty(faculty);
        setIsEdit(true);
        setModalOpen(true);
    }

    async function handleDelete(id: string) {
        if (!window.confirm('Are you sure you want to delete this faculty member?')) return;
        await deleteFaculty(id);
        startTransition(() => {
            router.refresh();
        });
    }

    async function handleCreate(formData: FormData) {
        await createFaculty(formData);
        startTransition(() => {
            router.refresh();
        });
    }

    async function handleEdit(formData: FormData) {
        await updateFaculty(formData);
        startTransition(() => {
            router.refresh();
        });
    }

    function handleUpdateAvailabilityClick(faculty: Faculty) {
        setAvailabilityFaculty(faculty);
        setAvailabilityModalOpen(true);
    }

    function handleAvailabilitySubmit(data: { eventId: string; slots: string[]; preferences: string }) {
        // After saving, refresh the page to update availabilities
        router.refresh();
    }

    return (
        <div>
            <AddEditFacultyModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={isEdit ? handleEdit : handleCreate}
                initialValues={editFaculty || {}}
                isEdit={isEdit}
            />
            <UpdateAvailabilityModal
                isOpen={isAvailabilityModalOpen}
                onClose={() => setAvailabilityModalOpen(false)}
                faculty={availabilityFaculty || { id: '', name: '' }}
                onSubmit={handleAvailabilitySubmit}
            />
            {role === 'admin' && (
                <button className="primary-btn mb-4" onClick={handleAddClick}>+ Create New Faculty</button>
            )}
            {faculty.length === 0 ? (
                <div>No faculty found or error loading faculty. Check server logs for details.</div>
            ) : (
                <table className="events-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {faculty.map((f: Faculty) => {
                            return (
                                <tr key={f.id}>
                                    <td>{f.name}</td>
                                    <td>{f.email}</td>
                                    <td>{f.department || '-'}</td>
                                    <td>{f.status}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {role === 'admin' && (
                                                <>
                                                    <button className="secondary-btn" onClick={() => handleEditClick(f)}>Edit</button>
                                                    <button className="danger-btn" onClick={() => handleDelete(f.id)}>Delete</button>
                                                </>
                                            )}
                                            <button className="secondary-btn" onClick={() => handleUpdateAvailabilityClick(f)}>
                                                Availability
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
} 