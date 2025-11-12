import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PadmasiniChat from "../components/PadmasiniChat";
import "./JEE.css";
import physicsImg from "../assets/physics.jpg";
import chemistryImg from "../assets/chemistry.jpg";
import mathsImg from "../assets/maths.png";
import { useUser } from "../components/UserContext";
import { API_BASE_URL } from "../config";

const subjectList = [
  { name: "Physics", image: physicsImg, certified: false },
  { name: "Chemistry", image: chemistryImg, certified: false },
  { name: "Maths", image: mathsImg, certified: false },
];

// 🔹 API helpers for saving & loading subject progress
// const saveSubjectCompletionToServer = async (userId, subjectCompletion, course, standard) => {
//   try {
//     await fetch(`${API_BASE_URL}/api/progress/save`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         userId,
//         subjectCompletion,
//         course,
//         standard
//       }),
//     });
//   } catch (err) {
//     console.error("❌ Error saving subject progress:", err);
//   }
// };

// const loadSubjectCompletionFromServer = async (userId, setSubjectCompletion) => {
const loadSubjectCompletionFromServer = async (userId, setSubjectCompletion, course, standard) => {
  const standardParam = Array.isArray(standard)
    ? encodeURIComponent(standard.join(","))
    : encodeURIComponent(standard);
  try {
    // const res = await fetch(`${API_BASE_URL}/api/progress/${userId}`);
    const res = await fetch(`${API_BASE_URL}/api/progress/${userId}?course=${encodeURIComponent(course)}&standard=${standardParam}`);
    const data = await res.json();
    if (data?.subjectCompletion) {
      setSubjectCompletion(data.subjectCompletion);
      // localStorage.setItem("jeeSubjectCompletion", JSON.stringify(data.subjectCompletion));
      localStorage.setItem(`subjectCompletion_${course}_${standardParam}`, JSON.stringify(data.subjectCompletion));

    }
  } catch (err) {
    console.error("❌ Error loading subject progress:", err);
  }
};

const Jee = () => {
  const navigate = useNavigate();
  const [standard, setStandard] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // const [subjectCompletion, setSubjectCompletion] = useState(subjectList);
  const [subjectCompletion, setSubjectCompletion] = useState({});
  const learningPathRef = useRef(null);
  const { login, logout } = useUser();

  // JEE.jsx (REPLACE OLD useEffect WITH THESE TWO)

  // ✅ FIX: This useEffect ONLY sets up the standard and dates
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    if (storedUser) {
      let stdData = storedUser.standards;

      if ((!stdData || stdData.length === 0) && storedUser.coursetype) {
        if (storedUser.coursetype.includes("11")) stdData = ["11th"];
        else if (storedUser.coursetype.includes("12")) stdData = ["12th"];
      }

      let currentClass = localStorage.getItem("currentClassJee"); // Use Jee key

      if (typeof stdData === "string") {
        setStandard(stdData);
        if (!currentClass) {
          localStorage.setItem("currentClassJee", stdData); // Use Jee key
          currentClass = stdData;
        }
      } else if (Array.isArray(stdData)) {
        setStandard(stdData);
        if (stdData.length === 1) {
          if (!currentClass) {
            localStorage.setItem("currentClassJee", stdData[0]); // Use Jee key
            currentClass = stdData[0];
          }
        }
      }

      if (currentClass) {
        setSelectedClass(currentClass);
      }

      console.log("🧠 Detected Standards:", stdData);
      console.log("📚 Initial Selected Class:", currentClass);

      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      };

      if (storedUser.startDate) setStartDate(formatDate(storedUser.startDate));
      if (storedUser.endDate) setEndDate(formatDate(storedUser.endDate));
    }
  }, []); // ✅ FIX: Run only ONCE on mount


  // ✅ FIX: NEW useEffect to load progress when user/standard/class changes
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    const userId = storedUser?.id || storedUser?._id;
    const course = "JEE"; // Use JEE course

    const currentStandard = selectedClass;

    if (!currentStandard) {
      console.log("📚 No class selected, clearing progress.");
      setSubjectCompletion({});
      return;
    }

    console.log("📚 Loading progress for standard:", currentStandard);

    if (userId) {
      loadSubjectCompletionFromServer(userId, setSubjectCompletion, course, currentStandard);
    } else {
      const savedLocal = JSON.parse(localStorage.getItem(`subjectCompletion_${course}_${currentStandard}`) || "{}"); // Default to {}
      setSubjectCompletion(savedLocal);
      window.dispatchEvent(new Event("storage"));
    }

  }, [selectedClass]); // Run when selectedClass changes


  useEffect(() => {
    const handleStorageChange = () => {
      const course = "JEE";
      const currentStandard = selectedClass || standard;

      const updatedCompletion = JSON.parse(localStorage.getItem(`subjectCompletion_${course}_${currentStandard}`) || "{}"); // ✅ FIX: Default to {}

      console.log("Storage change detected, updating subjectCompletion:", updatedCompletion);
      setSubjectCompletion(updatedCompletion);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [selectedClass, standard]); // ✅ FIX: Add dependencies

  const handleScrollToLearningPath = () => {
    if (learningPathRef.current) {
      learningPathRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/checkSession`, {
      method: "GET",
      credentials: 'include'
    }).then(resp => resp.json())
      .then(data => {
        console.log(data)
        if (data.loggedIn === true) {
          login(data.user)
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          console.log(localStorage.getItem('currentUser'))
        }
        if (data.loggedIn === false) {
          console.log('it came here before seeing user')
          const existingUser = localStorage.getItem('currentUser')
          if (existingUser) {
            console.log('it came here and deleted the user')
            localStorage.clear(); // Clear all local storage
            logout();
            navigate("/login");
          }
        }
      }).catch(console.error)
  }, [])


  const calculateProgress = () => {
    // ✅ FIX: This function now calculates progress based on the
    // 'normalizedSubjects' array, which is the true source of what the user sees.
    const totalSubjects = normalizedSubjects.length;
    if (totalSubjects === 0) return 0;

    const completedSubjects = normalizedSubjects.filter((s) => s.certified).length;

    return (completedSubjects / totalSubjects) * 100;
  };

  // ✅ Improved normalization using exact keys
  const normalizedSubjects = subjectList.map((sub) => {
    const course = "JEE";
    // Get the standard that is *currently* selected
    const currentStandard = selectedClass || (Array.isArray(standard) ? "" : standard);

    // Build the exact key to look for, e.g., "JEE_11th_Physics"
    const subjectKey = `${course}_${currentStandard}_${sub.name}`;

    // Get the value (0 or 100) from the state
    const progressValue = subjectCompletion?.[subjectKey];

    return {
      ...sub, // This keeps the name: "Physics", image: ...
      certified:
        progressValue === 100 ||
        progressValue === true ||
        progressValue === "completed",
    };
  });

  const progressPercentage = calculateProgress();
  const safeProgress = isNaN(progressPercentage) ? 0 : progressPercentage;



  const handleClassChange = (e) => {
    const selected = e.target.value;
    setSelectedClass(selected);
    localStorage.setItem("currentClassJee", selected);
  };

  return (
    <div className="subjects-page">
      <aside className="sidebar">
        <h2>JEE</h2>

        {standard && (
          <p>
            <strong>Standard:</strong>{" "}
            {Array.isArray(standard) ? (
              <select value={selectedClass} onChange={handleClassChange}>
                <option value="">Select Class</option>
                {standard.map((std, idx) => (
                  <option key={idx} value={std}>
                    {std === "11th" ? "Class 11" : std === "12th" ? "Class 12" : std}
                  </option>
                ))}
              </select>
            ) : (
              <span>
                {standard === "11th"
                  ? "Class 11"
                  : standard === "12th"
                    ? "Class 12"
                    : standard}
              </span>
            )}
          </p>
        )}

        <span className="badge certified">Certified</span>
        <span className="badge limited">Limited Access Only</span>

        {startDate && endDate && (
          <div className="cohort-details">
            <h4>Your Batch</h4>
            <p><strong>Start Date:</strong> {startDate}</p>
            <p><strong>End Date:</strong> {endDate}</p>
          </div>
        )}
      </aside>

      <main className="content">
        <section className="progress-section">
          <h3>My Completion Progress</h3>
          <div className="progress-header">
            <div className="progress-info">
              <p>{normalizedSubjects.filter((s) => s.certified).length} of {normalizedSubjects.length} subjects completed</p>

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
                {safeProgress === 100
                  ? "You've completed all subjects!"
                  : "Complete all mandatory subjects to earn your certificate"}
              </p>
            </div>

            <div className="certificate-box">
              <button
                className={`certificate-btn ${safeProgress === 100 ? "btn-completed" : "btn-continue"}`}
                onClick={handleScrollToLearningPath}
              >
                {safeProgress === 100 ? "Download Certificate" : "Continue Learning"}
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
                    <img
                      src={subject.image}
                      alt={subject.name}
                      className="subject-thumbnail"
                    />
                    <div className="jee-subject-info">
                      <span className="course-number">Course {index + 1}</span>
                      <h4 className="subject-title">{subject.name}</h4>
                      {subject.certified && (
                        <span className="certified-badge">Certified</span>
                      )}
                    </div>
                    <button
                      className="continue-btn"
                      onClick={() => {
                        console.log(localStorage.getItem("currentUser"))
                        if (!standard) {
                          alert("Please select a standard");
                          return;
                        }
                        if (Array.isArray(standard) && !selectedClass) {
                          alert("Please select a class before proceeding");
                          return;
                        }
                        navigate("/JeeLearn", {
                          state: {
                            subject: subject.name,
                            selectedClass: Array.isArray(standard)
                              ? selectedClass
                              : standard,
                          },
                        });
                      }}
                      disabled={standard === "both" && !selectedClass}
                    >
                      {subject.certified ? "Review" : "Learn More"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PadmasiniChat subjectName="JEE" />
    </div>
  );
};

export default Jee;