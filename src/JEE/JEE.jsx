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

const Jee = () => {
  const navigate = useNavigate();
  const [standard, setStandard] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [subjectCompletion, setSubjectCompletion] = useState(subjectList);
  const learningPathRef = useRef(null);
  const { login } = useUser();

  // ✅ Session check
  useEffect(() => {
    fetch(`${API_BASE_URL}/checkSession`, {
      method: "GET",
      credentials: "include",
    })
      .then((resp) => resp.json())
      .then((data) => {
        if (data.loggedIn === true) {
          login(data.user);
          localStorage.setItem("currentUser", JSON.stringify(data.user));
        } else if (data.loggedIn === false) {
          const existingUser = localStorage.getItem("currentUser");
          if (existingUser) {
            localStorage.clear();
            navigate("/login");
          }
        }
      })
      .catch(console.error);
  }, []);

  // ✅ Handle user standards (like NEET)
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    if (storedUser) {
      let stdData = storedUser.standards;

      // If no standards, try fallback from coursetype
      if ((!stdData || stdData.length === 0) && storedUser.coursetype) {
        if (storedUser.coursetype.includes("11")) stdData = ["11th"];
        else if (storedUser.coursetype.includes("12")) stdData = ["12th"];
      }

      // Handle single vs multiple classes
      if (typeof stdData === "string") {
        setStandard(stdData);
        localStorage.setItem("currentClassJee", stdData);
      } else if (Array.isArray(stdData)) {
        if (stdData.length === 1) {
          setStandard(stdData[0]);
          localStorage.setItem("currentClassJee", stdData[0]);
        } else {
          setStandard(stdData);
          const savedClass = localStorage.getItem("currentClassJee");
          if (savedClass) setSelectedClass(savedClass);
        }
      }

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

    // const savedCompletion = JSON.parse(localStorage.getItem("jeeSubjectCompletion"));
    // if (savedCompletion) {
    //   setSubjectCompletion(savedCompletion);
    // }

    const savedCompletion = JSON.parse(localStorage.getItem("jeeSubjectCompletion") || "[]");

    if (savedCompletion.length > 0) {
      // Merge with the default subject list to ensure all subjects appear
      const mergedSubjects = subjectList.map(sub => {
        const existing = savedCompletion.find(s => s.name === sub.name);
        return existing ? { ...sub, ...existing } : sub;
      });
      setSubjectCompletion(mergedSubjects);
    } else {
      // If nothing saved yet, initialize and store default list
      localStorage.setItem("jeeSubjectCompletion", JSON.stringify(subjectList));
      setSubjectCompletion(subjectList);
    }


  }, []);

  // Listen for updates to jeeSubjectCompletion (written by JeeLearn)
  useEffect(() => {
    const handleStorageChange = () => {
      const updated = JSON.parse(localStorage.getItem("jeeSubjectCompletion") || "[]");
      // Merge with default list so missing fields/images don't break UI
      const merged = subjectList.map(sub => {
        const existing = updated.find(s => s.name === sub.name);
        return existing ? { ...sub, ...existing } : sub;
      });
      setSubjectCompletion(merged);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);


  const handleClassChange = (e) => {
    const selected = e.target.value;
    setSelectedClass(selected);
    localStorage.setItem("currentClassJee", selected);
  };

  const handleScrollToLearningPath = () => {
    if (learningPathRef.current) {
      learningPathRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const calculateProgress = () => {
    const completedSubjects = subjectCompletion.filter((s) => s.certified).length;
    return (completedSubjects / subjectCompletion.length) * 100;
  };

  const progressPercentage = calculateProgress();
  const safeProgress = isNaN(progressPercentage) ? 0 : progressPercentage;

  const handleSubjectCompletion = (subjectName) => {
    const updatedSubjects = subjectCompletion.map((subject) =>
      subject.name === subjectName ? { ...subject, certified: true } : subject
    );
    setSubjectCompletion(updatedSubjects);
    localStorage.setItem("jeeSubjectCompletion", JSON.stringify(updatedSubjects));
  };

  useEffect(() => {
    const completedSubtopics = JSON.parse(localStorage.getItem("jeeCompletedSubtopics"));
    if (
      completedSubtopics &&
      Object.keys(completedSubtopics["UNIT AND MEASURE"] || {}).length === 6
    ) {
      handleSubjectCompletion("Physics");
    }
  }, []);

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
            <p>
              <strong>Start Date:</strong> {startDate}
            </p>
            <p>
              <strong>End Date:</strong> {endDate}
            </p>
          </div>
        )}
      </aside>

      <main className="content">
        <section className="progress-section">
          <h3>My Completion Progress</h3>
          <div className="progress-header">
            <div className="progress-info">
              <p>
                {subjectCompletion.filter((s) => s.certified).length} of{" "}
                {subjectCompletion.length} subjects completed
              </p>

              {/* <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${progressPercentage}%`,
                    backgroundColor:
                      progressPercentage === 100
                        ? "#4CAF50"
                        : progressPercentage > 50
                          ? "#FFEB3B"
                          : "#B0BEC5",
                  }}
                  title={`Completed: ${Math.round(progressPercentage)}%`}
                >
                  <div className="progress-filled">
                    <span className="progress-percentage">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                </div>
              </div> */}

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
                    <span className="progress-percentage">
                      {Math.round(safeProgress)}%
                    </span>
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
                className={`certificate-btn ${safeProgress === 100 ? "btn-completed" : "btn-continue"
                  }`}
                onClick={handleScrollToLearningPath}
              >
                {safeProgress === 100
                  ? "Download Certificate"
                  : "Continue Learning"}
              </button>
            </div>
          </div>
        </section>

        <section className="learning-path" ref={learningPathRef}>
          <h3>Learning Path</h3>
          <div className="timeline">
            {subjectCompletion.map((subject, index) => (
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