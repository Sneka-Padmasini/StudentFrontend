// src/Pages/PricingPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PricingPage.css';
import { API_BASE_URL } from "../config"; // Ensure this is imported correctly

const PricingPage = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // 1. Try local storage first (Immediate UI update)
        const userStr = localStorage.getItem("currentUser");
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }

        // 2. Fetch fresh data from server (Critical Fix for "Plan: None")
        fetch(`${API_BASE_URL}/api/checkSession`, {
            method: "GET",
            credentials: 'include'
        })
            .then(resp => resp.json())
            .then(data => {
                if (data.status === "pass") {
                    console.log("Pricing Page - Fresh Data:", data);
                    setCurrentUser(data); // Update state with fresh plan
                    localStorage.setItem("currentUser", JSON.stringify(data)); // Sync local storage
                }
            })
            .catch(err => console.error("Pricing session check failed", err));

    }, []);

    const handlePlanSelection = (planType) => {
        // Logic: Is this a renewal of the SAME plan?
        const isSamePlan = currentUser && currentUser.plan === planType;

        let url = `/register?plan=${planType}`;

        if (currentUser) {
            url += `&upgrade=true`; // Skip password step
        }

        if (isSamePlan) {
            url += `&renew=true`; // ✅ Renewal Flag
        }

        navigate(url);
    };

    const currentPlanText = currentUser?.plan ? currentUser.plan.toUpperCase() : "NONE";

    return (
        <div className="pricing-page-container">
            <h2>Choose Your Learning Plan</h2>

            {/* ✅ Display Plan Status */}
            {currentUser && (
                <div style={{ textAlign: 'center', marginBottom: '20px', color: '#555' }}>
                    <p>Current Plan: <strong>{currentPlanText}</strong></p>
                    {/* Optional: Show expiry date */}
                    {currentUser.endDate && <p style={{ fontSize: '12px', color: '#777' }}>Valid till: {currentUser.endDate}</p>}
                </div>
            )}

            <div className="pricing-plans-wrapper">

                {/* Plan 1: Free Trial */}
                <div className="pricing-card free-trial-card">
                    <h3>10-Day Free Trial ✨</h3>
                    <div className="price">₹0</div>
                    <p className="duration">Free for 10 days</p>
                    <ul className="features">
                        <li>✅ Full access to NEET course content</li>
                        <li>✅ Limited mock tests</li>
                        <li>✅ Personalized learning features</li>
                        <li>✅ Quick and hassle-free registration</li>
                    </ul>
                    <button
                        className="select-plan-btn"
                        onClick={() => handlePlanSelection('trial')}
                        // 🛑 FREE TRIAL CANNOT BE RENEWED/EXTENDED
                        disabled={currentUser && (currentUser.plan === 'trial' || currentUser.plan === 'monthly' || currentUser.plan === 'yearly')}
                        style={currentUser && currentUser.plan ? { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#ccc' } : {}}
                    >
                        {currentUser && currentUser.plan === 'trial' ? "Trial Active" : "Start 10-Day Free Trial"}
                    </button>
                </div>

                {/* Plan 2: Paid Plans */}
                <div className="pricing-card">
                    <h3>Full Access Plan 🚀</h3>
                    <div className="price-options">

                        {/* MONTHLY BUTTON */}
                        <div className="plan-option">
                            <span className="price-amount">₹1000</span>
                            <span className="price-term">/month</span>
                            <button
                                className="select-plan-btn small-btn primary-btn"
                                onClick={() => handlePlanSelection('monthly')}
                                // ✅ ENABLED ALWAYS (Unless on Yearly)
                                disabled={currentUser && currentUser.plan === 'yearly'}
                                style={currentUser && currentUser.plan === 'yearly' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                            >
                                {/* Change text based on status */}
                                {currentUser && currentUser.plan === 'monthly' ? "Extend +1 Month" : "Go Monthly"}
                            </button>
                        </div>

                        {/* YEARLY BUTTON */}
                        <div className="plan-option">
                            <span className="price-amount">₹10000</span>
                            <span className="price-term">/year (Save ₹2000!)</span>
                            <button
                                className="select-plan-btn small-btn primary-btn"
                                onClick={() => handlePlanSelection('yearly')}
                            >
                                {currentUser && currentUser.plan === 'yearly' ? "Extend +1 Year" : "Go Yearly"}
                            </button>
                        </div>
                    </div>

                    <ul className="features full-features">
                        <li>✅ Unlimited access to all NEET content</li>
                        <li>✅ Unlimited mock tests and practice sets</li>
                        <li>✅ Access to AI-generated lecture videos</li>
                        <li>✅ Full access to personalized learning modules</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;