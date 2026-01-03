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
          <h2>2. Payment and Refund Policy</h2>
          <p>
            <strong>All sales are final.</strong> Please note that subscription fees,
            course purchases, and other payments made on the Padmasini platform
            are <strong>non-refundable and non-transferable</strong> under any
            circumstances. We encourage users to review the plan details carefully
            before proceeding with payment.
          </p>
        </section>

        <section>
          <h2>3. Content & Syllabus Alignment</h2>
          <p>
            The study materials, video lectures, and scripts provided on Padmasini
            Learning are <strong>curated to align with the NCERT syllabus guidelines</strong> specifically
            for NEET preparation. We are committed to providing high-quality educational
            resources that reflect current examination standards. <br /><br />
            While we strive for precision and excellence in our content creation,
            Padmasini Innovations Pvt Ltd assumes no liability for any inadvertent
            errors, omissions, or technical inaccuracies that may appear in the
            materials. The content is provided on an "as is" basis to support
            your academic journey.
          </p>
        </section>


        <section>
          <h2>4. Intellectual Property Rights</h2>
          <p>
            All content provided on this platform, including but not limited to
            video lectures, PDF notes, quizzes, and code, is the intellectual
            property of Padmasini Innovations Pvt Ltd. <br /><br />
            You agree <strong>not to reproduce, distribute, record (screen record),
              or share</strong> our content with third parties. Any violation of this
            clause may result in immediate account termination without refund and
            potential legal action.
          </p>
        </section>

        <section>
          <h2>5. Our Commitment to Your Success</h2>
          <p>
            At Padmasini Learning, we are fully dedicated to empowering your NEET
            journey with top-tier resources, structured study plans, and expert guidance.
            <strong>We promise to provide the best possible tools to maximize your potential.</strong>
            <br /><br />
            However, achieving a medical seat is a partnership between our content
            and your hard work. While we guarantee our commitment to quality, final
            admission and rank depend on individual student dedication, consistent
            practice, and exam-day performance.
          </p>
        </section>

        <section>
          <h2>6. User Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your
            account and for all activities that occur under your account.
            Sharing login credentials with multiple users is strictly prohibited
            and will lead to account suspension.
          </p>
        </section>

        <section>
          <h2>7. Privacy Policy</h2>
          <p>
            Your privacy is important to us. Please review our Privacy Policy to
            understand how we collect, use, and protect your personal information.
          </p>
        </section>

        <section>
          <h2>8. Limitation of Liability</h2>
          <p>
            Our liability is limited to the maximum extent allowed by law. We are
            not liable for any indirect, incidental, or consequential damages
            arising from server downtime, data loss, or your use of the services.
          </p>
        </section>

        <section>
          <h2>9. Modifications</h2>
          <p>
            We reserve the right to modify these Terms at any time. Any changes
            will be posted on this page with the updated date. Continued use of
            the app constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2>10. Governing Law</h2>
          <p>
            These Terms are governed by the laws of India. Any disputes will be
            resolved under the exclusive jurisdiction of the courts in India.
          </p>
        </section>

        <section>
          <h2>11. Contact Us</h2>
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

export default Terms;