// Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaSignOutAlt,
} from "react-icons/fa";
import logo from "../assets/logo.png";
import "./Navbar.css";
import { useUser } from "./UserContext";
import { API_BASE_URL } from "../config";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { login, currentUser, logout } = useUser();
  const navigate = useNavigate();
  const dropdownRef = useRef(null); // ✅ ref for dynamic positioning

  // const handleLogout = () => {
  //   fetch(`${API_BASE_URL}/api/logout`, {
  //     method: "GET",
  //     credentials: "include",
  //   })
  //     .then((resp) => resp.json())
  //     .then((data) => {
  //       if (data.message === "Logged out successfully") {
  //         localStorage.clear();
  //         logout();
  //         setCoursesOpen(false);
  //         setUserDropdownOpen(false);
  //         navigate("/login");
  //       }
  //     })
  //     .catch(console.log);
  // };

  const handleLogout = () => {
    const sessionId = localStorage.getItem("currentSessionId");

    fetch(`${API_BASE_URL}/api/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId }), // Fixed: send as object
      credentials: "include",
    })
      .then((resp) => resp.json())
      .then((data) => {
        if (data.message === "Logged out successfully") {
          localStorage.clear();
          logout();
          setCoursesOpen(false);
          setUserDropdownOpen(false);
          navigate("/login");
        }
      })
      .catch(console.log);
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/checkSession`, {
      method: "GET",
      credentials: "include",
    })
      .then((resp) => resp.json())
      .then((data) => {
        if (data.status === "pass") {
          const normalizedUser = {
            ...data,
            userName: data.userName || "",
            phoneNumber: data.phoneNumber || "",
            selectedCourse: data.selectedCourse || {},
            standards: data.standards || [],
            subjects: data.subjects || [],
          };
          login(normalizedUser);
          localStorage.setItem("currentUser", JSON.stringify(normalizedUser));
        } else {
          localStorage.clear();
          logout();
          setCoursesOpen(false);
          setUserDropdownOpen(false);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdowns = document.querySelectorAll(".dropdown-toggle, .dropdown-menu");
      if (!Array.from(dropdowns).some((el) => el.contains(event.target))) {
        setCoursesOpen(false);
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Dynamic dropdown adjustment to prevent clipping
  useEffect(() => {
    if (userDropdownOpen && dropdownRef.current) {
      const dropdown = dropdownRef.current;
      const rect = dropdown.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      if (rect.right > viewportWidth) {
        // Shift left so it stays inside viewport
        const overflow = rect.right - viewportWidth + 10; // 10px buffer
        dropdown.style.left = `auto`;
        dropdown.style.right = `${overflow + 10}px`;
      } else {
        dropdown.style.left = "auto";
        dropdown.style.right = "0px";
      }
    }
  }, [userDropdownOpen]);


  // Extract courses and standards
  let selectedCourse = [];
  let selectedStandard = [];

  if (currentUser) {
    if (currentUser.coursetype) {
      selectedCourse = currentUser.coursetype.split(",").map(c => c.trim());
    } else if (currentUser.courseName) {
      selectedCourse = currentUser.courseName.split(",").map(c => c.trim());
    }

    if (Array.isArray(currentUser.standards)) {
      selectedStandard = currentUser.standards;
    } else if (typeof currentUser.standards === "string" && currentUser.standards.length > 0) {
      selectedStandard = currentUser.standards.split(",").map(s => s.trim());
    }
  }

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="logo">
        <Link to="/home" onClick={() => setMenuOpen(false)}>
          <img src={logo} alt="Logo" />
        </Link>
      </div>

      <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <FaTimes /> : <FaBars />}
      </div>

      <ul className={menuOpen ? "nav-links active" : "nav-links"}>
        <li><Link to="/home" onClick={() => setMenuOpen(false)}>Home</Link></li>
        <li><Link to="/about" onClick={() => setMenuOpen(false)}>About</Link></li>
        {/* <li>
          <Link
            to="/home"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              if (window.location.pathname !== "/home") {
                navigate("/home");
                setTimeout(() => {
                  const section = document.getElementById("course-section");
                  if (section) section.scrollIntoView({ behavior: "smooth" });
                }, 100);
              } else {
                const section = document.getElementById("course-section");
                if (section) section.scrollIntoView({ behavior: "smooth" });
              }
              setMenuOpen(false);
            }}
          >
            Courses
          </Link>
        </li> */}

        <li>
          <Link to="/pricing" onClick={() => setMenuOpen(false)}>
            Pricing
          </Link>
        </li>

        <li>
          <Link
            to="/courses"
            onClick={() => setMenuOpen(false)}
          >
            Skilling
          </Link>
        </li>


        <li>
          <Link
            to="/contact-us"
            onClick={() => setMenuOpen(false)}
          >
            Contact
          </Link>
        </li>


        {currentUser && selectedCourse.length > 0 && (
          <li className="dropdown">
            <div
              className="dropdown-toggle"
              onClick={() => {
                setCoursesOpen((prev) => !prev);
                setUserDropdownOpen(false);
              }}
            >
              <span>My Courses</span>
              <span className="dropdown-icon">
                {coursesOpen ? <FaChevronUp /> : <FaChevronDown />}
              </span>
            </div>
            {coursesOpen && (
              <ul className="dropdown-menu">
                {selectedCourse
                  .filter(course => course.toLowerCase() !== 'jee') // Remove this line when JEE is needed
                  .map((course) => (
                    <li key={course}>
                      <Link
                        to={`/${course}`}
                        onClick={() => {
                          setMenuOpen(false);
                          setCoursesOpen(false);
                        }}
                      >
                        {course}
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </li>
        )}

        <li className="dropdown">
          {currentUser ? (
            <>
              <div
                className="dropdown-toggle"
                onClick={() => {
                  setUserDropdownOpen((prev) => !prev);
                  setCoursesOpen(false);
                }}
              >
                <span>Hi, {currentUser.userName}</span>
                <span className="dropdown-icon">
                  {userDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              </div>


              {userDropdownOpen && (
                <ul
                  ref={dropdownRef} // ✅ attach ref here
                  className="dropdown-menu user-details-dropdown simple-dropdown"
                >
                  <li className="user-row">
                    {/* <img src={currentUser.photo || ""} alt="user" className="user-photo-small" /> */}

                    <img
                      src={
                        currentUser.photo && currentUser.photo.trim() !== ""
                          ? currentUser.photo
                          : currentUser.gender === "female"
                            ? "https://cdn-icons-png.flaticon.com/512/921/921087.png" // 👩 female avatar
                            : currentUser.gender === "male"
                              ? "https://cdn-icons-png.flaticon.com/512/236/236832.png" // 👨 male avatar
                              : "https://cdn-icons-png.flaticon.com/512/149/149071.png" // 🧑 neutral default
                      }
                      alt="user avatar"
                      className="user-photo-small"
                    />


                    <div className="user-meta">
                      <div className="detail-item"><strong>Name:</strong> {currentUser.userName || "-"}</div>
                      <div className="detail-item"><strong>Email:</strong> {currentUser.email || "-"}</div>
                    </div>
                  </li>

                  <li className="detail-item"><strong>Mobile:</strong> {currentUser.phoneNumber || "-"}</li>
                  <li className="detail-item"><strong>Courses:</strong> {selectedCourse.length ? selectedCourse.join(", ") : "-"}</li>
                  <li className="detail-item"><strong>Standards:</strong> {selectedStandard.length ? selectedStandard.join(", ") : "-"}</li>

                  <li className="action-item">
                    <button
                      className="upgrade-btn small-btn"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        // navigate("/register?step=2&upgrade=true");
                        navigate("/pricing");
                      }}
                    >
                      🪙 Upgrade Plan
                    </button>
                  </li>

                  <li className="action-item">
                    <button className="logout-btn small-btn" onClick={handleLogout}>
                      <FaSignOutAlt style={{ marginRight: "8px" }} />
                      Logout
                    </button>
                  </li>
                </ul>
              )}

            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>Sign In</Link>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;