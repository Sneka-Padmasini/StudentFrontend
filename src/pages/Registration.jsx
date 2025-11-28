import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Registration.css";
import registerIllustration from "../assets/registerIllustration.jpg";
import { API_BASE_URL } from "../config";
// IMPORTANT: RAZORPAY KEY ID must be defined using the VITE prefix in your .env file
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

const RegistrationFlow = () => {
  const [step, setStep] = useState(1);

  // Step 1 states
  const [firstname, setUsername] = useState("");
  const [lastname, setStudentName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mobile, setMobile] = useState("");
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState("")
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  // Step 2 states
  const [photo, setPhoto] = useState(null);
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedStandards, setSelectedStandards] = useState([]);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [standardDropdownOpen, setStandardDropdownOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const courseDropdownRef = useRef(null);
  const standardDropdownRef = useRef(null);

  // Step 3 states
  const [selectedPlan, setSelectedPlan] = useState("");
  const [promoCode, setPromoCode] = useState("");
  // Removed manual payment states like upiId, bank, cardNumber, etc.
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const stepFromURL = parseInt(queryParams.get("step"));
  const isUpgrade = queryParams.get("upgrade") === "true";
  const planFromURL = queryParams.get("plan");
  const [isVerified, setIsVerified] = useState(false);


  // 1. Load Razorpay Script Dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Existing useEffects for user data and routing
  useEffect(() => {
    const useMe1 = localStorage.getItem("registeredUser")
    if (useMe1) {
      console.log("useMe1")
      try {
        const useMe = JSON.parse(useMe1);
        setUsername(useMe.firstname || "");
        setStudentName(useMe.lastname || "");
        setEmail(useMe.email || "");
        setPassword(useMe.password || "");
        setConfirmPassword(useMe.confirmPassword || "");
        setMobile(useMe.mobile || "");
        localStorage.removeItem("registeredUser")
      } catch (err) {
        console.error('Invalid JSON in localStorage:', err);
      }
    }

  }, [])


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target)) {
        setCourseDropdownOpen(false);
      }
      if (standardDropdownRef.current && !standardDropdownRef.current.contains(event.target)) {
        setStandardDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (stepFromURL === 2) setStep(2);
    if (stepFromURL === 3) setStep(3);
    // If a plan is passed via the URL, set it as the selected plan immediately.
    if (planFromURL) setSelectedPlan(planFromURL);
    window.scrollTo(0, 0);
  }, [stepFromURL, planFromURL]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);


  // Helper functions
  const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email);
  const validateMobile = (mobile) => /^[0-9]{10}$/.test(mobile);

  const storeLocal = () => {
    console.log("use me too")
    localStorage.setItem("registeredUser", JSON.stringify({ firstname, lastname, email, mobile, password, confirmPassword }));
  }

  // Existing submit handlers (Step 1 and Step 2)
  const handleStepOneSubmit = (e) => {
    console.log(localStorage.getItem("registeredUser"))
    e.preventDefault();
    if (!validateEmail(email)) return setEmailError("Please enter a valid email address.");
    else setEmailError("");
    if (!validateMobile(mobile)) return setMobileError("Please enter a valid 10-digit mobile number.");
    else setMobileError("");
    if (password !== confirmPassword) return alert("Passwords do not match!");
    localStorage.setItem("registeredUser", JSON.stringify({ firstname, lastname, email, mobile, password, confirmPassword }));
    setStep(2);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file); // store actual File object
      const localUrl = URL.createObjectURL(file);
      setPhotoPreview(localUrl); // preview photo on UI
    }
  };

  const toggleCourse = (course) => {
    setSelectedCourses((prev) =>
      prev.includes(course) ? prev.filter((c) => c !== course) : [...prev, course]
    );
    setCourseDropdownOpen(false); // ✅ closes dropdown
  };

  const toggleStandard = (std) => {
    setSelectedStandards((prev) =>
      prev.includes(std) ? prev.filter((s) => s !== std) : [...prev, std]
    );
    setStandardDropdownOpen(false); // ✅ closes dropdown
  };

  // Helper function to calculate plan end date
  const calculateEndDate = (plan) => {
    const startDate = new Date();
    let days;
    if (plan === "trial") {
      days = 10;
    } else if (plan === "monthly") {
      days = 30;
    } else if (plan === "yearly") {
      days = 365;
    } else {
      return null;
    }
    const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
    return endDate.toISOString().split("T")[0];
  }

  const getPlanPrice = (plan) => {
    if (plan === 'monthly') return 1000; // ₹1000
    if (plan === 'yearly') return 10000; // ₹10000
    return 0;
  };


  const sendUserDetails = async () => {
    const formData = new FormData();
    const user = JSON.parse(localStorage.getItem("registeredUser") || "{}");

    // Add user and plan details to formData
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
    formData.append('startDate', user.startDate);
    formData.append('endDate', user.endDate);

    formData.append('paymentId', user.paymentId || "");
    formData.append('paymentMethod', user.paymentMethod || "");
    formData.append('amountPaid', user.amountPaid || "0");

    // append photo only if selected
    if (photo) {
      console.log("photo is there")
      formData.append('photo', photo);
    }

    if (!isUpgrade) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/register/newUser`, {
          method: 'POST',
          credentials: "include",
          body: formData, // Do not set Content-Type; browser sets it with boundary
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.removeItem("registeredUser");
          alert(data.message || "Registration Successful!");
          navigate('/Login')
        } else {
          alert(data.error || "Registration failed");
        }
      } catch (error) {
        console.error("Error during registration:", error);
        alert("Something went wrong");
      }
    }
    else {
      alert("updated successfully.... note: backend is not set")
      navigate('/home')
    }
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();

    if (!isUpgrade) {
      if (!dob || !gender || selectedCourses.length === 0 || selectedStandards.length === 0) {
        return alert("Please fill in all required fields.");
      }
    } else {
      if (selectedCourses.length === 0 || selectedStandards.length === 0) {
        return alert("Please select your course and standard.");
      }
    }

    const updatedUser = JSON.parse(localStorage.getItem("registeredUser") || "{}");

    updatedUser.dob = dob;
    updatedUser.gender = gender;
    updatedUser.selectedCourses = selectedCourses;
    updatedUser.selectedStandard = selectedStandards;

    if (!isUpgrade) {
      updatedUser.photo = photo;
    }

    localStorage.setItem("registeredUser", JSON.stringify(updatedUser));

    // Logic based on Free Trial vs Paid Plan
    if (planFromURL === 'trial' && !isUpgrade) {
      // FREE TRIAL FLOW: Finalize registration and grant 10-day trial immediately.
      updatedUser.plan = "trial";
      updatedUser.startDate = new Date().toISOString().split("T")[0];
      updatedUser.endDate = calculateEndDate('trial'); // 10 days

      // 🔥 ADD PAYMENT DETAILS FOR TRIAL 🔥
      updatedUser.paymentId = "TRIAL_" + Date.now(); // Generate a fake ID
      updatedUser.paymentMethod = "Free Trial";
      updatedUser.amountPaid = "0";

      localStorage.setItem("registeredUser", JSON.stringify(updatedUser));

      alert(`Registration Completed! Starting your 10-day Free Trial!`);
      sendUserDetails(); // Final registration call and navigates to /Login

    } else if (planFromURL && planFromURL !== 'trial' || isUpgrade) {
      // PAID PLAN FLOW or UPGRADE: Go to Step 3 (Payment)
      setStep(3);
    } else {
      // Fallback/Standard registration (if no explicit plan selected upfront) -> Default to trial
      updatedUser.plan = "trial";
      updatedUser.startDate = new Date().toISOString().split("T")[0];
      updatedUser.endDate = calculateEndDate('trial'); // 10 days
      localStorage.setItem("registeredUser", JSON.stringify(updatedUser));

      alert(`Registration Completed! Starting your 10-day Free Trial!`);
      sendUserDetails(); // Final registration call and navigates to /Login
    }
  };

  // OTP functions (unchanged)
  const sendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setEmailError("Please enter an email first");
      return;
    }
    if (!validateEmail(email)) return setEmailError("Please enter a valid email address.");
    else setEmailError("");
    setEmailError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      console.log("status:", res.status);
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        console.log("otp send successfully")
        alert(data.message);
      } else {
        alert(data.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending OTP");
    }
    setLoading(false);

  }
  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return setOtpError("Please enter OTP");
    try {
      console.log("Verifying OTP", { email, otp });
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsVerified(true);
        localStorage.setItem("verifiedEmail", email)
        localStorage.setItem("emailVerification", "success");
        alert("Email verified successfully ✅");
      } else {
        setOtpError(data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      setOtpError("Error verifying OTP");
    }
  }

  const currentUserCourses = () => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"))
    if (currentUser) {
      let userCourse = currentUser.selectedCourse
      if (typeof userCourse === 'string') {
        userCourse = [userCourse]
        return <div>Your current course: {userCourse.join(", ")}</div>;
      }
      if (Array.isArray(userCourse)) {
        return <div>Your current course: {userCourse.join(", ")}</div>;
      }

      // Case 3: object → flatten courses + standards
      if (typeof userCourse === "object") {
        const courseList = Object.entries(userCourse).map(
          ([course, standards]) =>
            `${course}: ${Array.isArray(standards) ? standards.join(", ") : standards}`
        );
        return <div>Your current course: {courseList.join(" | ")}</div>;
      }
    }
  }


  // ----------------------------------------------------
  // Razorpay Integration Functions
  // ----------------------------------------------------

  const displayRazorpay = async () => {
    if (isPaying) return;
    setIsPaying(true);

    const price = getPlanPrice(selectedPlan);
    const user = JSON.parse(localStorage.getItem("registeredUser") || "{}");

    // Step A: Call Spring Boot Backend to Create Order
    try {
      const orderResponse = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
        method: 'POST',
        body: JSON.stringify({ amount: price, plan: selectedPlan }), // Sending amount in Rupees
        headers: { 'Content-Type': 'application/json' }
      });

      if (!orderResponse.ok) {
        alert("Failed to create Razorpay Order. Check server logs.");
        setIsPaying(false);
        return;
      }

      const orderData = await orderResponse.json();
      // orderData should contain { id: "order_...", amount: 100000, currency: "INR", ... }

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Padmasini Learning Platform",
        description: `Subscription for ${selectedPlan.toUpperCase()} Plan`,
        order_id: orderData.id,
        handler: async function (response) {
          // Step B: Call Spring Boot Backend to Verify Payment

          const verificationResponse = await fetch(`${API_BASE_URL}/api/payment/verify`, {
            method: 'POST',
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              plan: selectedPlan,
              userId: user.email // Passing email for backend to identify the user
            }),
            headers: { 'Content-Type': 'application/json' }
          });

          if (verificationResponse.ok) {
            // Verification success! Finalize local user data and register.
            handleSuccessfulPayment(response.razorpay_payment_id);
          } else {
            alert("Payment verification failed on the server. Please contact support.");
            setIsPaying(false);
          }
        },
        prefill: {
          name: `${user.firstname} ${user.lastname}`,
          email: user.email,
          contact: user.mobile
        },
        notes: {
          plan: selectedPlan,
          user_email: user.email
        },
        theme: {
          color: "#198754"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        alert(`Payment failed. Error: ${response.error.description}`);
        setIsPaying(false);
      });
      paymentObject.open();

    } catch (error) {
      console.error("Error during Razorpay flow:", error);
      alert("Payment process error. Please try again.");
      setIsPaying(false);
    }
  };

  const handleSuccessfulPayment = (paymentId) => {
    setPaymentSuccess(true);
    setIsPaying(false);
    alert(`Payment Successful! Transaction ID: ${paymentId}`);

    const user = JSON.parse(localStorage.getItem("registeredUser") || "{}");

    // Assign paid plan details and end date
    user.plan = selectedPlan;
    user.startDate = new Date().toISOString().split("T")[0];
    user.endDate = calculateEndDate(selectedPlan);

    // 🔥 ADD PAYMENT DETAILS FOR RAZORPAY 🔥
    user.paymentId = paymentId; // The ID from Razorpay
    user.paymentMethod = "Razorpay";
    user.amountPaid = getPlanPrice(selectedPlan).toString(); // "1000" or "10000"

    localStorage.setItem("registeredUser", JSON.stringify(user));

    // Final registration call (sends user details and navigates to /Login)
    sendUserDetails();
  };

  // Step 3 Primary Action
  const handleFinalPayment = () => {
    setPaymentSuccess(false);
    displayRazorpay();
  };


  return (
    <div className="registration-container">
      <div className="registration-box">
        {/* Left side */}
        <div className="registration-illustration">
          <img src={registerIllustration} alt="Register Illustration" />
          <h1>Welcome to Our Platform</h1>
          <p>Join us to explore amazing features and opportunities!</p>
        </div>
        {/* Divider */}
        <div className="divider"></div>
        {/* Right side */}
        <div className="registration-form">
          {step === 1 && (
            <>
              <div className="right-content">
                <h2 className="register-heading">Register Now</h2>
                <div className="Register-form-box">
                  <form onSubmit={handleStepOneSubmit}>
                    <div className="name-container">
                      <input
                        type="text"
                        placeholder="Student First Name"
                        value={firstname}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="half-width"
                      />
                      <input
                        type="text"
                        placeholder="Student Last Name"
                        value={lastname}
                        onChange={(e) => setStudentName(e.target.value)}
                        required
                        className="half-width"
                      />
                    </div>

                    <input
                      type="email"
                      placeholder="Email Id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    {emailError && <span className="error-message">{emailError}</span>}

                    {!otpSent && (
                      <button
                        type="button"
                        onClick={sendOtp}
                        disabled={loading}
                        className="sendOtp"
                      >
                        {loading ? "Sending..." : "Send OTP"}
                      </button>
                    )}
                    {otpSent && (
                      <>
                        <input
                          type="text"
                          placeholder="Enter OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          disabled={isVerified}
                        />
                        {otpError && <span className="error-message">{otpError}</span>}
                        <button
                          type="button"
                          className={`verifyOtp ${isVerified ? "verified" : ""}`}
                          onClick={verifyOtp}
                          disabled={isVerified}
                        >
                          {isVerified ? "Verified ✅" : "Verify OTP"}
                        </button>
                      </>
                    )}

                    <input
                      type="tel"
                      placeholder="Mobile No."
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                    />
                    {mobileError && <span className="error-message">{mobileError}</span>}

                    <div className="password-container">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="password-input"
                      />
                      <span
                        className="icon inside"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </div>

                    <div className="password-container">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="password-input"
                      />
                      <span
                        className="icon inside"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </div>

                    <div className="form-actions">
                      <div className="checkbox-container">
                        <input type="checkbox" id="agree" required />
                        <label htmlFor="agree">
                          I have agreed to the{" "}
                          <Link to="/terms" onClick={storeLocal} className="footer-link">
                            Terms and Conditions
                          </Link>
                        </label>
                      </div>

                      <button type="submit">Next</button>

                      <p className="login-text">
                        Already have an account?{" "}
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate("/login");
                          }}
                        >
                          Login
                        </a>
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="student-details">
              <h2>{isUpgrade ? "Update Plan" : "Student Details"}</h2>
              {isUpgrade && currentUserCourses()}
              <div className="student-details-wrapper">
                {!isUpgrade && (
                  <div className="left-section">
                    <p className="upload-text">Upload Profile Picture *</p>
                    <label htmlFor="file-input" className="custom-upload">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Profile" className="profile-preview" />
                      ) : (
                        <span className="upload-placeholder">+</span>
                      )}
                    </label>
                    <input
                      id="file-input"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden-input"
                    />
                  </div>
                )}
                <div className="right-section">
                  <div className="right-content">
                    <form onSubmit={handleFinalSubmit}>
                      {!isUpgrade && (
                        <>
                          <input
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            required
                          />

                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            required
                          >
                            <option value="">Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </>
                      )}

                      <div ref={courseDropdownRef} className="dropdown-wrapper">
                        <label>Course(s):</label>
                        <div
                          className="dropdown-display"
                          onClick={() => setCourseDropdownOpen(!courseDropdownOpen)}
                        >
                          {selectedCourses.length > 0 ? selectedCourses.join(", ") : "Select Course(s)"}
                        </div>
                        {courseDropdownOpen && (
                          <div className="dropdown-menu">
                            {["NEET"].map((course) => (
                              <label key={course} className="dropdown-item">
                                <input
                                  type="checkbox"
                                  checked={selectedCourses.includes(course)}
                                  onChange={() => toggleCourse(course)}
                                />
                                {course}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {selectedCourses.length > 0 && (
                        <div ref={standardDropdownRef} className="dropdown-wrapper">
                          <label>Standard(s):</label>
                          <div
                            className="dropdown-display"
                            onClick={() => setStandardDropdownOpen(!standardDropdownOpen)}
                          >
                            {selectedStandards.length > 0 ? selectedStandards.join(", ") : "Select Standard(s)"}
                          </div>
                          {standardDropdownOpen && (
                            <div className="dropdown-menu">
                              {["11th", "12th"].map((std) => (
                                <label key={std} className="dropdown-item">
                                  <input
                                    type="checkbox"
                                    checked={selectedStandards.includes(std)}
                                    onChange={() => toggleStandard(std)}
                                  />
                                  {std}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}


                      <div className="student-navigation-buttons">
                        <button
                          type="button"
                          onClick={() => (isUpgrade ? navigate("/home") : setStep(1))}
                        >
                          Previous
                        </button>
                        <button type="submit">Next</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment Section (Razorpay Integration) */}
          {step === 3 && (selectedPlan && selectedPlan !== 'trial' || isUpgrade) && (
            <div className="payment-section">
              <h2>{isUpgrade ? "Upgrade Plan" : `Pay for ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan`}</h2>
              <p className="plan-summary">
                **Selected Plan:** {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} ({selectedPlan === 'monthly' ? '₹1000' : '₹10000'})
              </p>

              <div className="payment-selection">
                {/* Promo Code section */}
                <div className="promo-section">
                  <input
                    type="text"
                    placeholder="Enter Promo Code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <button onClick={() => alert("Promo Applied: " + promoCode)}>Apply</button>
                </div>

                {/* Razorpay Button */}
                <div className="razorpay-button-wrapper">
                  {!paymentSuccess ? (
                    <button
                      onClick={handleFinalPayment}
                      disabled={isPaying}
                      className="select-plan-btn"
                      style={{ width: '100%', marginTop: '20px' }}
                    >
                      {isPaying ? "Opening Payment Gateway..." : "Proceed to Razorpay Payment"}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="select-plan-btn primary-btn"
                      style={{ width: '100%', marginTop: '20px', backgroundColor: '#34a853' }}
                    >
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