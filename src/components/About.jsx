// About.jsx
import React, { useState, useEffect } from "react";
import "./About.css";

const About = () => {
    const [activeSection, setActiveSection] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const sections = document.querySelectorAll('.about-section');
            const scrollPos = window.scrollY + 100;

            sections.forEach((section, index) => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                    setActiveSection(index);
                }
            });
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (index) => {
        const sections = document.querySelectorAll('.about-section');
        sections[index].scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="about-container">
            {/* Navigation Dots */}
            <div className="section-nav">
                {/* {['Welcome', 'Vision', 'Mission', 'Values', 'Team'].map((item, index) => ( */}
                {['Welcome', 'Vision', 'Mission', 'Values'].map((item, index) => (
                    <button
                        key={index}
                        className={`nav-dot ${activeSection === index ? 'active' : ''}`}
                        onClick={() => scrollToSection(index)}
                        title={item}
                    >
                        <span>{item}</span>
                    </button>
                ))}
            </div>

            {/* Hero Section */}
            <section className="about-section hero-section">
                <div className="hero-content">
                    <h1 className="company-name">Padmasini Innovations Pvt Ltd</h1>
                    <p className="company-tagline">Innovating Education, Empowering Students</p>

                    {/* ADDED SUMMARY HERE */}
                    <div className="hero-summary" style={{ marginTop: '20px', maxWidth: '800px' }}>
                        <p>
                            Home of <strong> Cheeku</strong> – Your personal AI-powered NEET Companion.
                            We go beyond traditional learning by providing an AI agent that listens, plans, teaches,
                            and motivates you daily. It's not just an app; it's a study partner dedicated to your victory.
                        </p>
                    </div>

                    <div className="hero-stats">
                        <div className="stat">
                            <h3>2+</h3>
                            <p>Courses</p>
                        </div>
                        <div className="stat">
                            <h3>500+</h3>
                            <p>Students</p>
                        </div>
                        <div className="stat">
                            <h3>50+</h3>
                            <p>Expert Faculty</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Vision Section */}
            <section className="about-section vision-section">
                <div className="section-content">
                    <div className="text-content">
                        <h2>Our Vision</h2>
                        <p>
                            To be a leading ed-tech company that transforms education through technology and innovation, making high-quality learning accessible to students across India.
                        </p>
                        <p>
                            We aim to empower every learner to achieve academic excellence and succeed in competitive exams and personal growth.
                        </p>
                    </div>
                    <div className="image-content">
                        <div className="vision-graphic">
                            <div className="graphic-item">Innovation</div>
                            <div className="graphic-item">Excellence</div>
                            <div className="graphic-item">Accessibility</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="about-section mission-section">
                <div className="section-content reverse">
                    <div className="image-content">
                        <div className="mission-cards">
                            <div className="mission-card">
                                <h4>Quality Learning</h4>
                                <p>Provide structured and interactive educational resources</p>
                            </div>
                            <div className="mission-card">
                                <h4>Expert Mentorship</h4>
                                <p>Guidance from experienced educators and industry experts</p>
                            </div>
                            <div className="mission-card">
                                <h4>Inclusive Education</h4>
                                <p>Making learning accessible to students from all backgrounds</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-content">
                        <h2>Our Mission</h2>
                        <p>
                            To deliver personalized, technology-driven education solutions while fostering critical thinking, creativity, and exam readiness for students across India.
                        </p>
                        <ul className="mission-list">
                            <li>Deliver innovative and interactive learning experiences</li>
                            <li>Provide expert mentorship and support</li>
                            <li>Ensure accessible and inclusive education for all students</li>
                            <li>Help students excel in competitive exams and school curricula</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="about-section values-section">
                <div className="section-content">
                    <div className="text-content">
                        <h2>Our Core Values</h2>
                        <p>Principles guiding Padmasini Innovations Pvt Ltd</p>
                    </div>
                    <div className="values-grid">
                        <div className="value-item">
                            <div className="value-icon">🎯</div>
                            <h4>Excellence</h4>
                            <p>Delivering high-quality educational content and services</p>
                        </div>
                        <div className="value-item">
                            <div className="value-icon">💡</div>
                            <h4>Innovation</h4>
                            <p>Continuous improvement and cutting-edge solutions for learning</p>
                        </div>
                        <div className="value-item">
                            <div className="value-icon">🤝</div>
                            <h4>Integrity</h4>
                            <p>Transparency and honesty in all operations</p>
                        </div>
                        <div className="value-item">
                            <div className="value-icon">🌍</div>
                            <h4>Accessibility</h4>
                            <p>Making education reachable for students everywhere</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            {/* <section className="about-section team-section">
        <div className="section-content">
          <div className="text-content">
            <h2>Our Leadership</h2>
            <p>Meet the key management personnel driving Padmasini Innovations</p>
          </div>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-avatar">GB</div>
              <h4>Govindaraj</h4>
              <p className="member-role">Director</p>
              <p>Co-founder and driving strategic vision for growth and innovation</p>
            </div>
            <div className="team-member">
              <div className="member-avatar">DB</div>
              <h4>Bhuvaneswari</h4>
              <p className="member-role">Director</p>
              <p>Overseeing operations and ensuring excellence in education delivery</p>
            </div>
            <div className="team-member">
              <div className="member-avatar">SD</div>
              <h4>Deepan Gunasekar</h4>
              <p className="member-role">Director</p>
              <p>Responsible for technology integration and platform scalability</p>
            </div>
          </div>
        </div>
      </section> */}
        </div>
    );
};

export default About;