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


// 🧩 Helper function to restore keys that contain dots
const restoreKeys = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj;
  const restored = {};
  for (const [key, value] of Object.entries(obj)) {
    const cleanKey = key.replace(/__dot__/g, ".");
    restored[cleanKey] = restoreKeys(value);
  }
  return restored;
};



const saveProgressToServer = async (userId, completedSubtopics, setCompletedSubtopics, course, standard) => {
  // Clear any pending debounced calls before running the actual save
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
        standard
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

  // ✅ FIX: Get course and standard to send to the backend
  const course = "NEET";
  const standard = localStorage.getItem("currentClass") || "";

  if (!standard) {
    console.error("❌ Cannot save subject completion, standard is missing from localStorage");
    return;
  }

  // We need to sanitize subtopics before sending
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
        completedSubtopics: safeSubtopics, // ✅ FIX: Send the actual subtopics
        course,                           // ✅ FIX: Send course
        standard                          // ✅ FIX: Send standard
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


// const loadProgressFromServer = async (userId, setCompletedSubtopics) => {
const loadProgressFromServer = async (userId, course, standard) => {
  try {
    // const res = await fetch(`${API_BASE_URL}/api/progress/${userId}`);
    const res = await fetch(`${API_BASE_URL}/api/progress/${userId}?course=${course}&standard=${standard}`);
    const data = await res.json();
    console.log("🌐 Fetched backend progress data:", data);

    // ✅ Convert __dot__ back to real dots
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
      // We only need to return the data here, the useEffect will handle merging with local
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
}) => {
  const [expandedSub, setExpandedSub] = useState(null);

  const handleSubClick = (sub, idx, e) => {
    e.stopPropagation(); // 🧱 prevent bubbling (especially on nested lists)

    const hasChildren = (sub.units && sub.units.length > 0) || (sub.test && sub.test.length > 0);

    if (hasChildren) {
      // If tapping the same one again, collapse
      setExpandedSub((prev) => (prev === idx ? null : idx));
    } else {
      // If it's a leaf (no children/tests), open explanation/test
      onClick(sub, parentIndex);
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
      {subtopics.map((sub, idx) => (
        <li key={idx}>
          <div
            className={`subtopic-title ${selectedTitle === sub.unitName ? "selected" : ""
              }`}
            style={{ marginLeft: `${level * 20}px` }}
            onClick={(e) => handleSubClick(sub, idx, e)}
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

  const [userId, setUserId] = useState(null);



  useEffect(() => {
    let storedUserId = localStorage.getItem("userId");
    const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

    // Derive from currentUser if not found directly
    if (!storedUserId && (storedUser?._id || storedUser?.userId)) {
      storedUserId = storedUser._id || storedUser.userId;
      localStorage.setItem("userId", storedUserId); // ✅ persist for reloads
    }

    if (storedUserId) {
      console.log("✅ Restored userId from localStorage:", storedUserId);
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

  // 🌟 FIX: Add loading state
  const [isProgressLoading, setIsProgressLoading] = useState(true);

  useEffect(() => window.scrollTo(0, 0), []);


  useEffect(() => {
    if (!userId) {
      console.warn("⚠️ Waiting for userId to load before fetching progress...");
      return;
    }

    // --- Start Loading ---
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

    console.log("📦 Loaded local progress for", userId, course, standard, restoredLocal);

    loadProgressFromServer(userId, course, standard).then((backendData) => {
      if (!backendData) {
        setIsProgressLoading(false); // If load failed, stop loading anyway
        return;
      }
      // The backendData is already restored by loadProgressFromServer
      const merged = { ...restoredLocal, ...backendData };
      setCompletedSubtopics(merged);
      localStorage.setItem(localKey, JSON.stringify(merged));
      console.log("🌐 Synced merged progress for", userId, merged);

      // 💡 Important: Force a re-render of topics to update progress bars 
      // by toggling state that is used in rendering.
      setTimeout(() => setExpandedTopic((prev) => prev), 200);

      // --- Stop Loading ---
      setIsProgressLoading(false); // <--- STOP LOADING HERE
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
    console.log("📈 Current completedSubtopics:", completedSubtopics);
    console.log("📈 Current expandedTopic:", expandedTopic);
    console.log("📈 Current selectedSubtopic:", selectedSubtopic);

    if (expandedTopic !== null && fetchedUnits[expandedTopic]) {
      const topic = fetchedUnits[expandedTopic];
      const progress = calculateProgress(topic);
      console.log(`📊 Progress for ${topic.unitName}: ${progress}%`);
    }
  }, [completedSubtopics, expandedTopic, selectedSubtopic, fetchedUnits]); // Added fetchedUnits dependency

  useEffect(() => {
    const getAllSubjectDetails = () => {
      const subjectName = subject;
      const stringStandard = localStorage.getItem("currentClass");
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


  const collectAllLessons = (subs) => {
    if (!Array.isArray(subs)) {
      return [];
    }
    let leaves = [];
    subs.forEach(sub => {
      // If it has 'units', it's a folder, so we go deeper
      if (sub.units && sub.units.length > 0) {
        leaves = leaves.concat(collectAllLessons(sub.units));
      }
      // If it has NO 'units', it's a leaf lesson
      else {
        leaves.push(sub);
      }
    });
    return leaves;
  };

  // HELPER 2: Finds ALL tests, no matter how deep
  const collectAllTests = (topic) => {
    let tests = [];

    // 1. Check for a test at the top level
    if (topic.test && topic.test.length > 0) {
      // This test is named after the main topic
      tests.push({ testName: `Assessment - ${topic.unitName}` });
    }

    // 2. Recursively check all units for nested tests
    if (Array.isArray(topic.units)) {
      topic.units.forEach(sub => {
        // If this sub-unit has a test
        if (sub.test && sub.test.length > 0) {
          // This test is named after the sub-unit (e.g., "1.System of Units...")
          tests.push({ testName: `Assessment - ${sub.unitName}` });
        }
        // Recurse deeper to find tests inside sub-sub-folders
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

    // 1. Get all leaf lessons and all tests
    const allLessons = collectAllLessons(topic.units);
    const allTests = collectAllTests(topic);

    // 2. Calculate Total
    const totalCount = allLessons.length + allTests.length;
    if (totalCount === 0) return 0; // Nothing to complete

    // 3. Calculate Completed
    let completedCount = 0;

    // Count completed lessons
    allLessons.forEach(lesson => {
      if (topicProgress[lesson.unitName] === true) {
        completedCount++;
      }
    });

    // Count completed tests
    allTests.forEach(test => {
      if (topicProgress[test.testName] === true) {
        completedCount++;
      }
    });

    // 4. Return the percentage
    const percent = Math.round((completedCount / totalCount) * 100);
    return percent > 100 ? 100 : percent;
  };

  const isTopicCompleted = (topic) => {
    const progress = calculateProgress(topic);
    const completed = progress === 100;
    // console.log(`🔓 Topic ${topic.unitName} completed: ${completed} (${progress}%)`);
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

  // 🚀 NEW HELPER FUNCTION
  const checkAndSaveSubjectCompletion = (userId, fetchedUnits, subject, course, standard, currentProgressData) => {
    if (!fetchedUnits?.length || !userId) {
      console.log("Skipping subject completion check (no units or user)");
      return;
    }

    // Use a slight delay to ensure 'currentProgressData' (the new state) is processed
    setTimeout(() => {
      const allCompleted = fetchedUnits.every((topic) => {
        const tKey = `${course}_${standard}_${subject}_${topic.unitName}`;

        // Use the 'currentProgressData' map, which has the most current data
        const topicProgress = currentProgressData[tKey] || {};

        const allLessons = collectAllLessons(topic.units);
        const allTests = collectAllTests(topic);

        const totalCount = allLessons.length + allTests.length;
        if (totalCount === 0) return true; // An empty topic is always "complete"

        let completedCount = 0;
        allLessons.forEach(lesson => {
          if (topicProgress[lesson.unitName] === true) completedCount++;
        });
        allTests.forEach(test => {
          if (topicProgress[test.testName] === true) completedCount++;
        });

        // console.log(`Checking topic ${topic.unitName}: ${completedCount}/${totalCount}`);
        return completedCount === totalCount;
      });

      if (allCompleted) {
        console.log(`🏁 All topics completed for ${subject} (${course} ${standard})`);

        // ✅ FIX: Read/write from the CORRECT course-specific localStorage key
        const localKey = `subjectCompletion_${course}_${standard}`;
        // ✅ FIX: Default to an object {}, not an array []
        const existingCompletionData = JSON.parse(localStorage.getItem(localKey) || "{}");

        const subjectKey = `${course}_${standard}_${subject}`;

        const updatedCompletionMap = {
          ...existingCompletionData,
          [subjectKey]: 100 // Mark the current subject as 100
        };

        // ✅ FIX: Save to the CORRECT course-specific localStorage key
        localStorage.setItem(localKey, JSON.stringify(updatedCompletionMap));

        // Send to server
        // We pass 'currentProgressData' as the subtopics to ensure backend has latest
        saveSubjectCompletionToServer(userId, updatedCompletionMap, currentProgressData);

        // Notify the NEET.jsx page
        window.dispatchEvent(new Event("storage"));
      } else {
        console.log(`⏳ Subject ${subject} not yet complete.`);
      }
    }, 500); // 500ms delay
  };


  const markSubtopicComplete = () => {
    if (!selectedSubtopic || expandedTopic === null) return;

    let finalUserId = userId;
    if (!finalUserId) {
      const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      finalUserId = storedUser?._id || storedUser?.userId;
      if (finalUserId) {
        console.log("🔁 Using determined userId for save:", finalUserId);
        setUserId(finalUserId);
      } else {
        console.warn("⚠️ Cannot save — userId missing completely");
        return;
      }
    }

    const topicTitle = fetchedUnits[expandedTopic].unitName;
    const subtopicTitle = selectedSubtopic.unitName;
    const course = "NEET";
    const standard = localStorage.getItem("currentClass") || "";
    const subjectName = subject;
    const topicKey = `${course}_${standard}_${subjectName}_${topicTitle}`;

    console.log("🔵 Marking complete:", { topicKey, subtopicTitle, userId: finalUserId });

    let updatedProgressData; // 👈 To capture the new state

    // --- 1️⃣ Assessment Completion Logic ---
    if (subtopicTitle.includes("Assessment")) {
      console.log("🎯 This is a test - marking ONLY this test as completed");

      setCompletedSubtopics((prev) => {
        const topicProgress = prev[topicKey] || {};
        const updatedProgress = { ...topicProgress };
        updatedProgress[subtopicTitle] = true; // Mark ONLY the test

        const updated = { ...prev, [topicKey]: updatedProgress };

        localStorage.setItem(`completedSubtopics_${finalUserId}_${course}_${standard}`, JSON.stringify(updated));

        if (saveProgressTimer) clearTimeout(saveProgressTimer);
        saveProgressTimer = setTimeout(() => {
          saveProgressToServer(finalUserId, updated, setCompletedSubtopics, course, standard);
          saveProgressTimer = null;
        }, 500);

        updatedProgressData = updated; // 👈 Capture the new state
        return updated;
      });

      // ✅ CALL THE CHECKER FUNCTION
      if (updatedProgressData) {
        checkAndSaveSubjectCompletion(finalUserId, fetchedUnits, subject, course, standard, updatedProgressData);
      }
    }

    // --- 2️⃣ Normal Subtopic Logic ---
    else {
      setCompletedSubtopics((prev) => {
        const topicProgress = prev[topicKey] || {};
        if (topicProgress[subtopicTitle]) {
          updatedProgressData = prev; // No change, but still need to check
          return prev;
        }

        const updated = {
          ...prev,
          [topicKey]: {
            ...topicProgress,
            [subtopicTitle]: true,
          },
        };

        localStorage.setItem(
          `completedSubtopics_${finalUserId}_${course}_${standard}`,
          JSON.stringify(updated)
        );

        // localStorage.setItem(
        //   `${course}-completed-${finalUserId}-${standard}-${selectedSubtopic.unitName}`,
        //   "true"
        // );

        if (saveProgressTimer) clearTimeout(saveProgressTimer);
        saveProgressTimer = setTimeout(() => {
          saveProgressToServer(finalUserId, updated, setCompletedSubtopics, course, standard);
          saveProgressTimer = null;
        }, 500);

        updatedProgressData = updated; // 👈 Capture the new state
        return updated;
      });

      // ✅ CALL THE CHECKER FUNCTION
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

      // 1️⃣ Backend DELETE
      const response = await fetch(
        `${API_BASE_URL}/api/progress/delete?userId=${finalUserId}&course=${course}&standard=${standard}&subject=${encodeURIComponent(subjectName)}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        console.log(`🗑️ Backend progress deleted for ${finalUserId} ${course} ${standard}`);

        // 2️⃣ Local cleanup
        localStorage.removeItem(`completedSubtopics_${finalUserId}_${course}_${standard}`);
        localStorage.removeItem(`subjectCompletion_${course}_${standard}`);

        // Remove individual subtopic flags
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith(`${course}-completed-${finalUserId}-${standard}-`)) {
            localStorage.removeItem(key);
          }
        });

        // 3️⃣ Update React state
        setCompletedSubtopics({});
        setSubjectCompletion({});

        // 4️⃣ Notify any listeners (like other components)
        window.dispatchEvent(new Event("storage"));
        console.log(`🧹 Cleared ${course} ${standard} progress data`);
      } else {
        console.error("❌ Failed to delete progress from backend:", await response.text());
      }
    } catch (err) {
      console.error("⚠️ Reset progress error:", err);
    }
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

      {/* 1. Show Loading State when fetching progress */}
      {showTopics && isProgressLoading && (
        <div className="topics-list" style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Loading Progress... Please wait. </h2>
        </div>
      )}

      {/* 2. Render Topics List when loaded and shown */}
      {showTopics && !isProgressLoading && (
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
            {/* <button className="back-subjects-btn" onClick={resetProgress}>
              Reset Progress
            </button> */}
            <button className="back-subjects-btn" onClick={() => resetProgress(subject)}>
              Reset Progress
            </button>

          </div>
        </div>
      )}

      {/* Explanation / Quiz Section */}
      <div className="explanation-container">
        {selectedSubtopic ? (
          (() => { // Use IIFE (Immediately Invoked Function Expression) to calculate and return
            const course = "NEET";
            const standard = localStorage.getItem("currentClass") || "";
            const topicTitle = fetchedUnits[expandedTopic]?.unitName;
            const subtopicTitle = selectedSubtopic.unitName;
            const topicKey = `${course}_${standard}_${subject}_${topicTitle}`;

            // This is the SINGLE SOURCE OF TRUTH
            const isAlreadyComplete = completedSubtopics[topicKey]?.[subtopicTitle] === true;

            if (selectedSubtopic.unitName.includes("Assessment")) {
              return (
                <NeetQuiz
                  topicTitle={fetchedUnits[expandedTopic]?.unitName}
                  subtopicTitle={selectedSubtopic.unitName}
                  test={selectedSubtopic.test || []}
                  onBack={handleBackToTopics}
                  onMarkComplete={markSubtopicComplete}
                  isAlreadyComplete={isAlreadyComplete} // 👈 PASS PROP
                />
              );
            } else {
              return (
                <NeetExplanation
                  topicTitle={fetchedUnits[expandedTopic]?.unitName}
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
                  onMarkComplete={markSubtopicComplete}
                  isAlreadyComplete={isAlreadyComplete} // 👈 PASS PROP
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