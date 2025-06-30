"use client";
import { useState, useTransition } from 'react';
import EventModal from './EventModal';
import { createEvent } from './actions';
import { useRouter } from 'next/navigation';

export default function EventModalButton() {
    const [modalOpen, setModalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    async function handleEventCreate(formData: FormData) {
        await createEvent(formData);
        setModalOpen(false);
        // Refresh the dashboard to show the new event
        router.refresh();
    }

    return (
        <>
            <button
                className="mb-8 px-6 py-2 rounded bg-northwestern-purple text-white font-semibold hover:bg-blue-700 transition-colors"
                onClick={() => setModalOpen(true)}
                disabled={isPending}
            >
                + Create New Event
            </button>
            <EventModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleEventCreate}
            />
        </>
    );
} 