import React, { useState } from 'react';

const Contact: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // We construct a JSON object to send to FormSubmit via AJAX
    const data = {
      _subject: `New Contact Request from ${formData.get('Name')}`,
      Name: formData.get('Name'),
      Email: formData.get('Email'),
      Message: formData.get('Message'),
      _template: 'table'
    };
    
    fetch('https://formsubmit.co/ajax/hazed.co.hr@gmail.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data),
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed');
      return response.json();
    })
    .then(() => {
      setStatus('Message sent successfully. We will get back to you shortly.');
      setIsSubmitting(false);
      form.reset();
      setFileName('');
    })
    .catch(error => {
      setStatus('Failed to send message. Please try again.');
      setIsSubmitting(false);
      console.error(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName('');
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1000px' }}>
      <h1 className="page-title">Contact Us</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px' }}>
        <div style={{ flex: '1 1 400px', background: 'var(--bg2)', padding: '40px', borderRadius: '8px', border: '1px solid var(--bd)' }}>
          <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '26px', fontWeight: 300, fontStyle: 'italic', color: 'var(--dk)', margin: '0 0 24px 0' }}>Send us a message</h3>
          {status ? (
            <p style={{ color: 'var(--cr)', fontStyle: 'italic', fontSize: '14px', lineHeight: '1.8' }}>{status}</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="fg">
                <label className="fl">Name</label>
                <input type="text" name="Name" className="fi" placeholder="Your name" required />
              </div>
              <div className="fg">
                <label className="fl">Email</label>
                <input type="email" name="Email" className="fi" placeholder="Your email address" required />
              </div>
              <div className="fg">
                <label className="fl">Message</label>
                <textarea name="Message" className="fi" placeholder="How can we help you?" rows={4} required style={{ resize: 'vertical' }}></textarea>
              </div>
              <div className="fg">
                <label className="fl">Attachment (Optional)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                  <label 
                    htmlFor="file-upload" 
                    style={{ 
                      display: 'inline-block',
                      padding: '10px 24px', 
                      background: 'transparent', 
                      border: '1px solid var(--cr)', 
                      color: 'var(--cr)', 
                      fontSize: '11px', 
                      letterSpacing: '.2em', 
                      textTransform: 'uppercase', 
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cr)'; e.currentTarget.style.color = 'var(--bg)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--cr)'; }}
                  >
                    Choose File
                  </label>
                  <span style={{ fontSize: '13px', color: 'var(--mu)', fontStyle: fileName ? 'normal' : 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                    {fileName || 'No file chosen'}
                  </span>
                  <input 
                    id="file-upload"
                    type="file" 
                    name="Attachment"
                    onChange={handleFileChange}
                    style={{ display: 'none' }} 
                  />
                </div>
              </div>
              <button type="submit" className="fsub" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        <div className="page-content" style={{ flex: '1 1 300px' }}>
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
    </div>
  );
};

export default Contact;
