import React from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import "./Footer.css";
// ✅ FIX: Import directly from the same folder
import { useUser } from "./UserContext";

const Footer = () => {
  const { currentUser } = useUser();

  return (
    <footer className="footer">
      <p className="foot">@2025, Padmasini innovations Pvt Ltd. All rights reserved</p>
      <p className="foot">
        {currentUser ? "Need help? " : "For any enquiry: "}

        <Link to="/contact-us" className="footer-link">
          {currentUser ? "Contact Support" : "Contact Us"}
        </Link>
      </p>

      {/* Follow Us Section */}
      <div className="follow-us">
        <h3>Follow Us</h3>
        <div className="social-icons">
          <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">
            <FaFacebook className="icon facebook" />
          </a>
          <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">
            <FaInstagram className="icon instagram" />
          </a>
          <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer">
            <FaYoutube className="icon youtube" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;