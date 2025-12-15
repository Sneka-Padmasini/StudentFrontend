import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PadmasiniChat from "../components/PadmasiniChat";
import "./NEET.css";
import physicsImg from "../assets/physics.jpg";
import chemistryImg from "../assets/chemistry.jpg";
import zoologyImg from "../assets/zoology.jpg";
import botanyImg from "../assets/botany.jpg";
import { useUser } from "../components/UserContext";
import { API_BASE_URL } from "../config";

const subjectList = [
  { name: "Physics", image: physicsImg, certified: false },
  { name: "Chemistry", image: chemistryImg, certified: false },
  { name: "Zoology", image: zoologyImg, certified: false },
  { name: "Botany", image: botanyImg, certified: false },
];

const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const extractQuestionsFromUnits = (units) => {
  let questions = [];
  if (!Array.isArray(units)) return questions;
  units.forEach((unit) => {
    if (unit.test && Array.isArray(unit.test)) {
      unit.test.forEach(t => {
        if (t.questionsList && Array.isArray(t.questionsList)) {
          questions = [...questions, ...t.questionsList];
        }
      });
    }
    if (unit.units && Array.isArray(unit.units)) {
      questions = [...questions, ...extractQuestionsFromUnits(unit.units)];
    }
  });
  return questions;
};

// Helper to fetch completion for BOTH 11th and 12th
const loadSubjectCompletionFromServer = async (userId, setSubjectCompletion, course) => {
  try {
    const stds = ["11th", "12th"];
    let combinedCompletion = {};

    // 1. Load from LocalStorage FIRST for immediate UI update
    const local11 = JSON.parse(localStorage.getItem(`subjectCompletion_${course}_11th`) || "{}");
    const local12 = JSON.parse(localStorage.getItem(`subjectCompletion_${course}_12th`) || "{}");
    combinedCompletion = { ...local11, ...local12 };

    // 2. Fetch from API and Merge
    for (const std of stds) {
      const res = await fetch(`${API_BASE_URL}/api/progress/${userId}?course=${encodeURIComponent(course)}&standard=${std}`);
      const data = await res.json();
      if (data?.subjectCompletion) {
        combinedCompletion = { ...combinedCompletion, ...data.subjectCompletion };
      }
    }
    setSubjectCompletion(combinedCompletion);
  } catch (err) {
    console.error("❌ Error loading subject progress:", err);
  }
};

const Subjects = () => {
  const navigate = useNavigate();
  const [standard, setStandard] = useState("");
  const [subjectCompletion, setSubjectCompletion] = useState({});
  const learningPathRef = useRef(null);
  const { login, logout } = useUser();
  const [loadingMock, setLoadingMock] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    if (storedUser) {
      let stdData = storedUser.standards;
      if ((!stdData || stdData.length === 0) && storedUser.coursetype) {
        if (storedUser.coursetype.includes("11")) stdData = ["11th"];
        else if (storedUser.coursetype.includes("12")) stdData = ["12th"];
      }
      if (stdData) setStandard(stdData);
    }
  }, []);

  // Load Progress on Mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    const userId = storedUser?.id || storedUser?._id;
    const course = "NEET";

    if (userId) {
      loadSubjectCompletionFromServer(userId, setSubjectCompletion, course);
    } else {
      // Fallback for guest or if user ID not ready
      const local11 = JSON.parse(localStorage.getItem(`subjectCompletion_${course}_11th`) || "{}");
      const local12 = JSON.parse(localStorage.getItem(`subjectCompletion_${course}_12th`) || "{}");
      setSubjectCompletion({ ...local11, ...local12 });
    }
  }, []);

  // Listen for storage updates (Instant update when coming back from NeetLearn)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = JSON.parse(localStorage.getItem("currentUser"));
      const userId = storedUser?.id || storedUser?._id;
      if (userId) {
        loadSubjectCompletionFromServer(userId, setSubjectCompletion, "NEET");
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/checkSession`, {
      method: "GET",
      credentials: 'include'
    }).then(resp => resp.json())
      .then(data => {
        if (data.loggedIn === true) {
          login(data.user)
          localStorage.setItem('currentUser', JSON.stringify(data.user));
        }
        if (data.loggedIn === false) {
          const existingUser = localStorage.getItem('currentUser')
          if (existingUser) {
            localStorage.clear();
            logout();
            navigate("/login");
          }
        }
      }).catch(console.error)
  }, [login, logout, navigate])

  // ✅ FIX: Calculate Progress based on 8 parts (4 subjects * 2 standards)
  const calculateProgress = () => {
    let completedCount = 0;
    const course = "NEET";

    subjectList.forEach(sub => {
      // Construct Keys
      const key11 = `${course}_11th_${sub.name}`;
      const key12 = `${course}_12th_${sub.name}`;

      // Check 11th
      const val11 = subjectCompletion?.[key11];
      if (val11 === 100 || val11 === true || val11 === "completed") {
        completedCount++;
      }

      // Check 12th
      const val12 = subjectCompletion?.[key12];
      if (val12 === 100 || val12 === true || val12 === "completed") {
        completedCount++;
      }
    });

    // Total possible completions = 4 subjects * 2 standards = 8
    const totalMilestones = subjectList.length * 2;
    return (completedCount / totalMilestones) * 100;
  };

  // ✅ Normalize subjects to check if BOTH 11th & 12th are done for certification badge
  const normalizedSubjects = subjectList.map((sub) => {
    const course = "NEET";
    const key11 = `${course}_11th_${sub.name}`;
    const key12 = `${course}_12th_${sub.name}`;

    const is11Completed = subjectCompletion?.[key11] === 100 || subjectCompletion?.[key11] === true || subjectCompletion?.[key11] === "completed";
    const is12Completed = subjectCompletion?.[key12] === 100 || subjectCompletion?.[key12] === true || subjectCompletion?.[key12] === "completed";

    return {
      ...sub,
      certified: is11Completed && is12Completed, // Badge only if BOTH are done
    };
  });

  const progressPercentage = calculateProgress();
  const safeProgress = isNaN(progressPercentage) ? 0 : progressPercentage;

  const handleScrollToLearningPath = () => {
    if (learningPathRef.current) {
      learningPathRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleStartMockTest = async () => {
    setLoadingMock(true);
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    let courseName = "professional";
    if (currentUser?.coursetype && currentUser.coursetype.toLowerCase().includes("school")) {
      courseName = "local";
    }

    const standardsToFetch = ["11", "12"];
    const subjectConfig = [
      { name: "Physics", count: 45 },
      { name: "Chemistry", count: 45 },
      { name: "Botany", count: 45 },
      { name: "Zoology", count: 45 }
    ];

    let finalExamQuestions = [];

    try {
      const subjectPromises = subjectConfig.map(async (sub) => {
        let subjectPool = [];
        const stdPromises = standardsToFetch.map(stdNum =>
          fetch(`${API_BASE_URL}/api/getAllUnits/${courseName}/${sub.name}/${stdNum}`, { credentials: "include" })
            .then(res => res.json())
            .then(data => (Array.isArray(data) ? data : []))
        );
        const stdResults = await Promise.all(stdPromises);
        stdResults.forEach(data => {
          subjectPool = [...subjectPool, ...extractQuestionsFromUnits(data)];
        });
        const shuffledPool = shuffleArray([...subjectPool]);
        return shuffledPool.slice(0, sub.count);
      });

      const results = await Promise.all(subjectPromises);
      results.forEach(questions => {
        finalExamQuestions = [...finalExamQuestions, ...questions];
      });

      const mixedQuestions = shuffleArray(finalExamQuestions);

      if (mixedQuestions.length === 0) {
        alert("No questions found.");
        setLoadingMock(false);
        return;
      }

      navigate("/NeetLearn", {
        state: {
          isMock: true,
          mockData: mixedQuestions,
          subject: "Full Cumulative Mock Test",
          selectedClass: "Both"
        },
      });

    } catch (error) {
      console.error("Mock Test Generation Error:", error);
      alert("Failed to generate test. Check connection.");
    } finally {
      setLoadingMock(false);
    }
  };

  return (
    <div className="subjects-page">
      <aside className="sidebar">
        <h2>NEET</h2>
        <p><strong>Course:</strong> Full Syllabus (11th & 12th)</p>
        <span className="badge certified">Certified</span>
        <span className="badge limited">Limited Access Only</span>
      </aside>

      <main className="content">
        <section className="progress-section">
          <h3>My Completion Progress</h3>
          <div className="progress-header">
            <div className="progress-info">
              {/* Show how many full subjects (11+12) are certified */}
              <p>{normalizedSubjects.filter((s) => s.certified).length} of {normalizedSubjects.length} subjects fully completed</p>

              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${safeProgress}%`,
                    backgroundColor:
                      safeProgress === 100
                        ? "#4CAF50"
                        : safeProgress > 50
                          ? "#FFEB3B"
                          : "#B0BEC5",
                  }}
                  title={`Completed: ${Math.round(safeProgress)}%`}
                >
                  <div className="progress-filled">
                    <span className="progress-percentage">{Math.round(safeProgress)}%</span>
                  </div>
                </div>
              </div>

              <p className="subtext">
                {progressPercentage === 100
                  ? "You've completed all subjects!"
                  : "Complete 11th & 12th for all subjects to earn your certificate"}
              </p>
            </div>

            <div className="certificate-box">
              <button
                className={`certificate-btn ${progressPercentage === 100 ? "btn-completed" : "btn-continue"}`}
                onClick={handleScrollToLearningPath}
              >
                {progressPercentage === 100 ? "Download Certificate" : "Continue Learning"}
              </button>
            </div>
          </div>
        </section>

        <section className="learning-path" ref={learningPathRef}>
          <h3>Learning Path</h3>
          <div className="timeline">
            {normalizedSubjects.map((subject, index) => (
              <div key={subject.name} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className={`subject-card subject-card-${index}`}>
                    <img src={subject.image} alt={subject.name} className="subject-thumbnail" />
                    <div className="neet-subject-info">
                      <span className="course-number">Course {index + 1}</span>
                      <h4 className="subject-title">{subject.name}</h4>
                      {/* Certified Badge only shows if BOTH 11 and 12 are complete */}
                      {subject.certified && <span className="certified-badge">Certified</span>}
                    </div>
                    <button
                      className="continue-btn"
                      onClick={() => {
                        navigate("/NeetLearn", {
                          state: {
                            subject: subject.name,
                            selectedClass: "Both",
                          },
                        })
                      }}
                    >
                      {subject.certified ? "Study Again" : "Start Learning"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mock-test-section" style={{ marginTop: "30px", marginBottom: "50px", padding: "25px", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", borderLeft: "5px solid #006400" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
            <div className="mock-text-content">
              <h3 style={{ margin: "0 0 8px 0", color: "#2c3e50", fontSize: "1.5rem" }}>Full Syllabus Mock Test</h3>
              <p style={{ margin: "0 0 10px 0", color: "#555" }}>
                Take a comprehensive exam combining Physics, Chemistry, Botany, and Zoology from Class 11 and 12.
              </p>
              <div style={{ display: "flex", gap: "15px", fontSize: "0.9rem", color: "#666", fontWeight: "500" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>⏱️ 180 Mins</span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>📝 180 Questions</span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>🏆 720 Marks</span>
              </div>
            </div>
            <button
              onClick={handleStartMockTest}
              disabled={loadingMock}
              style={{
                backgroundColor: loadingMock ? "#9ca3af" : "#006400",
                color: "white",
                padding: "12px 28px",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: loadingMock ? "not-allowed" : "pointer",
                boxShadow: "0 4px 6px rgba(0, 100, 0, 0.2)",
              }}
            >
              {loadingMock ? "Preparing..." : "Start Full Mock Test"}
            </button>
          </div>
        </section>
      </main>

      <PadmasiniChat subjectName="NEET" />
    </div>
  );
};

export default Subjects;