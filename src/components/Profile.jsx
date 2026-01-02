// src/components/Profile.jsx
import React, { useState, useEffect } from "react";
import { useUser } from "./UserContext";
import { API_BASE_URL } from "../config";
import "./Profile.css";
import { FaUserEdit, FaSave, FaTimes } from "react-icons/fa";

const Profile = () => {
    const { currentUser, login } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        comfortableDailyHours: currentUser?.comfortableDailyHours || "",
        severity: currentUser?.severity || "Medium",
    });

    // Sync state with user data
    useEffect(() => {
        if (currentUser) {
            setFormData({
                comfortableDailyHours: currentUser.comfortableDailyHours || 0,
                severity: currentUser.severity || "Medium",
            });
        }
    }, [currentUser]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };


    const handleSave = async () => {
        setLoading(true);
        try {
            // 1. Send Update to Backend
            const response = await fetch(`${API_BASE_URL}/api/update-study-goal`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: currentUser.email,
                    hours: parseInt(formData.comfortableDailyHours),
                    severity: formData.severity
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // 2. Prepare updated user object
                const updatedUser = {
                    ...currentUser,
                    comfortableDailyHours: parseInt(formData.comfortableDailyHours),
                    severity: formData.severity
                };

                // 3. Update Storage & Context synchronously
                localStorage.setItem("currentUser", JSON.stringify(updatedUser));
                login(updatedUser);

                setIsEditing(false);

                // 4. Force Hard Reload to sync Backend Session
                alert("Profile updated successfully! Refreshing data...");
                window.location.href = window.location.href;
            } else {
                alert(data.message || "Failed to update profile");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) return <div className="profile-loading">Loading Profile...</div>;

    const courseDisplay = currentUser.coursetype || currentUser.courseName || "-";
    const standardsDisplay = Array.isArray(currentUser.standards)
        ? currentUser.standards.join(", ")
        : currentUser.standards || "-";

    return (
        <div className="profile-page-wrapper">
            <div className="profile-container">

                <div className="profile-card">
                    <div className="card-header-row">
                        <h1>My Profile</h1>
                    </div>

                    <hr className="divider" />

                    {/* --- Read Only Fields --- */}
                    <div className="profile-section">
                        <h3 className="section-title">Personal Information</h3>
                        <div className="detail-row">
                            <span className="label">Name:</span>
                            <span className="value">{currentUser.userName}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Email:</span>
                            <span className="value">{currentUser.email}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Mobile:</span>
                            <span className="value">{currentUser.phoneNumber || "-"}</span>
                        </div>
                    </div>

                    <hr className="divider" />

                    {/* --- Academic Details --- */}
                    <div className="profile-section">
                        <h3 className="section-title">Academic Details</h3>
                        <div className="detail-row">
                            <span className="label">Course:</span>
                            <span className="value">{courseDisplay}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Standards:</span>
                            <span className="value">{standardsDisplay}</span>
                        </div>
                    </div>

                    <hr className="divider" />

                    {/* --- Editable Preference Section --- */}

                    <div className="profile-section">
                        {/* ✅ UPDATED HEADER WITH BUTTONS */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 className="section-title" style={{ margin: 0, borderBottom: 'none' }}>Study Preferences</h3>

                            {!isEditing ? (
                                <button className="edit-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setIsEditing(true)}>
                                    <FaUserEdit /> Edit
                                </button>
                            ) : (
                                <div className="edit-actions">
                                    <button className="cancel-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setIsEditing(false)} disabled={loading}>
                                        <FaTimes />
                                    </button>
                                    <button className="save-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={handleSave} disabled={loading}>
                                        <FaSave /> Save
                                    </button>
                                </div>
                            )}
                        </div>

                        <div style={{ borderBottom: '2px solid #e9fdec', marginBottom: '20px' }}></div>

                        <div className="detail-row">
                            <span className="label">Comfortable Study Hours (Daily):</span>
                            {isEditing ? (
                                <input
                                    type="number"
                                    name="comfortableDailyHours"
                                    className="profile-input"
                                    value={formData.comfortableDailyHours}
                                    onChange={handleInputChange}
                                    min="1"
                                    max="24"
                                />
                            ) : (
                                <span className="value highlight-value">
                                    {currentUser.comfortableDailyHours
                                        ? `${currentUser.comfortableDailyHours} Hours`
                                        : "Not set"}
                                </span>
                            )}
                        </div>

                        <div className="detail-row">
                            <span className="label">Mastery Level:</span>
                            {isEditing ? (
                                <select
                                    name="severity"
                                    className="profile-input"
                                    value={formData.severity}
                                    onChange={handleInputChange}
                                >
                                    <option value="Competent (70%)">Competent (70%)</option>
                                    <option value="Proficient (80%)">Proficient (80%)</option>
                                    <option value="Expert (90%)">Expert (90%)</option>
                                </select>
                            ) : (
                                <span className="value">{formData.severity}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;