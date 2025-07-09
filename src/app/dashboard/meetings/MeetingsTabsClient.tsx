"use client";
import React, { useState } from "react";

interface Meeting {
    id: string;
    event_id: string;
    faculty_id: string;
    student_id: string;
    slot: string;
    event_name: string;
    faculty_name: string;
    student_name: string;
    // ...other fields
    professor_id?: string;
    professor_name?: string;
}

interface User { id: string; name: string; }
interface Event { id: string; name: string; }

export default function MeetingsTabsClient({ meetings, professors, students, events }: {
    meetings: Meeting[];
    professors: User[];
    students: User[];
    events: Event[];
}) {
    const [tab, setTab] = useState<'professor' | 'student' | 'master'>('professor');
    return (
        <div>
            <h1 className="dashboard-title">Meetings</h1>
            <div className="tabs" role="tablist">
                <button
                    className="tab-btn"
                    role="tab"
                    aria-selected={tab === 'professor'}
                    onClick={() => setTab('professor')}
                    tabIndex={0}
                >
                    Professor Calendar
                </button>
                <button
                    className="tab-btn"
                    role="tab"
                    aria-selected={tab === 'student'}
                    onClick={() => setTab('student')}
                    tabIndex={0}
                >
                    Student Calendar
                </button>
                <button
                    className="tab-btn"
                    role="tab"
                    aria-selected={tab === 'master'}
                    onClick={() => setTab('master')}
                    tabIndex={0}
                >
                    Master Calendar
                </button>
            </div>
            <div className="mt-6">
                {tab === 'professor' && <div>Professor Calendar (coming soon)</div>}
                {tab === 'student' && <div>Student Calendar (coming soon)</div>}
                {tab === 'master' && <div>Master Calendar (coming soon)</div>}
            </div>
        </div>
    );
} 