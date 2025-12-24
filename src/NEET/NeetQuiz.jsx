import React, { useState, useEffect } from "react";
import "./NeetQuiz.css";
import { FaCheckCircle, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import katex from "katex";
import parse from "html-react-parser";
import "katex/dist/katex.min.css";

const shuffleArray = (array) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

const NeetQuiz = ({ topicTitle, subtopicTitle, test, onBack, onMarkComplete, isAlreadyComplete, isMock, isUnitTest, onNextTopic, userName = "Student" }) => {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState(10800);

  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(isAlreadyComplete);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(true);


  // --- NEW SPEECH SETUP ---
  const synth = window.speechSynthesis;
  const [voice, setVoice] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  // ✅ CONDITION: Only allow voice if it's NOT a Mock and NOT a "Unit Test"
  const isVoiceEnabled = !isMock && !isUnitTest;

  // 1. Load Voice (Prefer Indian Female)
  useEffect(() => {
    if (!isVoiceEnabled) return;

    const loadVoices = () => {
      const voices = synth.getVoices();
      const preferredVoice = voices.find(
        (v) => (v.lang.includes("en-IN") || v.name.includes("India")) && v.name.includes("Female")
      ) || voices.find((v) => v.lang.includes("en-IN")) || voices[0];
      setVoice(preferredVoice);
    };
    synth.onvoiceschanged = loadVoices;
    loadVoices();
    return () => synth.cancel();
  }, [isVoiceEnabled]);

  // 2. Helper to clean text
  const cleanTextForSpeech = (html) => {
    if (!html) return "";
    return html
      .replace(/<[^>]+>/g, "")
      .replace(/\$\$/g, "")
      .replace(/\$/g, "")
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 over $2") // Read fractions
      .replace(/_/g, " sub ")   // Read underscore as "sub"
      .replace(/\^/g, " power ")// Read caret as "power"
      .replace(/\s+/g, " ")     // Collapse multiple spaces
      .replace(/\\/g, "")
      .trim();
  };

  // 3. Speak Function
  const speakText = (text) => {
    if (!isVoiceEnabled || isMuted) {
      synth.cancel();
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
  };

  // ✅ 4. Add Toggle Mute Function
  const toggleMute = () => {
    setIsMuted(prev => !prev);
    if (!isMuted) {
      synth.cancel();
    }
  };

  // ✅ AUTO-READ: Reads question when index changes (with Intro)
  useEffect(() => {
    if (hasStarted && isVoiceEnabled && !isMuted && questions.length > 0) {
      const currentQ = questions[currentQIndex];
      const textToRead = cleanTextForSpeech(currentQ.question);

      if (currentQIndex === 0) {
        // Safe check for the name
        const validName = (userName && userName !== "undefined" && userName !== "null") ? userName : "Student";

        if (!submitted) {
          speakText(`Hello ${validName}, Let's do some practice. ${textToRead}`);
        } else {
          speakText(textToRead);
        }
      } else {
        speakText(textToRead);
      }
    }
    if (isMuted) {
      synth.cancel();
    }
  }, [currentQIndex, hasStarted, isVoiceEnabled, isMuted, userName, submitted]);

  // ✅ SCROLL FIX: Ensure quiz starts at the top when title changes
  useEffect(() => {
    window.scrollTo(0, 0);
    const container = document.querySelector('.explanation-container');
    if (container) container.scrollTop = 0;
  }, [subtopicTitle, hasStarted]);



  useEffect(() => {
    const rawQuestions = test?.[0]?.questionsList || [];
    let filteredQuestions = rawQuestions;

    // 1. ✅ GET USER STANDARDS FROM LOCAL STORAGE
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userStandards = currentUser.selectedStandard || currentUser.standards || [];

    // 2. ✅ APPLY FILTERING LOGIC (If user is not 'Both')
    const has11th = userStandards.includes("11th");
    const has12th = userStandards.includes("12th");

    // Only filter if we have specific data. If user has BOTH or NEITHER, show all.
    if (has11th && !has12th) {
      filteredQuestions = rawQuestions.filter(q =>
        q.class === "11" || q.std === "11" || q.class === 11 || q.std === 11
      );
    } else if (!has11th && has12th) {
      filteredQuestions = rawQuestions.filter(q =>
        q.class === "12" || q.std === "12" || q.class === 12 || q.std === 12
      );
    }

    let finalQuestionList = [];

    // Logic to select questions
    if (isMock) {
      finalQuestionList = filteredQuestions;
    } else {
      const shuffledQuestions = shuffleArray([...filteredQuestions]);
      const MAX_QUESTIONS = 180;
      finalQuestionList = shuffledQuestions.slice(0, MAX_QUESTIONS);
    }

    setQuestions(finalQuestionList);
    setUserAnswers(Array(finalQuestionList.length).fill(""));
    setSubmitted(false);
    setCurrentQIndex(0);

    // === UPDATED TIMING LOGIC ===
    if (isMock) {
      setTimeRemaining(10800);
    } else {
      setTimeRemaining(finalQuestionList.length * 60);
    }

    setHasStarted(false);
    setShowConfirmation(false);
    setIsComplete(false);
    setShowResultPopup(false);

  }, [subtopicTitle, isMock, test]);

  useEffect(() => {
    if (isVoiceEnabled) {
      setHasStarted(true);
    }
  }, [isVoiceEnabled]);

  const parseTextWithFormulas = (texts) => {
    if (!texts) return null;

    // 1. Clean up the input string
    let text = texts
      .replace(/\\\\/g, "\\")
      .replace(/<\s*br\s*\/?\s*>/gi, "<br/>")
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

    // ✅ Voice Logic check
    if (isVoiceEnabled && !isMuted) {
      const currentQ = questions[currentQIndex];
      const correctAns = currentQ[`option${Number(currentQ.correctIndex) + 1}`];
      const explanationText = cleanTextForSpeech(currentQ.explanation || "No explanation available.");

      if (selected === correctAns) {
        speakText("Correct Answer! " + explanationText);
      } else {
        speakText(`Wrong Answer. ${explanationText}`);
      }
    }
  };

  // ✅ UPDATE SCORE CALCULATION
  const calculateNEETScore = () => {
    return questions.reduce((acc, q, i) => {
      const correctAnswer = q[`option${Number(q.correctIndex) + 1}`];
      const userAnswer = userAnswers[i];

      if (!userAnswer) return acc;

      if (userAnswer === correctAnswer) {
        return acc + (isVoiceEnabled ? 1 : 4);
      } else {
        return acc + (isVoiceEnabled ? 0 : -1);
      }
    }, 0);
  };

  // ✅ 2. UPDATE HANDLE SUBMIT
  const handleSubmit = () => {
    if (synth.speaking) synth.cancel();
    setSubmitted(true);
    setShowConfirmation(false);
    sessionStorage.setItem(`answers-neet-${subtopicTitle}`, JSON.stringify(userAnswers));
    sessionStorage.setItem(`quizData-neet-${subtopicTitle}`, JSON.stringify(questions));

    const finalScore = calculateNEETScore();

    const maxMarks = questions.length * (isVoiceEnabled ? 1 : 4);

    const percentage = maxMarks > 0 ? ((finalScore / maxMarks) * 100).toFixed(2) : 0;

    const passingScore = isVoiceEnabled ? 100 : 90;

    if (parseFloat(percentage) >= passingScore) {
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
  const maxMarks = questions.length * (isVoiceEnabled ? 1 : 4);
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
  const getResultFeedback = (percentage) => {
    const p = parseFloat(percentage);
    if (p === 100) return { message: "Excellent! You are a Champion! 🏆", color: "#4CAF50", emoji: "🌟" };
    if (p >= 90) return { message: "Awesome! Almost There! 🚀", color: "#2196F3", emoji: "🔥" };
    if (p >= 80) return { message: "Good Job! Push Harder! 💪", color: "#FF9800", emoji: "⚡" };
    if (p >= 70) return { message: "Good Try! Work More! 🌱", color: "#FFC107", emoji: "📈" };
    if (p >= 50) return { message: "Set a Goal! Work Hard! 🎯", color: "#FF5722", emoji: "📝" };
    return { message: "Don't Give Up! Continue Learning! ⏳", color: "#F44336", emoji: "📚" };
  };

  // 🎨 Helper: Get motivational message & color based on percentage from env file 
  // const getResultFeedback = (percentage) => {
  //   const p = parseFloat(percentage);

  //   if (p === 100) return {
  //     message: import.meta.env.VITE_FEEDBACK_MSG_100 || "Excellent! You are a Champion! 🏆",
  //     color: "#4CAF50",
  //     emoji: "🌟"
  //   };

  //   if (p >= 90) return {
  //     message: import.meta.env.VITE_FEEDBACK_MSG_90 || "Awesome! Almost There! 🚀",
  //     color: "#2196F3",
  //     emoji: "🔥"
  //   };

  //   if (p >= 80) return {
  //     message: import.meta.env.VITE_FEEDBACK_MSG_80 || "Good Job! Push Harder! 💪",
  //     color: "#FF9800",
  //     emoji: "⚡"
  //   };

  //   if (p >= 70) return {
  //     message: import.meta.env.VITE_FEEDBACK_MSG_70 || "Good Try! Work More! 🌱",
  //     color: "#FFC107",
  //     emoji: "📈"
  //   };

  //   if (p >= 50) return {
  //     message: import.meta.env.VITE_FEEDBACK_MSG_50 || "Set a Goal! Work Hard! 🎯",
  //     color: "#FF5722",
  //     emoji: "📝"
  //   };

  //   return {
  //     message: import.meta.env.VITE_FEEDBACK_MSG_FAIL || "Don't Give Up! Continue Learning! ⏳",
  //     color: "#F44336",
  //     emoji: "📚"
  //   };
  // };

  const feedback = getResultFeedback(percentage);


  const showSolutionNow = submitted || (isVoiceEnabled && userAnswers[currentQIndex]);

  // ✅ NEW: Handle finishing a Topic Test (No popup, direct exit)
  const handlePracticeFinish = () => {
    if (synth.speaking) synth.cancel();

    if (onMarkComplete) {
      onMarkComplete();
    }

    if (onNextTopic) {
      onNextTopic();
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className="quiz-wrapper">
      <div className="quiz-container">
        <h2>{subtopicTitle}</h2>

        {/* For Developer testing */}

        {/* <button
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
        </button> */}



        {!hasStarted && !isVoiceEnabled ? (
          // --- START SCREEN ---
          <div className="start-screen">
            <p><strong>Total Questions:</strong> {questions.length}</p>
            <p><strong>Total Marks:</strong> {questions.length * (isVoiceEnabled ? 1 : 4)}</p>
            <p><strong>Time Limit:</strong> {isMock ? "180" : questions.length} minutes</p>
            <p style={{ fontSize: "1rem", color: "#666", marginTop: "10px" }}>
              Pattern: {isVoiceEnabled ? "+1 for Correct, No Negative Marks." : "+4 for Correct, -1 for Wrong, 0 for Unattempted."}
            </p>
            <button className="start-btn" onClick={() => setHasStarted(true)}>Start Assessment</button>
            <button className="back-btn" onClick={onBack}>Back to Topics</button>
          </div>
        ) : (
          <>
            {/* --- ACTIVE QUIZ UI --- */}

            {/* 2. Timer Bar */}
            {!isVoiceEnabled && (
              <div className="timer">
                <p>Time Remaining: {formatTime(timeRemaining)}</p>
              </div>
            )}

            {/* 3. Main Layout (Split View: Tracker + Content) */}
            <div className="quiz-main-layout">

              {/* A. Tracker Toggle Button */}
              {!isVoiceEnabled && (
                <>
                  <button
                    className="tracker-toggle-btn"
                    onClick={() => setIsTrackerOpen(prev => !prev)}
                    title={isTrackerOpen ? "Close Tracker" : "Open Tracker"}
                  >
                    {isTrackerOpen ? "⟨⟨" : "⟩⟩"}
                  </button>

                  {/* B. Tracker Sidebar (Left) */}
                  {isTrackerOpen && (
                    <div className="tracker-panel">
                      <div className="tracker-header">Question Navigator</div>

                      <div className="tracker-legend">
                        <span><i className="dot answered"></i> Answered</span>
                        <span><i className="dot skipped"></i> Skipped</span>
                        <span><i className="dot current"></i> Current</span>
                      </div>

                      <div className="tracker-grid">
                        {questions.map((_, index) => {
                          const isAnswered = userAnswers[index] !== "";
                          const isCurrent = index === currentQIndex;
                          let status = "skipped";
                          if (isAnswered) status = "answered";
                          if (isCurrent) status += " current";

                          return (
                            <button
                              key={index}
                              className={`tracker-dot ${status}`}
                              onClick={() => setCurrentQIndex(index)}
                            >
                              {index + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* C. Right Side Content (Question + Nav) */}
              <div className="quiz-content">

                {/* Scrollable Question Area */}
                <div className="quiz-question-scroll">
                  <div className="quiz-question-wrapper">

                    <div className="question-text">
                      <span style={{ marginRight: '10px', fontWeight: 'bold' }}>
                        Q.{currentQIndex + 1}

                        {isVoiceEnabled && (
                          <button
                            onClick={toggleMute}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              marginLeft: "10px",
                              color: isMuted ? "#999" : "#006400",
                              fontSize: "1.2rem",
                              verticalAlign: "middle"
                            }}
                            title={isMuted ? "Unmute" : "Mute"}
                          >
                            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                          </button>
                        )}

                      </span>
                      {parseTextWithFormulas(currentQuestion.question)}

                      {currentQuestion.questionImages?.map((url, idx) => (
                        <img key={idx} src={url} alt={`Question ${currentQIndex + 1} Image ${idx + 1}`} className="quiz-question-image" />
                      ))}

                      {currentQuestion.tableData?.length > 0 && (
                        <table style={{ width: "100%", borderCollapse: "collapse", margin: "15px 0", border: "1px solid #ccc", background: 'white' }}>
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

                    {/* Options */}
                    <div className="options-group">
                      {[1, 2, 3, 4].map((num) => {
                        const optText = currentQuestion[`option${num}`];
                        const optImage = currentQuestion[`option${num}Image`];
                        const correctAnswer = currentQuestion[`option${Number(currentQuestion.correctIndex) + 1}`];
                        const isSelected = userAnswers[currentQIndex] === optText;

                        const showColors = submitted || (isVoiceEnabled && isSelected);

                        const isCorrect = showColors && optText === correctAnswer;
                        const isIncorrect = showColors && isSelected && optText !== correctAnswer;

                        return (
                          <label
                            key={num}
                            className={`option-label ${isSelected ? "selected-opt" : ""} ${isCorrect ? "correct" : ""} ${isIncorrect ? "incorrect" : ""}`}
                          >
                            <input
                              type="radio"
                              name={`q-${currentQIndex}`}
                              value={optText}
                              checked={isSelected}
                              onChange={() => handleOptionChange(optText)}
                              disabled={submitted || (isVoiceEnabled && userAnswers[currentQIndex])}
                            />
                            <div className="option-content">
                              <span className="option-text-inner">{parseTextWithFormulas(optText)}</span>
                              {optImage && <img src={optImage} alt={`Option ${num}`} className="quiz-option-image" />}
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {/* Feedback Message (Correct/Wrong) */}
                    {showSolutionNow && userAnswers[currentQIndex] !== "" && (
                      <p className={`feedback-msg ${userAnswers[currentQIndex] === currentQuestion[`option${Number(currentQuestion.correctIndex) + 1}`] ? "correct" : "incorrect"}`}>
                        {userAnswers[currentQIndex] === currentQuestion[`option${Number(currentQuestion.correctIndex) + 1}`]
                          ? ` ${isVoiceEnabled ? "Well Done!" : "Well Done! (+4)"} 🌟`
                          : `${isVoiceEnabled ? "Nice Try! Keep Rising!" : "Nice Try! Keep Rising! (-1)"} 💪`}
                      </p>
                    )}

                    {/* ✅ EXPLANATION BOX (Uses showSolutionNow) */}
                    {showSolutionNow && (
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

                  </div>
                </div>


                {/* Footer Buttons */}
                <div className="quiz-question-footer">
                  <div className="navigation-buttons">
                    <button onClick={handlePrevious} disabled={currentQIndex === 0} className="nav-btn">Previous</button>

                    {/* Logic for Next / Complete / Submit Buttons */}
                    {currentQIndex < questions.length - 1 ? (
                      <button onClick={handleNext} className="nav-btn">Next</button>
                    ) : (
                      <>
                        {isVoiceEnabled ? (
                          <button onClick={handlePracticeFinish} className="submit-btn" style={{ backgroundColor: "#4CAF50" }}>
                            {isComplete ? "Next Topic" : "Complete"}
                          </button>
                        ) : (
                          !submitted && (
                            <button onClick={() => setShowConfirmation(true)} className="submit-btn">Submit</button>
                          )
                        )}
                      </>
                    )}
                  </div>

                  {showConfirmation && (
                    <div className="confirmation-popup">
                      <p>Are you sure you want to submit your answers?</p>
                      <button onClick={handleSubmit} className="confirm-btn">Yes</button>
                      <button onClick={() => setShowConfirmation(false)} className="cancel-btn">No</button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </>
        )}

        {/* Back Button (Only after review) */}
        {submitted && !showResultPopup && (
          <div className="after-review-back">
            <button onClick={onBack} className="back-btn">Back to Topics</button>
          </div>
        )}
      </div>

      {/* Result Popup Overlay */}
      {submitted && showResultPopup && !isVoiceEnabled && (
        <div className="result-popup">
          <div className="result-popup-content modern-result">
            <div className="result-header">
              <span className="result-emoji">{feedback.emoji}</span>
              <h3 style={{ color: feedback.color }}>{feedback.message}</h3>
            </div>

            <div className="gauge-container">
              <div className="gauge-circle" style={{ background: `conic-gradient(${feedback.color} ${percentage}%, #e0e0e0 0)` }}>
                <div className="gauge-inner">
                  <span className="gauge-score">{finalScore}</span>
                  <span className="gauge-total">/ {maxMarks}</span>
                </div>
              </div>
              <p className="gauge-percentage" style={{ color: feedback.color }}>{percentage}% Score</p>

              {/* Unlock Logic Display */}
              {parseFloat(percentage) < (isVoiceEnabled ? 100 : 90) ? (
                <p style={{ color: "#d32f2f", fontSize: "0.9rem", marginTop: "5px", fontWeight: "bold" }}>
                  🔒 Score {isVoiceEnabled ? "100%" : "90%"} to unlock the next lesson
                </p>
              ) : (
                <p style={{ color: "#388e3c", fontSize: "0.9rem", marginTop: "5px", fontWeight: "bold" }}>
                  🔓 Next Lesson Unlocked!
                </p>
              )}
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card correct">
                <span className="stat-value">{questions.filter((q, i) => userAnswers[i] === q[`option${Number(q.correctIndex) + 1}`]).length}</span>
                <span className="stat-label">Correct</span>
              </div>
              <div className="stat-card wrong">
                <span className="stat-value">{questions.filter((q, i) => userAnswers[i] !== "" && userAnswers[i] !== q[`option${Number(q.correctIndex) + 1}`]).length}</span>
                <span className="stat-label">Learning</span>
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

// end of NeetQuiz component

export default NeetQuiz;