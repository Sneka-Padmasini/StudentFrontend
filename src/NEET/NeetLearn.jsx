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


// const saveProgressToServer = async (userId, completedSubtopics, setCompletedSubtopics) => {
// const saveProgressToServer = async (userId, completedSubtopics, setCompletedSubtopics, course, standard) => {
//   // Clear any pending debounced calls before running the actual save
//   if (saveProgressTimer) clearTimeout(saveProgressTimer);
//   saveProgressTimer = null;

//   if (!userId || userId === "guest") {
//     console.warn("⚠️ Skipping save — no valid userId");
//     return;
//   }

//   const sanitizeKeys = (obj) => {
//     if (typeof obj !== "object" || obj === null) return obj;
//     const sanitized = {};
//     for (const [key, value] of Object.entries(obj)) {
//       const safeKey = key.replace(/\./g, "__dot__");
//       sanitized[safeKey] = sanitizeKeys(value);
//     }
//     return sanitized;
//   };

//   const safeData = sanitizeKeys(completedSubtopics);
//   console.log("🚀 Sending progress to backend:", safeData);

//   try {
//     const res = await fetch(`${API_BASE_URL}/api/progress/save`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       // Send the entire merged 'completedSubtopics' map for the backend to handle the deep merge
//       body: JSON.stringify({ userId, completedSubtopics: safeData }),
//     });

//     const text = await res.text();
//     console.log("🧾 Backend response text:", text);

//     if (!res.ok) {
//       console.error("❌ Backend rejected progress save:", text);
//     } else {
//       console.log("✅ Progress saved to backend successfully!");
//     }
//   } catch (err) {
//     console.error("❌ Error saving progress:", err);
//   }
// };

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

  try {
    const response = await fetch(`${API_BASE_URL}/api/progress/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Sending subjectCompletionMap (key-value object)
      body: JSON.stringify({ userId, subjectCompletion: subjectCompletionMap, completedSubtopics: {} }),
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


  // // ✅ Step 1: Restore userId from localStorage if missing
  // useEffect(() => {
  //   if (!userId) {
  //     const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  //     const restoredId = storedUser?._id || storedUser?.userId; // MUST be the DB ID

  //     if (restoredId) {

  //       console.log("✅ Restored userId from localStorage:", restoredId);
  //       setUserId(restoredId);
  //     } else {
  //       console.warn("⚠️ No valid userId or email found in localStorage");
  //     }
  //   }
  // }, [userId]);

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


  // ✅ Load progress only once per user, merge local + backend data safely
  //useEffect(() => {
  // if (!userId) {
  //   console.warn("⚠️ Waiting for userId to load before fetching progress...");
  //   return;
  // }

  // // --- Start Loading ---
  // setIsProgressLoading(true); // <--- START LOADING HERE

  // const localKey = `completedSubtopics_${userId}_neet`;
  // const savedProgress = JSON.parse(localStorage.getItem(localKey) || "{}");

  // const restoreKeys = (obj) => {
  //   if (typeof obj !== "object" || obj === null) return obj;
  //   const restored = {};
  //   for (const [key, value] of Object.entries(obj)) {
  //     const cleanKey = key.replace(/__dot__/g, ".");
  //     restored[cleanKey] = restoreKeys(value);
  //   }
  //   return restored;
  // };

  // const restoredLocal = restoreKeys(savedProgress);
  // setCompletedSubtopics(restoredLocal);

  // console.log("📦 Loaded local progress for", userId, restoredLocal);

  // loadProgressFromServer(userId).then((backendData) => { // <-- Use .then here
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




  // Recursively flatten all subtopics in a topic
  const collectAllSubtopics = (subs = []) =>
    subs.flatMap((s) => [s, ...(s.units ? collectAllSubtopics(s.units) : [])]);


  // Calculate % completion for a topic - FIXED VERSION
  // const calculateProgress = (topic) => {
  //   if (!topic || !topic.units) return 0;

  //   // Get all subtopics (lessons) recursively
  //   const allSubs = collectAllSubtopics(topic.units);

  //   // Count completed subtopics
  //   const completedCount = allSubs.filter((sub) => {
  //     // Retrieve topic progress, handling both normal and sanitized keys (though front-end should only use normal keys here)
  //     const topicKeyName = topic.unitName;
  //     const topicProgress = completedSubtopics[topicKeyName];

  //     // Subtopic completion is a boolean under the topic's map
  //     const isCompleted = topicProgress?.[sub.unitName] === true;

  //     // console.log(`📝 Checking ${topicKeyName} -> ${sub.unitName}: ${isCompleted ? '✅' : '❌'}`);
  //     return isCompleted;
  //   }).length;

  //   const totalCount = allSubs.length;
  //   const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  //   // console.log(`📊 Progress for ${topic.unitName}: ${completedCount}/${totalCount} = ${progress}%`);
  //   return progress;
  // };

  const calculateProgress = (topic) => {
    if (!topic || !topic.units) return 0;

    const allSubs = collectAllSubtopics(topic.units);
    const course = "NEET";
    const standard = localStorage.getItem("currentClass") || "";
    const subjectName = subject; // "Physics", "Chemistry", etc.

    // Unified key format used everywhere
    const topicKey = `${course}_${standard}_${subjectName}_${topic.unitName}`;
    const topicProgress = completedSubtopics[topicKey] || {};

    const completedCount = allSubs.filter((sub) => topicProgress?.[sub.unitName] === true).length;
    const totalCount = allSubs.length;
    return totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
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

    // --- 1️⃣ Assessment Completion Logic ---
    if (subtopicTitle.includes("Assessment")) {
      console.log("🎯 This is a test - marking ALL subtopics in topic as completed");

      setCompletedSubtopics((prev) => {
        const topicProgress = prev[topicKey] || {};
        const allSubs = collectAllSubtopics(fetchedUnits[expandedTopic].units);
        const updatedProgress = { ...topicProgress };

        // Mark all subtopics as completed
        allSubs.forEach((sub) => {
          updatedProgress[sub.unitName] = true;
          localStorage.setItem(`${course}-completed-${finalUserId}-${standard}-${sub.unitName}`, "true");
        });

        // Mark the test as completed
        updatedProgress[subtopicTitle] = true;

        const updated = { ...prev, [topicKey]: updatedProgress };
        localStorage.setItem(`completedSubtopics_${finalUserId}_${course}_${standard}`, JSON.stringify(updated));

        if (saveProgressTimer) clearTimeout(saveProgressTimer);
        saveProgressTimer = setTimeout(() => {
          saveProgressToServer(finalUserId, updated, setCompletedSubtopics, course, standard);
          saveProgressTimer = null;
        }, 500);

        // Check if subject is fully completed
        setTimeout(() => {
          if (!fetchedUnits?.length) return;
          const allCompleted = fetchedUnits.every((topic) => {
            const tKey = `${course}_${standard}_${subjectName}_${topic.unitName}`;
            const allSubs = collectAllSubtopics(topic.units);
            const completedCount = allSubs.filter(
              (sub) => updated[tKey]?.[sub.unitName] === true
            ).length;
            return completedCount === allSubs.length;
          });

          if (allCompleted) {
            console.log(`🏁 All topics completed for ${subject}`);
            const allSubjects = ["Physics", "Chemistry", "Zoology", "Botany"];
            const existingCompletionData = JSON.parse(localStorage.getItem("subjectCompletion") || "[]");
            const existingCompletion = Array.isArray(existingCompletionData) ? existingCompletionData : [];

            const mergedCompletion = allSubjects.map((subj) => {
              const old =
                existingCompletion.find((s) => s.name === subj) || {
                  name: subj,
                  progress: 0,
                  certified: false,
                };
              if (subj === subject)
                return { ...old, certified: true, progress: 100 };
              return old;
            });

            const subjectCompletionMap = mergedCompletion.reduce((acc, subj) => {
              const key = `${course}_${standard}_${subj.name}`;
              acc[key] = subj.certified ? 100 : subj.progress || 0;
              return acc;
            }, {});

            localStorage.setItem("subjectCompletion", JSON.stringify(mergedCompletion));
            saveSubjectCompletionToServer(finalUserId, subjectCompletionMap, updated);
            window.dispatchEvent(new Event("storage"));
          }
        }, 500);

        return updated;
      });
    }

    // --- 2️⃣ Normal Subtopic Logic ---
    else {
      setCompletedSubtopics((prev) => {
        const topicProgress = prev[topicKey] || {};
        if (topicProgress[subtopicTitle]) return prev;

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

        localStorage.setItem(
          `${course}-completed-${finalUserId}-${standard}-${selectedSubtopic.unitName}`,
          "true"
        );

        if (saveProgressTimer) clearTimeout(saveProgressTimer);
        saveProgressTimer = setTimeout(() => {
          saveProgressToServer(finalUserId, updated, setCompletedSubtopics, course, standard);
          saveProgressTimer = null;
        }, 500);

        return updated;
      });
    }
  };



  // const resetProgress = async () => {
  //   const confirmReset = window.confirm(
  //     "Are you sure you want to reset ALL your progress for all subjects?" // Updated prompt clarity
  //   );
  //   if (!confirmReset) return;

  //   // 1. Determine the stable UserId (since state might be null/outdated)
  //   let finalUserId = userId;
  //   if (!finalUserId) {
  //     const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  //     finalUserId = storedUser?._id || storedUser?.userId;
  //   }

  //   if (!finalUserId) {
  //     alert("Cannot reset: User ID is missing.");
  //     return;
  //   }

  //   // 2. Call API to delete progress from MongoDB
  //   try {
  //     const res = await fetch(`${API_BASE_URL}/api/progress/${finalUserId}`, {
  //       method: "DELETE"
  //     });

  //     const text = await res.text();

  //     if (!res.ok) {
  //       console.error("❌ Backend DELETE failed:", text);
  //       alert(`Reset failed! Backend error. Details: ${text}`);
  //     } else {
  //       console.log("🗑️ Backend progress deleted for", finalUserId);
  //     }
  //   } catch (err) {
  //     console.error("❌ Error deleting progress:", err);
  //     // Continue even if delete fails, allowing local reset
  //   }

  //   // 3. Clear all local state and storage
  //   localStorage.removeItem(`completedSubtopics_${finalUserId}_neet`);
  //   Object.keys(localStorage).forEach((key) => {
  //     if (key.startsWith("neet-completed-")) {
  //       localStorage.removeItem(key);
  //     }
  //   });

  //   // 🧹 Also clear subjectCompletion
  //   localStorage.removeItem("subjectCompletion");

  //   // 4. Reset component state
  //   setCompletedSubtopics({});
  //   setExpandedTopic(null);
  //   setSelectedSubtopic(null);

  //   console.log("🧹 Cleared all local progress data");

  //   // 🔄 Notify NEET.jsx to refresh (re-initialize progress bars to zero)
  //   window.dispatchEvent(new Event("storage"));

  //   alert("Your progress has been reset successfully.");
  // };

  // const resetProgress = async (subjectName) => {
  //   try {
  //     const storedUser = JSON.parse(localStorage.getItem("currentUser"));
  //     if (!storedUser?._id) return;
  //     const finalUserId = storedUser._id;
  //     const course = "NEET";
  //     const standard = localStorage.getItem("currentClass");

  //     // 1️⃣ Backend DELETE
  //     const response = await fetch(
  //       `${API_BASE_URL}/api/progress/delete?userId=${finalUserId}&course=${course}&standard=${standard}`,
  //       { method: "DELETE" }
  //     );

  //     if (response.ok) {
  //       console.log(`🗑️ Backend progress deleted for ${finalUserId} ${course} ${standard}`);

  //       // 2️⃣ Local cleanup
  //       localStorage.removeItem(`completedSubtopics_${finalUserId}_${course}_${standard}`);
  //       localStorage.removeItem(`subjectCompletion_${course}_${standard}`);

  //       // Remove per-subtopic flags too
  //       Object.keys(localStorage).forEach((key) => {
  //         if (key.startsWith(`${course}-completed-${finalUserId}-${standard}-`)) {
  //           localStorage.removeItem(key);
  //         }
  //       });

  //       // 3️⃣ Update React state
  //       setCompletedSubtopics({});
  //       setSubjectCompletion((prev) =>
  //         prev.map((subject) =>
  //           subject.name === subjectName
  //             ? { ...subject, progress: 0 }
  //             : subject
  //         )
  //       );

  //       // 4️⃣ Dispatch global update
  //       window.dispatchEvent(new Event("storage"));
  //       console.log(`🧹 Cleared ${course} ${standard} progress data`);
  //     } else {
  //       console.error("❌ Failed to delete progress from backend:", await response.text());
  //     }
  //   } catch (err) {
  //     console.error("⚠️ Reset progress error:", err);
  //   }
  // };

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