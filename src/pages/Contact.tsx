import React, { useState, useRef } from 'react';

const Contact: React.FC = () => {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const filesRef = useRef<File[]>([]);
  const [status, setStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <div className="page-container" style={{ maxWidth: '1000px' }}>
      <h1 className="page-title">Contact Us</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px' }}>
        <div style={{ flex: '1 1 400px', background: 'var(--bg2)', padding: '40px', borderRadius: '8px', border: '1px solid var(--bd)' }}>
          <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '26px', fontWeight: 300, fontStyle: 'italic', color: 'var(--dk)', margin: '0 0 24px 0' }}>Send us a message</h3>
          
          <iframe name="hidden_iframe" id="hidden_iframe" style={{ display: 'none' }} onLoad={() => {
            if (isSubmitting) {
              setStatus('Message sent successfully. We will get back to you shortly.');
              setIsSubmitting(false);
              setFileNames([]);
              filesRef.current = [];
              const form = document.getElementById('contact-form') as HTMLFormElement;
              if (form) {
                form.reset();
                const originalInput = document.getElementById('file-upload') as HTMLInputElement;
                if (originalInput) originalInput.disabled = false;
                const existingDynamicInputs = form.querySelectorAll('.dynamic-attachment');
                existingDynamicInputs.forEach(input => input.remove());
              }
            }
          }}></iframe>

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
              action="https://formsubmit.co/hazed.co.hr@gmail.com" 
              method="POST" 
              encType="multipart/form-data" 
              target="hidden_iframe" 
              onSubmit={(e) => {
                setIsSubmitting(true);
                const form = e.currentTarget;
                
                // Disable the original multi-file input so it doesn't get sent as a single field
                const originalInput = document.getElementById('file-upload') as HTMLInputElement;
                if (originalInput) originalInput.disabled = true;

                // Remove any previously added dynamic inputs
                const existingDynamicInputs = form.querySelectorAll('.dynamic-attachment');
                existingDynamicInputs.forEach(input => input.remove());
                
                // Create individual file inputs for each file so FormSubmit processes them all
                filesRef.current.forEach((file, index) => {
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.name = `attachment${index + 1}`;
                  input.files = dt.files;
                  input.className = 'dynamic-attachment';
                  input.style.display = 'none';
                  form.appendChild(input);
                });
              }}
            >
              <input type="hidden" name="_subject" value="New Contact Request" />
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_template" value="box" />
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
                    name="attachment"
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
