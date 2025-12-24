import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Registration.css";
import registerIllustration from "../assets/registerIllustration.jpg";
import { API_BASE_URL } from "../config";

// IMPORTANT: RAZORPAY KEY ID must be defined using the VITE prefix in your .env file
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

const RegistrationFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  // --- URL PARAMS ---
  const stepFromURL = parseInt(queryParams.get("step"));
  const isUpgrade = queryParams.get("upgrade") === "true"; // ✅ Detect Upgrade Mode
  const isRenew = queryParams.get("renew") === "true";
  const planFromURL = queryParams.get("plan");


  const [step, setStep] = useState(1);

  // --- STATE VARIABLES ---
  const [firstname, setUsername] = useState("");
  const [lastname, setStudentName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mobile, setMobile] = useState("");

  // Errors & Loading
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 2 States
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [selectedCourses, setSelectedCourses] = useState(["NEET"]);
  const [selectedStandards, setSelectedStandards] = useState(["11th", "12th"]);

  const [dailyHours, setDailyHours] = useState(3);
  const [calcMessage, setCalcMessage] = useState("");

  // Dropdowns
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [standardDropdownOpen, setStandardDropdownOpen] = useState(false);
  const courseDropdownRef = useRef(null);
  const standardDropdownRef = useRef(null);

  // Step 3 States
  const [selectedPlan, setSelectedPlan] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // --- 1. INITIALIZATION & UPGRADE SETUP ---
  useEffect(() => {
    // Load Razorpay Script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    // Set Plan from URL
    if (planFromURL) setSelectedPlan(planFromURL);

    // ✅ UPGRADE LOGIC: Pre-fill data and skip to Step 2
    if (isUpgrade) {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (currentUser) {
        // Map backend fields to state
        setUsername(currentUser.firstName || "");
        setStudentName(currentUser.lastName || "");
        setEmail(currentUser.email || "");
        setMobile(currentUser.phoneNumber || "");
        setDob(currentUser.dob || "");
        setGender(currentUser.gender || "");

        // Skip Step 1 (OTP/Password)
        setStep(2);

        // Note: We don't auto-fill courses/standards here to allow the user 
        // to "Upgrade" them by selecting new ones.
      }
    } else {
      // ✅ NEW USER LOGIC: Restore from temp storage if refreshed
      const useMe1 = localStorage.getItem("registeredUser");
      if (useMe1) {
        try {
          const useMe = JSON.parse(useMe1);
          setUsername(useMe.firstname || "");
          setStudentName(useMe.lastname || "");
          setEmail(useMe.email || "");
          setPassword(useMe.password || "");
          setConfirmPassword(useMe.confirmPassword || "");
          setMobile(useMe.mobile || "");

          // This ensures if they selected only '11th', it stays '11th'
          if (useMe.selectedStandard && Array.isArray(useMe.selectedStandard) && useMe.selectedStandard.length > 0) {
            setSelectedStandards(useMe.selectedStandard);
          }
          if (useMe.selectedCourses && Array.isArray(useMe.selectedCourses) && useMe.selectedCourses.length > 0) {
            setSelectedCourses(useMe.selectedCourses);
          }

        } catch (err) {
          console.error('Invalid JSON', err);
        }
      }
      if (stepFromURL) setStep(stepFromURL);
    }

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [isUpgrade, planFromURL, stepFromURL]);

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target)) setCourseDropdownOpen(false);
      if (standardDropdownRef.current && !standardDropdownRef.current.contains(event.target)) setStandardDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  useEffect(() => {
    if (dailyHours) {
      fetch(`${API_BASE_URL}/api/calculate-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: parseInt(dailyHours) })
      })
        .then(res => res.json())
        .then(data => setCalcMessage(data.message));
    }
  }, [dailyHours]);


  // --- HELPER FUNCTIONS ---
  const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email);
  const validateMobile = (mobile) => /^[0-9]{10}$/.test(mobile);

  // const calculateEndDate = (plan) => {
  //   const startDate = new Date();
  //   let days = plan === "trial" ? 10 : plan === "monthly" ? 30 : plan === "yearly" ? 365 : 0;
  //   const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
  //   return endDate.toISOString().split("T")[0];
  // }

  const calculateEndDate = (plan) => {
    // 1. Determine how many days to add
    let days = plan === "trial" ? 10 : plan === "monthly" ? 30 : plan === "yearly" ? 365 : 0;

    // 2. Determine the Base Date (Start Date)
    let baseDate = new Date(); // Default: Start from TODAY

    // ✅ RENEWAL LOGIC: Check if we should extend an existing date
    if (isRenew) {
      // Try getting user from one of the keys
      const userStr = localStorage.getItem("upgradingUser") || localStorage.getItem("currentUser");
      const currentUser = userStr ? JSON.parse(userStr) : null;

      // If user has an existing end date
      if (currentUser && currentUser.endDate) {
        const currentEndDate = new Date(currentUser.endDate);
        const today = new Date();

        // Logic: If plan is NOT expired yet, extend from the end date.
        // If plan IS expired, restart from today.
        if (currentEndDate > today) {
          baseDate = currentEndDate;
          console.log("🔄 Extending plan from:", baseDate);
        } else {
          console.log("⚠️ Plan expired. Restarting from Today.");
        }
      }
    }

    // 3. Add the days
    const newEndDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
    return newEndDate.toISOString().split("T")[0];
  }

  // const getPlanPrice = (plan) => (plan === 'monthly' ? 1000 : plan === 'yearly' ? 10000 : 0);
  const getPlanPrice = (plan) => (plan === 'monthly' ? 3000 : plan === 'yearly' ? 33000 : 0);

  const storeLocal = () => {
    localStorage.setItem("registeredUser", JSON.stringify({ firstname, lastname, email, mobile, password, confirmPassword }));
  }

  // --- HANDLERS ---

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const toggleCourse = (c) => setSelectedCourses(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  const toggleStandard = (s) => setSelectedStandards(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  // --- STEP 1 SUBMIT (New Users Only) ---
  const handleStepOneSubmit = (e) => {
    e.preventDefault();
    if (!validateEmail(email)) return setEmailError("Please enter a valid email address.");
    if (!validateMobile(mobile)) return setMobileError("Please enter a valid 10-digit mobile number.");
    if (password !== confirmPassword) return alert("Passwords do not match!");

    localStorage.setItem("registeredUser", JSON.stringify({ firstname, lastname, email, mobile, password, confirmPassword }));
    setStep(2);
  };

  // --- FINAL API SUBMIT (Handles Both Register & Upgrade) ---
  const sendUserDetails = async () => {
    // ✅ Decide which storage key to use
    const storageKey = isUpgrade ? "upgradingUser" : "registeredUser";
    const user = JSON.parse(localStorage.getItem(storageKey) || "{}");

    if (isUpgrade) {
      // ==========================================
      // ✅ UPGRADE PATH (PUT Request)
      // ==========================================
      // We use JSON body for upgrade to preserve progress
      try {
        const response = await fetch(`${API_BASE_URL}/api/upgradePlan/${user.email}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
        const data = await response.json();

        if (response.ok) {
          alert("Plan Upgraded Successfully! Please Login again to refresh details.");
          localStorage.removeItem("upgradingUser");
          localStorage.clear(); // Force re-login
          navigate('/login');
        } else {
          alert(data.message || "Upgrade Failed");
        }
      } catch (error) {
        console.error(error);
        alert("Upgrade error");
      }

    } else {
      // ==========================================
      // ✅ NEW REGISTRATION PATH (POST Request)
      // ==========================================
      const formData = new FormData();
      formData.append('firstname', user.firstname);
      formData.append('lastname', user.lastname);
      formData.append('email', user.email);
      formData.append('password', user.password);
      formData.append('mobile', user.mobile);
      formData.append('dob', user.dob);
      formData.append('gender', user.gender);
      formData.append('selectedCourses', JSON.stringify(user.selectedCourses));
      formData.append('selectedStandard', JSON.stringify(user.selectedStandard));
      formData.append('plan', user.plan);

      formData.append('comfortableDailyHours', user.comfortableDailyHours || "3");

      formData.append('startDate', user.startDate);
      formData.append('endDate', user.endDate);
      formData.append('paymentId', user.paymentId || "");
      formData.append('paymentMethod', user.paymentMethod || "");
      formData.append('amountPaid', user.amountPaid || "0");
      formData.append('payerId', user.payerId || "");
      if (photo) formData.append('photo', photo);

      try {
        const response = await fetch(`${API_BASE_URL}/api/register/newUser`, {
          method: 'POST',
          credentials: "include",
          body: formData,
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.removeItem("registeredUser");
          alert(data.message || "Registration Successful!");
          navigate('/Login');
        } else {
          alert(data.error || "Registration failed");
        }
      } catch (error) {
        alert("Something went wrong");
      }
    }
  };

  // --- STEP 2 SUBMIT (Validation & Direction) ---
  const handleFinalSubmit = (e) => {
    e.preventDefault();

    // 1. Validate Selection
    if (selectedCourses.length === 0 || selectedStandards.length === 0) {
      return alert("Please select your course and standard.");
    }
    // For new users, validate extra fields
    if (!isUpgrade && (!dob || !gender)) {
      return alert("Please fill in all required fields.");
    }

    // 2. Prepare Data Object
    let updatedUser;
    if (isUpgrade) {
      // Upgrade: Merge new selection with existing user basics
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      updatedUser = {
        ...currentUser,
        dob: dob || currentUser.dob,
        gender: gender || currentUser.gender,
        selectedCourses: selectedCourses,
        selectedStandard: selectedStandards,
        // Ensure keys match backend expectations
        firstname: currentUser.firstName,
        lastname: currentUser.lastName,
        email: currentUser.email,
        comfortableDailyHours: dailyHours,
      };
      localStorage.setItem("upgradingUser", JSON.stringify(updatedUser));
    } else {
      // New: Load from Step 1
      updatedUser = JSON.parse(localStorage.getItem("registeredUser") || "{}");
      updatedUser.comfortableDailyHours = dailyHours;
      updatedUser.dob = dob;
      updatedUser.gender = gender;
      updatedUser.selectedCourses = selectedCourses;
      updatedUser.selectedStandard = selectedStandards;
      if (photo) updatedUser.photo = photo;
      localStorage.setItem("registeredUser", JSON.stringify(updatedUser));
    }

    // 3. Handle Plan Logic (Trial vs Paid)
    if (planFromURL === 'trial') {
      // ✅ Block Upgrade to Trial (One time only)
      if (isUpgrade) {
        alert("❌ You cannot use the Free Trial again. Please select a paid plan.");
        navigate("/pricing?upgrade=true");
        return;
      }

      // Activate Trial for New User
      updatedUser.plan = "trial";
      updatedUser.startDate = new Date().toISOString().split("T")[0];
      updatedUser.endDate = calculateEndDate('trial');
      updatedUser.paymentId = "TRIAL_" + Date.now();
      updatedUser.paymentMethod = "Free Trial";
      updatedUser.amountPaid = "0";

      localStorage.setItem("registeredUser", JSON.stringify(updatedUser));
      alert(`Registration Completed! Starting your 10-day Free Trial!`);
      sendUserDetails();

    } else {
      // Paid Plan -> Go to Step 3
      setStep(3);
    }
  };

  // --- PAYMENT HANDLERS ---
  const displayRazorpay = async () => {
    if (isPaying) return;
    setIsPaying(true);

    const price = getPlanPrice(selectedPlan);
    const storageKey = isUpgrade ? "upgradingUser" : "registeredUser";
    const user = JSON.parse(localStorage.getItem(storageKey) || "{}");

    try {
      const orderResponse = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
        method: 'POST',
        body: JSON.stringify({ amount: price, plan: selectedPlan }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!orderResponse.ok) {
        alert("Failed to create Order.");
        setIsPaying(false);
        return;
      }

      const orderData = await orderResponse.json();
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Padmasini Learning",
        description: `${selectedPlan} Plan`,
        order_id: orderData.id,
        handler: async function (response) {
          // Verification
          const verifyRes = await fetch(`${API_BASE_URL}/api/payment/verify`, {
            method: 'POST',
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              plan: selectedPlan,
              userId: user.email
            }),
            headers: { 'Content-Type': 'application/json' }
          });

          if (verifyRes.ok) {
            const verifyData = await verifyRes.json(); // ✅ Parse JSON response

            // ✅ Pass the retrieved payerId (UPI ID) to the success handler
            handleSuccessfulPayment(response.razorpay_payment_id, verifyData.payerId);
          } else {
            alert("Payment Verification Failed");
            setIsPaying(false);
          }
        },

        //   if (verifyRes.ok) {
        //     handleSuccessfulPayment(response.razorpay_payment_id);
        //   } else {
        //     alert("Payment Verification Failed");
        //     setIsPaying(false);
        //   }
        // },
        prefill: {
          name: `${user.firstname} ${user.lastname}`,
          email: user.email,
          contact: user.mobile || user.phoneNumber
        },
        theme: { color: "#198754" }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        alert(`Payment failed: ${response.error.description}`);
        setIsPaying(false);
      });
      paymentObject.open();

    } catch (error) {
      console.error(error);
      alert("Payment Error");
      setIsPaying(false);
    }
  };

  // const handleSuccessfulPayment = (paymentId) => {
  //   setPaymentSuccess(true);
  //   setIsPaying(false);

  //   const storageKey = isUpgrade ? "upgradingUser" : "registeredUser";
  //   const user = JSON.parse(localStorage.getItem(storageKey) || "{}");

  //   // ✅ Set Payment & Date Details
  //   user.plan = selectedPlan;
  //   user.startDate = new Date().toISOString().split("T")[0];
  //   user.endDate = calculateEndDate(selectedPlan);
  //   user.paymentId = paymentId;
  //   user.paymentMethod = "Razorpay";
  //   user.amountPaid = getPlanPrice(selectedPlan).toString();

  //   localStorage.setItem(storageKey, JSON.stringify(user));

  //   // ✅ Trigger Final API Call
  //   sendUserDetails();
  // };

  // ✅ Accept payerId as 2nd argument
  const handleSuccessfulPayment = (paymentId, payerId) => {
    setPaymentSuccess(true);
    setIsPaying(false);

    const storageKey = isUpgrade ? "upgradingUser" : "registeredUser";
    const user = JSON.parse(localStorage.getItem(storageKey) || "{}");

    user.plan = selectedPlan;
    user.startDate = new Date().toISOString().split("T")[0];
    user.endDate = calculateEndDate(selectedPlan);
    user.paymentId = paymentId;
    user.paymentMethod = "Razorpay";
    user.amountPaid = getPlanPrice(selectedPlan).toString();

    // ✅ SAVE THE UPI ID / PAYER ID
    user.payerId = payerId || "Unknown";

    localStorage.setItem(storageKey, JSON.stringify(user));
    sendUserDetails();
  };

  // OTP Logic (Only needed for new users)
  const sendOtp = async (e) => {
    e.preventDefault();
    if (!email || !validateEmail(email)) return setEmailError("Invalid Email");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) { setOtpSent(true); alert(data.message); }
      else alert(data.message);
    } catch (err) { alert("Error sending OTP"); }
    setLoading(false);
  }

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return setOtpError("Enter OTP");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ email, otp }),
      });
      if (res.ok) { setIsVerified(true); alert("Verified ✅"); }
      else setOtpError("Invalid OTP");
    } catch (err) { setOtpError("Error"); }
  }

  // Display Current Course (Visual helper)
  const currentUserCourses = () => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser && currentUser.courseName) {
      return <div style={{ marginBottom: '10px', color: 'gray' }}>Current Plan: {currentUser.courseName}</div>;
    }
  }

  return (
    <div className="registration-container">
      <div className="registration-box">
        {/* Left Side */}
        <div className="registration-illustration">
          <img src={registerIllustration} alt="Register Illustration" />
          <h1>Welcome to Our Platform</h1>
          <p>Join us to explore amazing features and opportunities!</p>
        </div>
        <div className="divider"></div>

        {/* Right Side */}
        <div className="registration-form">

          {/* --- STEP 1: Personal Info (Hide if Upgrading) --- */}
          {step === 1 && !isUpgrade && (
            <div className="right-content">
              <h2 className="register-heading">Register Now</h2>
              <div className="Register-form-box">
                <form onSubmit={handleStepOneSubmit}>
                  <div className="name-container">
                    <input type="text" placeholder="First Name" value={firstname} onChange={(e) => setUsername(e.target.value)} required className="half-width" />
                    <input type="text" placeholder="Last Name" value={lastname} onChange={(e) => setStudentName(e.target.value)} required className="half-width" />
                  </div>
                  <input type="email" placeholder="Email Id" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  {emailError && <span className="error-message">{emailError}</span>}

                  {!otpSent ? (
                    <button type="button" onClick={sendOtp} disabled={loading} className="sendOtp">
                      {loading ? "Sending..." : "Send OTP"}
                    </button>
                  ) : (
                    <>
                      <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} disabled={isVerified} />
                      <button type="button" className={`verifyOtp ${isVerified ? "verified" : ""}`} onClick={verifyOtp} disabled={isVerified}>
                        {isVerified ? "Verified ✅" : "Verify OTP"}
                      </button>
                    </>
                  )}

                  <input type="tel" placeholder="Mobile No." value={mobile} onChange={(e) => setMobile(e.target.value)} required />

                  <div className="password-container">
                    <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="password-input" />
                    <span className="icon inside" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                  <div className="password-container">
                    <input type={showPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="password-input" />
                  </div>

                  <div className="form-actions">
                    <div className="checkbox-container">
                      <input type="checkbox" id="agree" required />
                      <label htmlFor="agree">I agree to <Link to="/terms" onClick={storeLocal}>terms & conditions</Link></label>
                    </div>
                    <button type="submit">Next</button>
                    <p className="login-text">Already have an account? <Link to="/login">Login</Link></p>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* --- STEP 2: Course & Standard (Common for New & Upgrade) --- */}
          {step === 2 && (
            <div className="student-details">
              {/* <h2>{isUpgrade ? "Update Plan & Courses" : "Student Details"}</h2> */}
              <h2>{isRenew ? "Renew / Extend Plan" : (isUpgrade ? "Update Plan & Courses" : "Student Details")}</h2>
              {isUpgrade && currentUserCourses()}

              <div className="student-details-wrapper">
                {/* Hide Photo upload if Upgrading to keep UI simple, or keep if you want them to change photo */}
                {!isUpgrade && (
                  <div className="left-section">
                    <p className="upload-text">Upload Profile Picture *</p>
                    <label htmlFor="file-input" className="custom-upload">
                      {photoPreview ? <img src={photoPreview} alt="Profile" className="profile-preview" /> : <span className="upload-placeholder">+</span>}
                    </label>
                    <input id="file-input" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden-input" />
                  </div>
                )}

                <div className="right-section">
                  <div className="right-content">
                    <form onSubmit={handleFinalSubmit}>
                      {!isUpgrade && (
                        <>
                          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                          <select value={gender} onChange={(e) => setGender(e.target.value)} required>
                            <option value="">Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </>
                      )}

                      <div ref={courseDropdownRef} className="dropdown-wrapper">
                        <label>Course(s):</label>
                        <div className="dropdown-display" onClick={() => setCourseDropdownOpen(!courseDropdownOpen)}>
                          {selectedCourses.length > 0 ? selectedCourses.join(", ") : "Select Course(s)"}
                        </div>
                        {courseDropdownOpen && (
                          <div className="dropdown-menu">
                            {["NEET"].map((course) => (
                              <label key={course} className="dropdown-item">
                                <input type="checkbox" checked={selectedCourses.includes(course)} onChange={() => toggleCourse(course)} />
                                {course}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {selectedCourses.length > 0 && (
                        <div ref={standardDropdownRef} className="dropdown-wrapper">
                          <label>Standard(s):</label>
                          <div className="dropdown-display" onClick={() => setStandardDropdownOpen(!standardDropdownOpen)}>
                            {selectedStandards.length > 0 ? selectedStandards.join(", ") : "Select Standard(s)"}
                          </div>
                          {standardDropdownOpen && (
                            <div className="dropdown-menu">
                              {["11th", "12th"].map((std) => (
                                <label key={std} className="dropdown-item">
                                  <input type="checkbox" checked={selectedStandards.includes(std)} onChange={() => toggleStandard(std)} />
                                  {std}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="input-group">
                        <label>Comfortable Study Hours/Day:</label>
                        <input type="number" value={dailyHours} onChange={e => setDailyHours(e.target.value)} />
                        <p style={{ fontSize: "12px", color: "green" }}>{calcMessage}</p>
                      </div>

                      <div className="student-navigation-buttons">
                        <button type="button" onClick={() => (isUpgrade ? navigate("/home") : setStep(1))}>
                          {isUpgrade ? "Cancel" : "Previous"}
                        </button>
                        <button type="submit">
                          {planFromURL === 'trial' ? "Activate Trial" : "Proceed to Payment"}
                        </button>
                      </div>



                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- STEP 3: Payment (Paid Plans Only) --- */}
          {step === 3 && (
            <div className="payment-section">
              <h2>{isUpgrade ? "Upgrade Plan" : `Pay for ${selectedPlan} Plan`}</h2>
              <p className="plan-summary">
                {/* Selected Plan: {selectedPlan} ({selectedPlan === 'monthly' ? '₹1000' : '₹10000'}) */}
                Selected Plan: {selectedPlan} ({selectedPlan === 'monthly' ? '₹3000' : '₹33000'})
              </p>

              <div className="payment-selection">
                {/* Apply promo code */}
                {/* <div className="promo-section">
                  <input type="text" placeholder="Enter Promo Code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                  <button onClick={() => alert("Promo Applied: " + promoCode)}>Apply</button>
                </div> */}

                <div className="razorpay-button-wrapper">
                  {!paymentSuccess ? (
                    <button onClick={displayRazorpay} disabled={isPaying} className="select-plan-btn" style={{ width: '100%', marginTop: '20px' }}>
                      {isPaying ? "Opening Payment Gateway..." : "Proceed to Razorpay Payment"}
                    </button>
                  ) : (
                    <button disabled className="select-plan-btn primary-btn" style={{ width: '100%', marginTop: '20px', backgroundColor: '#34a853' }}>
                      Payment Completed ✅
                    </button>
                  )}
                </div>

                <div className="plans-navigation-buttons">
                  <button onClick={() => setStep(2)}>Previous</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default RegistrationFlow;