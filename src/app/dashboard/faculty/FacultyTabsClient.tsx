"use client";
import React, { useState } from 'react';
import FacultyTableClient from './FacultyTableClient';
import AvailabilitiesTableClient from './AvailabilitiesTableClient';

export default function FacultyTabsClient({ faculty, availabilities }: { faculty: any[]; availabilities: any[] }) {
    const [tab, setTab] = useState<'faculty' | 'availabilities'>('faculty');
    return (
        <div>
            <h1 className="dashboard-title">Faculty</h1>
            <div className="tabs" role="tablist">
                <button
                    className="tab-btn"
                    role="tab"
                    aria-selected={tab === 'faculty'}
                    onClick={() => setTab('faculty')}
                    tabIndex={0}
                >
                    Faculty
                </button>
                <button
                    className="tab-btn"
                    role="tab"
                    aria-selected={tab === 'availabilities'}
                    onClick={() => setTab('availabilities')}
                    tabIndex={0}
                >
                    Availabilities
                </button>
            </div>
            {tab === 'faculty' ? (
                <FacultyTableClient faculty={faculty} />
            ) : (
                <AvailabilitiesTableClient availabilities={availabilities} />
            )}
        </div>
    );
} 