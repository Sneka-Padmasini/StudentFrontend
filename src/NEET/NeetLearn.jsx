import React, { useState, useEffect } from "react";
import { FaBars } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import "./NeetLearn.css";
import PadmasiniChat from "../components/PadmasiniChat";
import NeetExplanation from "./NeetExplanation";
import NeetQuiz from "./NeetQuiz";
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
    // Expand if children/tests exist
    if (
      (sub.units && sub.units.length > 0) ||
      (sub.test && sub.test.length > 0)
    ) {
      setExpandedSub((prev) => (prev === idx ? null : idx));
    }
    // Always open explanation as well
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
            ⮚ {sub.unitName}
          </div>

          {/* Show tests when expanded */}
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

          {/* Recursive children */}
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

const NeetLearn = () => {
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

  // ADD THIS useEffect to load completed subtopics
  useEffect(() => {
    const savedProgress = localStorage.getItem(`completedSubtopics_${userId}_neet`);
    if (savedProgress) {
      setCompletedSubtopics(JSON.parse(savedProgress));
    }
  }, [userId]);

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
    console.log("📈 Current completedSubtopics:", completedSubtopics);
    console.log("📈 Current expandedTopic:", expandedTopic);
    console.log("📈 Current selectedSubtopic:", selectedSubtopic);

    if (expandedTopic !== null && fetchedUnits[expandedTopic]) {
      const topic = fetchedUnits[expandedTopic];
      const progress = calculateProgress(topic);
      console.log(`📊 Progress for ${topic.unitName}: ${progress}%`);
    }
  }, [completedSubtopics, expandedTopic, selectedSubtopic]);

  useEffect(() => {
    const getAllSubjectDetails = () => {
      const subjectName = subject;
      const stringStandard = localStorage.getItem("currentClass");
      // const standard = stringStandard?.replace(/\D/g, "");
      const standard = String(stringStandard?.replace(/\D/g, ""));


      // 🧭 Dynamically map the user's course type to the MongoDB folder
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      let courseName = "professional"; // default

      if (currentUser?.coursetype) {
        const type = currentUser.coursetype.toLowerCase();
        if (type.includes("neet")) courseName = "professional";
        else if (type.includes("jee")) courseName = "professional";
        else if (type.includes("school")) courseName = "local";
      }

      console.log("📘 Fetching details for:", { courseName, subjectName, standard });


      fetch(
        `${API_BASE_URL}/api/getAllUnits/${courseName}/${subjectName}/${standard}`,
        {
          method: "GET",
          credentials: "include",
        }
      )

        .then(async (resp) => {
          if (!resp.ok) {
            const text = await resp.text();
            console.error("❌ Server error:", text);
            throw new Error(text);
          }
          return resp.json();
        })
        .then((data) => {
          console.log(`✅ ${subjectName} data fetched:`, data);
          setFetchedUnits(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error("❌ Error fetching subject details:", err);
          setFetchedUnits([]);
        });
    };

    getAllSubjectDetails();
  }, [subject]);




  // Recursively flatten all subtopics in a topic
  const collectAllSubtopics = (subs = []) =>
    subs.flatMap((s) => [s, ...(s.units ? collectAllSubtopics(s.units) : [])]);


  // Calculate % completion for a topic - FIXED VERSION
  const calculateProgress = (topic) => {
    if (!topic || !topic.units) return 0;

    // Get all subtopics (lessons) recursively
    const allSubs = collectAllSubtopics(topic.units);

    // Count completed subtopics
    const completedCount = allSubs.filter((sub) => {
      const isCompleted = completedSubtopics[topic.unitName]?.[sub.unitName];
      console.log(`📝 Checking ${sub.unitName}: ${isCompleted ? '✅' : '❌'}`);
      return isCompleted;
    }).length;

    const totalCount = allSubs.length;
    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    console.log(`📊 Progress for ${topic.unitName}: ${completedCount}/${totalCount} = ${progress}%`);
    return progress;
  };

  const isTopicCompleted = (topic) => {
    const progress = calculateProgress(topic);
    const completed = progress === 100;
    console.log(`🔓 Topic ${topic.unitName} completed: ${completed} (${progress}%)`);
    return completed;
  };

  // ADD THIS MISSING FUNCTION
  const isTopicUnlocked = (index) => {
    if (index === 0) return true; // Always unlock first topic
    const prevTopic = fetchedUnits[index - 1];
    return isTopicCompleted(prevTopic);
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

  const handleBackToSubjects = () => navigate("/Neet");


  const markSubtopicComplete = () => {
    if (!selectedSubtopic || expandedTopic === null) return;

    const topicTitle = fetchedUnits[expandedTopic].unitName;
    const subtopicTitle = selectedSubtopic.unitName;

    console.log("🔵 Marking complete:", { topicTitle, subtopicTitle });

    // For tests, we need to mark ALL subtopics in the topic as completed
    if (subtopicTitle.includes("Assessment")) {
      console.log("🎯 This is a test - marking ALL subtopics in topic as completed");

      setCompletedSubtopics((prev) => {
        const topicProgress = prev[topicTitle] || {};

        // Get all subtopics in this topic
        const allSubs = collectAllSubtopics(fetchedUnits[expandedTopic].units);

        // Mark ALL subtopics as completed
        const updatedProgress = { ...topicProgress };
        allSubs.forEach(sub => {
          updatedProgress[sub.unitName] = true;
          localStorage.setItem(`neet-completed-${sub.unitName}`, "true");
        });

        // Also mark the test itself
        updatedProgress[subtopicTitle] = true;
        localStorage.setItem(`neet-completed-${subtopicTitle}`, "true");

        const updated = {
          ...prev,
          [topicTitle]: updatedProgress
        };

        console.log("🟢 Marked ALL subtopics as completed:", Object.keys(updatedProgress));

        // Save to localStorage
        localStorage.setItem(`completedSubtopics_${userId}_neet`, JSON.stringify(updated));

        return updated;
      });
    } else {
      // For regular lessons (existing logic)
      setCompletedSubtopics((prev) => {
        const topicProgress = prev[topicTitle] || {};

        if (topicProgress[subtopicTitle]) {
          console.log("🟡 Already completed, skipping");
          return prev;
        }

        const updated = {
          ...prev,
          [topicTitle]: {
            ...topicProgress,
            [subtopicTitle]: true
          }
        };

        console.log("🟢 Updated progress:", updated);

        // Save to localStorage
        localStorage.setItem(`completedSubtopics_${userId}_neet`, JSON.stringify(updated));
        localStorage.setItem(`neet-completed-${subtopicTitle}`, "true");

        return updated;
      });
    }
  };

  const resetProgress = () => {
    const confirmReset = window.confirm(
      "Are you sure you want to reset all your NEET progress?"
    );
    if (!confirmReset) return;

    localStorage.removeItem(`completedSubtopics_${userId}_neet`);
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("neet-completed-")) {
        localStorage.removeItem(key);
      }
    });

    setCompletedSubtopics({});
    setExpandedTopic(null);
    setSelectedSubtopic(null);

    alert("Your NEET progress has been reset successfully.");
  };

  return (
    <div className="Neet-container">
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
                <div
                  className={`topic-title ${expandedTopic === index ? "active" : ""
                    } ${!isTopicUnlocked(index) ? "locked" : ""}`}
                  onClick={() => toggleTopic(index)}
                >
                  {/* Topic Header with expand icon aligned right */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span> {topic.unitName}</span>

                    <span className="expand-icon">
                      {expandedTopic === index ? "−" : "+"}
                    </span>
                  </div>

                  {/* Slim Progress Bar */}
                  <div className="progress-bar-wrapper">
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${calculateProgress(topic)}%` }}
                      ></div>
                    </div>
                    <div className="progress-info">
                      {calculateProgress(topic)}%
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

      {/* Explanation / Quiz Section */}
      <div className="explanation-container">
        {selectedSubtopic ? (
          selectedSubtopic.unitName.includes("Assessment") ? (
            <NeetQuiz
              topicTitle={fetchedUnits[expandedTopic]?.unitName}
              subtopicTitle={selectedSubtopic.unitName}
              test={selectedSubtopic.test || []}
              onBack={handleBackToTopics}
              onMarkComplete={markSubtopicComplete}
            />
          ) : (
            <>

              <NeetExplanation
                topicTitle={fetchedUnits[expandedTopic]?.unitName}
                subtopicTitle={selectedSubtopic.unitName}
                subject={subject}
                explanation={selectedSubtopic.explanation || ""}
                // audioFileId={selectedSubtopic.audioFileId || []}
                imageUrls={selectedSubtopic.imageUrls || []}
                onBack={handleBackToTopics}
                onMarkComplete={markSubtopicComplete}
              />



              {/* Show AI Generated Video (robust to different field names) */}
              {(selectedSubtopic?.videoUrl || selectedSubtopic?.video_url || selectedSubtopic?.aiVideoUrl) && (
                <div className="ai-video-container" style={{ marginTop: "20px" }}>
                  <h5>AI Generated Video</h5>
                  <video width="100%" controls>
                    <source
                      src={selectedSubtopic?.videoUrl || selectedSubtopic?.video_url || selectedSubtopic?.aiVideoUrl}
                      type="video/mp4"
                    />
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

export default NeetLearn;