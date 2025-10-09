import React, { useState, useEffect } from "react";
import { FaBars } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import "./JeeLearn.css";
import PadmasiniChat from "../components/PadmasiniChat";
import JeeExplanation from "./JeeExplanation";
import JeeQuiz from "./JeeQuiz";
import { API_BASE_URL } from "../config";

// Recursive component to render subtopics and their tests
const SubtopicTree = ({
  subtopics,
  onClick,
  selectedTitle,
  parentIndex,
  level = 1,
}) => {
  const [expandedSub, setExpandedSub] = useState(null);

  const handleSubClick = (sub, idx) => {
    if (
      (sub.units && sub.units.length > 0) ||
      (sub.test && sub.test.length > 0)
    ) {
      setExpandedSub((prev) => (prev === idx ? null : idx));
    }

    // Trigger parent click logic (for leaf subtopics)
    onClick(sub, parentIndex);
  };

  const handleTestClick = (test, idx, sub) => {
    const testSubtopic = {
      ...sub,
      unitName: `Assessment - ${sub.unitName}`,
      test: [test],
    };
    onClick(testSubtopic, parentIndex);
  };

  return (
    <ul className="subtopics-list">
      {subtopics.map((sub, idx) => (
        <li key={idx}>
          <div
            className={`subtopic-title ${selectedTitle === sub.unitName ? "selected" : ""
              }`}
            style={{ marginLeft: `${level * 20}px` }}
            onClick={() => handleSubClick(sub, idx)}
          >
            📄 {sub.unitName}
          </div>

          {expandedSub === idx &&
            sub.test &&
            sub.test.length > 0 &&
            sub.test.map((test, tIdx) => (
              <div
                key={tIdx}
                className="subtopic-title test-title"
                style={{ marginLeft: `${(level + 1) * 20}px` }}
                onClick={() => handleTestClick(test, tIdx, sub)}
              >
                📝 {test.testName} - Assessment
              </div>
            ))}

          {expandedSub === idx && sub.units && (
            <SubtopicTree
              subtopics={sub.units}
              onClick={onClick}
              selectedTitle={selectedTitle}
              parentIndex={parentIndex}
              level={level + 1}
            />
          )}
        </li>
      ))}
    </ul>
  );
};

const JeeLearn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const subject = location.state?.subject || "Physics";
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const selectedStandard =
    currentUser.selectedStandard === "11th"
      ? 11
      : currentUser.selectedStandard === "12th"
        ? 12
        : null;
  const userId = currentUser?.id || "guest";
  const [fetchedUnits, setFetchedUnits] = useState([]);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [showTopics, setShowTopics] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [completedSubtopics, setCompletedSubtopics] = useState({});

  useEffect(() => window.scrollTo(0, 0), []);

  useEffect(() => {
    const handleResize = () => {
      const isNowMobile = window.innerWidth <= 768;
      setIsMobile(isNowMobile);
      if (!isNowMobile) setShowTopics(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  useEffect(() => {
    const courseName = "professional";
    const subjectName = subject;
    const stringStandard = localStorage.getItem("currentClassJee");
    console.log(stringStandard)
    const standard = stringStandard?.replace(/\D/g, "");
    console.log(standard)
    console.log(localStorage.getItem("currentClassJee"))
    //localStorage.removeItem("currentClass")
    const getAllSubjectDetails = () => {
      fetch(
        // `http://localhost:3000/getSubjectDetails?courseName=${courseName}&subjectName=${subjectName}&standard=${standard}`,
        // `https://studentpadmasini.onrender.com/getSubjectDetails?courseName=${courseName}&subjectName=${subjectName}&standard=${standard}`,
        //  `https://padmasini-prod-api.padmasini.com/getSubjectDetails?courseName=${courseName}&subjectName=${subjectName}&standard=${standard}`,
        `${API_BASE_URL}/getSubjectDetails?courseName=${courseName}&subjectName=${subjectName}&standard=${standard}`,
        
        {
          method: "GET",
          credentials: "include",
        }
      )
        .then((resp) => resp.json())
        .then((data) => {
          console.log("details of units: ", data);
          setFetchedUnits(data);
        })
        .catch((err) => console.log("getting units error: ", err));
    };

    getAllSubjectDetails();

    // Load saved progress from localStorage
    const savedProgress = JSON.parse(
      localStorage.getItem(`completedSubtopics_${userId}_jee`) || "{}"
    );
    setCompletedSubtopics(savedProgress);
  }, []);
  // useEffect(() => {
  //   const updated = {};
  //   const traverse = (subs, topicName) => {
  //     for (const sub of subs) {
  //       if (sub.units) traverse(sub.units, topicName);
  //       const key = `jee-completed-${sub.unitName}`;
  //       if (localStorage.getItem(key) === "true") {
  //         if (!updated[topicName]) updated[topicName] = {};
  //         updated[topicName][sub.unitName] = true;
  //       }
  //     }
  //   };
  //   topics.forEach((topic) => traverse(topic.units, topic.unitName));
  //   setCompletedSubtopics(updated);
  // }, [topics]);

  const collectAllSubtopics = (subs = []) =>
    subs.flatMap((s) => [s, ...(s.units ? collectAllSubtopics(s.units) : [])]);

  // Calculate % completion for a topic
  const calculateProgress = (topic) => {
    if (!topic || !topic.units) return 0;
    const allSubs = collectAllSubtopics(topic.units);
    const completedCount = allSubs.filter(
      (sub) => completedSubtopics[topic.unitName]?.[sub.unitName]
    ).length;
    const totalCount = allSubs.length;
    return totalCount === 0
      ? 0
      : Math.round((completedCount / totalCount) * 100);
  };

  const isTopicCompleted = (topic) => calculateProgress(topic) === 100;

  const isTopicUnlocked = (index) => {
    if (index === 0) return true;
    return isTopicCompleted(fetchedUnits[index - 1]);
  };

  const toggleTopic = (index) => {
    if (!isTopicUnlocked(index)) return;
    setExpandedTopic((prev) => (prev === index ? null : index));
    setSelectedSubtopic(null);
  };

  const handleSubtopicClick = (sub, index) => {
    setSelectedSubtopic(sub);
    if (isMobile) setShowTopics(false);
    setExpandedTopic(index);
  };

  const handleBackToTopics = () => {
    setSelectedSubtopic(null);
    if (isMobile) setShowTopics(true);
  };

  const handleBackToSubjects = () => navigate("/Jee");

  const markSubtopicComplete = () => {
    if (!selectedSubtopic || expandedTopic === null) return;
    const topicTitle = fetchedUnits[expandedTopic].unitName;
    const subtopicTitle = selectedSubtopic.unitName;

    localStorage.setItem(`jee-completed-${subtopicTitle}`, "true");

    setCompletedSubtopics((prev) => {
      const topicProgress = prev[topicTitle] || {};
      if (topicProgress[subtopicTitle]) return prev;

      const updated = {
        ...prev,
        [topicTitle]: { ...topicProgress, [subtopicTitle]: true },
      };

      localStorage.setItem(
        `completedSubtopics_${userId}_jee`,
        JSON.stringify(updated)
      );
      return updated;
    });
  };

  const resetProgress = () => {
    const confirmReset = window.confirm(
      "Are you sure you want to reset all your JEE progress?"
    );
    if (!confirmReset) return;

    localStorage.removeItem(`completedSubtopics_${userId}_jee`);
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("jee-completed-")) {
        localStorage.removeItem(key);
      }
    });

    setCompletedSubtopics({});
    setExpandedTopic(null);
    setSelectedSubtopic(null);

    alert("Your JEE progress has been reset successfully.");
  };

  return (
    <div className="Jee-container">
      {isMobile && (
        <button
          className="toggle-btn"
          onClick={() => setShowTopics(!showTopics)}
        >
          <FaBars />
          <h2>{subject} Topics</h2>
        </button>
      )}
      {showTopics && (
        <div className="topics-list">
          <ul>
            {fetchedUnits.map((topic, index) => (
              <li key={index}>
                {/* <div
                  className={`topic-title ${expandedTopic === index ? "active" : ""
                    } ${!isTopicUnlocked(index) ? "locked" : ""}`}
                  onClick={() => toggleTopic(index)}
                >
                  {topic.unitName}
                  <div className="progress-bar-wrapper">
                    <div className="progress-info">
                      <span className="progress-inside">
                        {calculateProgress(topic)}%
                      </span>
                      <span className="expand-icon">
                        {expandedTopic === index ? "-" : "+"}
                      </span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${calculateProgress(topic)}%` }}
                      ></div>
                    </div>
                  </div>
                </div> */}
                <div
                  className={`topic-title ${expandedTopic === index ? "active" : ""} ${!isTopicUnlocked(index) ? "locked" : ""
                    }`}
                  onClick={() => toggleTopic(index)}
                >
                  <div className="topic-header">
                    <span>{topic.unitName}</span>
                    <span className="expand-icon">{expandedTopic === index ? "-" : "+"}</span>
                  </div>

                  <div className="progress-bar-wrapper">
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${calculateProgress(topic)}%` }}
                      ></div>
                    </div>
                    <div className="progress-info">
                      <span>{calculateProgress(topic)}%</span>
                    </div>
                  </div>
                </div>



                {expandedTopic === index && topic.units && (
                  <SubtopicTree
                    subtopics={topic.units}
                    onClick={handleSubtopicClick}
                    selectedTitle={selectedSubtopic?.unitName}
                    parentIndex={index}
                  />
                )}

                {/* Topic-level tests */}
                {expandedTopic === index && topic.test?.length > 0 && (
                  <ul className="subtopics-list">
                    {topic.test.map((test, tIdx) => {
                      const testSubtopic = {
                        ...topic,
                        unitName: `Assessment - ${topic.unitName}`,
                        test: [test],
                      };
                      return (
                        <li
                          key={tIdx}
                          className="subtopic-title test-title"
                          onClick={() =>
                            handleSubtopicClick(testSubtopic, index)
                          }
                        >
                          📝 {test.testName} - Assessment
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <button className="back-subjects-btn" onClick={handleBackToSubjects}>
              Back to Subjects
            </button>
            <button className="back-subjects-btn" onClick={resetProgress}>
              Reset Progress
            </button>
          </div>
        </div>
      )}
      {/* <div className="explanation-container">
        {selectedSubtopic ? (
          selectedSubtopic.unitName.includes("Assessment") ? (
            <JeeQuiz
              topicTitle={fetchedUnits[expandedTopic]?.unitName}
              subtopicTitle={selectedSubtopic.unitName}
              test={selectedSubtopic.test || []}
              onBack={handleBackToTopics}
              onMarkComplete={markSubtopicComplete}
            />
          ) : (
            <JeeExplanation
              topicTitle={fetchedUnits[expandedTopic]?.unitName}
              subtopicTitle={selectedSubtopic.unitName}
              subject={subject}
              explanation={selectedSubtopic.explanation || ""}
              audioFileId={selectedSubtopic.audioFileId || []}
              onBack={handleBackToTopics}
              onMarkComplete={markSubtopicComplete}
            />
          )
        ) : (
          <div className="no-explanation">
            <h2>
              Welcome to {subject} - Std {selectedStandard}
            </h2>
            <p>Select a topic and subtopic to begin your learning journey.</p>
          </div>
        )}
      </div> */}


      {/* to fetch ai video  */}
      <div className="explanation-container">
        {selectedSubtopic ? (
          selectedSubtopic.unitName.includes("Assessment") ? (
            <JeeQuiz
              topicTitle={fetchedUnits[expandedTopic]?.unitName}
              subtopicTitle={selectedSubtopic.unitName}
              test={selectedSubtopic.test || []}
              onBack={handleBackToTopics}
              onMarkComplete={markSubtopicComplete}
            />
          ) : (
            <>
              <JeeExplanation
                topicTitle={fetchedUnits[expandedTopic]?.unitName}
                subtopicTitle={selectedSubtopic.unitName}
                subject={subject}
                explanation={selectedSubtopic.explanation || ""}
                audioFileId={selectedSubtopic.audioFileId || []}
                onBack={handleBackToTopics}
                onMarkComplete={markSubtopicComplete}
              />

              {/* Show AI Generated Video */}
              {selectedSubtopic?.video_url && (
                <div style={{ marginTop: "20px" }}>
                  <h5>AI Generated Video</h5>
                  <video width="100%" controls>
                    <source src={selectedSubtopic.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
            </>
          )
        ) : (
          <div className="no-explanation">
            <h2>
              Welcome to {subject} - Std {selectedStandard}
            </h2>
            <p>Select a topic and subtopic to begin your learning journey.</p>
          </div>
        )}
      </div>
      <PadmasiniChat subjectName={subject} />
    </div>
  );
};

export default JeeLearn;
