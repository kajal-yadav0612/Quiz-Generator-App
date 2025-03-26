"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Countdown } from "@/ui/components/Countdown";
import { Intro } from "@/ui/components/Intro";
import { Quiz } from "@/ui/components/Quiz";
import { SubjectSelect } from "@/ui/components/SubjectSelect";
import { authAPI } from "./_ui/utils/apiUtils"; // Assuming authAPI is defined in this file
import axios from "axios";

export default function Home() {
  const [displayView, setDisplayView] = useState<"intro" | "subjectSelect" | "countdown" | "quiz">("intro");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [testCode, setTestCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login"); // Redirect to login if not logged in
      return;
    }
    
    // Check if token is valid by making a request to get user profile
    const checkAuth = async () => {
      try {
        await authAPI.getProfile();
        // If successful, user is authenticated
      } catch (error) {
        // If error, token is invalid or expired
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("email");
        router.push("/login");
      }
    };
    
    checkAuth();
  }, []);

  const onStartQuiz = (subject: string, level: string, topic: string) => {
    setSelectedSubject(subject);
    setSelectedLevel(level);
    setSelectedTopic(topic);
    setTestCode(""); // Clear any test code when starting a regular quiz
    setDisplayView("countdown"); // Transition to countdown before quiz starts
  };

  const onTestCodeSubmit = async (code: string) => {
    setError("");
    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Validate the test code
      const response = await axios.post(
        "/api/quiz/generate", 
        { testCode: code },
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.testInfo) {
        // Store the test code and test info
        setTestCode(code);
        setSelectedSubject(response.data.testInfo.subject);
        setSelectedLevel(response.data.testInfo.difficulty);
        setSelectedTopic(response.data.testInfo.topic);
        
        // Store the questions in localStorage
        localStorage.setItem("quizQuestions", JSON.stringify(response.data.questions));
        
        // Proceed to countdown
        setDisplayView("countdown");
      } else {
        setError("Invalid test code. Please try again.");
      }
    } catch (error: any) {
      console.error("Error validating test code:", error);
      setError(error.response?.data?.error || "Invalid test code. Please try again.");
    }
  };

  return (
    <main className="h-viewport flex flex-col w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {displayView === "intro" && (
          <Intro 
            onGetStartedClick={() => setDisplayView("subjectSelect")} 
            onTestCodeSubmit={onTestCodeSubmit}
          />
        )}

        {displayView === "subjectSelect" && (
          <SubjectSelect onStartQuiz={onStartQuiz} />
        )}

        {displayView === "countdown" && (
          <Countdown onGoClick={() => setDisplayView("quiz")} />
        )}

        {displayView === "quiz" && (
          <Quiz 
            selectedSubject={selectedSubject} 
            selectedLevel={selectedLevel} 
            selectedTopic={selectedTopic}
            testCode={testCode}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
