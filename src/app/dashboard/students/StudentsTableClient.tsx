"use client";
import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import AddEditStudentModal from './AddEditStudentModal';
import { createStudent, updateStudent, deleteStudent } from './actions';

interface Student {
    id: string;
    name: string;
    email: string;
    department: string;
    status: string;
    created_at: string;
}

export default function StudentsTableClient({ students }: { students: Student[] }) {
    const [isModalOpen, setModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editStudent, setEditStudent] = useState<Student | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    function handleAddClick() {
        setEditStudent(null);
        setIsEdit(false);
        setModalOpen(true);
    }

    function handleEditClick(student: Student) {
        setEditStudent(student);
        setIsEdit(true);
        setModalOpen(true);
    }

    async function handleDelete(id: string) {
        if (!window.confirm('Are you sure you want to delete this student?')) return;
        await deleteStudent(id);
        startTransition(() => {
            router.refresh();
        });
    }

    async function handleCreate(formData: FormData) {
        await createStudent(formData);
        startTransition(() => {
            router.refresh();
        });
    }

    async function handleEdit(formData: FormData) {
        await updateStudent(formData);
        startTransition(() => {
            router.refresh();
        });
    }

    return (
        <div>
            <AddEditStudentModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={isEdit ? handleEdit : handleCreate}
                initialValues={editStudent || {}}
                isEdit={isEdit}
            />
            <button className="primary-btn mb-4" onClick={handleAddClick}>+ Create New Student</button>
            {students.length === 0 ? (
                <div>No students found or error loading students. Check server logs for details.</div>
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
                        {students.map((s: Student) => {
                            let createdAtStr = '';
                            try {
                                const createdAtObj = new Date(s.created_at ?? '');
                                createdAtStr = isNaN(createdAtObj.getTime()) ? String(s.created_at) : createdAtObj.toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                            } catch {
                                createdAtStr = String(s.created_at);
                            }
                            return (
                                <tr key={s.id}>
                                    <td>{s.name}</td>
                                    <td>{s.email}</td>
                                    <td>{s.department || '-'}</td>
                                    <td>{s.status}</td>
                                    <td>{createdAtStr}</td>
                                    <td>
                                        <button className="secondary-btn" style={{ marginRight: '0.5rem' }} onClick={() => handleEditClick(s)}>Edit</button>
                                        <button className="danger-btn" onClick={() => handleDelete(s.id)}>Delete</button>
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