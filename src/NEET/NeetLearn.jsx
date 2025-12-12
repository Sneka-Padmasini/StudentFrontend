import React, { useState, useEffect } from "react";
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

    // Recursive function to add topics and subtopics in order
    const collectItems = (subs) => {
      subs.forEach(sub => {
        // 1. Add the topic/subtopic itself to the list
        list.push({ type: 'lesson', data: sub, unitIndex });

        // 2. If it has children, recursively add them AFTER the parent
        if (sub.units && sub.units.length > 0) {
          collectItems(sub.units);
        }

        // 3. Add any tests associated with this subtopic
        if (sub.test && sub.test.length > 0) {
          sub.test.forEach(t => {
            list.push({
              type: 'test',
              data: { ...sub, unitName: `Assessment - ${sub.unitName}`, test: [t] },
              unitIndex
            });
          });
        }
      });
    };

    if (unit.units) {
      collectItems(unit.units);
    }

    // Add Topic Level Tests (Top level)
    if (unit.test && unit.test.length > 0) {
      unit.test.forEach(t => {
        list.push({
          type: 'test',
          data: { ...unit, unitName: `Assessment - ${unit.unitName}`, test: [t] },
          unitIndex
        });
      });
    }
  });
  return list;
};

const saveProgressToServer = async (userId, completedSubtopics, setCompletedSubtopics, course, standard) => {
  if (saveProgressTimer) clearTimeout(saveProgressTimer);
  saveProgressTimer = null;

  if (!userId || userId === "guest") {
    console.warn("⚠️ Skipping save — no valid userId");
    return;
  }

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
  console.log("🚀 Sending progress to backend:", safeData);

  try {
    const res = await fetch(`${API_BASE_URL}/api/progress/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        completedSubtopics: safeData,
        course,
        standard,
      }),
    });

    const text = await res.text();
    console.log("🧾 Backend response text:", text);

    if (!res.ok) {
      console.error("❌ Backend rejected progress save:", text);
    } else {
      console.log("✅ Progress saved to backend successfully!");
    }
  } catch (err) {
    console.error("❌ Error saving progress:", err);
  }
};

const saveSubjectCompletionToServer = async (userId, subjectCompletionMap, completedSubtopics) => {
  if (!userId || userId === "guest") {
    console.warn("⚠️ Skipping subject sync — userId not ready");
    return;
  }

  const course = "NEET";
  const standard = localStorage.getItem("currentClass") || "";

  if (!standard) {
    console.error("❌ Cannot save subject completion, standard is missing from localStorage");
    return;
  }

  const sanitizeKeys = (obj) => {
    if (typeof obj !== "object" || obj === null) return obj;
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const safeKey = key.replace(/\./g, "__dot__");
      sanitized[safeKey] = sanitizeKeys(value);
    }
    return sanitized;
  };

  const safeSubtopics = sanitizeKeys(completedSubtopics);

  try {
    const response = await fetch(`${API_BASE_URL}/api/progress/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        subjectCompletion: subjectCompletionMap,
        completedSubtopics: safeSubtopics,
        course,
        standard,
      }),
    });

    if (!response.ok) {
      console.error("❌ Backend rejected subject completion sync:", await response.text());
    } else {
      console.log("✅ Subject completion synced successfully for", userId);
    }
  } catch (err) {
    console.error("❌ Error syncing subject completion:", err);
  }
};

const loadProgressFromServer = async (userId, course, standard) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/progress/${userId}?course=${course}&standard=${standard}`);
    const data = await res.json();
    console.log("🌐 Fetched backend progress data:", data);

    const restoreKeys = (obj) => {
      if (typeof obj !== "object" || obj === null) return obj;
      const restored = {};
      for (const [key, value] of Object.entries(obj)) {
        const realKey = key.replace(/__dot__/g, ".");
        restored[realKey] = restoreKeys(value);
      }
      return restored;
    };

    if (data?.completedSubtopics) {
      const merged = restoreKeys(data.completedSubtopics);
      console.log("📦 Restored backend progress:", merged);
      return merged;
    } else {
      return {};
    }
  } catch (err) {
    console.error("❌ Error loading progress:", err);
    return {};
  }
};

// Recursive component to render subtopics and their tests
const SubtopicTree = ({
  subtopics,
  onClick,
  selectedTitle,
  parentIndex,
  level = 1,
  isTopicUnlocked // Receive the lock checker
}) => {
  const [expandedSub, setExpandedSub] = useState(null);

  const handleSubClick = (sub, idx, e) => {
    e.stopPropagation();
    const hasChildren = (sub.units && sub.units.length > 0) || (sub.test && sub.test.length > 0);

    // 1. ALWAYS load the description for this topic
    onClick(sub, parentIndex);

    // 2. If it's a folder, ALSO toggle expansion
    if (hasChildren) {
      setExpandedSub((prev) => (prev === idx ? null : idx));
    }
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
      {subtopics.map((sub, idx) => {
        // Check if unlocked
        const isUnlocked = isTopicUnlocked ? isTopicUnlocked(sub.unitName) : true;

        return (
          <li key={idx}>
            <div
              className={`subtopic-title ${selectedTitle === sub.unitName ? "selected" : ""}`}
              style={{
                marginLeft: `${level * 20}px`,
                // Grey out if locked
                opacity: isUnlocked ? 1 : 0.5,
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                pointerEvents: isUnlocked ? 'auto' : 'none'
              }}
              onClick={(e) => handleSubClick(sub, idx, e)}
            >
              {/* Arrow Logic */}
              {((sub.units && sub.units.length > 0) || (sub.test && sub.test.length > 0)) ? (
                <span>{expandedSub === idx ? "▼ " : "▶ "}</span>
              ) : (
                <span>⮚ </span>
              )}
              {/* Lock Icon */}
              {!isUnlocked && <span style={{ marginRight: '5px' }}>🔒</span>}

              {sub.unitName}
            </div>

            {/* Render Children (Only if expanded) */}
            {expandedSub === idx && (
              <>
                {/* 1. Sub-units (Recursive) */}
                {sub.units && (
                  <SubtopicTree
                    subtopics={sub.units}
                    onClick={onClick}
                    selectedTitle={selectedTitle}
                    parentIndex={parentIndex}
                    level={level + 1}
                    isTopicUnlocked={isTopicUnlocked} // Pass lock check down
                  />
                )}

                {/* 2. Tests */}
                {sub.test &&
                  sub.test.length > 0 &&
                  sub.test.map((test, tIdx) => {
                    // Check if test is unlocked
                    const testName = `Assessment - ${sub.unitName}`;
                    const isTestUnlocked = isTopicUnlocked ? isTopicUnlocked(testName) : true;

                    return (
                      <div
                        key={tIdx}
                        className="subtopic-title test-title"
                        style={{
                          marginLeft: `${(level + 1) * 20}px`,
                          opacity: isTestUnlocked ? 1 : 0.5,
                          cursor: isTestUnlocked ? 'pointer' : 'not-allowed',
                          pointerEvents: isTestUnlocked ? 'auto' : 'none'
                        }}
                        onClick={() => handleTestClick(test, tIdx, sub)}
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
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const selectedStandard =
    currentUser.selectedStandard === "11th"
      ? 11
      : currentUser.selectedStandard === "12th"
        ? 12
        : null;

  const [userId, setUserId] = useState(null);
  const DEV_MODE = false;

  useEffect(() => {
    let storedUserId = localStorage.getItem("userId");
    const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

    if (!storedUserId && (storedUser?._id || storedUser?.userId)) {
      storedUserId = storedUser._id || storedUser.userId;
      localStorage.setItem("userId", storedUserId);
    }

    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      console.warn("⚠️ No valid userId found in localStorage or currentUser");
    }
  }, []);

  const [fetchedUnits, setFetchedUnits] = useState([]);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [showTopics, setShowTopics] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [completedSubtopics, setCompletedSubtopics] = useState({});
  const [subjectCompletion, setSubjectCompletion] = useState({});
  const [isProgressLoading, setIsProgressLoading] = useState(true);

  useEffect(() => window.scrollTo(0, 0), []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    setIsProgressLoading(true);

    const course = "NEET";
    const standard = localStorage.getItem("currentClass");
    const localKey = `completedSubtopics_${userId}_${course}_${standard}`;
    const savedProgress = JSON.parse(localStorage.getItem(localKey) || "{}");

    const restoreKeys = (obj) => {
      if (typeof obj !== "object" || obj === null) return obj;
      const restored = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanKey = key.replace(/__dot__/g, ".");
        restored[cleanKey] = restoreKeys(value);
      }
      return restored;
    };

    const restoredLocal = restoreKeys(savedProgress);
    setCompletedSubtopics(restoredLocal);

    loadProgressFromServer(userId, course, standard).then((backendData) => {
      if (!backendData) {
        setIsProgressLoading(false);
        return;
      }
      const merged = { ...restoredLocal, ...backendData };
      setCompletedSubtopics(merged);
      localStorage.setItem(localKey, JSON.stringify(merged));
      setTimeout(() => setExpandedTopic((prev) => prev), 200);
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

  useEffect(() => {
    if (expandedTopic !== null && fetchedUnits[expandedTopic]) {
      const topic = fetchedUnits[expandedTopic];
      const progress = calculateProgress(topic);
    }
  }, [completedSubtopics, expandedTopic, selectedSubtopic, fetchedUnits]);

  useEffect(() => {
    const getAllSubjectDetails = () => {
      const subjectName = subject;
      const stringStandard = localStorage.getItem("currentClass");
      const standard = String(stringStandard?.replace(/\D/g, ""));

      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      let courseName = "professional";

      if (currentUser?.coursetype) {
        const type = currentUser.coursetype.toLowerCase();
        if (type.includes("neet")) courseName = "professional";
        else if (type.includes("jee")) courseName = "professional";
        else if (type.includes("school")) courseName = "local";
      }

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
            throw new Error(text);
          }
          return resp.json();
        })
        .then((data) => {
          setFetchedUnits(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          setFetchedUnits([]);
        });
    };

    getAllSubjectDetails();
  }, [subject]);

  const collectAllLessons = (subs) => {
    if (!Array.isArray(subs)) {
      return [];
    }
    let leaves = [];
    subs.forEach((sub) => {
      if (sub.units && sub.units.length > 0) {
        leaves = leaves.concat(collectAllLessons(sub.units));
      } else {
        leaves.push(sub);
      }
    });
    return leaves;
  };

  const collectAllTests = (topic) => {
    let tests = [];
    if (topic.test && topic.test.length > 0) {
      tests.push({ testName: `Assessment - ${topic.unitName}` });
    }
    if (Array.isArray(topic.units)) {
      topic.units.forEach((sub) => {
        if (sub.test && sub.test.length > 0) {
          tests.push({ testName: `Assessment - ${sub.unitName}` });
        }
        tests = tests.concat(collectAllTests(sub));
      });
    }
    return tests;
  };

  const calculateProgress = (topic) => {
    if (!topic) return 0;
    const course = "NEET";
    const standard = localStorage.getItem("currentClass") || "";
    const subjectName = subject;
    const topicKey = `${course}_${standard}_${subjectName}_${topic.unitName}`;
    const topicProgress = completedSubtopics[topicKey] || {};

    const allLessons = collectAllLessons(topic.units);
    const allTests = collectAllTests(topic);
    const totalCount = allLessons.length + allTests.length;
    if (totalCount === 0) return 0;

    let completedCount = 0;
    allLessons.forEach((lesson) => {
      if (topicProgress[lesson.unitName] === true) completedCount++;
    });
    allTests.forEach((test) => {
      if (topicProgress[test.testName] === true) completedCount++;
    });

    const percent = Math.round((completedCount / totalCount) * 100);
    return percent > 100 ? 100 : percent;
  };

  const isTopicCompleted = (topic) => {
    const progress = calculateProgress(topic);
    return progress === 100;
  };

  // ✅ 1. Logic to unlock Top-Level Lessons (e.g., Unit 1, Unit 2)
  const isLessonUnlocked = (index) => {
    if (DEV_MODE) return true; // 🔓 BYPASS: Always unlock in Dev Mode

    if (index === 0) return true;
    const prevTopic = fetchedUnits[index - 1];
    return isTopicCompleted(prevTopic);
  };

  // ✅ 2. Logic to unlock Inner Topics (e.g., 1.1, 1.2, Tests)
  const isSubtopicUnlocked = (targetUnitName) => {
    if (DEV_MODE) return true; // 🔓 BYPASS: Always unlock in Dev Mode

    const flatList = getFlatList(fetchedUnits);
    const currentIndex = flatList.findIndex(item => item.data.unitName === targetUnitName);

    if (currentIndex <= 0) return true; // First subtopic always open

    // Check if PREVIOUS subtopic is marked complete
    const prevItem = flatList[currentIndex - 1];
    const course = "NEET";
    const standard = localStorage.getItem("currentClass") || "";
    const subjectName = subject;

    // Construct key to check completion in localStorage/State
    const parentUnitName = fetchedUnits[prevItem.unitIndex].unitName;
    const topicKey = `${course}_${standard}_${subjectName}_${parentUnitName}`;
    const prevUnitName = prevItem.data.unitName;

    return completedSubtopics[topicKey]?.[prevUnitName] === true;
  };

  const toggleTopic = (index) => {
    // Check if the LESSON is unlocked before opening
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

  const handleBackToTopics = () => {
    setSelectedSubtopic(null);
    if (isMobile) setShowTopics(true);
  };

  const handleBackToSubjects = () => navigate("/Neet");

  const checkAndSaveSubjectCompletion = (userId, fetchedUnits, subject, course, standard, currentProgressData) => {
    if (!fetchedUnits?.length || !userId) return;

    setTimeout(() => {
      const allCompleted = fetchedUnits.every((topic) => {
        const tKey = `${course}_${standard}_${subject}_${topic.unitName}`;
        const topicProgress = currentProgressData[tKey] || {};
        const allLessons = collectAllLessons(topic.units);
        const allTests = collectAllTests(topic);
        const totalCount = allLessons.length + allTests.length;
        if (totalCount === 0) return true;

        let completedCount = 0;
        allLessons.forEach((lesson) => {
          if (topicProgress[lesson.unitName] === true) completedCount++;
        });
        allTests.forEach((test) => {
          if (topicProgress[test.testName] === true) completedCount++;
        });
        return completedCount === totalCount;
      });

      if (allCompleted) {
        const localKey = `subjectCompletion_${course}_${standard}`;
        const existingCompletionData = JSON.parse(localStorage.getItem(localKey) || "{}");
        const subjectKey = `${course}_${standard}_${subject}`;
        const updatedCompletionMap = { ...existingCompletionData, [subjectKey]: 100 };
        localStorage.setItem(localKey, JSON.stringify(updatedCompletionMap));
        saveSubjectCompletionToServer(userId, updatedCompletionMap, currentProgressData);
        window.dispatchEvent(new Event("storage"));
      }
    }, 500);
  };

  const markSubtopicComplete = () => {
    if (!selectedSubtopic || expandedTopic === null) return;

    let finalUserId = userId;
    if (!finalUserId) {
      const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      finalUserId = storedUser?._id || storedUser?.userId;
      if (finalUserId) {
        setUserId(finalUserId);
      } else {
        return;
      }
    }

    const topicTitle = fetchedUnits[expandedTopic].unitName;
    const subtopicTitle = selectedSubtopic.unitName;
    const course = "NEET";
    const standard = localStorage.getItem("currentClass") || "";
    const subjectName = subject;
    const topicKey = `${course}_${standard}_${subjectName}_${topicTitle}`;

    let updatedProgressData;

    if (subtopicTitle.includes("Assessment")) {
      setCompletedSubtopics((prev) => {
        const topicProgress = prev[topicKey] || {};
        const updatedProgress = { ...topicProgress };
        updatedProgress[subtopicTitle] = true;
        const updated = { ...prev, [topicKey]: updatedProgress };
        localStorage.setItem(`completedSubtopics_${finalUserId}_${course}_${standard}`, JSON.stringify(updated));

        if (saveProgressTimer) clearTimeout(saveProgressTimer);
        saveProgressTimer = setTimeout(() => {
          saveProgressToServer(finalUserId, updated, setCompletedSubtopics, course, standard);
          saveProgressTimer = null;
        }, 500);

        updatedProgressData = updated;
        return updated;
      });

      if (updatedProgressData) {
        checkAndSaveSubjectCompletion(finalUserId, fetchedUnits, subject, course, standard, updatedProgressData);
      }
    } else {
      setCompletedSubtopics((prev) => {
        const topicProgress = prev[topicKey] || {};
        if (topicProgress[subtopicTitle]) {
          updatedProgressData = prev;
          return prev;
        }
        const updated = {
          ...prev,
          [topicKey]: {
            ...topicProgress,
            [subtopicTitle]: true,
          },
        };
        localStorage.setItem(`completedSubtopics_${finalUserId}_${course}_${standard}`, JSON.stringify(updated));

        if (saveProgressTimer) clearTimeout(saveProgressTimer);
        saveProgressTimer = setTimeout(() => {
          saveProgressToServer(finalUserId, updated, setCompletedSubtopics, course, standard);
          saveProgressTimer = null;
        }, 500);

        updatedProgressData = updated;
        return updated;
      });

      if (updatedProgressData) {
        checkAndSaveSubjectCompletion(finalUserId, fetchedUnits, subject, course, standard, updatedProgressData);
      }
    }
  };

  const resetProgress = async (subjectName) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!storedUser?._id) return;
      const finalUserId = storedUser._id;
      const course = "NEET";
      const standard = localStorage.getItem("currentClass");

      const response = await fetch(
        `${API_BASE_URL}/api/progress/delete?userId=${finalUserId}&course=${course}&standard=${standard}&subject=${encodeURIComponent(subjectName)}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        localStorage.removeItem(`completedSubtopics_${finalUserId}_${course}_${standard}`);
        localStorage.removeItem(`subjectCompletion_${course}_${standard}`);
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith(`${course}-completed-${finalUserId}-${standard}-`)) {
            localStorage.removeItem(key);
          }
        });
        setCompletedSubtopics({});
        setSubjectCompletion({});
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {
      console.error("⚠️ Reset progress error:", err);
    }
  };

  if (isMockMode) {
    const mockTestObject = [
      {
        testName: "Full NEET Mock Test",
        questionsList: mockData,
      },
    ];

    return (
      <div className="neet-mock-test-wrapper" style={{ marginTop: "60px" }}>
        <NeetQuiz
          topicTitle="Full Syllabus"
          subtopicTitle={`NEET Mock Test - ${mockData.length} Questions`}
          test={mockTestObject}
          onBack={() => navigate("/Neet")}
          onMarkComplete={() => {
            alert("Mock Test Completed!");
            navigate("/Neet");
          }}
          isAlreadyComplete={false}
          isMock={true}
        />
      </div>
    );
  }

  const handleNextLesson = () => {
    markSubtopicComplete();
    const flatList = getFlatList(fetchedUnits);
    const currentIndex = flatList.findIndex((item) => item.data.unitName === selectedSubtopic.unitName);

    if (currentIndex !== -1 && currentIndex < flatList.length - 1) {
      const nextItem = flatList[currentIndex + 1];
      setExpandedTopic(nextItem.unitIndex);
      setSelectedSubtopic(nextItem.data);
      window.scrollTo(0, 0);
    } else {
      alert("You have reached the end of this subject!");
    }
  };

  const handlePreviousLesson = () => {
    const flatList = getFlatList(fetchedUnits);
    const currentIndex = flatList.findIndex((item) => item.data.unitName === selectedSubtopic.unitName);

    if (currentIndex > 0) {
      const prevItem = flatList[currentIndex - 1];
      setExpandedTopic(prevItem.unitIndex);
      setSelectedSubtopic(prevItem.data);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="Neet-container">
      {isMobile && (
        <button className="toggle-btn" onClick={() => setShowTopics(!showTopics)}>
          <FaBars />
          <h2>{subject} Topics</h2>
        </button>
      )}

      {showTopics && isProgressLoading && (
        <div className="topics-list" style={{ padding: "20px", textAlign: "center" }}>
          <h2>Loading Progress... Please wait. </h2>
        </div>
      )}

      {showTopics && !isProgressLoading && (
        <div className="topics-list">
          <ul>
            {fetchedUnits.map((topic, index) => (
              <li key={index}>
                <div
                  className={`topic-title ${expandedTopic === index ? "active" : ""} ${!isLessonUnlocked(index) ? "locked" : ""
                    }`}
                  style={{
                    opacity: isLessonUnlocked(index) ? 1 : 0.6,
                    cursor: isLessonUnlocked(index) ? 'pointer' : 'not-allowed'
                  }}
                  onClick={() => toggleTopic(index)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span> {topic.unitName}</span>
                    <span className="expand-icon">{expandedTopic === index ? "−" : "+"}</span>
                  </div>
                  <div className="progress-bar-wrapper">
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${calculateProgress(topic)}%` }}
                      ></div>
                    </div>
                    <div className="progress-info">{calculateProgress(topic)}%</div>
                  </div>
                </div>

                {expandedTopic === index && topic.units && (
                  <SubtopicTree
                    subtopics={topic.units}
                    onClick={handleSubtopicClick}
                    selectedTitle={selectedSubtopic?.unitName}
                    parentIndex={index}
                    isTopicUnlocked={isSubtopicUnlocked} // 👈 Passes the subtopic locker
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

                      // Check if test is unlocked
                      const testName = `Assessment - ${topic.unitName}`;
                      const isTestUnlocked = isSubtopicUnlocked(testName);

                      return (
                        <li
                          key={tIdx}
                          className="subtopic-title test-title"
                          style={{
                            opacity: isTestUnlocked ? 1 : 0.5,
                            cursor: isTestUnlocked ? 'pointer' : 'not-allowed',
                            pointerEvents: isTestUnlocked ? 'auto' : 'none'
                          }}
                          onClick={() => handleSubtopicClick(testSubtopic, index)}
                        >
                          {!isTestUnlocked && <span>🔒 </span>}
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
            <button className="back-subjects-btn" onClick={() => resetProgress(subject)}>
              Reset Progress
            </button>
          </div>
        </div>
      )}

      <div className="explanation-container">
        {selectedSubtopic ? (
          (() => {
            const course = "NEET";
            const standard = localStorage.getItem("currentClass") || "";
            const topicTitle = fetchedUnits[expandedTopic]?.unitName;
            const subtopicTitle = selectedSubtopic.unitName;
            const topicKey = `${course}_${standard}_${subject}_${topicTitle}`;
            const isAlreadyComplete = completedSubtopics[topicKey]?.[subtopicTitle] === true;
            const currentTopicTitle = fetchedUnits[expandedTopic]?.unitName || "Topic";

            if (
              selectedSubtopic.unitName.includes("Assessment") ||
              (selectedSubtopic.test &&
                selectedSubtopic.test.length > 0 &&
                selectedSubtopic.unitName.startsWith("Assessment"))
            ) {
              return (
                <NeetQuiz
                  topicTitle={currentTopicTitle}
                  subtopicTitle={selectedSubtopic.unitName}
                  test={selectedSubtopic.test || []}
                  onBack={handleBackToTopics}
                  onMarkComplete={markSubtopicComplete}
                  isAlreadyComplete={isAlreadyComplete}
                />
              );
            } else {
              return (
                <NeetExplanation
                  topicTitle={currentTopicTitle}
                  subtopicTitle={selectedSubtopic.unitName}
                  subject={subject}
                  explanation={selectedSubtopic.explanation || ""}
                  imageUrls={selectedSubtopic.imageUrls || []}
                  videoUrl={
                    selectedSubtopic?.videoUrl ||
                    selectedSubtopic?.video_url ||
                    selectedSubtopic?.aiVideoUrl ||
                    ""
                  }
                  onBack={handleBackToTopics}
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