import { useState, useEffect, useRef } from "react";
import { fetchQuizQuestions } from "../utils/fetchQuestions"; // Import the utility function
import { Button } from "@/app/_ui/components/Button";
import { OptionList } from "./OptionList";
import { formatTime } from "../utils/formatTime";
import { useRouter } from "next/navigation";
import { Result } from "./Result";
import { authAPI } from "../utils/apiUtils";
import {
  playCorrectAnswer,
  playWrongAnswer,
  playQuizEnd,
} from "../utils/playSound";
import axios from "axios";

// Define props type
interface QuizProps {
  selectedSubject: string;
  selectedLevel: string;
  selectedTopic: string;
  testCode?: string;
}

const TIME_LIMIT = 60; // 1 minute per question

export const Quiz = ({
  selectedSubject,
  selectedLevel,
  selectedTopic,
  testCode = "",
}: QuizProps) => {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [timePassed, setTimePassed] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(-1);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [results, setResults] = useState({
    correctAnswers: 0,
    wrongAnswers: 0,
    secondsUsed: 0,
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeSpent, setTimeSpent] = useState(0);
  const [testCodeState, setTestCode] = useState(testCode);
  const [quizInitialized, setQuizInitialized] = useState(false);
  const questionsLoadedRef = useRef(false);

  // Load questions from localStorage or fetch them
  useEffect(() => {
    const loadQuizData = async () => {
      if (questionsLoadedRef.current) return; // Prevent multiple loads
      questionsLoadedRef.current = true;
      
      try {
        setLoading(true);
        let questions;
        
        // Check if we have stored questions for a test code
        const storedQuestions = localStorage.getItem("quizQuestions");
        if (storedQuestions && testCode) {
          try {
            questions = JSON.parse(storedQuestions);
            localStorage.removeItem("quizQuestions"); // Clear after loading
          } catch (err) {
            console.error("Error parsing stored questions:", err);
            questions = null;
          }
        }
        
        // If no stored questions or parsing failed, fetch new ones
        if (!questions) {
          if (testCode) {
            // Fetch questions for specific test code
            const token = localStorage.getItem("token");
            if (!token) {
              router.push("/login");
              return;
            }
            
            const response = await axios.post(
              "/api/quiz/generate",
              {
                subject: selectedSubject,
                difficulty: selectedLevel,
                topic: selectedTopic,
                testCode: testCode,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            
            if (response.data && response.data.questions) {
              questions = response.data.questions;
            } else {
              throw new Error("Invalid response format from server");
            }
          } else {
            // Fetch new questions using the utility function
            questions = await fetchQuizQuestions(
              selectedSubject, 
              selectedLevel, 
              selectedTopic
            );
          }
        }
        
        // Validate questions
        if (!Array.isArray(questions) || questions.length === 0) {
          throw new Error("No valid questions received");
        }
        
        // Update state with questions
        setQuizQuestions(questions);
        setQuizInitialized(true);
      } catch (error: any) {
        console.error("Error loading quiz questions:", error);
        setError(
          error.response?.data?.error || error.message || "Failed to load questions. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    
    loadQuizData();
    
    // Cleanup function
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedSubject, selectedLevel, selectedTopic, testCode, router]);

  // Setup timer only after questions are loaded and quiz is initialized
  useEffect(() => {
    if (!quizInitialized || quizFinished || quizQuestions.length === 0) return;
    
    setupTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizInitialized, quizFinished, quizQuestions.length]);

  const setupTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimePassed((prevTimePassed) =>
        prevTimePassed > TIME_LIMIT ? TIME_LIMIT : prevTimePassed + 1
      );
    }, 1000);
  };

  useEffect(() => {
    if (quizFinished || timePassed <= TIME_LIMIT || !quizInitialized || quizQuestions.length === 0) return;
    
    if (selectedAnswerIndex === -1) {
      setResults((prev) => ({
        ...prev,
        wrongAnswers: prev.wrongAnswers + 1,
      }));
    }
    handleNextQuestion();
    setTimePassed(0);
  }, [timePassed, quizInitialized, quizQuestions.length]);

  const handleNextQuestion = () => {
    setSelectedAnswerIndex(-1);
    if (activeQuestion + 1 < quizQuestions.length) {
      setActiveQuestion((prev) => prev + 1);
      setSelectedAnswerIndex(-1);
      setTimePassed(0); // Reset timer
      setupTimer();
    } else {
      playQuizEnd();
      // Save the quiz result before showing the result screen
      const saveResult = async () => {
        try {
          console.log("Saving quiz result...");
          const finalTestCode = testCode || generateTestCode();
          
          // Save quiz result only once
          const response = await authAPI.saveQuizResult({
            subject: selectedSubject,
            topic: selectedTopic,
            score: results.correctAnswers,
            totalQuestions: quizQuestions.length,
            testCode: finalTestCode,
            timeTaken: results.secondsUsed + timePassed,
          });
          
          console.log("Quiz result saved successfully");
          
          // Set the test code for the Result component
          setTestCode(finalTestCode);
          
          // Show the result
          setQuizFinished(true);
        } catch (error: any) {
          console.error("Failed to save quiz result:", error.response?.data || error);
          setError("Failed to save your quiz result. Please try again later.");
        }
      };
      saveResult();
    }
  };

  const handleSelectAnswer = (answerIndex: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedAnswerIndex(answerIndex);
    const correctAnswer = quizQuestions[activeQuestion]?.correctAnswer;
    const selectedAnswer = quizQuestions[activeQuestion]?.options[answerIndex];

    if (correctAnswer === selectedAnswer) {
      playCorrectAnswer();
      setResults((prev) => ({
        ...prev,
        secondsUsed: prev.secondsUsed + timePassed,
        correctAnswers: prev.correctAnswers + 1,
      }));
      setIsCorrectAnswer(true);
    } else {
      playWrongAnswer();
      setResults((prev) => ({
        ...prev,
        secondsUsed: prev.secondsUsed + timePassed,
        wrongAnswers: prev.wrongAnswers + 1,
      }));
      setIsCorrectAnswer(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const saveTestScore = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      // Calculate score
      const score = quizQuestions.reduce((total, question) => {
        return total + (answers[question.id] === question.correctAnswer ? 1 : 0);
      }, 0);
      // Save score to the server
      await axios.post(
        "/api/quiz/save-score",
        {
          testCode: testCodeState,
          score,
          totalQuestions: quizQuestions.length,
          timeTaken: timeSpent,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error saving test score:", error);
    }
  };

  const generateTestCode = () => {
    // Implement test code generation logic here
    // For now, return a random string
    return Math.random().toString(36).substr(2, 9);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-light-blue mx-auto"></div>
          <p className="mt-4 text-brand-light-blue">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  if (quizFinished) {
    return (
      <Result
        results={{
          correctAnswers: results.correctAnswers,
          wrongAnswers: results.wrongAnswers,
          secondsUsed: results.secondsUsed,
        }}
        totalQuestions={quizQuestions.length}
        topic={selectedTopic}
        subject={selectedSubject}
        testCode={testCodeState} // Pass the test code to Result component
      />
    );
  }

  // Don't render quiz content until questions are loaded and initialized
  if (!quizInitialized || quizQuestions.length === 0 || !quizQuestions[activeQuestion]) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-light-blue mx-auto"></div>
          <p className="mt-4 text-brand-light-blue">Preparing quiz questions...</p>
        </div>
      </div>
    );
  }

  const { question, options } = quizQuestions[activeQuestion];

  return (
    <div className="w-full h-full flex justify-center p-5">
      <div className="flex flex-col text-black font-bold text-[32px] text-center w-full">
        <h1 className="font-bold text-base text-brand-light-blue">
          Daily Practice Paper Test
        </h1>

        <div className="mt-6 rounded-2xl border border-brand-light-gray px-7 py-4 w-full mb-1">
          <h3 className="text-black font-medium text-sm">
            Question {activeQuestion + 1} / {quizQuestions.length}
          </h3>
          <h4 className="text-brand-midnight font-medium text-base mt-[34px]">
            {question}
          </h4>
        </div>
        <div className="flex justify-center items-center w-full mt-[18px]">
          <span className="text-brand-mountain-mist text-xs font-normal">
            {formatTime(timePassed)}
          </span>
          <div className="relative flex-1 h-3 bg-[#F0F0F0] mx-1 rounded-full">
            <div
              className="absolute top-0 left-0 h-full bg-brand-light-blue rounded-full"
              style={{ width: `${(timePassed / TIME_LIMIT) * 100}%` }}
            />
          </div>
          <span className="text-brand-mountain-mist text-xs font-normal">
            {formatTime(TIME_LIMIT)}
          </span>
        </div>

        <OptionList
          activeQuestion={quizQuestions[activeQuestion]}
          options={options}
          selectedAnswerIndex={selectedAnswerIndex}
          onAnswerSelected={handleSelectAnswer}
          isCorrectAnswer={isCorrectAnswer}
        />

        <div className="mt-auto w-full z-10">
          <Button
            disabled={selectedAnswerIndex === -1}
            block
            size="small"
            onClick={handleNextQuestion}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};