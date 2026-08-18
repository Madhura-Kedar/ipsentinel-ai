import React, { useState } from 'react';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { User, Bell, Shield, CreditCard, Key, Check } from 'lucide-react';
import '../components/dashboard/Dashboard.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({ label, description, defaultChecked }) => {
    const [checked, setChecked] = useState(defaultChecked);
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>{label}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{description}</div>
        </div>
        <div 
          onClick={() => setChecked(!checked)}
          style={{ width: '44px', height: '24px', background: checked ? 'var(--accent-cyan)' : 'var(--bg-app)', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', border: `1px solid ${checked ? 'var(--accent-cyan)' : 'var(--border-color)'}` }}
        >
          <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '1px', left: checked ? '21px' : '1px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          <span className="dashboard-label">Administration</span>
          <h1 className="dashboard-title">Account Settings</h1>
        </div>
        <div className="dashboard-actions">
          {saved && <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '16px', fontSize: '0.9rem' }}><Check size={16} /> Preferences saved</span>}
          <Button variant="primary" onClick={handleSave}>Save Changes</Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px' }}>
        <div style={{ width: '240px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div onClick={() => setActiveTab('profile')} style={{ padding: '12px 16px', background: activeTab === 'profile' ? 'var(--bg-surface-hover)' : 'transparent', color: activeTab === 'profile' ? 'var(--accent-cyan)' : 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: activeTab === 'profile' ? 600 : 400 }}>
              <User size={18} /> Profile & Workspace
            </div>
            <div onClick={() => setActiveTab('api')} style={{ padding: '12px 16px', background: activeTab === 'api' ? 'var(--bg-surface-hover)' : 'transparent', color: activeTab === 'api' ? 'var(--accent-cyan)' : 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: activeTab === 'api' ? 600 : 400 }}>
              <Key size={18} /> API & Integrations
            </div>
            <div onClick={() => setActiveTab('notifications')} style={{ padding: '12px 16px', background: activeTab === 'notifications' ? 'var(--bg-surface-hover)' : 'transparent', color: activeTab === 'notifications' ? 'var(--accent-cyan)' : 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: activeTab === 'notifications' ? 600 : 400 }}>
              <Bell size={18} /> Notifications
            </div>
            <div onClick={() => setActiveTab('security')} style={{ padding: '12px 16px', background: activeTab === 'security' ? 'var(--bg-surface-hover)' : 'transparent', color: activeTab === 'security' ? 'var(--accent-cyan)' : 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: activeTab === 'security' ? 600 : 400 }}>
              <Shield size={18} /> Security
            </div>
            <div onClick={() => setActiveTab('billing')} style={{ padding: '12px 16px', background: activeTab === 'billing' ? 'var(--bg-surface-hover)' : 'transparent', color: activeTab === 'billing' ? 'var(--accent-cyan)' : 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: activeTab === 'billing' ? 600 : 400 }}>
              <CreditCard size={18} /> Billing
            </div>
          </div>
        </div>

        <div style={{ flex: 1, maxWidth: '800px' }}>
          {activeTab === 'profile' && (
            <Card>
              <CardHeader title="Profile Details" />
              <CardBody>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                  <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#fff', fontWeight: 600 }}>JD</div>
                  <div>
                    <Button variant="secondary" style={{ marginBottom: '8px' }}>Upload Photo</Button>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>JPG, GIF or PNG. Max size of 800K.</div>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>First Name</label>
                    <input type="text" defaultValue="Jane" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Last Name</label>
                    <input type="text" defaultValue="Doe" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address</label>
                    <input type="email" defaultValue="jane.doe@example.com" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Workspace Name</label>
                    <input type="text" defaultValue="Acme Corp Innovation Lab" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'api' && (
            <Card>
              <CardHeader title="API Configuration" />
              <CardBody>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Google Gemini API Key</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="password" defaultValue="************************" style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }} />
                    <Button variant="secondary">Reveal</Button>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>Used for powering Semantic Search and Draft Assistant.</p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>USPTO Patent Database Key</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="password" defaultValue="************************" style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }} />
                    <Button variant="secondary">Reveal</Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader title="Notification Preferences" />
              <CardBody style={{ paddingTop: 0 }}>
                <Toggle label="Weekly Digest" description="Receive a weekly summary of new patents in your tracked domains." defaultChecked={true} />
                <Toggle label="Risk Alerts" description="Immediate email alerts when a highly similar patent is published." defaultChecked={true} />
                <Toggle label="Analysis Completion" description="Notify me when a large batch analysis is finished." defaultChecked={true} />
                <Toggle label="Product Updates" description="News about new features and improvements to IPSentinel AI." defaultChecked={false} />
              </CardBody>
            </Card>
          )}
          
          {(activeTab === 'security' || activeTab === 'billing') && (
            <Card>
              <CardBody style={{ padding: '64px 24px', textAlign: 'center' }}>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Available in Enterprise Plan</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Upgrade your workspace to access advanced security controls and custom billing.</p>
                <Button variant="primary" style={{ marginTop: '24px' }}>Upgrade Plan</Button>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
