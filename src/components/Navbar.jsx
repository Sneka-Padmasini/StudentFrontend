// Navbar.jsx
import React, { useState, useEffect } from "react";
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

  const handleLogout = () => {
    fetch(`${API_BASE_URL}/logout`, {
      method: "GET",
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

  // useEffect(() => {
  //   fetch(`${API_BASE_URL}/checkSession`, {
  //     method: "GET",
  //     credentials: "include",
  //   })
  //     .then((resp) => resp.json())
  //     .then((data) => {
  //       if (data.status === "pass") {
  //         // Normalize backend keys
  //         const normalizedUser = {
  //           ...data,
  //           userName: data.userName || "",
  //           phoneNumber: data.phoneNumber || "",
  //           selectedCourse: data.selectedCourse || {},
  //           standards: data.standards || [],
  //           subjects: data.subjects || [],
  //         };
  //         login(normalizedUser);
  //         localStorage.setItem("currentUser", JSON.stringify(normalizedUser));
  //       } else {
  //         localStorage.clear();
  //         logout();
  //         setCoursesOpen(false);
  //         setUserDropdownOpen(false);
  //         navigate("/login");
  //       }
  //     })
  //     .catch(console.error);
  // }, []);
  useEffect(() => {
    fetch(`${API_BASE_URL}/checkSession`, {
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
          // ❌ REMOVE this navigate("/login") here
          // Instead, let ProtectedRoute handle redirection on protected pages
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

  // Extract courses and standards
  let selectedCourse = [];
  let selectedStandard = [];

  // if (currentUser) {
  //   // If backend sends selectedCourse object, use it
  //   if (currentUser.selectedCourse && typeof currentUser.selectedCourse === "object") {
  //     selectedCourse = Object.keys(currentUser.selectedCourse);
  //     selectedStandard = [...new Set(Object.values(currentUser.selectedCourse).flat())];
  //   } else {
  //     // Fallback: derive from courseName / coursetype
  //     if (currentUser.courseName) selectedCourse = [currentUser.courseName];
  //     if (currentUser.coursetype) {
  //       const match = currentUser.coursetype.match(/\(([^)]+)\)/);
  //       if (match) selectedStandard = [match[1]];
  //     }
  //   }
  // }

  if (currentUser) {
    // ✅ Preferred: use backend data directly
    if (currentUser.coursetype) {
      selectedCourse = currentUser.coursetype.split(",").map(c => c.trim());
    } else if (currentUser.courseName) {
      selectedCourse = currentUser.courseName.split(",").map(c => c.trim());
    }

    // ✅ Standards array (if available)
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

      {/* <ul className={menuOpen ? "nav-links active" : "nav-links"}>
        {currentUser && (
          <li className="dropdown">
            <div
              className="dropdown-toggle"
              onClick={() => {
                setCoursesOpen((prev) => !prev);
                setUserDropdownOpen(false);
              }}
            >
              <span>Courses</span>
              <span className="dropdown-icon">
                {coursesOpen ? <FaChevronUp /> : <FaChevronDown />}
              </span>
            </div>
            {coursesOpen && (
              <ul className="dropdown-menu">
                {selectedCourse.map((course) => (
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
                <ul className="dropdown-menu user-details-dropdown">
                  <div className="user-details-header">
                    <li>
                      <img src={currentUser.photo} alt="user" className="user-photo" />
                    </li>
                    <li>
                      <strong>Name:</strong> {currentUser.userName}
                    </li>
                    <li>
                      <strong>Email:</strong> {currentUser.email}
                    </li>
                    <li>
                      <strong>Mobile:</strong> {currentUser.phoneNumber}
                    </li>
                    <li>
                      <strong>Courses:</strong> {selectedCourse.join(",")}
                    </li>
                    <li>
                      <strong>Standards:</strong> {selectedStandard.join(",")}
                    </li>
                    <li>
                      <button
                        className="upgrade-btn"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate("/register?step=2&upgrade=true");
                        }}
                      >
                        🪙 Upgrade Plan
                      </button>
                    </li>
                    <li>
                      <button className="logout-btn" onClick={handleLogout}>
                        <FaSignOutAlt style={{ marginRight: "8px" }} />
                        Logout
                      </button>
                    </li>
                  </div>
                </ul>
              )}
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
          )}
        </li>
      </ul> */}
      <ul className={menuOpen ? "nav-links active" : "nav-links"}>
        {/* Static links */}
        <li>
          <Link to="/home" onClick={() => setMenuOpen(false)}>Home</Link>
        </li>
        <li>
          <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
        </li>
        {/* <li>
          <Link to="/courses" onClick={() => setMenuOpen(false)}>Courses</Link>
        </li> */}
        <li>
          <Link
            to="#course-section"
            onClick={(e) => {
              e.preventDefault();
              const section = document.getElementById("course-section");
              if (section) section.scrollIntoView({ behavior: "smooth" });
              setMenuOpen(false);
            }}
          >
            Courses
          </Link>
        </li>


        <li>
          <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
        </li>

        {/* Existing Courses dropdown (if logged in) */}
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
                {selectedCourse.map((course) => (
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

        {/* User dropdown / Sign In */}
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
                <ul className="dropdown-menu user-details-dropdown">
                  <div className="user-details-header">
                    <li>
                      <img src={currentUser.photo} alt="user" className="user-photo" />
                    </li>
                    <li>
                      <strong>Name:</strong> {currentUser.userName}
                    </li>
                    <li>
                      <strong>Email:</strong> {currentUser.email}
                    </li>
                    <li>
                      <strong>Mobile:</strong> {currentUser.phoneNumber}
                    </li>
                    <li>
                      <strong>Courses:</strong> {selectedCourse.join(",")}
                    </li>
                    <li>
                      <strong>Standards:</strong> {selectedStandard.join(",")}
                    </li>
                    <li>
                      <button
                        className="upgrade-btn"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate("/register?step=2&upgrade=true");
                        }}
                      >
                        🪙 Upgrade Plan
                      </button>
                    </li>
                    <li>
                      <button className="logout-btn" onClick={handleLogout}>
                        <FaSignOutAlt style={{ marginRight: "8px" }} />
                        Logout
                      </button>
                    </li>
                  </div>
                </ul>
              )}
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
          )}
        </li>
      </ul>

    </nav>
  );
};

export default Navbar;