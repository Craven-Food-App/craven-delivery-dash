// src/pages/ForRestaurants.tsx
import React from 'react';
import './ForRestaurants.css';
import { FaMobileAlt, FaTruck, FaDollarSign } from 'react-icons/fa';

const ForRestaurants: React.FC = () => {
  return (
    <div className="restaurant-page">
      <header className="restaurant-header">
        <h1>Grow Your Restaurant with Crave'n</h1>
        <p>Reach more customers, increase orders, and simplify delivery.</p>
      </header>

      <section className="how-it-works">
        <h2>How Crave'n Works</h2>
        <div className="steps">
          <div className="step">
            <div className="icon-container">
              <FaMobileAlt className="icon" />
            </div>
            <h3>Sign Up & List Your Menu</h3>
            <p>Create your restaurant profile and upload your menu in minutes.</p>
          </div>
          <div className="step">
            <div className="icon-container">
              <FaTruck className="icon" />
            </div>
            <h3>Receive Orders</h3>
            <p>Customers place orders through our app or website, instantly notifying you.</p>
          </div>
          <div className="step">
            <div className="icon-container">
              <FaDollarSign className="icon" />
            </div>
            <h3>Get Paid</h3>
            <p>Fulfill orders efficiently and receive payments directly to your account.</p>
          </div>
        </div>
      </section>

      <section className="benefits">
        <h2>Why Partner With Crave'n?</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <h3>Expand Your Reach</h3>
            <p>Get your restaurant in front of thousands of hungry customers.</p>
          </div>
          <div className="benefit-card">
            <h3>Simple Setup</h3>
            <p>Easy onboarding—get started without technical headaches.</p>
          </div>
          <div className="benefit-card">
            <h3>Flexible Delivery</h3>
            <p>Choose your own drivers or use Crave'n’s delivery network.</p>
          </div>
          <div className="benefit-card">
            <h3>Track & Optimize</h3>
            <p>Real-time order tracking and analytics to improve operations.</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <h2>Ready to Join?</h2>
        <p>Partner with Crave'n and take your restaurant to the next level.</p>
        <button className="sign-up-button">Sign Up Now</button>
      </section>

      <footer className="restaurant-footer">
        <p>© 2025 Crave'n. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ForRestaurants;
