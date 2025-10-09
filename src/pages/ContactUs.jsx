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
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true); // Start loading

  try {
    const response = await fetch("/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setSubmitted(true);
    } else {
      alert("Failed to send email. Please try again.");
    }
  } catch (err) {
    console.error("Request error:", err);
    alert("Server not reachable.");
  } finally {
    setSubmitting(false); // Stop loading
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
      <h2>Contact Us</h2>
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
          <textarea
            name="enquiry"
            placeholder="Enquiry"
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
            <a
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
            </a>
    </div>
  );
};

export default ContactUs;
