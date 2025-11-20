// src/Pages/PricingPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PricingPage.css'; // You'll need to create this CSS file

const PricingPage = () => {
    const navigate = useNavigate();

    const handlePlanSelection = (planType) => {
        // All plans (trial, monthly, yearly) should start the registration flow at step 1.
        // We pass the selected plan as a query parameter.
        navigate(`/register?plan=${planType}`);
    };

    return (
        <div className="pricing-page-container">
            <h2>Choose Your Learning Plan</h2>

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
                    >
                        Start 10-Day Free Trial
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