"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface TestInfo {
  testCode: string;
  subject: string;
  topic: string;
  difficulty: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
}

interface LeaderboardEntry {
  _id: string;
  testCode: string;
  userId: User;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  rank: number;
  timestamp: string;
}

interface LeaderboardData {
  testInfo: TestInfo;
  leaderboard: LeaderboardEntry[];
}

export default function Leaderboard({ params }: { params: { testCode: string } }) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    // Fetch leaderboard data
    const fetchLeaderboard = async () => {
      try {
        console.log("Fetching leaderboard for test code:", params.testCode);
        const response = await axios.get(
          `/api/admin/leaderboard/${params.testCode}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        console.log("Received leaderboard data:", response.data);
        setLeaderboardData(response.data);
      } catch (error: any) {
        console.error("Error fetching leaderboard:", error.response?.data || error);
        setError(error.response?.data?.error || "Failed to fetch leaderboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [params.testCode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleBack = () => {
    router.push("/admin/dashboard");
  };

  // Only render content if we have data and no error
  if (!loading && !error && leaderboardData) {
    const { testInfo, leaderboard } = leaderboardData;
    console.log("Rendering leaderboard with data:", { testInfo, leaderboard });

    // Check if there are any scores
    if (!leaderboard || leaderboard.length === 0) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center">
          <p className="text-xl text-brand-neutral-dark mb-4">No students have taken this test yet.</p>
          <button
            onClick={handleBack}
            className="bg-brand-light-blue text-white px-4 py-2 rounded-md hover:bg-brand-primary transition-colors duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-brand-background p-8">
        <div className="container mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-brand-primary mb-2">Test Leaderboard</h1>
              <div className="text-brand-neutral-dark">
                <p><span className="font-medium">Test Code:</span> {testInfo.testCode}</p>
                <p><span className="font-medium">Subject:</span> {testInfo.subject}</p>
                <p><span className="font-medium">Topic:</span> {testInfo.topic}</p>
                <p><span className="font-medium">Difficulty:</span> {testInfo.difficulty}</p>
              </div>
            </div>
            <button
              onClick={handleBack}
              className="bg-brand-light-blue text-white px-4 py-2 rounded-md hover:bg-brand-primary transition-colors duration-200"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-xl shadow-soft overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-brand-light-blue text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Student Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Score</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Time Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaderboard.map((entry, index) => {
                  console.log("Rendering leaderboard entry:", entry);
                  return (
                    <tr key={entry._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center ${
                          entry.rank === 1 ? 'text-yellow-500' :
                          entry.rank === 2 ? 'text-gray-500' :
                          entry.rank === 3 ? 'text-amber-700' : 'text-brand-neutral-dark'
                        } font-semibold`}>
                          {entry.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-brand-neutral-dark">
                        {entry.userId.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-brand-primary font-medium">
                          {entry.score}/{entry.totalQuestions}
                        </span>
                        <span className="text-brand-neutral ml-2">
                          ({((entry.score / entry.totalQuestions) * 100).toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-brand-neutral-dark">
                        {formatTime(entry.timeTaken)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading leaderboard...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl text-red-500 mb-4">{error}</p>
        <button
          onClick={handleBack}
          className="bg-brand-light-blue text-white px-4 py-2 rounded-md hover:bg-brand-primary transition-colors duration-200"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return null;
}
