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
const saveSubjectCompletionToServer = async (userId, subjectCompletion, course, standard) => {
  try {
    await fetch(`${API_BASE_URL}/api/progress/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        subjectCompletion,
        course,
        standard
      }),
    });
  } catch (err) {
    console.error("❌ Error saving subject progress:", err);
  }
};

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
  const [subjectCompletion, setSubjectCompletion] = useState(subjectList);
  const learningPathRef = useRef(null);
  const { login, logout } = useUser();

  // useEffect(() => {
  //   const storedUser = JSON.parse(localStorage.getItem("currentUser"));
  //   if (storedUser) {
  //     let stdData = storedUser.standards;

  //     // If standards is empty, try to extract from coursetype or courseName
  //     if ((!stdData || stdData.length === 0) && storedUser.coursetype) {
  //       if (storedUser.coursetype.includes("11")) stdData = ["11th"];
  //       else if (storedUser.coursetype.includes("12")) stdData = ["12th"];
  //     }

  //     // Handle string
  //     if (typeof stdData === "string") {
  //       setStandard(stdData);
  //       localStorage.setItem("currentClassJee", stdData);
  //     }
  //     // Handle array
  //     else if (Array.isArray(stdData)) {
  //       if (stdData.length === 1) {
  //         setStandard(stdData[0]);
  //         localStorage.setItem("currentClassJee", stdData[0]);
  //       } else {
  //         setStandard(stdData);
  //         const savedClass = localStorage.getItem("currentClassJee");
  //         if (savedClass) setSelectedClass(savedClass);
  //       }
  //     }

  //     console.log("🧠 Detected Standards:", stdData);
  //     console.log("📚 Final Standard State:", standard);

  //     const formatDate = (dateStr) => {
  //       const date = new Date(dateStr);
  //       return date.toLocaleDateString("en-GB", {
  //         day: "2-digit",
  //         month: "short",
  //         year: "numeric",
  //       });
  //     };

  //     if (storedUser.startDate) setStartDate(formatDate(storedUser.startDate));
  //     if (storedUser.endDate) setEndDate(formatDate(storedUser.endDate));
  //   }

  //   const userId = storedUser?.id || storedUser?._id;
  //   if (userId) {
  //     const course = "JEE";
  //     const currentStandard = selectedClass || standard;
  //     loadSubjectCompletionFromServer(userId, setSubjectCompletion, course, currentStandard);
  //   } else {
  //     // Fallback only if backend data not found
  //     const savedLocal = JSON.parse(localStorage.getItem(`subjectCompletion_${course}_${currentStandard}`) || "[]");
  //     if (savedLocal.length > 0) {
  //       setSubjectCompletion(savedLocal);
  //     } else {
  //       setSubjectCompletion(subjectList);
  //       // localStorage.setItem("jeeSubjectCompletion", JSON.stringify(subjectList));
  //       localStorage.setItem(`subjectCompletion_${course}_${currentStandard}`, JSON.stringify(subjectList));
  //     }
  //     window.dispatchEvent(new Event("storage")); // force progress refresh
  //   }
  // }, []);

  // useEffect(() => {
  //   const storedUser = JSON.parse(localStorage.getItem("currentUser"));
  //   const course = "JEE"; // ✅ move these two to the top
  //   const currentStandard = selectedClass || standard;

  //   if (storedUser) {
  //     let stdData = storedUser.standards;
  //     if ((!stdData || stdData.length === 0) && storedUser.coursetype) {
  //       if (storedUser.coursetype.includes("11")) stdData = ["11th"];
  //       else if (storedUser.coursetype.includes("12")) stdData = ["12th"];
  //     }

  //     if (typeof stdData === "string") {
  //       setStandard(stdData);
  //       localStorage.setItem("currentClassJee", stdData);
  //     } else if (Array.isArray(stdData)) {
  //       if (stdData.length === 1) {
  //         setStandard(stdData[0]);
  //         localStorage.setItem("currentClassJee", stdData[0]);
  //       } else {
  //         setStandard(stdData);
  //         const savedClass = localStorage.getItem("currentClassJee");
  //         if (savedClass) setSelectedClass(savedClass);
  //       }
  //     }

  //     console.log("🧠 Detected Standards:", stdData);
  //     console.log("📚 Final Standard State:", standard);

  //     const formatDate = (dateStr) => {
  //       const date = new Date(dateStr);
  //       return date.toLocaleDateString("en-GB", {
  //         day: "2-digit",
  //         month: "short",
  //         year: "numeric",
  //       });
  //     };

  //     if (storedUser.startDate) setStartDate(formatDate(storedUser.startDate));
  //     if (storedUser.endDate) setEndDate(formatDate(storedUser.endDate));
  //   }

  //   // ✅ Safe to use here
  //   const userId = storedUser?.id || storedUser?._id;
  //   if (userId) {
  //     // ✅ Use selectedClass if available, else fallback to single string standard
  //     const activeStandard = Array.isArray(standard)
  //       ? selectedClass || standard[0] // use one at a time, not full array
  //       : standard;

  //     loadSubjectCompletionFromServer(userId, setSubjectCompletion, course, activeStandard);
  //   } else {
  //     const activeStandard = Array.isArray(standard)
  //       ? selectedClass || standard[0]
  //       : standard;

  //     const savedLocal = JSON.parse(
  //       localStorage.getItem(`subjectCompletion_${course}_${activeStandard}`) || "[]"
  //     );
  //     if (savedLocal.length > 0) {
  //       setSubjectCompletion(savedLocal);
  //     } else {
  //       setSubjectCompletion(subjectList);
  //       localStorage.setItem(
  //         `subjectCompletion_${course}_${activeStandard}`,
  //         JSON.stringify(subjectList)
  //       );
  //     }
  //     window.dispatchEvent(new Event("storage"));
  //   }

  // }, [selectedClass, standard]); // ✅ add dependencies

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    const course = "JEE";

    if (!storedUser) return;

    let stdData = storedUser.standards;
    if ((!stdData || stdData.length === 0) && storedUser.coursetype) {
      if (storedUser.coursetype.includes("11")) stdData = ["11th"];
      else if (storedUser.coursetype.includes("12")) stdData = ["12th"];
    }

    // 🔹 Save detected standards
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

    console.log("🧠 Detected Standards:", stdData);

    // ✅ Pick only ONE active standard (not the entire array)
    const activeStandard = Array.isArray(stdData)
      ? selectedClass || stdData[0]
      : stdData;

    console.log("📚 Final Active Standard:", activeStandard);

    // ✅ Format batch dates safely
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

    // ✅ Load progress only once per valid standard
    const userId = storedUser?.id || storedUser?._id;
    if (userId && activeStandard) {
      loadSubjectCompletionFromServer(userId, setSubjectCompletion, course, activeStandard);
    } else if (activeStandard) {
      const savedLocal = JSON.parse(
        localStorage.getItem(`subjectCompletion_${course}_${activeStandard}`) || "[]"
      );
      if (savedLocal.length > 0) {
        setSubjectCompletion(savedLocal);
      } else {
        setSubjectCompletion(subjectList);
        localStorage.setItem(
          `subjectCompletion_${course}_${activeStandard}`,
          JSON.stringify(subjectList)
        );
      }
    }

    // ✅ Refresh UI progress safely
    window.dispatchEvent(new Event("storage"));
  }, [selectedClass]); // 🔥 only depend on selectedClass (NOT standard)


  // 🔁 Listen for updates to localStorage (when user finishes a subject in JeeLearn)
  useEffect(() => {
    const handleStorageChange = () => {
      // const updatedCompletion = JSON.parse(localStorage.getItem("jeeSubjectCompletion") || "[]");
      const course = "JEE";
      const currentStandard = selectedClass || standard;
      const updatedCompletion = JSON.parse(localStorage.getItem(`subjectCompletion_${course}_${currentStandard}`) || "[]");

      setSubjectCompletion(updatedCompletion);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

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
    // try partial match (for keys like "Introduction to Physics...")
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

  const handleSubjectCompletion = (subjectName) => {
    const updatedSubjects = subjectCompletion.map((subject) =>
      subject.name === subjectName ? { ...subject, certified: true } : subject
    );
    setSubjectCompletion(updatedSubjects);
    // localStorage.setItem("jeeSubjectCompletion", JSON.stringify(updatedSubjects));
    const course = "JEE";
    // const currentStandard = selectedClass || standard;
    // localStorage.setItem(`subjectCompletion_${course}_${currentStandard}`, JSON.stringify(updatedSubjects));
    // const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    // if (storedUser?.id || storedUser?._id) {
    //   const userId = storedUser.id || storedUser._id;
    //   // saveSubjectCompletionToServer(userId, updatedSubjects);
    //   saveSubjectCompletionToServer(userId, updatedSubjects, course, currentStandard);
    // }
    const activeStandard = Array.isArray(standard)
      ? selectedClass || standard[0]
      : standard;

    localStorage.setItem(`subjectCompletion_${course}_${activeStandard}`, JSON.stringify(updatedSubjects));
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    if (storedUser?.id || storedUser?._id) {
      const userId = storedUser.id || storedUser._id;
      saveSubjectCompletionToServer(userId, updatedSubjects, course, activeStandard);
    }

  };

  // useEffect(() => {
  //   // const completedSubtopics = JSON.parse(localStorage.getItem("jeeCompletedSubtopics"));
  //   const course = "JEE";
  //   const currentStandard = selectedClass || standard;
  //   const storedUser = JSON.parse(localStorage.getItem("currentUser"));
  //   const userId = storedUser?.id || storedUser?._id;
  //   const completedSubtopics = JSON.parse(localStorage.getItem(`completedSubtopics_${userId}_${course}_${currentStandard}`) || "{}");

  //   if (
  //     completedSubtopics &&
  //     Object.keys(completedSubtopics["UNIT AND MEASURE"] || {}).length === 6
  //   ) {
  //     handleSubjectCompletion("Physics");
  //   }
  // }, []);

  useEffect(() => {
    const course = "JEE";
    const currentStandard = selectedClass || standard;
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    const userId = storedUser?.id || storedUser?._id;
    const completedSubtopics = JSON.parse(localStorage.getItem(`completedSubtopics_${userId}_${course}_${currentStandard}`) || "{}");

    if (completedSubtopics && Object.keys(completedSubtopics["UNIT AND MEASURE"] || {}).length === 6) {
      handleSubjectCompletion("Physics");
    }
  }, [selectedClass, standard]); // ✅ runs when class/standard changes


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