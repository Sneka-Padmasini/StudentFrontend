import React from "react";
import { useNavigate } from "react-router-dom";
import "./terms.css";
// import whatsappIcon from "../assets/WhatsApp_icon.png"; // Uncomment if used

const Terms = () => {
  const navigate = useNavigate();

  const handleUnderstandClick = () => {
    navigate("/register");
  };

  return (
    <div className="terms-container">
      <div className="terms-content">
        <h1>Terms and Conditions</h1>
        <p>Last updated: January 2026</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Welcome to Padmasini Learning. These Terms and Conditions ("Terms")
            govern your use of our website, services, and educational products.
            By subscribing to or using our platform, you agree to comply with
            these Terms.
          </p>
        </section>

        <section>
          <h2>2. License and Usage</h2>
          <p>
            The Software grants you a limited, non-exclusive, non-transferable license
            to use its features for educational purposes only.
          </p>
          <ul>
            <li>You may not copy, modify, or distribute the Software without prior written consent.</li>
            <li>You may not use the Software for unlawful, harmful, or commercial exploitation outside the permitted scope.</li>
            <li>You may not attempt to reverse-engineer or interfere with the Software’s functionality.</li>
          </ul>
        </section>

        <section>
          <h2>3. Payment and Refund Policy</h2>
          <p>
            <strong>All sales are final.</strong> Please note that subscription fees,
            course purchases, and other payments made on the Padmasini platform
            are <strong>non-refundable and non-transferable</strong> under any
            circumstances. We encourage users to review the plan details carefully
            before proceeding with payment.
          </p>
        </section>

        <section>
          <h2>4. Content & Syllabus Alignment</h2>
          <p>
            The study materials, video lectures, and scripts provided on Padmasini
            Learning are <strong>curated to align with the NCERT syllabus guidelines</strong> specifically
            for NEET preparation.
            <br /><br />
            While we strive for precision, Padmasini Innovations Pvt Ltd assumes no liability for any inadvertent
            errors or omissions. The content is provided on an "as is" basis to support
            your academic journey.
          </p>
        </section>

        <section>
          <h2>5. AI-Generated Content</h2>
          <p>
            Our platform may generate educational content, explanations, or recommendations using
            artificial intelligence. Such content is provided for informational purposes only.
          </p>
          <ul>
            <li>It should not be considered professional, legal, medical, or financial advice.</li>
            <li>We do not guarantee the accuracy, completeness, or suitability of AI-generated content.</li>
          </ul>
        </section>

        <section>
          <h2>6. Intellectual Property Rights</h2>
          <p>
            All intellectual property rights in the Software, including its design, algorithms,
            video lectures, PDF notes, and content, remain the property of Padmasini Innovations Pvt Ltd.
            <br /><br />
            <strong>Strict Prohibition:</strong> You agree <strong>not to reproduce, distribute, record (screen record),
              or share</strong> our content with third parties. Users retain rights to their own uploaded content
            but grant the Software a license to use it for improving services.
          </p>
        </section>

        <section>
          <h2>7. User Responsibilities</h2>
          <p>
            By using this platform, you agree to the following responsibilities:
          </p>
          <ul>
            <li>Provide accurate information when registering.</li>
            <li><strong>Maintain the confidentiality of your account credentials.</strong> Sharing login credentials with multiple users is strictly prohibited and will lead to account suspension.</li>
            <li>Ensure that your use of the Software complies with applicable laws and regulations.</li>
          </ul>
        </section>

        <section>
          <h2>8. Data Privacy</h2>
          <p>
            The Software may collect and process personal data in accordance with our Privacy Policy.
            By using the Software, you consent to such data collection and processing.
          </p>
        </section>

        <section>
          <h2>9. Limitation of Liability</h2>
          <p>
            The Software is provided "as is" without warranties of any kind.
            Padmasini Innovations Pvt Ltd shall not be liable for:
          </p>
          <ul>
            <li>Errors or inaccuracies in AI-generated or study content.</li>
            <li>Losses arising from reliance on the Software.</li>
            <li>Technical issues, server downtime, or data loss.</li>
          </ul>
        </section>

        <section>
          <h2>10. Termination</h2>
          <p>
            Padmasini Innovations Pvt Ltd reserves the right to suspend or terminate your access
            if you violate these Terms. Upon termination, your license to use the Software
            will immediately cease.
          </p>
        </section>

        <section>
          <h2>11. Modifications</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Software
            after changes indicates acceptance of the revised Terms. Any changes will be posted on this page.
          </p>
        </section>

        <section>
          <h2>12. Governing Law</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of <strong>India</strong>.
            Any disputes shall be resolved exclusively in the courts of India.
          </p>
        </section>

        <section>
          <h2>13. Contact Us</h2>
          <p>
            If you have any questions about these Terms and Conditions, please
            contact us at: <br />
            <a
              href="https://mail.google.com/mail/?view=cm&to=learnforward@padmasini.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              learnforward@padmasini.com
            </a>
          </p>
        </section>

        {/* "I Understand" Button */}
        <div className="agree-button">
          <button onClick={handleUnderstandClick}>
            I Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default Terms;