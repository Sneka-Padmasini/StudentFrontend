import React, { useState, useEffect, useRef, useCallback } from "react";
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

// 🔹 API helpers for saving & loading subject progress - UPDATED with course and standard
const saveSubjectCompletionToServer = async (userId, subjectCompletion, course, standard) => {
  try {
    await fetch(`${API_BASE_URL}/api/progress/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        subjectCompletion,
        course, // Add course identifier
        standard // Add standard identifier
      }),
    });
  } catch (err) {
    console.error("❌ Error saving subject progress:", err);
  }
};

const loadSubjectCompletionFromServer = async (userId, setSubjectCompletion, course, standard) => {
  try {
    // Ensure standard is always a single string, not an array
    const standardParam = Array.isArray(standard)
      ? encodeURIComponent(standard.join(","))
      : encodeURIComponent(standard);

    const res = await fetch(`${API_BASE_URL}/api/progress/${userId}?course=${encodeURIComponent(course)}&standard=${standardParam}`);
    const data = await res.json();

    if (data?.subjectCompletion) {
      setSubjectCompletion(data.subjectCompletion);
      localStorage.setItem(`subjectCompletion_${course}_${standardParam}`, JSON.stringify(data.subjectCompletion));
    }
  } catch (err) {
    console.error("❌ Error loading subject progress:", err);
  }
};


const Subjects = () => {
  const navigate = useNavigate();
  const [standard, setStandard] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [subjectCompletion, setSubjectCompletion] = useState(subjectList);
  const learningPathRef = useRef(null);
  const { login, logout } = useUser(); // Make sure logout is included

  useEffect(() => {
    console.log(JSON.parse(localStorage.getItem("currentUser")))
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    if (storedUser) {
      // ✅ Fix for standard fetching
      let stdData = storedUser.standards;

      // If standards is empty, try to extract from coursetype or courseName
      if ((!stdData || stdData.length === 0) && storedUser.coursetype) {
        if (storedUser.coursetype.includes("11")) stdData = ["11th"];
        else if (storedUser.coursetype.includes("12")) stdData = ["12th"];
      }

      // Handle string
      if (typeof stdData === "string") {
        setStandard(stdData);
        localStorage.setItem("currentClass", stdData);
      }
      // Handle array
      else if (Array.isArray(stdData)) {
        if (stdData.length === 1) {
          setStandard(stdData[0]);
          localStorage.setItem("currentClass", stdData[0]);
        } else {
          setStandard(stdData);
          const savedClass = localStorage.getItem("currentClass");
          if (savedClass) setSelectedClass(savedClass);
        }
      }

      console.log("🧠 Detected Standards:", stdData);
      console.log("📚 Final Standard State:", standard);

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

    // Get current course and standard
    const course = "NEET";
    const currentStandard = selectedClass || standard;

    const userId = storedUser?.id || storedUser?._id;
    if (userId) {
      loadSubjectCompletionFromServer(userId, setSubjectCompletion, course, currentStandard);
    } else {
      // Fallback only if backend data not found - use course-specific key
      const savedLocal = JSON.parse(localStorage.getItem(`subjectCompletion_${course}_${currentStandard}`) || "[]");
      if (savedLocal.length > 0) {
        setSubjectCompletion(savedLocal);
      } else {
        setSubjectCompletion(subjectList);
        localStorage.setItem(`subjectCompletion_${course}_${currentStandard}`, JSON.stringify(subjectList));
      }
      window.dispatchEvent(new Event("storage")); // force progress refresh
    }
  }, [selectedClass]);

  // 🔁 Listen for updates to localStorage (when user finishes a subject in NeetLearn)
  useEffect(() => {
    const handleStorageChange = () => {
      const course = "NEET";
      const currentStandard = selectedClass || standard;
      const updatedCompletion = JSON.parse(localStorage.getItem(`subjectCompletion_${course}_${currentStandard}`) || "[]");
      setSubjectCompletion(updatedCompletion);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [selectedClass]);

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
            localStorage.clear();
            logout();
            navigate("/login");
          }
        }
      }).catch(console.error)
  }, [login, logout, navigate])

  const calculateProgress = () => {
    // ✅ Convert object to array safely
    let data = subjectCompletion;

    if (!Array.isArray(data)) {
      data = Object.keys(data || {}).map((key) => ({
        name: key,
        certified:
          data[key] === 100 ||
          data[key] === true ||
          data[key] === "completed",
      }));
    }

    const completed = data.filter((s) => s.certified).length;
    return data.length === 0 ? 0 : (completed / data.length) * 100;
  };

  // ✅ Improved normalization with fuzzy matching
  const normalizedSubjects = subjectList.map((sub) => {
    // try exact match
    const exactValue = subjectCompletion?.[sub.name];
    // try partial match (for keys like "Introduction to Botany...")
    const partialKey = Object.keys(subjectCompletion || {}).find((key) =>
      key.toLowerCase().includes(sub.name.toLowerCase())
    );
    const partialValue = partialKey ? subjectCompletion[partialKey] : null;

    const progressValue = exactValue ?? partialValue;

    return {
      ...sub,
      certified:
        progressValue === 100 ||
        progressValue === true ||
        progressValue === "completed",
    };
  });

  const progressPercentage = calculateProgress();
  const safeProgress = isNaN(progressPercentage) ? 0 : progressPercentage;

  const handleSubjectCompletion = useCallback((subjectName) => {
    const updatedSubjects = subjectCompletion.map((subject) =>
      subject.name === subjectName ? { ...subject, certified: true } : subject
    );
    setSubjectCompletion(updatedSubjects);

    // Use course-specific localStorage key
    const course = "NEET";
    const currentStandard = selectedClass || standard;
    localStorage.setItem(`subjectCompletion_${course}_${currentStandard}`, JSON.stringify(updatedSubjects));

    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    if (storedUser?.id || storedUser?._id) {
      const userId = storedUser.id || storedUser._id;
      saveSubjectCompletionToServer(userId, updatedSubjects, course, currentStandard);
    }
  }, [subjectCompletion, selectedClass, standard]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    if (storedUser) {
      const userId = storedUser?.id || storedUser?._id;
      const course = "NEET";
      const currentStandard = selectedClass || standard;
      const completedSubtopics = JSON.parse(localStorage.getItem(`completedSubtopics_${userId}_${course}_${currentStandard}`) || "{}");

      if (
        completedSubtopics &&
        Object.keys(completedSubtopics["UNIT AND MEASURE"] || {}).length === 6
      ) {
        handleSubjectCompletion("Physics");
      }
    }
  }, [selectedClass, standard, handleSubjectCompletion]);

  const handleClassChange = (e) => {
    const selected = e.target.value;
    setSelectedClass(selected);
    localStorage.setItem("currentClass", selected);
  };

  return (
    <div className="subjects-page">
      <aside className="sidebar">
        <h2>NEET</h2>

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
                {progressPercentage === 100
                  ? "You've completed all subjects!"
                  : "Complete all mandatory subjects to earn your certificate"}
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
                      {subject.certified && <span className="certified-badge">Certified</span>}
                    </div>
                    <button
                      className="continue-btn"
                      onClick={() => {
                        console.log(localStorage.getItem("currentUser"))
                        if (!standard) {
                          console.log("jiii")
                          alert("please select a standard")
                          return
                        }
                        if (Array.isArray(standard) && !selectedClass) {
                          alert("Please select a class before proceeding");
                          return;
                        }
                        navigate("/NeetLearn", {
                          state: {
                            subject: subject.name,
                            selectedClass: Array.isArray(standard) ? selectedClass : standard,
                          },
                        })
                      }
                      }
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

      <PadmasiniChat subjectName="NEET" />
    </div>
  );
};

export default Subjects;