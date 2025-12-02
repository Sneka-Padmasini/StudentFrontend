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

const NeetQuiz = ({ topicTitle, subtopicTitle, test, onBack, onMarkComplete, isAlreadyComplete }) => {
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

  useEffect(() => {
    const allQuestions = test?.[0]?.questionsList || [];

    // --- New Shuffle and Slice Logic ---
    const shuffledQuestions = shuffleArray([...allQuestions]); // Shuffle a copy

    // CHANGED: Set to 180 Questions for NEET Pattern
    const MAX_QUESTIONS = 180;

    const finalQuestionList = shuffledQuestions.slice(0, MAX_QUESTIONS);
    // --- End of New Logic ---

    setQuestions(finalQuestionList);
    setUserAnswers(Array(finalQuestionList.length).fill(""));
    setSubmitted(false);
    setCurrentQIndex(0);

    // CHANGED: Reset time to 180 minutes (10800 seconds)
    setTimeRemaining(10800);

    setHasStarted(false);
    setShowConfirmation(false);
    setIsComplete(false);
    setShowResultPopup(false);
  }, [test, subtopicTitle]);

  useEffect(() => {
    if (timeRemaining > 0 && !submitted && hasStarted) {
      const timer = setInterval(() => setTimeRemaining((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeRemaining === 0 && !submitted && hasStarted) {
      handleAutoSubmit();
    }
  }, [timeRemaining, submitted, hasStarted]);

  const parseTextWithFormulas = (texts) => {
    if (!texts) return;
    const text = texts.replace(/\\\\/g, "\\");
    const TEMP_DOLLAR = "__DOLLAR__";
    const safeText = text.replace(/\\\$/g, TEMP_DOLLAR);
    const parts = safeText.split(/(\$[^$]+\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith("$") && part.endsWith("$")) {
        const latex = part.slice(1, -1);
        try {
          const html = katex.renderToString(latex, { throwOnError: false, output: "html" });
          return <span key={index}>{parse(html)}</span>;
        } catch (err) {
          return <span key={index} style={{ color: "red" }}>{latex}</span>;
        }
      } else {
        return <span key={index}>{part.replaceAll(TEMP_DOLLAR, "$")}</span>;
      }
    });
  };

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

    // Logic: In real NEET, you don't need 100% to "pass", 
    // but I kept your logic that marks it 'Complete' only on high performance.
    // You might want to lower this threshold or remove the check entirely.
    if (percentage === "100.00") {
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

  return (
    <div className="quiz-wrapper">
      <div className="quiz-container">
        <h2>{subtopicTitle}</h2>

        <button
          onClick={handleMarkComplete}
          className={`complete-btn ${isComplete ? "completed" : ""}`}
          disabled={isComplete}
        >
          {isComplete ? <>Completed <FaCheckCircle className="check-icon" /></> : "Mark as Complete"}
        </button>

        {!hasStarted ? (
          <div className="start-screen">
            <p><strong>Total Questions:</strong> {questions.length}</p>
            <p><strong>Total Marks:</strong> {questions.length * 4}</p>
            <p><strong>Time Limit:</strong> 180 minutes</p>
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
                  <img key={idx} src={url} alt={`Question ${currentQIndex + 1} Image ${idx + 1}`} style={{ maxWidth: "100%", margin: "10px 0", borderRadius: "8px" }} />
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
                      <div className="option-content">
                        {parseTextWithFormulas(optText)}
                        {optImage && (
                          <img
                            src={optImage}
                            alt={`Option ${num} Image`}
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
                    ? "Correct! (+4 Marks)"
                    : `Incorrect. (-1 Mark) Correct answer: ${currentQuestion[`option${Number(currentQuestion.correctIndex) + 1}`]}`}
                </p>
              )}

              {/* Solution explanation & images */}
              {submitted && (
                <div className="solution-explanation">
                  {currentQuestion.explanation && <p><strong>Explanation:</strong> {parseTextWithFormulas(currentQuestion.explanation)}</p>}
                  {currentQuestion.solutionImages?.map((url, idx) =>
                    url !== "NO_SOLUTION_IMAGE" && (
                      <img key={idx} src={url} alt={`Solution ${idx + 1}`} style={{ maxWidth: "100%", borderRadius: "8px", marginBottom: "10px" }} />
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
          <div className="result-popup-content">
            <h3>Quiz Result</h3>
            <p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
              Score: {finalScore} / {maxMarks}
            </p>
            <p>Percentage: {percentage}%</p>

            {/* Display detailed breakdown */}
            <div style={{ margin: "10px 0", fontSize: "0.9rem", color: "#555" }}>
              <p>Correct: {questions.filter((q, i) => userAnswers[i] === q[`option${Number(q.correctIndex) + 1}`]).length} (+4 each)</p>
              <p>Wrong: {questions.filter((q, i) => userAnswers[i] !== "" && userAnswers[i] !== q[`option${Number(q.correctIndex) + 1}`]).length} (-1 each)</p>
              <p>Unattempted: {questions.filter((q, i) => userAnswers[i] === "").length} (0 marks)</p>
            </div>

            <button onClick={() => { setShowResultPopup(false); setCurrentQIndex(0); }} className="back-btn">
              Review Answers
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NeetQuiz;