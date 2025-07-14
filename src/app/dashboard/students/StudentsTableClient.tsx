"use client";
import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddEditStudentModal from './AddEditStudentModal';
import UpdatePreferenceModal from './UpdatePreferenceModal';
import { createStudent, updateStudent, deleteStudent } from './actions';

export interface Student {
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
    const [isPreferenceModalOpen, setPreferenceModalOpen] = useState(false);
    const [preferenceStudent, setPreferenceStudent] = useState<Student | null>(null);
    const [, startTransition] = useTransition();
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRoleAndId() {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) throw new Error('Not authenticated');
                const data = await res.json();
                setRole(data.role);
                setUserId(data.userId || data.id || null);
            } catch {
                setRole(null);
                setUserId(null);
            }
        }
        fetchRoleAndId();
    }, []);

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

    function handlePreferenceClick(student: Student) {
        setPreferenceStudent(student);
        setPreferenceModalOpen(true);
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
            <UpdatePreferenceModal
                isOpen={isPreferenceModalOpen}
                onClose={() => setPreferenceModalOpen(false)}
                student={preferenceStudent || { id: '', name: '' }}
            />
            {role === 'admin' && (
                <button className="primary-btn mb-4" onClick={handleAddClick}>+ Create New Student</button>
            )}
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
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((s: Student) => {
                            return (
                                <tr key={s.id}>
                                    <td>{s.name}</td>
                                    <td>{s.email}</td>
                                    <td>{s.department || '-'}</td>
                                    <td>{s.status}</td>
                                    <td>
                                        {role === 'admin' ? (
                                            <>
                                                <button className="secondary-btn" style={{ marginRight: '0.5rem' }} onClick={() => handleEditClick(s)}>Edit</button>
                                                <button className="secondary-btn" style={{ marginRight: '0.5rem' }} onClick={() => handlePreferenceClick(s)}>Update Preferences</button>
                                                <button className="danger-btn" onClick={() => handleDelete(s.id)}>Delete</button>
                                            </>
                                        ) : (role === 'student' && userId === s.id) ? (
                                            <button className="secondary-btn" onClick={() => handlePreferenceClick(s)}>Update Preferences</button>
                                        ) : null}
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