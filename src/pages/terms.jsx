import React from "react";
import { useNavigate } from "react-router-dom";
import "./terms.css";
import whatsappIcon from "../assets/WhatsApp_icon.png"; // Adjust path if needed


const Terms = () => {
  const navigate = useNavigate(); // This hook will help us navigate to another page

  const handleUnderstandClick = () => {
    // Redirect to the registration page (assuming the route is "/register")
    navigate("/register");
  };

  return (
    <div className="terms-container">
      <div className="terms-content">
        <h1>Terms and Conditions</h1>
        <p>Last updated: April 2025</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Welcome to our platform. These Terms and Conditions ("Terms") govern
            your use of our website, services, and products. By using our website
            or services, you agree to comply with these Terms.
          </p>
        </section>

        <section>
          <h2>2. User Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your
            account and for all activities that occur under your account. You
            agree to notify us immediately of any unauthorized use of your
            account.
          </p>
        </section>

        <section>
          <h2>3. Privacy Policy</h2>
          <p>
            Your privacy is important to us. Please review our Privacy Policy to
            understand how we collect, use, and protect your personal information.
          </p>
        </section>

        <section>
          <h2>4. Restrictions</h2>
          <p>
            You agree not to engage in any prohibited activities such as
            impersonating others, distributing malware, or violating the rights of
            others while using our platform.
          </p>
        </section>

        <section>
          <h2>5. Limitation of Liability</h2>
          <p>
            Our liability is limited to the maximum extent allowed by law. We are
            not liable for any indirect, incidental, special, or consequential
            damages arising from your use of the website or services.
          </p>
        </section>

        <section>
          <h2>6. Modifications</h2>
          <p>
            We reserve the right to modify these Terms at any time. Any changes
            will be posted on this page with the updated date.
          </p>
        </section>

        <section>
          <h2>7. Governing Law</h2>
          <p>
            These Terms are governed by the laws of India. Any disputes
            will be resolved under the jurisdiction of the courts in India.
          </p>
        </section>

        <section>
          <h2>8. Contact Us</h2>
          <p>
            If you have any questions about these Terms and Conditions, please
            contact us at <a
  href="https://mail.google.com/mail/?view=cm&to=sales@padmasini.com,support@padmasini.com"
  target="_blank"
  rel="noopener noreferrer"
>
  sales@padmasini.com, support@padmasini.com
</a>.
          </p>
        </section>

        {/* "I Understand" Button */}
        <div className="agree-button">
          <button onClick={handleUnderstandClick}>
            I Understand
          </button>
        </div>
      </div>
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

export default Terms;
