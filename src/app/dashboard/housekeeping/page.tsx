"use client";
import React, { useState, useEffect } from "react";

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
            const res = await fetch("/api/housekeeping/get-runs");
            const data = await res.json();
            const runs: RunMeta[] = (data.runs || []).map((r: any) => ({ id: r.id, run_time: r.run_time }));
            setRuns(runs);
            // Fetch meeting counts for all runs in parallel
            const counts: Record<number, number> = {};
            await Promise.all(
                runs.map(async (run) => {
                    const res = await fetch(`/api/housekeeping/get-meeting-count?runId=${run.id}`);
                    const data = await res.json();
                    counts[run.id] = data.count ?? 0;
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
            const res = await fetch("/api/housekeeping/delete-meetings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ runId: selectedRunId }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(`Deleted ${data.deletedCount} meetings for run ID ${selectedRunId}.`);
                setMeetingCount(0);
                setMeetingCounts((prev) => ({ ...prev, [Number(selectedRunId)]: 0 }));
            } else {
                setMessage(data.error || "Failed to delete meetings.");
            }
        } catch (err) {
            setMessage("Error deleting meetings.");
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
            <button
                className="primary-btn px-6 py-2 rounded disabled:opacity-50"
                disabled={!selectedRunId || loading || meetingCount === 0}
                onClick={handleDelete}
            >
                {loading ? "Deleting..." : "Delete Meetings"}
            </button>
            {message && <div className="mt-4 text-lg font-semibold">{message}</div>}
        </div>
    );
} 