import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import "./StudyGoalModal.css"; // Create this CSS file for basic styling

const StudyGoalModal = ({ user, onUpdate }) => {
    const [hours, setHours] = useState(3);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        // 1. Safety check
        if (!user) return;

        // 2. Parse Data
        // Handle "3" (string) vs 3 (number)
        const hours = parseInt(user.comfortableDailyHours || 0);
        const isPaidUser = user.plan !== "trial"; // Ensure this matches your DB value exactly (check case sensitivity)

        // 3. Logic: Should the modal be open?
        const shouldBeOpen = isPaidUser && hours === 0;

        // 4. Force state based on logic
        // This ensures if data updates from 0 -> 3, the modal closes automatically.
        if (shouldBeOpen) {
            console.log("🎯 Goal not set (Hours: 0). Opening Modal.");
            setIsOpen(true);
        } else {
            // ✅ FIX: Close modal if goal IS set (prevents it from getting stuck open)
            if (isOpen) {
                console.log("✅ Goal found (" + hours + " hrs). Closing Modal.");
                setIsOpen(false);
            }
        }
    }, [user, user.comfortableDailyHours]);


    const handleSave = async () => {
        setLoading(true);

        // ✅ FIX: Ensure we have the email, as the backend relies on it now
        const targetEmail = user.email || "";

        // Debug log
        console.log("📤 Sending Goal:", { email: targetEmail, hours: hours });

        if (!targetEmail) {
            alert("User email missing. Please re-login.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/update-study-goal`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                // ✅ PAYLOAD: Send email and hours
                body: JSON.stringify({
                    email: targetEmail,
                    hours: parseInt(hours)
                }),
            });

            if (response.ok) {
                setIsOpen(false);
                if (onUpdate) onUpdate(parseInt(hours));
                alert("Goal set successfully! 🚀");
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
            <div className="modal-content">
                <h2>Set Your Daily Target 🎯</h2>
                <p>Since you are a premium member, let's personalize your schedule.</p>
                <p><strong>How many hours can you dedicate daily?</strong></p>

                <div className="goal-input-container">
                    <input
                        type="number"
                        min="1"
                        max="16"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                    />
                    <span>Hrs/Day</span>
                </div>

                <button onClick={handleSave} disabled={loading} className="save-goal-btn">
                    {loading ? "Saving..." : "Set Goal"}
                </button>
            </div>
        </div>
    );
};

export default StudyGoalModal;