"use client";
import React, { useState } from 'react';
import StudentsTableClient from './StudentsTableClient';
import PreferencesTableClient from './PreferencesTableClient';

export default function StudentsTabsClient({ students, preferences, faculty }: { students: any[]; preferences: any[]; faculty: { id: string; name: string }[] }) {
    const [tab, setTab] = useState<'students' | 'preferences'>('students');
    return (
        <div>
            <h1 className="dashboard-title">Students</h1>
            <div className="tabs" role="tablist">
                <button
                    className="tab-btn"
                    role="tab"
                    aria-selected={tab === 'students'}
                    onClick={() => setTab('students')}
                    tabIndex={0}
                >
                    Students
                </button>
                <button
                    className="tab-btn"
                    role="tab"
                    aria-selected={tab === 'preferences'}
                    onClick={() => setTab('preferences')}
                    tabIndex={0}
                >
                    Preferences
                </button>
            </div>
            {tab === 'students' ? (
                <StudentsTableClient students={students} />
            ) : (
                <PreferencesTableClient preferences={preferences} faculty={faculty} />
            )}
        </div>
    );
} 