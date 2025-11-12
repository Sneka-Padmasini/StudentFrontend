import React, { useState, useEffect } from "react";
import { FaBars } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import "./JeeLearn.css";
import PadmasiniChat from "../components/PadmasiniChat";
import JeeExplanation from "./JeeExplanation";
import JeeQuiz from "./JeeQuiz";
import { API_BASE_URL } from "../config";
import { useUser } from "../components/UserContext";

let saveProgressTimer = null;

const restoreKeys = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj;
  const restored = {};
  for (const [key, value] of Object.entries(obj)) {
    const cleanKey = key.replace(/__dot__/g, ".");
    restored[cleanKey] = restoreKeys(value);
  }
  return restored;
};

// ✅ Updated to include course + standard
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
  console.log(`🚀 Sending ${course} progress (${standard}) to backend:`, safeData);

  try {
    const res = await fetch(`${API_BASE_URL}/api/progress/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, completedSubtopics: safeData, course, standard }),
    });

    const text = await res.text();
    if (!res.ok) console.error("❌ Backend rejected progress save:", text);
    else console.log(`✅ ${course} Progress saved for ${standard}!`);
  } catch (err) {
    console.error(`❌ Error saving ${course} progress:`, err);
  }
};

// ✅ Include course + standard
const saveSubjectCompletionToServer = async (userId, subjectCompletionMap, completedSubtopics) => {
  if (!userId || userId === "guest") {
    console.warn("⚠️ Skipping subject sync — userId not ready");
    return;
  }

  // ✅ FIX: Get course and standard to send to the backend
  const course = "JEE"; // Hardcoded for this file
  const standard = localStorage.getItem("currentClassJee") || "";

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

// ✅ Include course + standard
const loadProgressFromServer = async (userId, course, standard) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/progress/${userId}?course=${course}&standard=${standard}`);
    const data = await res.json();
    console.log(`🌐 Fetched ${course} backend progress:`, data);
    if (data?.completedSubtopics) return restoreKeys(data.completedSubtopics);
    return {};
  } catch (err) {
    console.error(`❌ Error loading ${course} progress:`, err);
    return {};
  }
};

const SubtopicTree = ({ subtopics, onClick, selectedTitle, parentIndex, level = 1 }) => {
  const [expandedSub, setExpandedSub] = useState(null);

  const handleSubClick = (sub, idx, e) => {
    e.stopPropagation();
    const hasChildren = (sub.units && sub.units.length > 0) || (sub.test && sub.test.length > 0);
    if (hasChildren) setExpandedSub((prev) => (prev === idx ? null : idx));
    else onClick(sub, parentIndex);
  };

  const handleTestClick = (test, idx, sub) => {
    const testSubtopic = { ...sub, unitName: `Assessment - ${sub.unitName}`, test: [test] };
    onClick(testSubtopic, parentIndex);
  };

  return (
    <ul className="subtopics-list">
      {subtopics.map((sub, idx) => (
        <li key={idx}>
          <div
            className={`subtopic-title ${selectedTitle === sub.unitName ? "selected" : ""}`}
            style={{ marginLeft: `${level * 20}px` }}
            onClick={(e) => handleSubClick(sub, idx, e)}
          >
            ⮚ {sub.unitName}
          </div>
          {expandedSub === idx &&
            sub.test?.map((test, tIdx) => (
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
  const course = "JEE"; // ✅ fixed course
  // const standard = localStorage.getItem("currentClassJee") || "11th"; // ✅ fixed standard
  // prefer class passed from navigation (JEE.jsx) then fallback to localStorage
  const navSelectedClass = location.state?.selectedClass;
  const effectiveStandard = navSelectedClass || localStorage.getItem("currentClassJee") || "11th";

  const [userId, setUserId] = useState(null);

  const [fetchedUnits, setFetchedUnits] = useState([]);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [showTopics, setShowTopics] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [completedSubtopics, setCompletedSubtopics] = useState({});
  const [isProgressLoading, setIsProgressLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const id = storedUser?._id || storedUser?.userId;
    if (id) {
      setUserId(id);
      console.log("✅ JEE UserId restored:", id);
    }
  }, []);


  // 🧠 1️⃣ Fetch JEE subject units (like NEET)
  useEffect(() => {
    const fetchUnits = async () => {
      try {

        let courseName = "professional"; // ✅ use professional for JEE test content

        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

        if (currentUser?.coursetype) {
          const type = currentUser.coursetype.toLowerCase();

          // ✅ Backend sometimes stores all content (with tests) under "professional"
          if (type.includes("jee")) courseName = "professional";
          else if (type.includes("neet")) courseName = "professional";
          else if (type.includes("school")) courseName = "local";
        }

        const subjectName = subject;
        const standard = effectiveStandard?.replace(/\D/g, "") || effectiveStandard;

        console.log("📘 Fetching JEE units for:", { courseName, subjectName, standard });

        const resp = await fetch(
          `${API_BASE_URL}/api/getAllUnits/${courseName}/${encodeURIComponent(subjectName)}/${encodeURIComponent(standard)}`,
          { method: "GET", credentials: "include" }
        );

        if (!resp.ok) {
          console.error("❌ Failed to fetch JEE units:", await resp.text());
          setFetchedUnits([]);
          return;
        }

        const data = await resp.json();
        console.log(`✅ ${subjectName} JEE units fetched:`, data);

        setFetchedUnits(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Error fetching JEE subject units:", err);
        setFetchedUnits([]);
      }
    };


    fetchUnits();
  }, [subject, effectiveStandard]);

  // 🧩 2️⃣ Load progress for current user (uses course + effectiveStandard)
  useEffect(() => {
    if (!userId) return;

    setIsProgressLoading(true);
    const localKey = `completedSubtopics_${userId}_${course}_${effectiveStandard}`;
    const savedLocal = JSON.parse(localStorage.getItem(localKey) || "{}");
    setCompletedSubtopics(restoreKeys(savedLocal));

    loadProgressFromServer(userId, course, effectiveStandard).then((backendData) => {
      const merged = { ...savedLocal, ...backendData };
      setCompletedSubtopics(merged);
      localStorage.setItem(localKey, JSON.stringify(merged));
      setIsProgressLoading(false);
    });
  }, [userId, effectiveStandard]);


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

    // 1. Find TOP-LEVEL test (matches the render logic near line 823)
    if (topic.test && topic.test.length > 0) {
      tests.push({ testName: `Assessment - ${topic.test[0].testName}` });
    }

    // 2. Create a recursive function to find NESTED tests
    const findNestedTests = (subs) => {
      if (!Array.isArray(subs)) return;

      subs.forEach(sub => {
        // If this sub-folder has a test, add it
        // (matches the SubtopicTree's handleTestClick logic)
        if (sub.test && sub.test.length > 0) {
          tests.push({ testName: `Assessment - ${sub.unitName}` });
        }
        // Now, ONLY recurse into its children (sub.units)
        // This prevents double-counting the 'sub' itself
        findNestedTests(sub.units);
      });
    };

    // 3. Start the recursive search for nested tests
    findNestedTests(topic.units);

    return tests;
  };


  const calculateProgress = (topic) => {
    if (!topic) return 0;

    // Use the JEE course variables
    const course = "JEE";
    const standard = effectiveStandard;
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
      // Use exact matching
      if (topicProgress[lesson.unitName] === true) {
        completedCount++;
      }
    });

    // Count completed tests
    allTests.forEach(test => {
      // Use exact matching
      if (topicProgress[test.testName] === true) {
        completedCount++;
      }
    });

    // 4. Return the percentage
    const percent = Math.round((completedCount / totalCount) * 100);
    return percent > 100 ? 100 : percent;
  };


  const isTopicCompleted = (topic) => calculateProgress(topic) === 100;
  const isTopicUnlocked = (index) => index === 0 || isTopicCompleted(fetchedUnits[index - 1]);
  const toggleTopic = (index) => {
    if (!isTopicUnlocked(index)) return;
    setExpandedTopic(expandedTopic === index ? null : index);
    setSelectedSubtopic(null);
  };

  const handleSubtopicClick = (sub, index) => {
    setSelectedSubtopic(sub);
    if (isMobile) setShowTopics(false);
    setExpandedTopic(index);
  };

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

        return completedCount === totalCount;
      });

      if (allCompleted) {
        console.log(`🏁 All topics completed for ${subject} (${course} ${standard})`);

        // ✅ FIX: Read/write from the CORRECT course-specific localStorage key
        const localKey = `subjectCompletion_${course}_${standard}`;

        // ✅ FIX: Default to an object {}, not an array
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

        // Notify the JEE.jsx page
        window.dispatchEvent(new Event("storage"));
      } else {
        console.log(`⏳ Subject ${subject} not yet complete.`);
      }
    }, 500); // 500ms delay
  };

  // JeeLearn.jsx (REPLACE THIS FUNCTION)

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
    const course = "JEE"; // Use JEE variable
    const standard = effectiveStandard; // Use JEE variable
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
      const course = "JEE";
      const standard = effectiveStandard; // Use the correct standard

      // 1️⃣ Backend DELETE
      const response = await fetch(
        `${API_BASE_URL}/api/progress/delete?userId=${finalUserId}&course=${course}&standard=${standard}&subject=${encodeURIComponent(subjectName)}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        console.log(`🗑️ Backend progress deleted for ${finalUserId} ${course}_${standard}`);

        // 2️⃣ Local cleanup
        localStorage.removeItem(`completedSubtopics_${finalUserId}_${course}_${standard}`);

        // Remove individual lesson flags
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith(`${course}-completed-${finalUserId}-${standard}-`)) {
            localStorage.removeItem(key);
          }
        });

        // ✅ FIX: Update the Subject Completion OBJECT
        const completionKey = `subjectCompletion_${course}_${standard}`;
        const savedCompletion = JSON.parse(localStorage.getItem(completionKey) || "{}");

        const subjectKey = `${course}_${standard}_${subjectName}`;

        const updatedCompletionMap = {
          ...savedCompletion,
          [subjectKey]: 0 // Set this subject's progress to 0
        };

        localStorage.setItem(completionKey, JSON.stringify(updatedCompletionMap));

        // 3️⃣ Update React state
        setCompletedSubtopics({});

        // 4️⃣ Dispatch global update
        window.dispatchEvent(new Event("storage"));
        console.log(`🧹 Cleared ${subjectName} progress for ${course}_${standard}`);
      } else {
        console.error("❌ Failed to delete progress from backend:", await response.text());
      }
    } catch (err) {
      console.error("⚠️ Reset progress error:", err);
    }
  };

  const handleBackToSubjects = () => navigate("/Jee");

  return (
    <div className="Jee-container">
      {isMobile && (
        <button className="toggle-btn" onClick={() => setShowTopics(!showTopics)}>
          <FaBars /> <h2>{subject} Topics</h2>
        </button>
      )}

      {showTopics && isProgressLoading && (
        <div className="topics-list" style={{ padding: "20px", textAlign: "center" }}>
          <h2>Loading {course} Progress... Please wait.</h2>
        </div>
      )}

      {showTopics && !isProgressLoading && (
        <div className="topics-list">
          <ul>
            {fetchedUnits.map((topic, index) => (
              <li key={index}>
                <div
                  className={`topic-title ${expandedTopic === index ? "active" : ""} ${!isTopicUnlocked(index) ? "locked" : ""
                    }`}
                  onClick={() => toggleTopic(index)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
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
                    <div className="progress-info">{calculateProgress(topic)}%</div>
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

                {expandedTopic === index &&
                  topic.test?.length > 0 && (
                    <div
                      className="subtopic-title test-title"
                      style={{ marginLeft: "40px", cursor: "pointer" }}
                      onClick={() =>
                        handleSubtopicClick(
                          { unitName: `Assessment - ${topic.test[0].testName}`, test: topic.test },
                          index
                        )
                      }
                    >
                      🧠 {topic.test[0].testName} - Assessment
                    </div>
                  )}


              </li>
            ))}
          </ul>

          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <button className="back-subjects-btn" onClick={handleBackToSubjects}>
              Back to Subjects
            </button>
            <button
              className="back-subjects-btn"
              onClick={() => resetProgress(subject)}
            >
              Reset Progress
            </button>

          </div>
        </div>
      )}

      {/* Explanation / Quiz Section */}
      <div className="explanation-container">
        {selectedSubtopic ? (
          (() => { // Use IIFE to calculate completion status
            const course = "JEE";
            const standard = effectiveStandard;
            const topicTitle = fetchedUnits[expandedTopic]?.unitName;
            const subtopicTitle = selectedSubtopic.unitName;
            const topicKey = `${course}_${standard}_${subject}_${topicTitle}`;

            // This is the SINGLE SOURCE OF TRUTH
            const isAlreadyComplete = completedSubtopics[topicKey]?.[subtopicTitle] === true;

            if (selectedSubtopic.unitName.includes("Assessment")) {
              return (
                <JeeQuiz
                  topicTitle={fetchedUnits[expandedTopic]?.unitName}
                  subtopicTitle={selectedSubtopic.unitName}
                  test={selectedSubtopic.test || []}
                  onBack={() => setShowTopics(true)}
                  onMarkComplete={markSubtopicComplete}
                  isAlreadyComplete={isAlreadyComplete}
                />
              );
            } else {
              return (
                <JeeExplanation
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
                  onBack={() => setShowTopics(true)}
                  onMarkComplete={markSubtopicComplete}
                  isAlreadyComplete={isAlreadyComplete}
                />
              );
            }
          })()
        ) : (
          <div className="no-explanation">
            <h2>
              Welcome to {subject} - {effectiveStandard}
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
