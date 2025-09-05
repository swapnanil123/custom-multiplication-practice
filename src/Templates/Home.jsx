import React, { useState, useEffect } from "react";
import { Trophy, ChartLine } from "lucide-react";
import LoginModal from "./LoginModal.jsx";
import AnalyticsModal from "./AnalyticsModal.jsx";
import { db } from "./../firebase-config.jsx";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// ---------------------- Color Variables ----------------------
const COLORS = {
  primary: "#A1B5D8",       // header/footer, main buttons
  primaryDark: "#7D95B8",   // hover buttons (darker shade of primary)
  accent: "#D8A15C",        // highlights, trophies (warm contrast to blue)
  panelBg: "#E1E8F0",       // panel backgrounds (lighter shade of primary)
  secondary: "#6C8FBF",     // secondary buttons (medium blue)
  textDark: "#1F2E3D",      // main text (dark, readable)
  textLight: "#4A6A8C",     // encouragement messages (lighter, soft)
};

const Home = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedTables, setSelectedTables] = useState([]);
  const [questionPool, setQuestionPool] = useState([]);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("");
  const [difficulty, setDifficulty] = useState("normal");
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [progress, setProgress] = useState(0);
  const [sessionOver, setSessionOver] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [progressData, setProgressData] = useState([]);

  const ENCOURAGEMENTS = [
    "Great Job! 🎉",
    "Keep Going 💪",
    "You’re on Fire 🔥",
    "Amazing! 🌟",
    "Superb 👏",
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const saveSessionToFirebase = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, "sessions"), {
        username: user.username,
        correct: score.correct,
        incorrect: score.incorrect,
        totalQuestions,
        progressData,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const handleCheckboxChange = (e) => {
    const value = parseInt(e.target.value);
    if (e.target.checked) {
      setSelectedTables([...selectedTables, value]);
    } else {
      setSelectedTables(selectedTables.filter((num) => num !== value));
    }
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const startSession = () => {
    if (selectedTables.length === 0) return;

    const min = difficulty === "normal" ? 1 : 5;
    const max = 10;
    let pool = [];
    const perTable = Math.floor(totalQuestions / selectedTables.length);
    let remaining = totalQuestions;

    selectedTables.forEach((table, idx) => {
      const count = idx === selectedTables.length - 1 ? remaining : perTable;
      remaining -= count;

      let multipliers = [];
      while (multipliers.length < count) {
        const m = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!multipliers.includes(m)) multipliers.push(m);
        if (multipliers.length >= max - min + 1) break;
      }

      multipliers.forEach((multiplier) => {
        pool.push({ table, multiplier });
      });
    });

    pool = shuffleArray(pool);
    setQuestionPool(pool);
    setQuestion(pool[0]);
    setAnswer("");
    setStatus("");
    setScore({ correct: 0, incorrect: 0 });
    setProgress(0);
    setSessionOver(false);
    setProgressData(
      pool.map((q, idx) => ({
        name: `Q${idx + 1}`,
        table: q.table,
        multiplier: q.multiplier,
        correct: 0,
        userAnswer: null,
      }))
    );
  };

  const handleSubmit = () => {
    if (!question || sessionOver) return;
    if (answer.trim() === "") {
      setStatus("Please enter an answer ❗");
      return;
    }

    const correctAnswer = question.table * question.multiplier;
    const isCorrect = parseInt(answer) === correctAnswer;

    if (isCorrect) {
      setStatus(
        ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
      );
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setStatus("Incorrect ❌");
      setScore((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }

    setProgressData((prev) =>
      prev.map((p, idx) =>
        idx === progress
          ? { ...p, correct: isCorrect ? 1 : 0, userAnswer: parseInt(answer) }
          : p
      )
    );

    if (progress + 1 >= totalQuestions) {
      setSessionOver(true);
      saveSessionToFirebase();
    } else {
      const nextIndex = progress + 1;
      setProgress(nextIndex);
      setTimeout(() => {
        setQuestion(questionPool[nextIndex]);
        setAnswer("");
        setStatus("");
      }, 500);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `linear-gradient(to bottom right, #ffffffff, #FFFFFF)`,
      }}
    >
      {/* Header */}
      <header
        className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 py-4 shadow-sm gap-2 sm:gap-0"
        style={{ backgroundColor: COLORS.primary, color: COLORS.textDark }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">
          Multiplication Trainer
        </h1>
        <div className="flex flex-col sm:flex-row items-center sm:space-x-4 gap-2 w-full sm:w-auto">
          <button
            onClick={() => user && setShowAnalytics(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg w-full sm:w-auto transition"
            style={{ backgroundColor: COLORS.secondary, color: "#fff" }}
          >
            <ChartLine size={18} /> Analytics
          </button>
          {user ? (
            <>
              <span className="font-medium text-center sm:text-left">
                Welcome, {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg w-full sm:w-auto transition"
                style={{ backgroundColor: "#EF4444", color: "#fff" }}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="px-3 py-2 rounded-lg w-full sm:w-auto transition"
              style={{ backgroundColor: COLORS.primaryDark, color: "#fff" }}
            >
              Login / Register
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row justify-center items-center flex-grow p-4 sm:p-6 gap-4 lg:gap-6">
        {/* Left Panel */}
        <div className="flex flex-col w-full lg:w-1/2">
          <div
            className="shadow-sm rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6 hover:shadow-xl transition"
            style={{ backgroundColor: COLORS.panelBg }}
          >
            <h2 className="text-lg font-semibold" style={{ color: COLORS.textDark }}>
              Select Table
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
              {Array.from({ length: 15 }, (_, i) => i + 11).map((num) => (
                <label
                  key={num}
                  className="flex items-center justify-center space-x-2 px-2 py-2 border rounded-lg cursor-pointer transition"
                  style={{
                    borderColor: COLORS.primaryDark,
                    color: COLORS.textDark,
                  }}
                >
                  <input
                    type="checkbox"
                    value={num}
                    checked={selectedTables.includes(num)}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 rounded focus:ring-2"
                    style={{ accentColor: COLORS.primary }}
                  />
                  <span>{num}</span>
                </label>
              ))}
            </div>

            {/* Difficulty */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-2 sm:mt-4">
              {["normal", "hard"].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className="px-4 py-2 rounded-lg font-semibold w-24 sm:w-auto transition"
                  style={{
                    backgroundColor:
                      difficulty === level ? COLORS.primary : COLORS.panelBg,
                    color: difficulty === level ? "#fff" : COLORS.textDark,
                  }}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>

            {/* Question Count */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-2 sm:mt-4">
              {[5, 10, 15, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => setTotalQuestions(n)}
                  className="px-4 py-2 rounded-lg font-semibold w-16 sm:w-auto transition"
                  style={{
                    backgroundColor:
                      totalQuestions === n ? COLORS.primary : COLORS.panelBg,
                    color: totalQuestions === n ? "#fff" : COLORS.textDark,
                  }}
                >
                  {n} Qs
                </button>
              ))}
            </div>

            <button
              onClick={startSession}
              className="w-full py-3 rounded-2xl font-semibold shadow mt-2 sm:mt-4 transition"
              style={{ backgroundColor: COLORS.primary, color: "#fff" }}
            >
              Start Practice
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col w-full lg:w-1/2">
          <div
            className="shadow-sm rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6 hover:shadow-xl transition"
            style={{ backgroundColor: COLORS.panelBg }}
          >
            {sessionOver ? (
              <div className="text-center space-y-2 sm:space-y-4">
                {score.correct >= 5 ? (
                  <Trophy
                    className="w-12 h-12 mx-auto"
                    style={{ color: COLORS.accent }}
                  />
                ) : (
                  <span className="text-6xl mx-auto">😞</span>
                )}

                <h2 className="text-xl font-bold" style={{ color: COLORS.textDark }}>
                  Session Over!
                </h2>
                <p className="font-semibold" style={{ color: COLORS.textLight }}>
                  ✅ Correct: {score.correct}
                </p>
                <p className="font-semibold" style={{ color: "#EF4444" }}>
                  ❌ Incorrect: {score.incorrect}
                </p>
                <button
                  onClick={startSession}
                  className="mt-2 sm:mt-4 px-6 py-2 rounded-xl shadow w-full sm:w-auto transition"
                  style={{ backgroundColor: COLORS.primary, color: "#fff" }}
                >
                  Restart
                </button>
              </div>
            ) : question ? (
              <>
                {/* Progress */}
                <div className="w-full bg-gray-300 rounded-full h-6 relative">
                  <div
                    className="h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
                    style={{
                      width: `${((progress + 1) / totalQuestions) * 100}%`,
                      backgroundColor: COLORS.primaryDark,
                      color: "#fff",
                    }}
                  >
                    {progress + 1}/{totalQuestions}
                  </div>
                </div>

                {/* Question */}
                <div
                  className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl shadow-sm mt-2 sm:mt-4 gap-2 sm:gap-4"
                  style={{ backgroundColor: "#fff", color: COLORS.textDark }}
                >
                  <div className="text-2xl font-bold">{question.table} × {question.multiplier}</div>
                  <input
                    type="number"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Answer"
                    className="w-full sm:w-32 px-3 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 transition"
                    style={{ borderColor: COLORS.primary, color: COLORS.textDark }}
                  />
                </div>

                <p
                  className="text-center font-semibold"
                  style={{
                    color: ENCOURAGEMENTS.includes(status)
                      ? COLORS.textLight
                      : "#EF4444",
                  }}
                >
                  {status || "—"}
                </p>

                <div className="flex justify-center mt-2 sm:mt-4">
                  <button
                    onClick={handleSubmit}
                    className="px-8 py-3 rounded-xl shadow font-semibold transition w-full sm:w-auto"
                    style={{ backgroundColor: COLORS.primary, color: "#fff" }}
                  >
                    Submit
                  </button>
                </div>
              </>
            ) : (
              <p className="text-center" style={{ color: COLORS.textDark }}>
                Select tables, difficulty, number of questions and click{" "}
                <b>Start Practice</b>.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Login & Analytics Modals */}
      {showLogin && (
        <LoginModal
          show={showLogin}
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      {showAnalytics && (
        <AnalyticsModal
          show={showAnalytics}
          onClose={() => setShowAnalytics(false)}
          username={user?.username}
        />
      )}

      <footer
        className="w-full text-center py-3 shadow-lg mt-auto"
        style={{ backgroundColor: COLORS.primary, color: COLORS.textDark }}
      >
        © {new Date().getFullYear()} Swapnanil Paul. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;
