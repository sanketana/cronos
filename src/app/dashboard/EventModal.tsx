"use client";
import React, { useRef, useEffect } from 'react';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => void | Promise<void>;
}

export default function EventModal({ isOpen, onClose, onSubmit }: EventModalProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            ref.current?.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await onSubmit(formData);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div
                ref={ref}
                tabIndex={-1}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 w-full max-w-md outline-none"
                aria-modal="true"
                role="dialog"
            >
                <h2 className="text-2xl font-bold mb-4 text-northwestern-purple dark:text-northwestern-purple">Create New Event</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block mb-1 font-semibold">Event Name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-northwestern-purple bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="date" className="block mb-1 font-semibold">Event Date</label>
                        <input
                            id="date"
                            name="date"
                            type="date"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-northwestern-purple bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="slotLen" className="block mb-1 font-semibold">Slot Length (minutes)</label>
                        <input
                            id="slotLen"
                            name="slotLen"
                            type="number"
                            min={15}
                            max={120}
                            step={15}
                            defaultValue={30}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-northwestern-purple bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="status" className="block mb-1 font-semibold">Status</label>
                        <select
                            id="status"
                            name="status"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-northwestern-purple bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            defaultValue="CREATED"
                        >
                            <option value="CREATED">CREATED</option>
                            <option value="COLLECTING_AVAIL">COLLECTING_AVAIL</option>
                            <option value="SCHEDULING">SCHEDULING</option>
                            <option value="PUBLISHED">PUBLISHED</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-northwestern-purple text-white font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 