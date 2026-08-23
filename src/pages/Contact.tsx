import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';

const Contact: React.FC = () => {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const filesRef = useRef<File[]>([]);
  const [status, setStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquiryType, setInquiryType] = useState('general');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const inquiryOptions = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'return', label: 'Return' },
    { value: 'exchange', label: 'Exchange' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      filesRef.current = [...filesRef.current, ...newFiles];

      const dt = new DataTransfer();
      filesRef.current.forEach(f => dt.items.add(f));
      e.target.files = dt.files;

      setFileNames(filesRef.current.map(f => f.name));
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    filesRef.current = filesRef.current.filter((_, i) => i !== indexToRemove);

    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) {
      const dt = new DataTransfer();
      filesRef.current.forEach(f => dt.items.add(f));
      input.files = dt.files;
    }

    setFileNames(filesRef.current.map(f => f.name));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('');

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      if (filesRef.current.length > 1) {
        const zip = new JSZip();
        filesRef.current.forEach(file => {
          zip.file(file.name, file);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        formData.delete('Attachment');
        formData.append('Attachment', zipBlob, 'attachments.zip');
      } else if (filesRef.current.length === 1) {
        formData.delete('Attachment');
        formData.append('Attachment', filesRef.current[0]);
      } else {
        formData.delete('Attachment');
      }

      const contactUrl = import.meta.env.PROD
        ? '/api/contact'
        : `${import.meta.env.VITE_APP_URL || 'http://localhost:5000'}/api/contact`;
        
      const response = await fetch(contactUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setStatus('Message sent successfully. We will get back to you shortly.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setFileNames([]);
        filesRef.current = [];
        form.reset();
      } else {
        setStatus('Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setStatus('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1000px' }}>
      <h1 className="page-title">Contact Us</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px' }}>
        <div style={{ flex: '1 1 400px', background: 'var(--bg2)', padding: '40px', borderRadius: '8px', border: '1px solid var(--bd)' }}>
          <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '26px', fontWeight: 300, fontStyle: 'italic', color: 'var(--dk)', margin: '0 0 24px 0' }}>Send us a message</h3>



          {status ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: 'var(--cr)', fontStyle: 'italic', fontSize: '18px', lineHeight: '1.8' }}>{status}</p>
              <button
                type="button"
                onClick={() => setStatus('')}
                style={{ marginTop: '20px', background: 'transparent', border: '1px solid var(--cr)', color: 'var(--cr)', padding: '10px 24px', fontSize: '11px', letterSpacing: '.2em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '4px' }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
              <form
              id="contact-form"
              onSubmit={handleSubmit}
            >
              <input type="hidden" name="_subject" value={`New ${inquiryType.charAt(0).toUpperCase() + inquiryType.slice(1)} Request`} />
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_template" value="table" />
              <div className="fg">
                <label className="fl">Inquiry Type</label>
                <div className="custom-select-container" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
                  <div
                    className="fi"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{ 
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      borderColor: isDropdownOpen ? 'var(--cr)' : undefined
                    }}
                  >
                    <span style={{ color: inquiryType ? 'var(--dk)' : 'rgba(154, 136, 120, .5)' }}>
                      {inquiryOptions.find(opt => opt.value === inquiryType)?.label || 'Select...'}
                    </span>
                    <svg 
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', color: 'var(--mu)' }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  
                  {isDropdownOpen && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'var(--bg)',
                        border: '1px solid rgba(192, 127, 69, .25)',
                        borderTop: 'none',
                        marginTop: '0px',
                        zIndex: 10,
                        boxShadow: '0 8px 16px rgba(26, 18, 8, 0.05)',
                        overflow: 'hidden',
                        borderRadius: '0 0 4px 4px'
                      }}
                    >
                      {inquiryOptions.map((opt) => (
                        <div
                          key={opt.value}
                          onClick={() => {
                            setInquiryType(opt.value);
                            setIsDropdownOpen(false);
                          }}
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: inquiryType === opt.value ? 'var(--cr)' : 'var(--dk)',
                            background: inquiryType === opt.value ? 'var(--bg2)' : 'transparent',
                            transition: 'background 0.2s, color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            if (inquiryType !== opt.value) {
                              e.currentTarget.style.background = 'var(--bg2)';
                              e.currentTarget.style.color = 'var(--cr)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (inquiryType !== opt.value) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--dk)';
                            }
                          }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input type="hidden" name="InquiryType" value={inquiryType} />
              </div>
              {(inquiryType === 'return' || inquiryType === 'exchange') && (
                <div className="fg">
                  <label className="fl">Order ID</label>
                  <input 
                    type="text" 
                    name="OrderID" 
                    className="fi" 
                    placeholder="e.g. 12345" 
                    required 
                    pattern="\d+"
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
                    }}
                  />
                </div>
              )}
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
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <label
                    htmlFor="file-upload"
                    style={{
                      display: 'inline-block',
                      width: 'fit-content',
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
                    Choose Files
                  </label>

                  {fileNames.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                      {fileNames.map((name, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--bd)' }}>
                          <span style={{ fontSize: '13px', color: 'var(--mu)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                            {name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            style={{ background: 'none', border: 'none', color: 'var(--cr)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 4px', margin: '-4px 0' }}
                            title="Remove file"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    id="file-upload"
                    type="file"
                    name="Attachment"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    multiple
                  />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--mu)', marginTop: '12px', lineHeight: '1.5', fontStyle: 'italic' }}>
                  Note: When making a return, you should send 2 clear photos of the product (front and back) showing the entire product in a formal way.
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
            For all customer service and press inquiries, please reach out to us at:<br />
            <a href="mailto:hazed.co.hr@gmail.com">hazed.co.hr@gmail.com</a>
          </p>

          <h3>Studio Hours</h3>
          <p>
            Our Cairo-based client services team is available:<br />
            Sunday - Thursday: 11:00 AM - 7:00 PM (EET)
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
