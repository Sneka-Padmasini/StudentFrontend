import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import "./StudyGoalModal.css";

// Estimated total hours for NEET (approx 90 chapters * 10 hrs)
const TOTAL_COURSE_HOURS = 900;

const StudyGoalModal = ({ user, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Hours, 2: Calc, 3: Severity
    const [loading, setLoading] = useState(false);
    const [totalCourseHours, setTotalCourseHours] = useState(1940); // Default fallback
    const [advisedHours, setAdvisedHours] = useState(4);

    // Form State
    const [hours, setHours] = useState(3);
    const [severity, setSeverity] = useState("Proficient (80%)");


    useEffect(() => {
        if (!user) return;

        const savedHours = parseInt(user.comfortableDailyHours || 0);
        const savedSeverity = user.severity;
        const isPaidUser = user.plan && user.plan !== "trial";

        // Logic: Open if Paid User + Hours are 0 (Not set yet)
        if (isPaidUser && savedHours === 0) {
            setIsOpen(true);
        }

        // Pre-fill existing data
        if (savedHours > 0) setHours(savedHours);
        if (savedSeverity) setSeverity(savedSeverity);

    }, [user]);

    useEffect(() => {
        // 1. Fetch Dynamic Hours from Backend
        const fetchMetrics = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/course-metrics`);
                const data = await res.json();
                if (data.totalHours) {
                    setTotalCourseHours(data.totalHours);
                    setAdvisedHours(data.advisedDailyHours);
                }
            } catch (err) {
                console.error("Using default metrics");
            }
        };
        fetchMetrics();

        // 2. Existing User Data Logic (Keep your existing code here)
        if (!user) return;
        const savedHours = parseInt(user.comfortableDailyHours || 0);
        const savedSeverity = user.severity;
        const isPaidUser = user.plan && user.plan !== "trial";

        if (isPaidUser && savedHours === 0) setIsOpen(true);
        if (savedHours > 0) setHours(savedHours);
        if (savedSeverity) setSeverity(savedSeverity);

    }, [user]);

    // --- Calculation Helper ---
    const calculateCompletion = (dailyHours) => {
        if (!dailyHours || dailyHours <= 0) return "Unknown";
        const daysNeeded = Math.ceil(totalCourseHours / dailyHours); // ✅ Uses dynamic state
        const months = Math.ceil(daysNeeded / 30);
        return `${months} Months`;
    };

    // --- Helper to extract percentage for display ---
    const getPercentageDisplay = (val) => {
        if (val.includes("70%")) return "70%";
        if (val.includes("80%")) return "80%";
        if (val.includes("90%")) return "90%";
        return "80%";
    };

    // --- Navigation Handlers ---
    const handleNext = () => {
        if (step < 3) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    // --- Final Save Handler ---
    const handleSave = async () => {
        setLoading(true);
        const targetEmail = user.email || "";

        if (!targetEmail) {
            alert("User email missing. Please re-login.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/update-study-goal`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: targetEmail,
                    hours: parseInt(hours),
                    severity: severity
                }),
            });

            if (response.ok) {
                setIsOpen(false);
                if (onUpdate) onUpdate(parseInt(hours));
                alert("Study Plan Activated Successfully! 🚀");
            } else {
                const data = await response.json();
                alert(data.message || "Failed to save goal.");
            }
        } catch (error) {
            console.error(error);
            alert("Error connecting to server.");
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content wizard-modal">

                {/* --- HEADER --- */}
                <div className="wizard-header">
                    <h2>🎯 Personalize Your Plan</h2>
                    <div className="step-indicators">
                        <span className={`dot ${step >= 1 ? "active" : ""}`}></span>
                        <span className={`dot ${step >= 2 ? "active" : ""}`}></span>
                        <span className={`dot ${step >= 3 ? "active" : ""}`}></span>
                    </div>
                </div>

                {/* --- BODY --- */}
                <div className="wizard-body">

                    {/* STEP 1: HOURS */}
                    {step === 1 && (
                        <div className="step-content fade-in">
                            <div className="icon-badge">⏱️</div>
                            <h3>Daily Commitment</h3>

                            <p className="premium-note">
                                Since you are a <strong>Premium Member</strong>, let's personalize your schedule. 🌟
                            </p>

                            <p>How many hours can you dedicate to studying every day?</p>

                            <div className="input-group-large">
                                <input
                                    type="number"
                                    min="1"
                                    max="16"
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    autoFocus
                                />
                                <span>Hrs/Day</span>
                            </div>
                            <p style={{ fontSize: "0.85rem", color: "#2e7d32", marginTop: "15px", fontWeight: "500" }}>
                                💡 Recommended: {advisedHours} Hrs/Day (to finish 1 lesson every 5 days)
                            </p>
                        </div>
                    )}

                    {/* STEP 2: INSIGHT */}
                    {step === 2 && (
                        <div className="step-content fade-in">
                            <div className="icon-badge">📅</div>
                            <h3>Estimated Timeline</h3>
                            <p>At <strong>{hours} hours/day</strong>, you will complete the full syllabus in approximately:</p>

                            <div className="insight-box">
                                <span className="big-number">{calculateCompletion(hours)}</span>
                                <span className="sub-text">Based on our {totalCourseHours} hr syllabus</span>                            </div>
                        </div>
                    )}

                    {/* STEP 3: SEVERITY */}
                    {step === 3 && (
                        <div className="step-content fade-in">
                            <div className="icon-badge">🔥</div>
                            <h3>Mastery Threshold</h3>

                            <p>Set a target based on your <strong>confidence level</strong> to challenge yourself:</p>

                            <div className="select-wrapper">
                                <select
                                    className="severity-dropdown"
                                    value={severity}
                                    onChange={(e) => setSeverity(e.target.value)}
                                >
                                    <option value="Competent (70%)">Competent (I'm building basics)</option>
                                    <option value="Proficient (80%)">Proficient (I'm confident)</option>
                                    <option value="Expert (90%)">Expert (I'm aiming for top rank)</option>
                                </select>
                            </div>

                            {/* ✅ ADDED: Visible Percentage Display */}
                            <div className="score-display">
                                Target Score: <strong>{getPercentageDisplay(severity)}</strong>
                            </div>

                            <div className="hint-box">
                                <small>ℹ️ This sets the bar for your self-assessment in practice tests.</small>
                            </div>
                        </div>
                    )}

                </div>

                {/* --- FOOTER --- */}
                <div className="wizard-footer">
                    {step > 1 ? (
                        <button className="nav-btn back-btn" onClick={handleBack} disabled={loading}>
                            Back
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {step < 3 ? (
                        <button className="nav-btn next-btn" onClick={handleNext}>
                            Next &rarr;
                        </button>
                    ) : (
                        <button className="nav-btn finish-btn" onClick={handleSave} disabled={loading}>
                            {loading ? "Saving..." : "Confirm & Start 🚀"}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default StudyGoalModal;