"use client";
import React, { useEffect, useState } from "react";

export default function LoginPage() {
    const [error, setError] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            setError(params.get("error") === "invalid");
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
            <form
                className="bg-white p-8 rounded shadow-md w-full max-w-sm border border-northwestern-gray"
                method="POST"
                action="/login/auth"
            >
                <h1 className="text-2xl font-bold mb-6 text-northwestern-purple text-center">Chronos Login</h1>
                {error && (
                    <div className="mb-4 p-2 bg-red-100 text-red-700 border border-red-300 rounded text-center">
                        Invalid email or password. Please try again.
                    </div>
                )}
                <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-900 mb-1">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        className="w-full px-3 py-2 border border-northwestern-gray2 rounded focus:outline-none focus:ring-2 focus:ring-northwestern-purple bg-white text-gray-900 placeholder-gray-500"
                        required
                        autoFocus
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="password" className="block text-gray-900 mb-1">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        className="w-full px-3 py-2 border border-northwestern-gray2 rounded focus:outline-none focus:ring-2 focus:ring-northwestern-purple bg-white text-gray-900 placeholder-gray-500"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-semibold"
                >
                    Login
                </button>
            </form>
        </div>
    );
} 