"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

// Define subjects and topics
const subjects = [
  "Mathematics",
  "Science",
  "Social Studies",
  "General Knowledge",
  "Machine Learning",
] as const;

type Subject = typeof subjects[number];

const topicsBySubject: Record<Subject, string[]> = {
  Mathematics: ["Algebra", "Geometry", "Calculus", "Statistics", "Trigonometry", "Number Theory"],
  Science: ["Physics", "Chemistry", "Biology", "Astronomy", "Earth Science", "Environmental Science"],
  "Social Studies": ["History", "Geography", "Civics", "Economics", "Political Science", "Sociology"],
  "General Knowledge": ["Current Affairs", "Geography", "Arts & Literature", "Sports", "Technology", "Entertainment"],
  "Machine Learning": ["Supervised Learning", "Unsupervised Learning", "Deep Learning", "Neural Networks", "Natural Language Processing", "Computer Vision"],
};

interface TestCode {
  _id: string;
  testCode: string;
  subject: string;
  topic: string;
  difficulty: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [subject, setSubject] = useState<Subject | "">("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [testCodes, setTestCodes] = useState<TestCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    setAdminName(localStorage.getItem("adminName") || "Admin");
    setAdminEmail(localStorage.getItem("adminEmail") || "");
    
    // Fetch test codes
    fetchTestCodes();
  }, []);

  // Reset topic when subject changes
  useEffect(() => {
    setTopic("");
  }, [subject]);

  const fetchTestCodes = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get("/api/admin/test-codes", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTestCodes(response.data);
    } catch (error) {
      console.error("Error fetching test codes:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("adminRole");
    router.push("/admin/login");
  };

  const handleGenerateTestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!subject || !topic || !difficulty) {
      setError("All fields are required");
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.post(
        "/api/admin/generate-test-code",
        { subject, topic, difficulty },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setSuccess(`Test code generated successfully: ${response.data.testCode.testCode}`);
      
      // Refresh test codes list
      fetchTestCodes();
      
      // Reset form
      setSubject("");
      setTopic("");
      setDifficulty("easy");
    } catch (error: any) {
      console.error("Error generating test code:", error);
      setError(error.response?.data?.error || "Failed to generate test code");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Test code copied to clipboard!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const viewLeaderboard = (testCode: string) => {
    router.push(`/admin/leaderboard/${testCode}`);
  };

  return (
    <div className="min-h-screen bg-brand-background">
      <nav className="bg-brand-light-blue shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-white">EduAI Admin</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-white font-medium mr-2">{adminName}</span>
                <div className="h-8 w-8 rounded-full bg-brand-primary-light text-white flex items-center justify-center">
                  {adminName.charAt(0).toUpperCase()}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-dark transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <div className="container mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-soft p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-brand-primary">Generate Test Code</h2>
          
          <form onSubmit={handleGenerateTestCode}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Subject Dropdown */}
              <div>
                <label className="block text-sm font-medium text-brand-neutral-dark mb-2">
                  Subject
                </label>
                <div className="relative">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as Subject)}
                    className="w-full px-3 py-3 border border-brand-background-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary appearance-none pr-10 transition-all duration-200"
                    required
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-brand-neutral">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Topic Dropdown */}
              <div>
                <label className="block text-sm font-medium text-brand-neutral-dark mb-2">
                  Topic
                </label>
                <div className="relative">
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={!subject}
                    className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary appearance-none pr-10 transition-all duration-200 ${
                      !subject ? 'bg-brand-background-dark text-brand-neutral-light cursor-not-allowed' : 'border-brand-background-dark'
                    }`}
                    required
                  >
                    <option value="">Select a topic</option>
                    {subject && topicsBySubject[subject].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-brand-neutral">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Difficulty Dropdown */}
              <div>
                <label className="block text-sm font-medium text-brand-neutral-dark mb-2">
                  Difficulty
                </label>
                <div className="relative">
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-3 border border-brand-background-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary appearance-none pr-10 transition-all duration-200"
                    required
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-brand-neutral">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-100 border-l-4 border-brand-error text-brand-error p-4 mb-6 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-brand-error" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 border-l-4 border-brand-success text-brand-success p-4 mb-6 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-brand-success" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">{success}</p>
                  </div>
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-xl font-bold text-white shadow-button transition-all duration-200 ${
                loading ? 'bg-brand-neutral-light cursor-not-allowed' : 'bg-brand-primary hover:bg-brand-primary-dark transform hover:-translate-y-1'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Generate Test Code
                </div>
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h2 className="text-2xl font-bold mb-6 text-brand-primary">Your Test Codes</h2>
          
          {testCodes.length === 0 ? (
            <div className="text-center py-8 text-brand-neutral">
              No test codes generated yet. Create your first one above!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-background-dark">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-brand-background text-left text-xs font-medium text-brand-neutral-dark uppercase tracking-wider rounded-tl-lg">
                      Test Code
                    </th>
                    <th className="px-6 py-3 bg-brand-background text-left text-xs font-medium text-brand-neutral-dark uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 bg-brand-background text-left text-xs font-medium text-brand-neutral-dark uppercase tracking-wider">
                      Topic
                    </th>
                    <th className="px-6 py-3 bg-brand-background text-left text-xs font-medium text-brand-neutral-dark uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 bg-brand-background text-left text-xs font-medium text-brand-neutral-dark uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 bg-brand-background text-left text-xs font-medium text-brand-neutral-dark uppercase tracking-wider rounded-tr-lg">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-brand-background-dark">
                  {testCodes.map((testCode) => (
                    <tr key={testCode._id} className="hover:bg-brand-background transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-primary">
                        {testCode.testCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-neutral-dark">
                        {testCode.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-neutral-dark">
                        {testCode.topic}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          testCode.difficulty === 'easy' 
                            ? 'bg-green-100 text-green-800' 
                            : testCode.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {testCode.difficulty.charAt(0).toUpperCase() + testCode.difficulty.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-neutral-dark">
                        {new Date(testCode.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => copyToClipboard(testCode.testCode)}
                            className="text-brand-info hover:text-brand-primary transition-colors duration-150"
                            title="Copy test code"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => viewLeaderboard(testCode.testCode)}
                            className="text-brand-secondary hover:text-brand-secondary-dark transition-colors duration-150"
                            title="View leaderboard"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
