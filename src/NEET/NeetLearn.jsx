import React, { useState, useEffect, useRef } from "react";
import { FaBars } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import "./NeetLearn.css";
import PadmasiniChat from "../components/PadmasiniChat";
import NeetExplanation from "./NeetExplanation";
import NeetQuiz from "./NeetQuiz";
import { API_BASE_URL } from "../config";
import { useUser } from "../components/UserContext";

// Global debounce timer for saveProgressToServer calls
let saveProgressTimer = null;

// Helper function to restore keys that contain dots
const restoreKeys = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj;
  const restored = {};
  for (const [key, value] of Object.entries(obj)) {
    const cleanKey = key.replace(/__dot__/g, ".");
    restored[cleanKey] = restoreKeys(value);
  }
  return restored;
};

// Helper to create a flat list of ALL navigable items (Parents, Children, Tests)
const getFlatList = (units) => {
  let list = [];
  units.forEach((unit, unitIndex) => {
    const std = unit.std; // Capture std (11th or 12th)

    const collectItems = (subs) => {
      subs.forEach(sub => {
        list.push({ type: 'lesson', data: sub, unitIndex, std });
        if (sub.units && sub.units.length > 0) {
          collectItems(sub.units);
        }
        if (sub.test && sub.test.length > 0) {
          sub.test.forEach(t => {
            list.push({
              type: 'test',
              data: { ...sub, unitName: `Assessment - ${sub.unitName}`, test: [t] },
              unitIndex,
              std
            });
          });
        }
      });
    };

    if (unit.units) {
      collectItems(unit.units);
    }

    if (unit.test && unit.test.length > 0) {
      unit.test.forEach(t => {
        list.push({
          type: 'test',
          data: { ...unit, unitName: `Assessment - ${unit.unitName}`, test: [t] },
          unitIndex,
          std
        });
      });
    }
  });
  return list;
};

const saveProgressToServer = async (userId, completedSubtopics, setCompletedSubtopics, course, standard) => {
  if (saveProgressTimer) clearTimeout(saveProgressTimer);
  saveProgressTimer = null;

  if (!userId || userId === "guest") return;

  const sanitizeKeys = (obj) => {
    if (typeof obj !== "object" || obj === null) return obj;
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const safeKey = key.replace(/\./g, "__dot__");
      sanitized[safeKey] = sanitizeKeys(value);
    }
    return sanitized;
  };

  const safeData = sanitizeKeys(completedSubtopics);

  try {
    await fetch(`${API_BASE_URL}/api/progress/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        completedSubtopics: safeData,
        course,
        standard,
      }),
    });
  } catch (err) {
    console.error("❌ Error saving progress:", err);
  }
};

const saveSubjectCompletionToServer = async (userId, subjectCompletionMap, course, standard) => {
  if (!userId || userId === "guest") return;
  try {
    await fetch(`${API_BASE_URL}/api/progress/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        subjectCompletion: subjectCompletionMap,
        course,
        standard,
      }),
    });
  } catch (err) { console.error(err); }
};

const loadProgressFromServer = async (userId, course, standard) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/progress/${userId}?course=${course}&standard=${standard}`);
    const data = await res.json();
    if (data?.completedSubtopics) {
      return restoreKeys(data.completedSubtopics);
    }
    return {};
  } catch (err) {
    return {};
  }
};

const SubtopicTree = ({ subtopics, onClick, selectedTitle, parentIndex, level = 1, isTopicUnlocked }) => {
  const [expandedSub, setExpandedSub] = useState(null);

  const handleSubClick = (sub, idx, e) => {
    e.stopPropagation();
    const isUnlocked = isTopicUnlocked ? isTopicUnlocked(sub.unitName) : true;
    if (isUnlocked) {
      onClick(sub, parentIndex);
      const hasChildren = (sub.units && sub.units.length > 0) || (sub.test && sub.test.length > 0);
      if (hasChildren) {
        setExpandedSub((prev) => (prev === idx ? null : idx));
      }
    }
  };

  const handleTestClick = (test, idx, sub) => {
    const testSubtopic = { ...sub, unitName: `Assessment - ${sub.unitName}`, test: [test] };
    onClick(testSubtopic, parentIndex);
  };

  return (
    <ul className="subtopics-list">
      {subtopics.map((sub, idx) => {
        const isUnlocked = isTopicUnlocked ? isTopicUnlocked(sub.unitName) : true;
        return (
          <li key={idx}>
            <div
              className={`subtopic-title ${selectedTitle === sub.unitName ? "selected" : ""}`}
              style={{
                marginLeft: `${level * 20}px`,
                opacity: isUnlocked ? 1 : 0.5,
                cursor: isUnlocked ? 'pointer' : 'not-allowed'
              }}
              onClick={(e) => handleSubClick(sub, idx, e)}
            >
              {((sub.units && sub.units.length > 0) || (sub.test && sub.test.length > 0)) ? (
                <span>{expandedSub === idx ? "▼ " : "▶ "}</span>
              ) : (<span>⮚ </span>)}
              {!isUnlocked && <span style={{ marginRight: '5px' }}>🔒</span>}
              {sub.unitName}
            </div>

            {expandedSub === idx && (
              <>
                {sub.units && (
                  <SubtopicTree
                    subtopics={sub.units}
                    onClick={onClick}
                    selectedTitle={selectedTitle}
                    parentIndex={parentIndex}
                    level={level + 1}
                    isTopicUnlocked={isTopicUnlocked}
                  />
                )}
                {sub.test && sub.test.length > 0 && sub.test.map((test, tIdx) => {
                  const testName = `Assessment - ${sub.unitName}`;
                  const isTestUnlocked = isTopicUnlocked ? isTopicUnlocked(testName) : true;
                  return (
                    <div
                      key={tIdx}
                      className="subtopic-title test-title"
                      style={{
                        marginLeft: `${(level + 1) * 20}px`,
                        opacity: isTestUnlocked ? 1 : 0.5,
                        cursor: isTestUnlocked ? 'pointer' : 'not-allowed'
                      }}
                      onClick={() => isTestUnlocked && handleTestClick(test, tIdx, sub)}
                    >
                      {!isTestUnlocked && <span>🔒 </span>}
                      📝 {test.testName} - Assessment
                    </div>
                  )
                })}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
};

const NeetLearn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMockMode = location.state?.isMock || false;
  const mockData = location.state?.mockData || [];
  const subject = location.state?.subject || "Physics";

  const [userId, setUserId] = useState(null);
  const DEV_MODE = false;

  const [fetchedUnits, setFetchedUnits] = useState([]);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [showTopics, setShowTopics] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [completedSubtopics, setCompletedSubtopics] = useState({});
  const [isProgressLoading, setIsProgressLoading] = useState(true);

  // Reference for the scrolling container
  const contentRef = useRef(null);

  useEffect(() => {
    let storedUserId = localStorage.getItem("userId");
    const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    if (!storedUserId && (storedUser?._id || storedUser?.userId)) {
      storedUserId = storedUser._id || storedUser.userId;
      localStorage.setItem("userId", storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  // ✅ STRONG SCROLL FIX
  useEffect(() => {
    const scrollToTop = () => {
      // 1. Scroll the window (Standard)
      window.scrollTo(0, 0);

      // 2. Scroll the React Ref (If attached)
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }

      // 3. Fallback: Manually find the div by class name (Most reliable for specific layouts)
      const container = document.querySelector(".explanation-container");
      if (container) {
        container.scrollTop = 0;
      }
    };

    // Run immediately
    scrollToTop();

    // Run again after a tiny delay to account for rendering time
    const timer = setTimeout(scrollToTop, 50);

    return () => clearTimeout(timer);
  }, [selectedSubtopic, subject]); // Runs whenever the topic changes

  useEffect(() => {
    const getAllSubjectDetails = async () => {
      const subjectName = subject;
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      let courseName = "professional";
      if (currentUser?.coursetype && currentUser.coursetype.toLowerCase().includes("school")) {
        courseName = "local";
      }

      try {
        const res11 = await fetch(`${API_BASE_URL}/api/getAllUnits/${courseName}/${subjectName}/11`, { credentials: "include" });
        const data11 = await res11.json();
        const units11 = Array.isArray(data11) ? data11.map(u => ({ ...u, std: "11th" })) : [];

        const res12 = await fetch(`${API_BASE_URL}/api/getAllUnits/${courseName}/${subjectName}/12`, { credentials: "include" });
        const data12 = await res12.json();
        const units12 = Array.isArray(data12) ? data12.map(u => ({ ...u, std: "12th" })) : [];

        setFetchedUnits([...units11, ...units12]);
      } catch (err) {
        setFetchedUnits([]);
      }
    };
    getAllSubjectDetails();
  }, [subject]);

  useEffect(() => {
    if (!userId) return;
    setIsProgressLoading(true);
    const course = "NEET";
    Promise.all([
      loadProgressFromServer(userId, course, "11th"),
      loadProgressFromServer(userId, course, "12th")
    ]).then(([prog11, prog12]) => {
      const merged = { ...prog11, ...prog12 };
      setCompletedSubtopics(merged);
      setIsProgressLoading(false);
    });
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

  const collectAllLessons = (subs) => {
    if (!Array.isArray(subs)) return [];
    let leaves = [];
    subs.forEach((sub) => {
      if (sub.units && sub.units.length > 0) leaves = leaves.concat(collectAllLessons(sub.units));
      else leaves.push(sub);
    });
    return leaves;
  };

  const collectAllTests = (topic) => {
    let tests = [];
    if (topic.test && topic.test.length > 0) tests.push({ testName: `Assessment - ${topic.unitName}` });
    if (Array.isArray(topic.units)) {
      topic.units.forEach((sub) => {
        if (sub.test && sub.test.length > 0) tests.push({ testName: `Assessment - ${sub.unitName}` });
        tests = tests.concat(collectAllTests(sub));
      });
    }
    return tests;
  };

  const calculateProgress = (topic) => {
    if (!topic) return 0;
    const course = "NEET";
    const standard = topic.std || "11th";
    const subjectName = subject;
    const topicKey = `${course}_${standard}_${subjectName}_${topic.unitName}`;
    const topicProgress = completedSubtopics[topicKey] || {};

    const allLessons = collectAllLessons(topic.units);
    const allTests = collectAllTests(topic);
    const totalCount = allLessons.length + allTests.length;
    if (totalCount === 0) return 0;

    let completedCount = 0;
    allLessons.forEach((lesson) => { if (topicProgress[lesson.unitName] === true) completedCount++; });
    allTests.forEach((test) => { if (topicProgress[test.testName] === true) completedCount++; });

    const percent = Math.round((completedCount / totalCount) * 100);
    return percent > 100 ? 100 : percent;
  };

  const isTopicCompleted = (topic) => calculateProgress(topic) === 100;

  const isLessonUnlocked = (index) => {
    if (DEV_MODE) return true;
    if (index === 0) return true;
    const prevTopic = fetchedUnits[index - 1];
    return isTopicCompleted(prevTopic);
  };

  const isSubtopicUnlocked = (targetUnitName) => {
    if (DEV_MODE) return true;
    const flatList = getFlatList(fetchedUnits);
    const currentIndex = flatList.findIndex(item => item.data.unitName === targetUnitName);
    if (currentIndex <= 0) return true;

    const prevItem = flatList[currentIndex - 1];
    const course = "NEET";
    const standard = prevItem.std;
    const subjectName = subject;
    const parentUnitName = fetchedUnits[prevItem.unitIndex].unitName;
    const topicKey = `${course}_${standard}_${subjectName}_${parentUnitName}`;
    const prevUnitName = prevItem.data.unitName;

    return completedSubtopics[topicKey]?.[prevUnitName] === true;
  };

  const toggleTopic = (index) => {
    if (!isLessonUnlocked(index)) {
      alert("Please complete the previous lesson to unlock this one.");
      return;
    }
    setExpandedTopic((prev) => (prev === index ? null : index));
    setSelectedSubtopic(null);
  };

  const handleSubtopicClick = (sub, index) => {
    setSelectedSubtopic(sub);
    if (isMobile) setShowTopics(false);
    setExpandedTopic(index);
  };

  const checkAndSaveSubjectCompletion = (userId, topicObj, currentProgressData) => {
    if (!userId) return;
    const course = "NEET";
    const standard = topicObj.std;

    const unitsForThisStd = fetchedUnits.filter(u => u.std === standard);

    const allCompleted = unitsForThisStd.every((topic) => {
      const tKey = `${course}_${standard}_${subject}_${topic.unitName}`;
      const topicProgress = currentProgressData[tKey] || {};

      const allLessons = collectAllLessons(topic.units);
      const allTests = collectAllTests(topic);
      const totalCount = allLessons.length + allTests.length;
      if (totalCount === 0) return true;

      let completedCount = 0;
      allLessons.forEach(l => { if (topicProgress[l.unitName] === true) completedCount++; });
      allTests.forEach(t => { if (topicProgress[t.testName] === true) completedCount++; });

      return completedCount === totalCount;
    });

    if (allCompleted) {
      const subjectKey = `${course}_${standard}_${subject}`;
      const completionMap = { [subjectKey]: 100 };
      saveSubjectCompletionToServer(userId, completionMap, course, standard);

      const localKey = `subjectCompletion_${course}_${standard}`;
      const existingData = JSON.parse(localStorage.getItem(localKey) || "{}");
      const updatedData = { ...existingData, ...completionMap };
      localStorage.setItem(localKey, JSON.stringify(updatedData));
      window.dispatchEvent(new Event("storage"));
    }
  };

  const markSubtopicComplete = () => {
    if (!selectedSubtopic || expandedTopic === null) return;
    const topicObj = fetchedUnits[expandedTopic];
    const standard = topicObj.std;
    const course = "NEET";
    const topicTitle = topicObj.unitName;
    const subtopicTitle = selectedSubtopic.unitName;
    const topicKey = `${course}_${standard}_${subject}_${topicTitle}`;

    let updatedProgressData;

    setCompletedSubtopics((prev) => {
      const topicProgress = prev[topicKey] || {};
      const updated = {
        ...prev,
        [topicKey]: { ...topicProgress, [subtopicTitle]: true }
      };
      saveProgressToServer(userId, updated, setCompletedSubtopics, course, standard);
      updatedProgressData = updated;
      return updated;
    });

    if (updatedProgressData) checkAndSaveSubjectCompletion(userId, topicObj, updatedProgressData);
  };

  const resetProgress = async (subjectName) => {
    if (!window.confirm(`Are you sure you want to reset ALL progress for ${subjectName}? This cannot be undone.`)) {
      return;
    }
    try {
      const storedUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!storedUser?._id) return;
      const finalUserId = storedUser._id;
      const course = "NEET";
      const standardsToReset = ["11th", "12th"];

      for (const std of standardsToReset) {
        await fetch(
          `${API_BASE_URL}/api/progress/delete?userId=${finalUserId}&course=${course}&standard=${std}&subject=${encodeURIComponent(subjectName)}`,
          { method: "DELETE" }
        );
        localStorage.removeItem(`completedSubtopics_${finalUserId}_${course}_${std}`);
        localStorage.removeItem(`subjectCompletion_${course}_${std}`);
      }
      setCompletedSubtopics({});
      window.dispatchEvent(new Event("storage"));
      alert(`Progress for ${subjectName} has been reset.`);
      window.location.reload();
    } catch (err) {
      console.error("⚠️ Reset progress error:", err);
    }
  };

  const handleNextLesson = () => {
    markSubtopicComplete();
    const flatList = getFlatList(fetchedUnits);
    const currentIndex = flatList.findIndex((item) =>
      item.data.unitName === selectedSubtopic.unitName &&
      item.unitIndex === expandedTopic
    );

    if (currentIndex !== -1 && currentIndex < flatList.length - 1) {
      const nextItem = flatList[currentIndex + 1];
      setExpandedTopic(nextItem.unitIndex);
      setSelectedSubtopic(nextItem.data);
    } else {
      alert("You have reached the end of this subject!");
    }
  };

  const handlePreviousLesson = () => {
    const flatList = getFlatList(fetchedUnits);
    const currentIndex = flatList.findIndex((item) =>
      item.data.unitName === selectedSubtopic.unitName &&
      item.unitIndex === expandedTopic
    );

    if (currentIndex > 0) {
      const prevItem = flatList[currentIndex - 1];
      setExpandedTopic(prevItem.unitIndex);
      setSelectedSubtopic(prevItem.data);
    }
  };

  if (isMockMode) {
    const mockTestObject = [{ testName: "Full NEET Mock Test", questionsList: mockData }];
    return (
      <div className="neet-mock-test-wrapper" style={{ marginTop: "60px" }}>
        <NeetQuiz
          topicTitle="Full Syllabus"
          subtopicTitle={`NEET Mock Test - ${mockData.length} Questions`}
          test={mockTestObject}
          onBack={() => navigate("/Neet")}
          onMarkComplete={() => { alert("Mock Test Completed!"); navigate("/Neet"); }}
          isAlreadyComplete={false}
          isMock={true}
        />
      </div>
    );
  }

  return (
    <div className="Neet-container">
      {isMobile && (
        <button className="toggle-btn" onClick={() => setShowTopics(!showTopics)}>
          <FaBars /> <h2>{subject} Topics</h2>
        </button>
      )}

      {showTopics && (
        <div className={`topics-list ${!showTopics ? "hidden-mobile" : ""}`}>
          {isProgressLoading ? <p>Loading...</p> :
            <ul>
              {fetchedUnits.map((topic, index) => {
                const showHeader = index === 0 || topic.std !== fetchedUnits[index - 1].std;

                return (
                  <React.Fragment key={index}>
                    {showHeader && (
                      <li className="std-header-li" style={{
                        padding: "10px 15px",
                        backgroundColor: "#e8f5e9",
                        color: "#006400",
                        fontWeight: "bold",
                        borderBottom: "2px solid #006400",
                        marginTop: index !== 0 ? "20px" : "0"
                      }}>
                        {topic.std === "11th" ? "Class 11" : "Class 12"}
                      </li>
                    )}

                    <li>
                      <div
                        className={`topic-title ${expandedTopic === index ? "active" : ""} ${!isLessonUnlocked(index) ? "locked" : ""}`}
                        style={{ opacity: isLessonUnlocked(index) ? 1 : 0.6, cursor: isLessonUnlocked(index) ? 'pointer' : 'not-allowed' }}
                        onClick={() => toggleTopic(index)}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span> {topic.unitName}</span>
                          <span className="expand-icon">{expandedTopic === index ? "−" : "+"}</span>
                        </div>
                        <div className="progress-bar-wrapper">
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${calculateProgress(topic)}%` }}></div>
                          </div>
                          <div className="progress-info">{calculateProgress(topic)}%</div>
                        </div>
                      </div>

                      {expandedTopic === index && (
                        <>
                          {topic.units && (
                            <SubtopicTree
                              subtopics={topic.units}
                              onClick={(sub) => { setSelectedSubtopic(sub); if (isMobile) setShowTopics(false); }}
                              selectedTitle={selectedSubtopic?.unitName}
                              parentIndex={index}
                              isTopicUnlocked={isSubtopicUnlocked}
                            />
                          )}
                          {topic.test && topic.test.length > 0 && (
                            <ul className="subtopics-list">
                              {topic.test.map((test, tIdx) => {
                                const testSubtopic = { ...topic, unitName: `Assessment - ${topic.unitName}`, test: [test] };
                                const testName = `Assessment - ${topic.unitName}`;
                                const isTestUnlocked = isSubtopicUnlocked(testName);
                                return (
                                  <li key={tIdx}
                                    className="subtopic-title test-title"
                                    style={{ opacity: isTestUnlocked ? 1 : 0.5, cursor: isTestUnlocked ? 'pointer' : 'not-allowed', pointerEvents: isTestUnlocked ? 'auto' : 'none' }}
                                    onClick={() => { setSelectedSubtopic(testSubtopic); if (isMobile) setShowTopics(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                  >
                                    {!isTestUnlocked && <span>🔒 </span>}
                                    📝 {test.testName} - Assessment
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </>
                      )}
                    </li>
                  </React.Fragment>
                );
              })}
            </ul>
          }
          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <button className="back-subjects-btn" onClick={() => navigate("/Neet")}>Back to Subjects</button>
            <button className="back-subjects-btn" onClick={() => resetProgress(subject)}>Study Again</button>
          </div>
        </div>
      )}

      {/* ✅ ADDED REF to explanation container */}
      <div className="explanation-container" ref={contentRef}>
        {selectedSubtopic ? (
          (() => {
            const topicTitle = fetchedUnits[expandedTopic]?.unitName;
            const standard = fetchedUnits[expandedTopic]?.std;
            const topicKey = `NEET_${standard}_${subject}_${topicTitle}`;
            const isAlreadyComplete = completedSubtopics[topicKey]?.[selectedSubtopic.unitName] === true;

            // ✅ CRITICAL FIX: Add KEY prop here to force complete re-render when topic changes
            const componentKey = selectedSubtopic.unitName || "default-key";

            if (selectedSubtopic.unitName.includes("Assessment") || (selectedSubtopic.test && selectedSubtopic.test.length > 0 && selectedSubtopic.unitName.startsWith("Assessment"))) {
              return (
                <NeetQuiz
                  key={componentKey} // Forces new instance = Scroll Reset
                  topicTitle={topicTitle}
                  subtopicTitle={selectedSubtopic.unitName}
                  test={selectedSubtopic.test || []}
                  onBack={() => setShowTopics(true)}
                  onMarkComplete={markSubtopicComplete}
                  isAlreadyComplete={isAlreadyComplete}
                />
              );
            } else {
              return (
                <NeetExplanation
                  key={componentKey} // Forces new instance = Scroll Reset
                  topicTitle={topicTitle}
                  subtopicTitle={selectedSubtopic.unitName}
                  explanation={selectedSubtopic.explanation || ""}
                  imageUrls={selectedSubtopic.imageUrls || []}
                  videoUrl={selectedSubtopic?.videoUrl || selectedSubtopic?.video_url || selectedSubtopic?.aiVideoUrl || ""}
                  onBack={() => setShowTopics(true)}
                  onNext={handleNextLesson}
                  onPrevious={handlePreviousLesson}
                  onMarkComplete={markSubtopicComplete}
                  isAlreadyComplete={isAlreadyComplete}
                />
              );
            }
          })()
        ) : (
          <div className="no-explanation">
            <h2>Welcome to {subject}</h2>
            <p>Select a topic from the list (Class 11 or 12) to begin.</p>
          </div>
        )}
      </div>

      <PadmasiniChat subjectName={subject} />
    </div>
  );
};

export default NeetLearn;