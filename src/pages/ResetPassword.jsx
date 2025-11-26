import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./ResetPassword.css";
import { API_BASE_URL } from "../config";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("resetEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // Ideally redirect if no email is found, but for now we let them stay
      // navigate("/forgot-password"); 
    }
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!otp) {
      alert("Please enter OTP");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      // 1️⃣ Verify OTP
      const verify = await fetch(`${API_BASE_URL}/api/auth/verify-reset-otp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.trim() }) // Trim whitespace
      });

      const verifyData = await verify.json();
      if (!verify.ok) {
        alert(verifyData.message || "Invalid OTP");
        return;
      }

      // 2️⃣ Reset Password
      const reset = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: password })
      });

      const resetData = await reset.json();
      if (reset.ok) {
        alert("Password reset successful!");
        sessionStorage.removeItem("resetEmail");
        navigate("/login");
      } else {
        alert(resetData.message);
      }

    } catch (err) {
      console.error(err);
      alert("Server error, try again later");
    }
  };

  return (
    <div className="reset-container">
      <h2>Reset Password</h2>
      <div className="reset-form-box">

        {/* 'autoComplete="off"' tells browser not to fill this form */}
        <form onSubmit={handleReset} autoComplete="off">

          {/* HACK: Invisible inputs to trap browser autofill */}
          <input type="text" style={{ display: 'none' }} autoComplete="username" />
          <input type="password" style={{ display: 'none' }} autoComplete="current-password" />

          {/* OTP Input */}
          <div className="input-wrapper">
            <input
              type="text"
              name="otp_field_123" // Random name prevents browser guessing
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              autoComplete="one-time-code" // Explicitly tell browser it's an OTP
              id="otpInput"
            />
          </div>

          {/* New Password */}
          <div className="input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="new_password_field"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <span className="icon" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Confirm Password */}
          <div className="input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="confirm_password_field"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <span className="icon" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit">Reset Password</button>

        </form>
      </div>
    </div>
  );
};

export default ResetPassword;