import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ContactUs.css";
import whatsappIcon from "../assets/WhatsApp_icon.png"; // Make sure this path is correct

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    enquiry: "",
    category: "", // Default category
    file: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // ✅ NEW STATE

  const navigate = useNavigate();

  React.useEffect(() => {
    // ✅ FIX 1: The key in your browser is "currentUser"
    const storedUser = localStorage.getItem("currentUser");

    if (storedUser) {
      setIsLoggedIn(true);
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("Logged in user found:", parsedUser);

        setFormData((prev) => ({
          ...prev,
          // ✅ FIX 2: Map the keys exactly as they appear in your data
          name: parsedUser.userName || "",
          email: parsedUser.email || "",
          phone: parsedUser.phoneNumber || "",
        }));
      } catch (e) {
        console.error("Error parsing user details", e);
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const maxSizeInMB = 20; // Set your limit here (e.g. 20MB)

    if (file) {
      if (file.size > maxSizeInMB * 1024 * 1024) {
        alert(`File size exceeds ${maxSizeInMB}MB. Please upload a smaller file.`);
        e.target.value = null; // Reset input
        return;
      }
      setFormData({ ...formData, file: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const dataToSend = new FormData();
    dataToSend.append("name", formData.name);
    dataToSend.append("email", formData.email);
    dataToSend.append("phone", formData.phone);
    dataToSend.append("category", formData.category);
    dataToSend.append("enquiry", formData.enquiry);

    if (formData.file) {
      dataToSend.append("file", formData.file);
    }

    try {
      // ✅ FIX: Use the full path /api/send-email
      // The proxy in vite.config.js will forward this to http://localhost:8080/api/send-email
      const response = await fetch("/api/send-email", {
        method: "POST",
        body: dataToSend,
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        // Try to read the error message from backend
        const errorData = await response.json();
        alert("Failed: " + (errorData.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Request error:", err);
      alert("Server connection failed. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  };


  const handleClose = () => {
    setSubmitted(false);
    navigate("/"); // Redirect to homepage
  };

  // Capitalize the name
  const capitalizeName = (name) =>
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  return (
    <div className="contact-container">
      <h2>{isLoggedIn ? "For Support" : "For Enquiry"}</h2>
      <div className="contact-form-box">
        <form onSubmit={handleSubmit}>
          <input
            className="form-name"
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />


          {/* Category Dropdown */}
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="form-select"
          >
            <option value="" disabled>Select Category</option>

            {/* ✅ CONDITIONAL OPTIONS */}
            {isLoggedIn ? (
              /* Support Options (Logged In) */
              <>
                <option value="Video">Video Issue</option>
                <option value="Test">Test/Quiz Issue</option>
                <option value="Lesson">Lesson Content</option>
                <option value="Payment">Payment/Subscription</option>
                <option value="Others">Others</option>
              </>
            ) : (
              /* Enquiry Options (Not Logged In) */
              <>
                <option value="General">General Enquiry</option>
                <option value="Courses">Course Details</option>
                <option value="Pricing">Pricing & Plans</option>
                <option value="LoginIssue">Registration Issue</option>
                <option value="Others">Others</option>
              </>
            )}


          </select>

          {/* File Upload Input */}
          <div className="file-input-container">
            <label htmlFor="file-upload" className="file-label">
              Upload Screenshot or Video (Max 20MB)
            </label>
            <input
              id="file-upload"
              type="file"
              name="file"
              accept="image/*,video/*" // Accepts images and videos
              onChange={handleFileChange}
              className="form-file"
            />
          </div>

          {/* <textarea
            name="enquiry"
            placeholder="Enquiry"
            value={formData.enquiry}
            onChange={handleChange}
            required
          /> */}
          <textarea
            name="enquiry"
            // ✅ UPDATED PLACEHOLDER
            placeholder={isLoggedIn ? "Describe your issue..." : "Type your enquiry..."}
            value={formData.enquiry}
            onChange={handleChange}
            required
          />
          <div className="form-requirements">
            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>

      {/* Thank You Popup */}
      {submitted && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Thank you {capitalizeName(formData.name)}, for reaching out!</h2>
            <p>We appreciate your enquiry and will get back to you shortly.</p>
            <button className="popup-close-button" onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Button */}
      {/* <a
              href="https://wa.me/8248791389"
              className="whatsapp-chat-button"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with us on WhatsApp"
            >
              <img
                src={whatsappIcon}
                alt="WhatsApp"
                className="whatsapp-icon"
              />
              <span>Chat with us on whatsapp</span>
            </a> */}
    </div>
  );
};

export default ContactUs;