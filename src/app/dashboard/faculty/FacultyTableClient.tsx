"use client";
import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import AddEditFacultyModal from './AddEditFacultyModal';
import { createFaculty, updateFaculty, deleteFaculty } from './actions';

interface Faculty {
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
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

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

    return (
        <div>
            <AddEditFacultyModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={isEdit ? handleEdit : handleCreate}
                initialValues={editFaculty || {}}
                isEdit={isEdit}
            />
            <button className="primary-btn mb-4" onClick={handleAddClick}>+ Create New Faculty</button>
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
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {faculty.map((f: Faculty) => {
                            let createdAtStr = '';
                            try {
                                const createdAtObj = new Date(f.created_at ?? '');
                                createdAtStr = isNaN(createdAtObj.getTime()) ? String(f.created_at) : createdAtObj.toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                            } catch {
                                createdAtStr = String(f.created_at);
                            }
                            return (
                                <tr key={f.id}>
                                    <td>{f.name}</td>
                                    <td>{f.email}</td>
                                    <td>{f.department || '-'}</td>
                                    <td>{f.status}</td>
                                    <td>{createdAtStr}</td>
                                    <td>
                                        <button className="secondary-btn" style={{ marginRight: '0.5rem' }} onClick={() => handleEditClick(f)}>Edit</button>
                                        <button className="danger-btn" onClick={() => handleDelete(f.id)}>Delete</button>
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