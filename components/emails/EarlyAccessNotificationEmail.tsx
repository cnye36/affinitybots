import * as React from 'react';

interface EarlyAccessNotificationEmailProps {
  name: string;
  email: string;
  experience: string;
  organization?: string;
  purpose: string;
  expectations?: string;
}

export const EarlyAccessNotificationEmail: React.FC<Readonly<EarlyAccessNotificationEmailProps>> = ({
  name,
  email,
  organization,
  expectations,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
    <h1 style={{ color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>
      New Early Access Request - AffinityBots
    </h1>
    
    <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
      <h2 style={{ color: '#007bff', marginTop: '0' }}>Applicant Details</h2>
      <p><strong>Name:</strong> {name}</p>
      <p><strong>Email:</strong> {email}</p>
      {organization && <p><strong>Organization:</strong> {organization}</p>}
    </div>

    
    <p><strong>Features of Interest:</strong></p>
    <p style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #007bff' }}>
      {expectations}
    </p>


    <div style={{ textAlign: 'center', marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <p style={{ margin: '0', color: '#6c757d' }}>
        This request was submitted through the AffinityBots early access form.
      </p>
      <p style={{ margin: '10px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
        Timestamp: {new Date().toLocaleString()}
      </p>
    </div>
  </div>
);
