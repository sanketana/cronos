"use client";
import React, { useRef, useEffect } from 'react';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => void | Promise<void>;
    initialValues?: {
        id?: string;
        name: string;
        date: string;
        slot_len: number;
        status: string;
        start_time?: string;
        end_time?: string;
    };
    submitLabel?: string;
}

export default function EventModal({ isOpen, onClose, onSubmit, initialValues, submitLabel = "Create" }: EventModalProps) {
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
        if (initialValues?.id) {
            formData.set('id', initialValues.id);
        }
        await onSubmit(formData);
    }

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2 className="modal-title">{submitLabel} Event</h2>
                <form onSubmit={handleSubmit}>
                    {initialValues?.id && <input type="hidden" name="id" value={initialValues.id} />}
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">Event Name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            className="form-input"
                            required
                            defaultValue={initialValues?.name || ''}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="date" className="form-label">Event Date</label>
                        <input
                            id="date"
                            name="date"
                            type="date"
                            className="form-input"
                            required
                            defaultValue={initialValues?.date || ''}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="start_time" className="form-label">Event Start Time</label>
                        <input
                            id="start_time"
                            name="start_time"
                            type="time"
                            className="form-input"
                            required
                            defaultValue={initialValues?.start_time ? initialValues.start_time.slice(0, 5) : ''}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="end_time" className="form-label">Event End Time</label>
                        <input
                            id="end_time"
                            name="end_time"
                            type="time"
                            className="form-input"
                            required
                            defaultValue={initialValues?.end_time ? initialValues.end_time.slice(0, 5) : ''}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="slotLen" className="form-label">Slot Length (minutes)</label>
                        <input
                            id="slotLen"
                            name="slotLen"
                            type="number"
                            min={15}
                            max={120}
                            step={15}
                            defaultValue={initialValues?.slot_len || 30}
                            className="form-input"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="status" className="form-label">Status</label>
                        <select
                            id="status"
                            name="status"
                            className="form-input"
                            defaultValue={initialValues?.status || 'CREATED'}
                            required
                        >
                            <option value="CREATED">CREATED</option>
                            <option value="COLLECTING_AVAIL">COLLECTING_AVAIL</option>
                            <option value="SCHEDULING">SCHEDULING</option>
                            <option value="PUBLISHED">PUBLISHED</option>
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="primary-btn"
                        >
                            {submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 