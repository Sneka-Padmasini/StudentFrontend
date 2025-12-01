// src/Pages/PricingPage.jsx
import React, { useState, useEffect } from 'react'; // ✅ Import useState and useEffect
import { useNavigate } from 'react-router-dom';
import './PricingPage.css';

const PricingPage = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null); // ✅ State to store logged-in user

    // ✅ Check if user is already logged in when page loads
    useEffect(() => {
        const userStr = localStorage.getItem("currentUser");
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }
    }, []);

    const handlePlanSelection = (planType) => {
        if (currentUser) {
            // ✅ CASE 1: USER IS LOGGED IN -> UPGRADE FLOW
            // We pass '&upgrade=true' so Registration page knows to skip password/OTP
            navigate(`/register?plan=${planType}&upgrade=true`);
        } else {
            // ❌ CASE 2: NEW USER -> REGISTRATION FLOW
            navigate(`/register?plan=${planType}`);
        }
    };

    return (
        <div className="pricing-page-container">
            <h2>Choose Your Learning Plan</h2>

            {/* ✅ Optional: Show a friendly message if logged in */}
            {currentUser && (
                <div style={{ textAlign: 'center', marginBottom: '20px', color: '#555' }}>
                    <p>Current Plan: <strong>{currentUser.plan ? currentUser.plan.toUpperCase() : "None"}</strong></p>
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
                        // ✅ Disable if they are already on trial to prevent abuse
                        disabled={currentUser && currentUser.plan === 'trial'}
                        style={currentUser && currentUser.plan === 'trial' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                        {currentUser && currentUser.plan === 'trial' ? "Current Plan" : "Start 10-Day Free Trial"}
                    </button>
                </div>

                {/* Plan 2: Paid Plans (Monthly/Yearly) */}
                <div className="pricing-card">
                    <h3>Full Access Plan 🚀</h3>
                    <div className="price-options">
                        {/* Monthly Option */}
                        <div className="plan-option">
                            <span className="price-amount">₹1000</span>
                            <span className="price-term">/month</span>
                            <button
                                className="select-plan-btn small-btn primary-btn"
                                onClick={() => handlePlanSelection('monthly')}
                            >
                                Go Monthly
                            </button>
                        </div>

                        {/* Yearly Option */}
                        <div className="plan-option">
                            <span className="price-amount">₹10000</span>
                            <span className="price-term">/year (Save ₹2000!)</span>
                            <button
                                className="select-plan-btn small-btn primary-btn"
                                onClick={() => handlePlanSelection('yearly')}
                            >
                                Go Yearly
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