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
import StudyGoalModal from "../components/StudyGoalModal";

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
  // const [standard, setStandard] = useState("");
  const [standard, setStandard] = useState([]);
  const [subjectCompletion, setSubjectCompletion] = useState({});
  const learningPathRef = useRef(null);
  const { login, logout } = useUser();
  const [loadingMock, setLoadingMock] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSessionChecking, setIsSessionChecking] = useState(true);


  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    if (storedUser) {
      setCurrentUser(storedUser);
      // Prioritize selectedStandard, then standards, then coursetype
      let stdData = storedUser.selectedStandard || storedUser.standards;

      if ((!stdData || stdData.length === 0) && storedUser.coursetype) {
        if (storedUser.coursetype.includes("11")) stdData = ["11th"];
        else if (storedUser.coursetype.includes("12")) stdData = ["12th"];
      }

      // Force it into an array format if it's a single string
      if (stdData) setStandard(Array.isArray(stdData) ? stdData : [stdData]);
    }
  }, []);

  // ✅ HELPER: Determines if we should show "11th", "12th", or "11th & 12th"
  const getDisplayStandardText = () => {
    const has11 = standard.includes("11th");
    const has12 = standard.includes("12th");

    if (has11 && has12) return "11th & 12th";
    if (has11) return "11th";
    if (has12) return "12th";
    return "11th & 12th"; // Default fallback
  };

  const displayStandardText = getDisplayStandardText();

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
    // 1. Fetch from the correct API endpoint
    fetch(`${API_BASE_URL}/api/checkSession`, {
      method: "GET",
      credentials: 'include'
    })
      .then(resp => {
        if (!resp.ok) {
          throw new Error("Session check failed");
        }
        return resp.json();
      })
      .then(data => {
        // 2. Check for success 
        if (data.status === "pass" || data.loggedIn === true) {
          const userData = data;
          console.log("Session User Data:", userData);

          // 3. Update State (This triggered the loop before)
          login(userData);
          localStorage.setItem('currentUser', JSON.stringify(userData));
          setCurrentUser(userData);

          // Standards Logic
          let stdData = userData.selectedStandard || userData.standards;
          if ((!stdData || stdData.length === 0) && userData.coursetype) {
            if (userData.coursetype.includes("11")) stdData = ["11th"];
            else if (userData.coursetype.includes("12")) stdData = ["12th"];
          }
          if (stdData) setStandard(Array.isArray(stdData) ? stdData : [stdData]);

          // Progress Logic
          const userId = userData.id || userData._id || userData.userId;
          if (userId) {
            loadSubjectCompletionFromServer(userId, setSubjectCompletion, "NEET");
          }

        } else {
          // Session invalid
          localStorage.clear();
          logout();
          navigate("/login");
        }
      })
      .catch(err => {
        console.error("Session Check Error:", err);
      })
      .finally(() => {
        // ✅ CRITICAL FIX: Stop loading once the server response is handled
        setIsSessionChecking(false);
      });
  }, []);

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



  const normalizedSubjects = subjectList.map((sub) => {
    return sub;
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

  const handleGoalUpdate = (newHours) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, comfortableDailyHours: newHours };
      setCurrentUser(updatedUser);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    }
  };

  return (
    <div className="subjects-page">
      {/* 
      {currentUser && (
        <StudyGoalModal user={currentUser} onUpdate={handleGoalUpdate} />
      )} */}

      {currentUser && !isSessionChecking && (
        <StudyGoalModal user={currentUser} onUpdate={handleGoalUpdate} />
      )}

      <aside className="sidebar">
        <h2>NEET</h2>
        <p><strong>Course:</strong> Full Syllabus ({displayStandardText})</p>
        <span className="badge certified">Certified</span>
        <span className="badge limited">Limited Access Only</span>
      </aside>

      <main className="content">
        <section className="progress-section">
          <h3>My Completion Progress</h3>
          <div className="progress-header">
            <div className="progress-info">
              <p>{normalizedSubjects.filter((s) => s.certified).length} of {normalizedSubjects.length} subjects fully completed</p>


              <div className="progress-bar-container">
                {/* The Track (Background Rail) */}
                <div
                  className="progress-bar"
                  title={`Completed: ${Math.round(safeProgress)}%`}
                >
                  {/* The Moving Fill */}
                  <div
                    className="progress-filled"
                    style={{
                      width: `${safeProgress}%`,
                      // Theme Logic: Dark Green normally, Bright Green if 100%
                      backgroundColor: safeProgress === 100 ? "#08c534" : "#006400",
                    }}
                  ></div>
                </div>

                {/* Text is outside to prevent overlap */}
                <span className="progress-percentage">{Math.round(safeProgress)}%</span>
              </div>

              <p className="subtext">
                {progressPercentage === 100
                  ? "You've completed all subjects!"
                  : `Complete the ${displayStandardText} syllabus to earn your certificate`}
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

          <div className="subjects-row">
            {normalizedSubjects.map((subject, index) => (
              <div key={subject.name} className={`subject-card subject-card-${index}`}>
                <img src={subject.image} alt={subject.name} className="subject-thumbnail" loading="eager" />

                <h4 className="subject-title">{subject.name}</h4>

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
                  Start Learning
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="mock-test-section" style={{ marginTop: "30px", marginBottom: "50px", padding: "25px", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", borderLeft: "5px solid #006400" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
            <div className="mock-text-content">
              <h3 style={{ margin: "0 0 8px 0", color: "#2c3e50", fontSize: "1.5rem" }}>Full Syllabus Mock Test</h3>
              <p style={{ margin: "0 0 10px 0", color: "#555" }}>
                Take a comprehensive exam combining Physics, Chemistry, Botany, and Zoology from Class {displayStandardText}.
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