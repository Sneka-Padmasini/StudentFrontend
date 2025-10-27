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
    if ((sub.units && sub.units.length > 0) || (sub.test && sub.test.length > 0)) {
      setExpandedSub((prev) => (prev === idx ? null : idx));
    }
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
            className={`subtopic-title ${selectedTitle === sub.unitName ? "selected" : ""}`}
            style={{ marginLeft: `${level * 20}px` }}
            onClick={() => handleSubClick(sub, idx)}
          >
            ⮚ {sub.unitName}
          </div>

          {/* Show tests when expanded */}
          {expandedSub === idx &&
            sub.test?.length > 0 &&
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

  // ADD THIS useEffect to load completed subtopics
  useEffect(() => {
    const savedProgress = localStorage.getItem(`completedSubtopics_${userId}_jee`);
    if (savedProgress) {
      setCompletedSubtopics(JSON.parse(savedProgress));
    }
  }, [userId]);

  // Responsive check
  useEffect(() => {
    const handleResize = () => {
      const isNowMobile = window.innerWidth <= 768;
      setIsMobile(isNowMobile);
      if (!isNowMobile) setShowTopics(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Debug useEffect
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

  // Fetch all units and restore progress
  useEffect(() => {
    const getAllSubjectDetails = async () => {
      const stringStandard = localStorage.getItem("currentClassJee");
      const standard = String(stringStandard?.replace(/\D/g, ""));
      let courseName = "professional";

      if (currentUser?.coursetype) {
        const type = currentUser.coursetype.toLowerCase();
        if (type.includes("jee")) courseName = "professional";
        else if (type.includes("neet")) courseName = "professional";
        else if (type.includes("school")) courseName = "local";
      }

      try {
        const resp = await fetch(
          `${API_BASE_URL}/api/getAllUnits/${courseName}/${subject}/${standard}`,
          { method: "GET", credentials: "include" }
        );
        if (!resp.ok) throw new Error(await resp.text());
        const data = await resp.json();
        setFetchedUnits(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Error fetching JEE units:", err);
        setFetchedUnits([]);
      }
    };

    getAllSubjectDetails();
  }, [subject]);

  // Flatten subtopics recursively
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

  const handleBackToSubjects = () => navigate("/Jee");

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
          localStorage.setItem(`jee-completed-${sub.unitName}`, "true");
        });

        // Also mark the test itself
        updatedProgress[subtopicTitle] = true;
        localStorage.setItem(`jee-completed-${subtopicTitle}`, "true");

        const updated = {
          ...prev,
          [topicTitle]: updatedProgress
        };

        console.log("🟢 Marked ALL subtopics as completed:", Object.keys(updatedProgress));

        // Save to localStorage
        localStorage.setItem(`completedSubtopics_${userId}_jee`, JSON.stringify(updated));


        // ✅ Check if all topics of the subject are completed (then mark subject certified)
        setTimeout(() => {
          if (!fetchedUnits || fetchedUnits.length === 0) return;

          const allCompleted = fetchedUnits.every(topic => {
            const allSubs = collectAllSubtopics(topic.units);
            const completedCount = allSubs.filter(sub => updated[topic.unitName]?.[sub.unitName]).length;
            return completedCount === allSubs.length;
          });

          if (allCompleted) {
            console.log(`🏁 All topics completed for ${subject}`);

            // ensure list reflects JEE subjects
            const allSubjects = ["Physics", "Chemistry", "Maths"];

            const existingCompletion = JSON.parse(localStorage.getItem("jeeSubjectCompletion") || "[]");

            const mergedCompletion = allSubjects.map(subj => {
              const old = existingCompletion.find(s => s.name === subj) || { name: subj, progress: 0, certified: false };
              if (subj === subject) {
                return { ...old, certified: true, progress: 100 };
              }
              return old;
            });

            localStorage.setItem("jeeSubjectCompletion", JSON.stringify(mergedCompletion));
            // trigger storage event for other tabs/pages/components (JEE.jsx will listen)
            window.dispatchEvent(new Event("storage"));
          }
        }, 500);


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
        localStorage.setItem(`completedSubtopics_${userId}_jee`, JSON.stringify(updated));
        localStorage.setItem(`jee-completed-${subtopicTitle}`, "true");

        return updated;
      });
    }
  };

  const resetProgress = () => {
    const confirmReset = window.confirm("Are you sure you want to reset all your JEE progress?");
    if (!confirmReset) return;

    localStorage.removeItem(`completedSubtopics_${userId}_jee`);
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("jee-completed-")) localStorage.removeItem(key);
    });

    setCompletedSubtopics({});
    setExpandedTopic(null);
    setSelectedSubtopic(null);

    alert("Your JEE progress has been reset successfully.");
  };

  return (
    <div className="Jee-container">
      {isMobile && (
        <button className="toggle-btn" onClick={() => setShowTopics(!showTopics)}>
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
                  className={`topic-title ${expandedTopic === index ? "active" : ""} ${!isTopicUnlocked(index) ? "locked" : ""}`}
                  onClick={() => toggleTopic(index)}
                >
                  <div className="topic-header" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <span>{topic.unitName}</span>
                    <span className="expand-icon">{expandedTopic === index ? "−" : "+"}</span>
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
                          onClick={() => handleSubtopicClick(testSubtopic, index)}
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
                // audioFileId={selectedSubtopic.audioFileId || []}
                imageUrls={selectedSubtopic.imageUrls || []}
                videoUrl={
                  selectedSubtopic?.videoUrl ||
                  selectedSubtopic?.video_url ||
                  selectedSubtopic?.aiVideoUrl ||
                  ""
                }
                onBack={handleBackToTopics}
                onMarkComplete={markSubtopicComplete}
              />

              {/* {(selectedSubtopic?.videoUrl ||
                selectedSubtopic?.video_url ||
                selectedSubtopic?.aiVideoUrl) && (
                  <div className="ai-video-container" style={{ marginTop: "20px" }}>
                    <h5>AI Generated Video</h5>
                    <video width="100%" controls>
                      <source
                        src={
                          selectedSubtopic?.videoUrl ||
                          selectedSubtopic?.video_url ||
                          selectedSubtopic?.aiVideoUrl
                        }
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )} */}
            </>
          )
        ) : (
          <div className="no-explanation">
            <h2>Welcome to {subject} - Std {selectedStandard}</h2>
            <p>Select a topic and subtopic to begin your learning journey.</p>
          </div>
        )}
      </div>

      <PadmasiniChat subjectName={subject} />
    </div>
  );
};

export default JeeLearn;