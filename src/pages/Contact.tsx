import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">Contact Us</h1>
      <div className="page-content">
        <p>
          We are here to assist you with any inquiries regarding our collections, sizing, orders, or general questions.
        </p>
        
        <h3>Email</h3>
        <p>
          For all customer service and press inquiries, please reach out to us at:<br/>
          <a href="mailto:hazed.co.hr@gmail.com">hazed.co.hr@gmail.com</a>
        </p>

        <h3>Studio Hours</h3>
        <p>
          Our Cairo-based client services team is available:<br/>
          Sunday - Thursday: 10:00 AM - 6:00 PM (EET)
        </p>
        
        <p>
          <em>Please allow 24-48 hours for a response during standard business days.</em>
        </p>
      </div>
    </div>
  );
};

export default Contact;
