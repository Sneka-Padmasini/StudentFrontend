import React, { useState, useEffect } from "react";
import "./NeetQuiz.css";
import { FaCheckCircle } from "react-icons/fa";
import katex from "katex";
import parse from "html-react-parser";
import "katex/dist/katex.min.css";

const shuffleArray = (array) => {
  let currentIndex = array.length,
    randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

const NeetQuiz = ({ topicTitle, subtopicTitle, test, onBack, onMarkComplete, isAlreadyComplete, isMock }) => {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // CHANGED: 180 minutes = 10800 seconds
  const [timeRemaining, setTimeRemaining] = useState(10800);

  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(isAlreadyComplete);
  const [showResultPopup, setShowResultPopup] = useState(false);


  // ✅ SCROLL FIX: Ensure quiz starts at the top when title changes
  useEffect(() => {
    window.scrollTo(0, 0);
    const container = document.querySelector('.explanation-container');
    if (container) container.scrollTop = 0;
  }, [subtopicTitle, hasStarted]);


  useEffect(() => {
    const allQuestions = test?.[0]?.questionsList || [];
    let finalQuestionList = [];

    // Logic to select questions
    if (isMock) {
      finalQuestionList = allQuestions;
    } else {
      const shuffledQuestions = shuffleArray([...allQuestions]);
      // Limit regular tests to 180 questions max just in case
      const MAX_QUESTIONS = 180;
      finalQuestionList = shuffledQuestions.slice(0, MAX_QUESTIONS);
    }

    setQuestions(finalQuestionList);
    setUserAnswers(Array(finalQuestionList.length).fill(""));
    setSubmitted(false);
    setCurrentQIndex(0);

    // === UPDATED TIMING LOGIC ===
    if (isMock) {
      // Full Mock Exams: Fixed 180 minutes (10800 seconds)
      setTimeRemaining(10800);
    } else {
      // Unit/Topic Tests: 1 minute per question
      // Example: 45 questions = 45 minutes * 60 seconds
      setTimeRemaining(finalQuestionList.length * 60);
    }
    // ============================

    setHasStarted(false);
    setShowConfirmation(false);
    setIsComplete(false);
    setShowResultPopup(false);

  }, [subtopicTitle, isMock, test]); // Added 'test' to dependency array for safety

  const parseTextWithFormulas = (texts) => {
    if (!texts) return null;

    // 1. Clean up the input string
    let text = texts
      .replace(/\\\\/g, "\\")
      .replace(/<\s*br\s*\/?\s*>/gi, "<br/>") // Fix malformed breaks
      .replace(/\r?\n/g, "<br/>")
      .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

    // 2. Split by LaTeX delimiters ($$ first, then $)
    const regex = /(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      // Display Mode ($$)
      if (part.startsWith("$$") && part.endsWith("$$")) {
        const latex = part.slice(2, -2);
        try {
          const html = katex.renderToString(latex, {
            throwOnError: false,
            output: "html",
            displayMode: true
          });
          return <div key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (err) {
          return <span key={index} style={{ color: "red" }}>{latex}</span>;
        }
      }
      // Inline Mode ($)
      else if (part.startsWith("$") && part.endsWith("$")) {
        const latex = part.slice(1, -1);
        try {
          const html = katex.renderToString(latex, {
            throwOnError: false,
            output: "html",
            displayMode: false
          });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (err) {
          return <span key={index} style={{ color: "red" }}>{latex}</span>;
        }
      }
      // Regular Text
      else {
        return <span key={index}>{parse(part)}</span>;
      }
    });
  };

  useEffect(() => {
    if (timeRemaining > 0 && !submitted && hasStarted) {
      const timer = setInterval(() => setTimeRemaining((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeRemaining === 0 && !submitted && hasStarted) {
      handleAutoSubmit();
    }
  }, [timeRemaining, submitted, hasStarted]);

  useEffect(() => {
    setIsComplete(isAlreadyComplete);
  }, [isAlreadyComplete, subtopicTitle]);

  const handleOptionChange = (selected) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQIndex] = selected;
    setUserAnswers(updatedAnswers);
  };

  // Helper function to calculate NEET Score (+4 for correct, -1 for wrong)
  const calculateNEETScore = () => {
    return questions.reduce((acc, q, i) => {
      const correctAnswer = q[`option${Number(q.correctIndex) + 1}`];
      const userAnswer = userAnswers[i];

      if (!userAnswer) {
        return acc; // 0 marks for unattempted
      }
      if (userAnswer === correctAnswer) {
        return acc + 4; // +4 marks for correct
      } else {
        return acc - 1; // -1 mark for wrong
      }
    }, 0);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setShowConfirmation(false);
    sessionStorage.setItem(`answers-neet-${subtopicTitle}`, JSON.stringify(userAnswers));
    sessionStorage.setItem(`quizData-neet-${subtopicTitle}`, JSON.stringify(questions));

    const finalScore = calculateNEETScore();
    const maxMarks = questions.length * 4; // Should be 720 if 180 questions
    const percentage = ((finalScore / maxMarks) * 100).toFixed(2);

    if (parseFloat(percentage) >= 90) {
      console.log("🎯 Perfect score! Marking as complete...");
      setIsComplete(true);
      if (onMarkComplete) {
        onMarkComplete();
      }
    }

    setShowResultPopup(true);
  };

  const handleMarkComplete = () => {
    console.log("🔄 Manually marking test as complete");
    setIsComplete(true);
    if (onMarkComplete) {
      onMarkComplete();
    }
    alert("Test marked as complete! Progress updated.");
  };

  const handleAutoSubmit = () => {
    setSubmitted(true);
    sessionStorage.setItem(`answers-neet-${subtopicTitle}`, JSON.stringify(userAnswers));
    sessionStorage.setItem(`quizData-neet-${subtopicTitle}`, JSON.stringify(questions));
    setShowResultPopup(true);
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) setCurrentQIndex(currentQIndex + 1);
  };
  const handlePrevious = () => {
    if (currentQIndex > 0) setCurrentQIndex(currentQIndex - 1);
  };

  const currentQuestion = questions[currentQIndex];

  // Calculate stats for display
  const finalScore = calculateNEETScore();
  const maxMarks = questions.length * 4;
  const percentage = maxMarks > 0 ? ((finalScore / maxMarks) * 100).toFixed(2) : 0;

  if (!currentQuestion) {
    return (
      <div className="quiz-wrapper">
        <div className="quiz-container">
          <h2>{subtopicTitle}</h2>
          <p>No questions available.</p>
          <button className="back-btn" onClick={onBack}>Back to Topics</button>
        </div>
      </div>
    );
  }

  // Format time for display (Hours : Minutes : Seconds)
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };


  // 🎨 Helper: Get motivational message & color based on percentage
  // const getResultFeedback = (percentage) => {
  //   const p = parseFloat(percentage);
  //   if (p === 100) return { message: "Excellent! You are a Champion! 🏆", color: "#4CAF50", emoji: "🌟" };
  //   if (p >= 90) return { message: "Awesome! Almost There! 🚀", color: "#2196F3", emoji: "🔥" };
  //   if (p >= 80) return { message: "Good Job! Push Harder! 💪", color: "#FF9800", emoji: "⚡" };
  //   if (p >= 70) return { message: "Good Try! Work More! 🌱", color: "#FFC107", emoji: "📈" };
  //   if (p >= 50) return { message: "Set a Goal! Work Hard! 🎯", color: "#FF5722", emoji: "📝" };
  //   return { message: "Don't Give Up! Continue Learning! ⏳", color: "#F44336", emoji: "📚" };
  // };

  // 🎨 Helper: Get motivational message & color based on percentage from env file 
  const getResultFeedback = (percentage) => {
    const p = parseFloat(percentage);

    if (p === 100) return {
      message: import.meta.env.VITE_FEEDBACK_MSG_100 || "Excellent! You are a Champion! 🏆",
      color: "#4CAF50",
      emoji: "🌟"
    };

    if (p >= 90) return {
      message: import.meta.env.VITE_FEEDBACK_MSG_90 || "Awesome! Almost There! 🚀",
      color: "#2196F3",
      emoji: "🔥"
    };

    if (p >= 80) return {
      message: import.meta.env.VITE_FEEDBACK_MSG_80 || "Good Job! Push Harder! 💪",
      color: "#FF9800",
      emoji: "⚡"
    };

    if (p >= 70) return {
      message: import.meta.env.VITE_FEEDBACK_MSG_70 || "Good Try! Work More! 🌱",
      color: "#FFC107",
      emoji: "📈"
    };

    if (p >= 50) return {
      message: import.meta.env.VITE_FEEDBACK_MSG_50 || "Set a Goal! Work Hard! 🎯",
      color: "#FF5722",
      emoji: "📝"
    };

    return {
      message: import.meta.env.VITE_FEEDBACK_MSG_FAIL || "Don't Give Up! Continue Learning! ⏳",
      color: "#F44336",
      emoji: "📚"
    };
  };

  const feedback = getResultFeedback(percentage);

  return (
    <div className="quiz-wrapper">
      <div className="quiz-container">
        <h2>{subtopicTitle}</h2>

        <button
          onClick={handleMarkComplete}
          className={`complete-btn ${isComplete ? "completed" : ""}`}
          disabled={isComplete}
        >
          {isComplete ? (
            <>
              Completed <FaCheckCircle className="check-icon" />
            </>
          ) : (
            "Mark as Complete"
          )}
        </button>

        {!hasStarted ? (
          <div className="start-screen">
            <p><strong>Total Questions:</strong> {questions.length}</p>
            <p><strong>Total Marks:</strong> {questions.length * 4}</p>
            {/* <p><strong>Time Limit:</strong> 180 minutes</p> */}

            <p><strong>Time Limit:</strong> {isMock ? "180" : questions.length} minutes</p>

            <p style={{ fontSize: "1rem", color: "#666", marginTop: "10px" }}>
              Pattern: +4 for Correct, -1 for Wrong, 0 for Unattempted.
            </p>
            <button className="start-btn" onClick={() => setHasStarted(true)}>Start Assessment</button>
            <button className="back-btn" onClick={onBack}>Back to Topics</button>
          </div>
        ) : (
          <>
            <div className="timer">
              <p>Time Remaining: {formatTime(timeRemaining)}</p>
            </div>

            <div className="quiz-question">
              <div className="question-text">
                {parseTextWithFormulas(`${currentQIndex + 1}. ${currentQuestion.question}`)}

                {currentQuestion.questionImages?.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Question ${currentQIndex + 1} Image ${idx + 1}`}
                    className="quiz-question-image"
                  />
                ))}

                {currentQuestion.tableData?.length > 0 && (
                  <table style={{ width: "100%", borderCollapse: "collapse", margin: "15px 0", border: "1px solid #ccc" }}>
                    <tbody>
                      {currentQuestion.tableData.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Options with images */}
              <div className="options-group">
                {[1, 2, 3, 4].map((num) => {
                  const optText = currentQuestion[`option${num}`];
                  const optImage = currentQuestion[`option${num}Image`];
                  const correctAnswer = currentQuestion[`option${Number(currentQuestion.correctIndex) + 1}`];
                  const isSelected = userAnswers[currentQIndex] === optText;
                  const isCorrect = submitted && optText === correctAnswer;
                  const isIncorrect = submitted && isSelected && optText !== correctAnswer;

                  return (
                    <label
                      key={num}
                      className={`option-label ${isCorrect ? "correct" : ""} ${isIncorrect ? "incorrect" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQIndex}`}
                        value={optText}
                        checked={isSelected}
                        onChange={() => handleOptionChange(optText)}
                        disabled={submitted}
                      />
                      {/* <div className="option-content">
                        {parseTextWithFormulas(optText)}
                        {optImage && (
                          <img
                            src={optImage}
                            alt={`Option ${num} Image`}
                            className="quiz-option-image"
                          />
                        )}
                      </div> */}
                      <div className="option-content">
                        <span className="option-text-inner">
                          {parseTextWithFormulas(optText)}
                        </span>

                        {optImage && (
                          <img
                            src={optImage}
                            alt={`Option ${num} Image`}
                            className="quiz-option-image"
                          />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Feedback */}

              {submitted && userAnswers[currentQIndex] !== "" && (
                <p className={
                  `feedback-msg ${userAnswers[currentQIndex] === currentQuestion[`option${Number(currentQuestion.correctIndex) + 1}`]
                    ? "correct"
                    : "incorrect"}`
                }>
                  {userAnswers[currentQIndex] === currentQuestion[`option${Number(currentQuestion.correctIndex) + 1}`]
                    ? "Well Done! (+4) 🌟"
                    : "Nice Try! Keep Rising! (-1) 💪"}
                </p>
              )}

              {/* Solution explanation & images */}
              {submitted && (
                // 1. Check if we have Explanation Text OR Valid Images before rendering the div
                (currentQuestion.explanation ||
                  (currentQuestion.solutionImages && currentQuestion.solutionImages.some(url => url !== "NO_SOLUTION_IMAGE")))
              ) && (
                  <div className="solution-explanation">
                    {currentQuestion.explanation && (
                      <p><strong>Explanation:</strong> {parseTextWithFormulas(currentQuestion.explanation)}</p>
                    )}

                    {currentQuestion.solutionImages?.map((url, idx) =>
                      url !== "NO_SOLUTION_IMAGE" && (
                        <img
                          key={idx}
                          src={url}
                          alt={`Solution ${idx + 1}`}
                          style={{ maxWidth: "100%", borderRadius: "8px", marginBottom: "10px", display: "block" }}
                        />
                      )
                    )}
                  </div>
                )}

              {/* Navigation */}
              <div className="navigation-buttons">
                <button onClick={handlePrevious} disabled={currentQIndex === 0} className="nav-btn">Previous</button>
                {currentQIndex < questions.length - 1 ? (
                  <button onClick={handleNext} className="nav-btn">Next</button>
                ) : !submitted ? (
                  <button onClick={() => setShowConfirmation(true)} className="submit-btn">Submit</button>
                ) : null}
              </div>

              {showConfirmation && (
                <div className="confirmation-popup">
                  <p>Are you sure you want to submit your answers?</p>
                  <button onClick={handleSubmit} className="confirm-btn">Yes</button>
                  <button onClick={() => setShowConfirmation(false)} className="cancel-btn">No</button>
                </div>
              )}
            </div>
          </>
        )}

        {submitted && !showResultPopup && (
          <div className="after-review-back">
            <button onClick={onBack} className="back-btn">Back to Topics</button>
          </div>
        )}
      </div>


      {submitted && showResultPopup && (
        <div className="result-popup">
          <div className="result-popup-content modern-result">

            {/* Header with Emoji */}
            <div className="result-header">
              <span className="result-emoji">{feedback.emoji}</span>
              <h3 style={{ color: feedback.color }}>{feedback.message}</h3>
            </div>

            {/* Circular Progress Gauge */}
            <div className="gauge-container">
              <div
                className="gauge-circle"
                style={{ background: `conic-gradient(${feedback.color} ${percentage}%, #e0e0e0 0)` }}
              >
                <div className="gauge-inner">
                  <span className="gauge-score">{finalScore}</span>
                  <span className="gauge-total">/ {maxMarks}</span>
                </div>
              </div>
              <p className="gauge-percentage" style={{ color: feedback.color }}>{percentage}% Score</p>

              {/* ✅ ADDED: Unlock Status Message */}
              {parseFloat(percentage) < 90 ? (
                <p style={{ color: "#d32f2f", fontSize: "0.9rem", marginTop: "5px", fontWeight: "bold" }}>
                  🔒 Score 90% to unlock the next lesson
                </p>
              ) : (
                <p style={{ color: "#388e3c", fontSize: "0.9rem", marginTop: "5px", fontWeight: "bold" }}>
                  🔓 Next Lesson Unlocked!
                </p>
              )}
            </div>

            {/* Motivating Stat Cards */}
            <div className="stats-grid">
              <div className="stat-card correct">
                <span className="stat-value">{questions.filter((q, i) => userAnswers[i] === q[`option${Number(q.correctIndex) + 1}`]).length}</span>
                <span className="stat-label">Correct</span>
              </div>
              <div className="stat-card wrong">
                <span className="stat-value">{questions.filter((q, i) => userAnswers[i] !== "" && userAnswers[i] !== q[`option${Number(q.correctIndex) + 1}`]).length}</span>
                <span className="stat-label">Learning</span> {/* Changed "Wrong" to "Learning" */}
              </div>
              <div className="stat-card skipped">
                <span className="stat-value">{questions.filter((q, i) => userAnswers[i] === "").length}</span>
                <span className="stat-label">Skipped</span>
              </div>
            </div>

            <button onClick={() => { setShowResultPopup(false); setCurrentQIndex(0); }} className="review-btn" style={{ backgroundColor: feedback.color }}>
              Review Answers
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default NeetQuiz;