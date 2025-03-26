"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./Button";
import axios from "axios";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

interface QuizResultsProps {
  questions: Question[];
  answers: Record<string, string>;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  testCode?: string;
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

export const QuizResults = ({
  questions,
  answers,
  score,
  totalQuestions,
  timeSpent,
  testCode = "",
}: QuizResultsProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    // If test code is provided, fetch the leaderboard
    if (testCode) {
      fetchLeaderboard();
    }
  }, [testCode]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/login");
        return;
      }
      
      const response = await axios.get(
        `/api/quiz/leaderboard/${testCode}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data && response.data.leaderboard) {
        setLeaderboard(response.data.leaderboard);
        
        // Find user's rank
        const userId = localStorage.getItem("userId");
        const userEntry = response.data.leaderboard.find(
          (entry: LeaderboardEntry) => entry.userId._id === userId
        );
        
        if (userEntry) {
          setUserRank(userEntry.rank);
        }
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleReturnHome = () => {
    router.push("/");
  };

  const handleViewAnswers = () => {
    // Implement view answers functionality if needed
  };

  return (
    <div className="flex-1 flex flex-col p-5 max-w-4xl mx-auto w-full">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-center">Quiz Results</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-gray-500 text-sm">Score</p>
            <p className="text-2xl font-bold text-brand-light-blue">
              {score}/{totalQuestions}
            </p>
            <p className="text-sm text-gray-500">
              {Math.round((score / totalQuestions) * 100)}%
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-gray-500 text-sm">Time Taken</p>
            <p className="text-2xl font-bold text-brand-light-blue">
              {formatTime(timeSpent)}
            </p>
          </div>
          
          {testCode && userRank !== null && (
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-500 text-sm">Your Rank</p>
              <p className="text-2xl font-bold text-brand-light-blue">
                #{userRank}
              </p>
              <p className="text-sm text-gray-500">
                Out of {leaderboard.length} participants
              </p>
            </div>
          )}
        </div>
        
        {testCode && leaderboard.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Leaderboard</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.slice(0, 5).map((entry) => (
                    <tr key={entry._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          #{entry.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.userId.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {entry.score} / {entry.totalQuestions}
                        </div>
                        <div className="text-sm text-gray-500">
                          {Math.round((entry.score / entry.totalQuestions) * 100)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row justify-center space-y-3 md:space-y-0 md:space-x-4">
          <Button intent="secondary" onClick={handleReturnHome}>Return to Home</Button>
          <Button intent="primary" onClick={handleViewAnswers}>
            View Answers
          </Button>
        </div>
      </div>
    </div>
  );
};
