import React, { useState, useEffect } from "react";
import "./LoginPage.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useUser } from "../components/UserContext";

import loginIllustration from "../assets/loginIllustration.jpg";
import whatsappIcon from "../assets/WhatsApp_icon.png";
import { API_BASE_URL } from "../config";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('currentUser')) {
      console.log('user already logged in no need for sign page');
      navigate('/home');
    }
    window.scrollTo(0, 0);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const resp = await fetch(`${API_BASE_URL}/signIn`, {
        method: "POST",
        credentials: "include", // important for session cookies
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userName: email,    // input from form
          password: password  // input from form
        })
      });

      const data = await resp.json();
      console.log("Response from backend:", data);

      if (data.status === "failed") {
        alert("Invalid email or password");
        return;
      }

      // // store current user in localStorage
      // const currentUser = {
      //   userName: data.userName,
      //   email: data.email,
      //   phoneNumber: data.phoneNumber,
      //   role: data.role,
      //   coursetype: data.coursetype || "",
      //   courseName: data.courseName || "",
      //   subjects: data.subjects || [],
      //   standards: data.standards || []
      // };

      // localStorage.setItem("currentUser", JSON.stringify(currentUser));

      // // update app state if using context or redux
      // login(currentUser);
      // Normalize standards from selectedCourse object and selectedStandard array
      let standards = [];

      if (data.selectedCourse && typeof data.selectedCourse === "object") {
        Object.values(data.selectedCourse).forEach(arr => {
          if (Array.isArray(arr)) standards.push(...arr);
        });
      }

      if (Array.isArray(data.selectedStandard)) {
        standards.push(...data.selectedStandard);
      }

      standards = [...new Set(standards)]; // remove duplicates

      const currentUser = {
        userName: data.userName || `${data.firstname} ${data.lastname}`,
        email: data.email,
        phoneNumber: data.mobile || data.phoneNumber,
        role: data.role || "student",
        coursetype: data.coursetype || data.courseName || "",
        courseName: data.courseName || "",
        subjects: data.subjects || [],
        standards: standards.length ? standards : []
      };

      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      login(currentUser);


      // navigate to dashboard/home page
      navigate("/NEET");

    } catch (err) {
      console.error("Login failed:", err);
      alert("Something went wrong. Try again.");
    }
  };



  // const handleLogin = (e) => {
  //   e.preventDefault();

  //   fetch("https://studentpadmasini.onrender.com/login", {
  // fetch(`${API_BASE_URL}/login`, {
  //     method: "POST",
  //     credentials: "include",
  //     headers: {
  //       "Content-Type": "application/json"
  //     },
  //     body: JSON.stringify({
  //       userName: email,
  //       password: password
  //     })
  //   })
  //   .then(async resp => {
  //     const data = await resp.json();

  //     if (data.message === 'Invalid credentials') {
  //       alert("No user or password matched");
  //       throw new Error(data.message || "Login failed");
  //     }

  //    if (data.message === 'Login successful') {
  //   localStorage.setItem('currentUser', JSON.stringify(data.user));
  //   login(data.user);

  //   const rawCourse = data.user.course || "";
  //   const userCourse = rawCourse.toUpperCase().trim();

  //   console.log("👉 User course from server:", userCourse);

  //   if (userCourse.includes('JEE')) {
  //     navigate('/JEE');
  //   } else if (userCourse.includes('NEET')) {
  //     navigate('/NEET');
  //   } else {
  //     alert("Your enrolled course is not supported. Please contact admin.");
  //     navigate('/home');
  //   }

  //   console.log("✅ Logged in:", data);
  // }


  //     if (!resp.ok) throw new Error(data.message || "Login failed");
  //   })
  //   .catch(err => {
  //     console.log(err);
  //     return;
  //   });
  // };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email first");
      return;
    }

    try {
      // const resp = await fetch("http://localhost:3000/forgot-password", {
      // const resp = await fetch("https://studentpadmasini.onrender.com/forgot-password", {
      const resp = await fetch(`${API_BASE_URL}/forgot-password`, { // ✅ updated
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await resp.json();

      if (!resp.ok) throw new Error(data.message || "Something went wrong");

      alert(data.message); // backend will send success message
      //navigate("/reset-password");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="login-container">
      {/* Outer Layout */}
      <div className="login">

        {/* Left side: illustration + text */}
        <div className="login-illustration">
          <img
            src={loginIllustration || "https://via.placeholder.com/400x300"}
            alt="Login Illustration"
          />
          <h1>Welcome Back</h1>
          <p>Log in to continue learning and exploring!</p>
        </div>
        <div className="divider"></div>
        {/* Right side: form */}
        <div className="login-form-section">
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="icon inside"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="login-form-actions">
              <button type="submit">Login</button>
              <p className="login-forgot-password" onClick={handleForgotPassword}>
                Forgot Password?
              </p>
              <p className="login-text">
                Don’t have an account?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/register");
                  }}
                >
                  Register
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/8248791389"
        className="whatsapp-chat-button"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <img
          src={whatsappIcon || "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"}
          alt="WhatsApp"
          className="whatsapp-icon"
        />
        <span>Chat with us on WhatsApp</span>
      </a>
    </div>
  );


};

export default LoginPage;