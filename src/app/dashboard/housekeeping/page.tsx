"use client";
import React, { useState, useEffect } from "react";
import { deleteMeetingsByRunId, getAllSchedulerRuns, getMeetingCountByRunId, deleteAllMeetings } from './housekeepingActions';

interface RunMeta {
    id: number;
    run_time: string;
}

export default function HousekeepingPage() {
    const [runs, setRuns] = useState<RunMeta[]>([]);
    const [meetingCounts, setMeetingCounts] = useState<Record<number, number>>({});
    const [selectedRunId, setSelectedRunId] = useState<string>("");
    const [meetingCount, setMeetingCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [loadingRuns, setLoadingRuns] = useState(true);
    const [loadingCount, setLoadingCount] = useState(false);

    useEffect(() => {
        async function fetchRunsAndCounts() {
            setLoadingRuns(true);
            const runs = await getAllSchedulerRuns();
            setRuns(runs);
            // Fetch meeting counts for all runs in parallel
            const counts: Record<number, number> = {};
            await Promise.all(
                runs.map(async (run) => {
                    const count = await getMeetingCountByRunId(run.id);
                    counts[run.id] = count ?? 0;
                })
            );
            setMeetingCounts(counts);
            setLoadingRuns(false);
        }
        fetchRunsAndCounts();
    }, []);

    useEffect(() => {
        if (!selectedRunId) {
            setMeetingCount(null);
            return;
        }
        setMeetingCount(meetingCounts[Number(selectedRunId)] ?? null);
    }, [selectedRunId, meetingCounts]);

    async function handleDelete() {
        setLoading(true);
        setMessage("");
        try {
            const deletedCount = await deleteMeetingsByRunId(Number(selectedRunId));
            setMessage(`Deleted ${deletedCount} meetings for run ID ${selectedRunId}.`);
            setMeetingCount(0);
            setMeetingCounts((prev) => ({ ...prev, [Number(selectedRunId)]: 0 }));
        } catch (err) {
            setMessage("Error deleting meetings.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteAll() {
        if (!window.confirm('Do you really want to delete all meetings?')) return;
        setLoading(true);
        setMessage("");
        try {
            const deletedCount = await deleteAllMeetings();
            setMessage(`Deleted ${deletedCount} meetings (all meetings deleted).`);
            setMeetingCount(0);
            setMeetingCounts({});
        } catch (err) {
            setMessage("Error deleting all meetings.");
        } finally {
            setLoading(false);
        }
    }

    function formatRunOption(run: RunMeta) {
        const dateStr = new Date(run.run_time).toLocaleString();
        const count = meetingCounts[run.id] ?? "...";
        return `${run.id} | ${dateStr} | ${count}`;
    }

    return (
        <div className="max-w-lg mx-auto p-8">
            <h1 className="text-2xl font-bold mb-6">Housekeeping: Delete Meetings by Run ID</h1>
            <div className="mb-4">
                <label className="block mb-2 font-medium">Run ID</label>
                {loadingRuns ? (
                    <div>Loading runs...</div>
                ) : (
                    <select
                        className="form-input w-full max-w-xs"
                        value={selectedRunId}
                        onChange={e => setSelectedRunId(e.target.value)}
                    >
                        <option value="">Select a run</option>
                        {runs.map(run => (
                            <option key={run.id} value={run.id}>
                                {formatRunOption(run)}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            {selectedRunId && (
                <div className="mb-4">
                    <span className="font-medium">Meetings to delete:</span>{" "}
                    {loadingCount ? "..." : meetingCount}
                </div>
            )}
            <div className="flex flex-col items-start gap-3 mt-2">
                <button
                    className="primary-btn px-6 py-2 rounded disabled:opacity-50"
                    disabled={!selectedRunId || loading || meetingCount === 0}
                    onClick={handleDelete}
                >
                    {loading ? "Deleting..." : "Delete Meetings"}
                </button>
                <button
                    className="danger-btn px-6 py-2 rounded disabled:opacity-50"
                    style={{ minWidth: 150, fontSize: '1rem', height: '40px', lineHeight: '1.5' }}
                    disabled={loading}
                    onClick={handleDeleteAll}
                >
                    {loading ? "Deleting..." : "Delete All Meetings"}
                </button>
            </div>
            {message && <div className="mt-4 text-lg font-semibold">{message}</div>}
        </div>
    );
} 