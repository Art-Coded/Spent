'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/auth"; 

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.history.replaceState(null, '', '/');
  }, []);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await registerUser(email, password); 
      router.push("/dashboard"); 
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Create an Account ✨</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Start tracking your expenses with SPENT</p>
        </div>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors disabled:opacity-60"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
          {error && <p className="text-sm text-red-500 mt-2 text-center">{error}</p>}
        </form>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <a href="/sign-in" className="text-blue-600 dark:text-blue-400 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
