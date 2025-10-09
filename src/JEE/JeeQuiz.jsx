import React, { useState, useEffect } from "react";
import "./JeeQuiz.css";
import { FaCheckCircle } from "react-icons/fa";

const JeeQuiz = ({ topicTitle, subtopicTitle, test, onBack, onMarkComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);

  useEffect(() => {
    const questionList = test?.[0]?.questionsList || [];
    setQuestions(questionList);
    setUserAnswers(Array(questionList.length).fill(""));
    setSubmitted(false);
    setCurrentQIndex(0);
    setTimeRemaining(120);
    setHasStarted(false);
    setShowConfirmation(false);
    setIsComplete(false);
    setShowResultPopup(false);
  }, [test, subtopicTitle]);

  useEffect(() => {
    if (timeRemaining > 0 && !submitted && hasStarted) {
      const timer = setInterval(() => setTimeRemaining(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeRemaining === 0 && !submitted && hasStarted) {
      handleAutoSubmit();
    }
  }, [timeRemaining, submitted, hasStarted]);
const parseTextWithFormulas = (texts) => {
  if(!texts)return;
  const text=texts.replace(/\\\\/g, "\\")
  const TEMP_DOLLAR = '__DOLLAR__';
  const safeText = text.replace(/\\\$/g, TEMP_DOLLAR);

  const parts = safeText.split(/(\$[^$]+\$)/g);

  return parts.map((part, index) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      const latex = part.slice(1, -1);
      try {
        const html = katex.renderToString(latex, {
          throwOnError: false,
          output: 'html',
        });
        return <span key={index}>{parse(html)}</span>;
      } catch (err) {
        return <span key={index} style={{ color: 'red' }}>{latex}</span>;
      }
    } else {
      return <span key={index}>{part.replaceAll(TEMP_DOLLAR, '$')}</span>;
    }
  });
};
  useEffect(() => {
    const isDone = sessionStorage.getItem(`jee-completed-${subtopicTitle}`) === "true";
    if (isDone) setIsComplete(true);
  }, [subtopicTitle]);

  const handleOptionChange = (selected) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQIndex] = selected;
    setUserAnswers(updatedAnswers);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setShowConfirmation(false);
    sessionStorage.setItem(`answers-jee-${subtopicTitle}`, JSON.stringify(userAnswers));
    sessionStorage.setItem(`quizData-jee-${subtopicTitle}`, JSON.stringify(questions));

    const score = questions.reduce((acc, q, i) => q.answer === userAnswers[i] ? acc + 1 : acc, 0);
    const percentage = ((score / questions.length) * 100).toFixed(2);

    if (percentage === "100.00") {
      sessionStorage.setItem(`jee-completed-${subtopicTitle}`, "true");
      setIsComplete(true);
      if (onMarkComplete) onMarkComplete("quiz");
    }

    setShowResultPopup(true);
  };

  const handleAutoSubmit = () => {
    setSubmitted(true);
    sessionStorage.setItem(`answers-jee-${subtopicTitle}`, JSON.stringify(userAnswers));
    sessionStorage.setItem(`quizData-jee-${subtopicTitle}`, JSON.stringify(questions));

    // Do not mark as complete
    setShowResultPopup(true);
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(currentQIndex - 1);
    }
  };

  const currentQuestion = questions[currentQIndex];
  const score = questions.reduce((acc, q, i) => q.answer === userAnswers[i] ? acc + 1 : acc, 0);
  const percentage = ((score / questions.length) * 100).toFixed(2);

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

  return (
    <div className="quiz-wrapper">
      <div className="quiz-container">
        <h2>{subtopicTitle}</h2>

        <button
          onClick={handleSubmit}
          className={`complete-btn ${isComplete ? "completed" : ""}`}
          disabled={isComplete || !submitted}
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
            <p><strong>Time Limit:</strong> 2 minutes</p>
            <p><strong>Minimum Marks to Pass:</strong> 100%</p>
            <button className="start-btn" onClick={() => setHasStarted(true)}>Start Assessment</button>
            <button className="back-btn" onClick={onBack}>Back to Topics</button>
          </div>
        ) : (
          <>
            <div className="timer">
              <p>
                Time Remaining: {Math.floor(timeRemaining / 60)}:
                {String(timeRemaining % 60).padStart(2, "0")}
              </p>
            </div>

            <div className="quiz-question">
               <pre className="question-text" style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
  {parseTextWithFormulas(`${currentQIndex + 1}. ${currentQuestion.question}`)}
</pre>
              <div className="options-group">
                {[currentQuestion.option1, currentQuestion.option2, currentQuestion.option3, currentQuestion.option4].map((opt, j) => {
                  const isSelected = userAnswers[currentQIndex] === opt;
                  const isCorrect = submitted && opt === currentQuestion.answer;
                  const isIncorrect = submitted && isSelected && opt !== currentQuestion.answer;

                  return (
                    <label
                      key={j}
                      className={`option-label ${isCorrect ? "correct" : ""} ${isIncorrect ? "incorrect" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQIndex}`}
                        value={opt}
                        checked={isSelected}
                        onChange={() => handleOptionChange(opt)}
                        disabled={submitted}
                      />
                     {parseTextWithFormulas(opt)}
                    </label>
                  );
                })}
              </div>

              {submitted && userAnswers[currentQIndex] !== "" && (
                <p className="answer-feedback">
                  {userAnswers[currentQIndex] === currentQuestion.answer
                    ? "Correct!"
                    : `Incorrect. Correct answer: ${currentQuestion.answer}`}
                </p>
              )}

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
            <p>You scored {score} out of {questions.length} ({percentage}%)</p>
            {percentage !== "100.00" && (
              <p className="not-eligible-msg">
                You must score 100% to mark this quiz as completed. Try again!
              </p>
            )}
            <button
              onClick={() => {
                setShowResultPopup(false);
                setCurrentQIndex(0);
              }}
              className="back-btn"
            >
              Back to Test
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JeeQuiz;
