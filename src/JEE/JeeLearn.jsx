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
const saveSubjectCompletionToServer = async (userId, subjectCompletionMap, completedSubtopics, course, standard) => {
  if (!userId || userId === "guest") return;
  try {
    const response = await fetch(`${API_BASE_URL}/api/progress/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        subjectCompletion: subjectCompletionMap,
        completedSubtopics: {},
        course,
        standard,
      }),
    });
    if (!response.ok) console.error("❌ Subject completion sync failed:", await response.text());
    else console.log(`✅ ${course} subject completion synced (${standard})`);
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

  // do changes here

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



  // const collectAllSubtopics = (subs = []) => subs.flatMap((s) => [s, ...(s.units ? collectAllSubtopics(s.units) : [])]);
  const collectAllSubtopics = (subs = []) => {
    if (!Array.isArray(subs)) return [];
    return subs.flatMap((s) => [s, ...(Array.isArray(s.units) ? collectAllSubtopics(s.units) : [])]);
  };



  // const calculateProgress = (topic) => {
  //   if (!topic?.units && !topic?.test) return 0;

  //   const allSubs = collectAllSubtopics(topic.units || []);
  //   const topicKey = `${course}_${effectiveStandard}_${subject}_${topic.unitName}`;

  //   const topicProgress = completedSubtopics[topicKey] || {};

  //   // 🧠 Count completed lessons + test if available
  //   let completedCount = 0;

  //   // Count normal subtopics
  //   allSubs.forEach((sub) => {
  //     if (topicProgress[sub.unitName]) completedCount++;
  //   });

  //   // Count test if it exists and marked complete
  //   if (topic.test && topic.test.length > 0) {
  //     const testName = topic.test[0].testName;
  //     const assessmentKey = `Assessment - ${testName}`;
  //     if (topicProgress[assessmentKey]) completedCount++;
  //   }

  //   const totalCount = allSubs.length + (topic.test?.length > 0 ? 1 : 0);
  //   return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  // };

  const calculateProgress = (topic) => {
    if (!topic) return 0;

    // 🧠 Collect all nested subtopics
    const allSubs = collectAllSubtopics(topic.units || []);
    const topicKey = `${course}_${effectiveStandard}_${subject}_${topic.unitName}`;
    const topicProgress = completedSubtopics[topicKey] || {};

    let completedCount = 0;
    let totalCount = 0;

    // ✅ 1️⃣ Count all normal subtopics
    // allSubs.forEach((sub) => {
    //   totalCount++;
    //   if (topicProgress[sub.unitName]) completedCount++;
    // });
    allSubs.forEach((sub) => {
      totalCount++;

      const cleanName = sub.unitName?.trim().toLowerCase();

      // const found = Object.keys(topicProgress).some((key) => {
      //   const normalizedKey = key.trim().toLowerCase();

      //   // Flexible match: exact OR partial match
      //   return (
      //     normalizedKey === cleanName ||
      //     normalizedKey.includes(cleanName) ||
      //     cleanName.includes(normalizedKey)
      //   );
      // });
      const found = Object.keys(topicProgress).some((key) => {
        const normalizedKey = key.trim().toLowerCase();

        // ✅ super-flexible match
        return (
          normalizedKey === cleanName ||
          normalizedKey.includes(cleanName) ||
          cleanName.includes(normalizedKey) ||
          normalizedKey.replace(/\s+/g, "").includes(cleanName.replace(/\s+/g, "")) ||
          cleanName.replace(/\s+/g, "").includes(normalizedKey.replace(/\s+/g, "")) ||
          (normalizedKey.startsWith("child") && cleanName.startsWith("child")) ||
          (normalizedKey.startsWith("sub") && cleanName.startsWith("sub"))
        );
      });


      if (found) completedCount++;
    });



    // ✅ 2️⃣ Include test (special case for JEE)
    if (topic.test && topic.test.length > 0) {
      totalCount++; // count the test as one item

      // Sometimes saved key is "Assessment - <testName>" or "Assessment - <topic.unitName>"
      const testName = topic.test[0].testName || topic.unitName;
      const possibleKeys = [
        `Assessment - ${testName}`,
        `Assessment - ${topic.unitName}`,
        `Assessment - test`,
      ];

      // const isTestDone = possibleKeys.some((key) => topicProgress[key]);
      const isTestDone = Object.keys(topicProgress).some((k) =>
        possibleKeys.some(
          (pk) =>
            k.trim().toLowerCase() === pk.trim().toLowerCase() ||
            k.trim().toLowerCase().includes(pk.trim().toLowerCase()) ||
            pk.trim().toLowerCase().includes(k.trim().toLowerCase())
        )
      );


      if (isTestDone) completedCount++;
    }

    // ✅ 3️⃣ Return the percentage
    if (totalCount === 0) return 0;
    const percent = Math.round((completedCount / totalCount) * 100);
    // 🔍 🧠 Paste this block right BELOW the percent line
    if (percent < 100) {
      console.log(
        `⚠️ Incomplete keys for ${topic.unitName}:`,
        allSubs
          .map((s) => s.unitName)
          .filter((name) => !topicProgress[name]),
        "and test key:",
        Object.keys(topicProgress)
      );
    }

    return percent;
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

  const markSubtopicComplete = () => {
    if (!selectedSubtopic || expandedTopic === null) return;
    const topicTitle = fetchedUnits[expandedTopic].unitName;
    // const subtopicTitle = selectedSubtopic.unitName;
    const subtopicTitle = selectedSubtopic.unitName.trim().toLowerCase();

    const topicKey = `${course}_${effectiveStandard}_${subject}_${topicTitle}`;
    const localKey = `completedSubtopics_${userId}_${course}_${effectiveStandard}`;

    // const topicKey = `${course}_${standard}_${subject}_${topicTitle}`;
    // const localKey = `completedSubtopics_${userId}_${course}_${standard}`;

    setCompletedSubtopics((prev) => {
      const updated = {
        ...prev,
        [topicKey]: { ...(prev[topicKey] || {}), [subtopicTitle]: true },
      };
      localStorage.setItem(localKey, JSON.stringify(updated));

      if (saveProgressTimer) clearTimeout(saveProgressTimer);
      saveProgressTimer = setTimeout(() => {
        // saveProgressToServer(userId, updated, setCompletedSubtopics, course, standard);
        saveProgressToServer(userId, updated, setCompletedSubtopics, course, effectiveStandard);

      }, 500);

      return updated;
    });
  };



  const resetProgress = async (subjectName) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!storedUser?._id) return;

      const finalUserId = storedUser._id;
      const course = "JEE";
      const effectiveStandard =
        localStorage.getItem("currentClassJee") ||
        "11th"; // default fallback

      // 1️⃣ Backend DELETE
      const response = await fetch(
        `${API_BASE_URL}/api/progress/delete?userId=${finalUserId}&course=${course}&standard=${effectiveStandard}&subject=${encodeURIComponent(subjectName)}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        console.log(`🗑️ Backend progress deleted for ${finalUserId} ${course}_${effectiveStandard}`);

        // 2️⃣ Local cleanup
        const localKey = `completedSubtopics_${finalUserId}_${course}_${effectiveStandard}`;
        const completionKey = `subjectCompletion_${course}_${effectiveStandard}`;

        localStorage.removeItem(localKey);
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith(`${course}-completed-${finalUserId}-${effectiveStandard}-`)) {
            localStorage.removeItem(key);
          }
        });

        // 🧹 Normalize subjectCompletion (object → array)
        let savedCompletion = JSON.parse(localStorage.getItem(completionKey) || "[]");

        if (!Array.isArray(savedCompletion)) {
          console.warn("⚠️ subjectCompletion was not an array, converting:", savedCompletion);
          // Convert object form (like { JEE_11th_Physics: 100 }) into array form
          savedCompletion = Object.keys(savedCompletion).map((key) => {
            const parts = key.split("_");
            const subj = parts[parts.length - 1]; // last part = subject
            return { name: subj, progress: savedCompletion[key] || 0, certified: false };
          });
        }

        // ✅ Update or add the reset subject entry
        const updatedCompletion = savedCompletion.map((subj) =>
          subj.name === subjectName ? { ...subj, progress: 0, certified: false } : subj
        );

        if (!updatedCompletion.some((s) => s.name === subjectName)) {
          updatedCompletion.push({ name: subjectName, progress: 0, certified: false });
        }

        localStorage.setItem(completionKey, JSON.stringify(updatedCompletion));

        // 3️⃣ Update React state
        setCompletedSubtopics({});
        // Optional: if you have a subjectCompletion state, reset it too safely
        if (typeof setSubjectCompletion === "function") {
          setSubjectCompletion(updatedCompletion);
        }

        // 4️⃣ Dispatch global update
        window.dispatchEvent(new Event("storage"));
        console.log(`🧹 Cleared ${subjectName} progress for ${course}_${effectiveStandard}`);
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
            {/* <button className="back-subjects-btn" onClick={resetProgress}>
              Reset Progress
            </button> */}
            <button
              className="back-subjects-btn"
              onClick={() => resetProgress(subject)}
            >
              Reset Progress
            </button>

          </div>
        </div>
      )}

      <div className="explanation-container">
        {selectedSubtopic ? (
          selectedSubtopic.unitName.includes("Assessment") ? (
            <JeeQuiz
              topicTitle={fetchedUnits[expandedTopic]?.unitName}
              subtopicTitle={selectedSubtopic.unitName}
              test={selectedSubtopic.test || []}
              onBack={() => setShowTopics(true)}
              onMarkComplete={markSubtopicComplete}
            />
          ) : (
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
            />
          )
        ) : (
          <div className="no-explanation">
            {/* <h2>
              Welcome to {subject} - {standard}
            </h2> */}
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
