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

const Subjects = () => {
  const navigate = useNavigate();
  const [standard, setStandard] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [subjectCompletion, setSubjectCompletion] = useState(subjectList);
  const learningPathRef = useRef(null);
  const { login } = useUser()
  useEffect(() => {
    console.log(JSON.parse(localStorage.getItem("currentUser")))
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    if (storedUser) {
      // let stdData = storedUser.selectedCourse?.NEET;

      // // Handle string
      // if (typeof stdData === "string") {
      //   setStandard(stdData);
      //   localStorage.setItem("currentClass", stdData);
      // }
      // // Handle array
      // else if (Array.isArray(stdData)) {
      //   if (stdData.length === 1) {
      //     setStandard(stdData[0]);
      //     localStorage.setItem("currentClass", stdData[0]);
      //   } else {
      //     setStandard(stdData);
      //     const savedClass = localStorage.getItem("currentClassJee");
      //     if (savedClass) setSelectedClass(savedClass);
      //   }
      // }

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

    // const savedCompletion = JSON.parse(localStorage.getItem("subjectCompletion"));
    // if (savedCompletion) {
    //   setSubjectCompletion(savedCompletion);
    // }

    const savedCompletion = JSON.parse(localStorage.getItem("subjectCompletion") || "[]");

    if (savedCompletion.length > 0) {
      // Merge with the default subject list to ensure all subjects appear
      const mergedSubjects = subjectList.map(sub => {
        const existing = savedCompletion.find(s => s.name === sub.name);
        return existing ? { ...sub, ...existing } : sub;
      });
      setSubjectCompletion(mergedSubjects);
    } else {
      // If nothing saved yet, initialize and store default list
      localStorage.setItem("subjectCompletion", JSON.stringify(subjectList));
      setSubjectCompletion(subjectList);
    }


  }, []);


  // 🔁 Listen for updates to localStorage (when user finishes a subject in NeetLearn)
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedCompletion = JSON.parse(localStorage.getItem("subjectCompletion") || "[]");
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
    // fetch('http://localhost:3000/checkSession',{
    // fetch(`https://studentpadmasini.onrender.com/checkSession`, {
    //  fetch(`https://padmasini-prod-api.padmasini.com/checkSession`, {
    fetch(`${API_BASE_URL}/checkSession`, {
      method: "GET",
      credentials: 'include'
    }).then(resp => resp.json())
      .then(data => {
        console.log(data)
        if (data.loggedIn === true) {
          login(data.user)
          //localStorage.clear();
          //console.log(localStorage.getItem('currentUser'))
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          //  logout(localStorage.getItem('currentUser'))
          console.log(localStorage.getItem('currentUser'))
          //onsole.log(currentUser)
        }
        if (data.loggedIn === false) {
          console.log('it came here before seeing user')
          const existingUser = localStorage.getItem('currentUser')
          if (existingUser) {
            console.log('it came here and deleted the user')
            // localStorage.removeItem("currentUser");
            //localStorage.removeItem("jeeSubjectCompletion");
            //localStorage.removeItem("currentClassJee");
            localStorage.clear(); // Clear all local storage
            logout();
            setCoursesOpen(false);
            setUserDropdownOpen(false);
            navigate("/login");
          }
        }
      }).catch(console.error)

  }, [])
  const calculateProgress = () => {
    const completedSubjects = subjectCompletion.filter((subject) => subject.certified).length;
    // return (completedSubjects / subjectCompletion.length) * 100;

    return subjectCompletion.length === 0
      ? 0
      : (completedSubjects / subjectCompletion.length) * 100;


  };

  const progressPercentage = calculateProgress();

  const safeProgress = isNaN(progressPercentage) ? 0 : progressPercentage;


  const handleSubjectCompletion = (subjectName) => {
    const updatedSubjects = subjectCompletion.map((subject) =>
      subject.name === subjectName ? { ...subject, certified: true } : subject
    );
    setSubjectCompletion(updatedSubjects);
    localStorage.setItem("subjectCompletion", JSON.stringify(updatedSubjects));
  };

  useEffect(() => {
    const completedSubtopics = JSON.parse(localStorage.getItem("completedSubtopics"));
    if (
      completedSubtopics &&
      Object.keys(completedSubtopics["UNIT AND MEASURE"] || {}).length === 6
    ) {
      handleSubjectCompletion("Physics");
    }
  }, []);

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
              <p>{subjectCompletion.filter((s) => s.certified).length} of {subjectCompletion.length} subjects completed</p>


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
            {subjectCompletion.map((subject, index) => (
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