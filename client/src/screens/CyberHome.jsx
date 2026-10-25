import React, { useState, useEffect } from 'react';
import { Stepper } from '../components/Stepper';
import { Timeline } from '../components/Timeline';
import { ThumbGrid } from '../components/ThumbGrid';
import {
  ShieldAlert,
  FileText,
  Plus,
  Download,
  ExternalLink,
  PhoneCall,
  CheckCircle,
  Copy,
  Upload,
  Calendar,
  Lock,
  Edit2
} from 'lucide-react';
import { api, getToken } from '../lib/api';
import { triggerHaptic } from '../lib/haptics';

export function CyberHome() {
  const [currentStep, setCurrentStep] = useState(0); // 0: Incident, 1: Add Evidence, 2: Timeline, 3: Review, 4: Export
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showNewIncidentModal, setShowNewIncidentModal] = useState(false);
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPlatform, setNewPlatform] = useState('Instagram');
  const [newAccused, setNewAccused] = useState('');
  const [newSummary, setNewSummary] = useState('');

  // Add evidence form state
  const [evidenceType, setEvidenceType] = useState('image');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceOccurredAt, setEvidenceOccurredAt] = useState(
    new Date().toISOString().substring(0, 16)
  );
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [duplicateNotice, setDuplicateNotice] = useState(null);

  // Review & edits state
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewSummary, setReviewSummary] = useState('');
  const [generatedReport, setGeneratedReport] = useState(null);

  const fetchIncidents = async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data || []);
      if (data && data.length > 0 && !selectedIncident) {
        setSelectedIncident(data[0]);
      }
    } catch (e) {
      console.warn('Could not load incidents:', e);
    }
  };

  const fetchIncidentDetails = async (id) => {
    if (!id) return;
    try {
      const data = await api.getIncident(id);
      setSelectedIncident(data.incident);
      setEvidenceList(data.evidence || []);
      setReviewTitle(data.incident.title || '');
      setReviewSummary(data.incident.summary || '');
      if (data.report) setGeneratedReport(data.report);
    } catch (e) {
      console.warn('Could not fetch incident details:', e);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  useEffect(() => {
    if (selectedIncident && selectedIncident.id) {
      fetchIncidentDetails(selectedIncident.id);
    }
  }, [selectedIncident?.id]);

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      const created = await api.createIncident({
        title: newTitle.trim(),
        platform: newPlatform,
        accused_handle: newAccused.trim(),
        summary: newSummary.trim()
      });
      setShowNewIncidentModal(false);
      setNewTitle('');
      setNewAccused('');
      setNewSummary('');
      await fetchIncidents();
      setSelectedIncident(created);
      setCurrentStep(1); // proceed to Add Evidence
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvidence = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setLoading(true);
    setDuplicateNotice(null);

    try {
      const formData = new FormData();
      formData.append('incident_id', selectedIncident.id);
      formData.append('type', evidenceType);
      formData.append('occurred_at', new Date(evidenceOccurredAt).toISOString());
      formData.append('description', evidenceDesc);

      if (evidenceType === 'url') {
        formData.append('url', evidenceUrl);
      } else if (evidenceFile) {
        formData.append('file', evidenceFile);
      } else {
        alert('Please select a file or enter a URL.');
        setLoading(false);
        return;
      }

      const created = await api.createEvidence(formData);
      if (created.duplicate_of) {
        setDuplicateNotice(created.duplicate_of);
      }

      await fetchIncidentDetails(selectedIncident.id);
      setEvidenceFile(null);
      setEvidenceUrl('');
      setEvidenceDesc('');
      setShowAddEvidenceModal(false);
      triggerHaptic(80);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate Report & PDF
  const handleGenerateReport = async () => {
    if (!selectedIncident) return;
    setLoading(true);
    try {
      triggerHaptic([80, 40, 80]);
      const res = await api.generateReport(selectedIncident.id, {
        title: reviewTitle,
        summary: reviewSummary
      });
      setGeneratedReport(res);
      setCurrentStep(4); // proceed to Export step
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Download PDF
  const handleDownloadPdf = () => {
    if (!selectedIncident) return;
    const reportId = generatedReport?.id || generatedReport?.reportId || selectedIncident.id;
    const url = `/api/reports/${reportId}/export?token=${getToken()}`;
    window.open(url, '_blank');
  };

  return (
    <div className="screen-container">
      {/* Official Cybercrime Portals Banner */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#FFF7AE',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          border: '1.5px solid #E6DB74',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={20} color="var(--primary)" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#4A3B00' }}>
            National Cyber Crime Portal & Helpline
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noreferrer"
            className="btn btn-light"
            style={{
              minHeight: '34px',
              padding: '4px 10px',
              fontSize: '12px',
              textDecoration: 'none'
            }}
          >
            <ExternalLink size={13} /> cybercrime.gov.in
          </a>
          <a
            href="tel:1930"
            className="btn btn-primary"
            style={{
              minHeight: '34px',
              padding: '4px 10px',
              fontSize: '12px',
              textDecoration: 'none'
            }}
          >
            <PhoneCall size={13} /> 1930 Helpline
          </a>
        </div>
      </div>

      {/* 5-Step Stepper */}
      <Stepper currentStep={currentStep} onStepClick={(step) => setCurrentStep(step)} />

      {/* Notice badge if duplicate was recently detected */}
      {duplicateNotice && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#FFF3C4',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#6A4B00',
            fontWeight: 700
          }}
        >
          <Copy size={16} /> {duplicateNotice}
        </div>
      )}

      {/* --- STEP 0: INCIDENT SELECTION & SUMMARY --- */}
      {currentStep === 0 && (
        <>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                Incidents ({incidents.length})
              </h2>
              <button
                className="btn btn-light"
                onClick={() => setShowNewIncidentModal(true)}
                style={{ minHeight: '36px', padding: '6px 12px', fontSize: '13px' }}
              >
                <Plus size={16} /> New Incident
              </button>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Organize digital abuse, screenshots, and profiles into forensic evidence bundles.
            </p>
          </div>

          {incidents.map((inc) => {
            const isSelected = selectedIncident && selectedIncident.id === inc.id;
            return (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className="card"
                style={{
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--text)'
                      }}
                    >
                      {inc.platform}
                    </span>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)', marginTop: '6px' }}>
                      {inc.title}
                    </h3>
                  </div>

                  <span className="status-chip">
                    {inc.evidence_count !== undefined ? inc.evidence_count : evidenceList.length} items
                  </span>
                </div>

                {inc.accused_handle && (
                  <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, marginTop: '4px' }}>
                    Accused: {inc.accused_handle}
                  </div>
                )}

                <p style={{ fontSize: '14px', color: 'var(--text)', marginTop: '8px', lineHeight: 1.4 }}>
                  {inc.summary || 'No summary entered.'}
                </p>

                <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIncident(inc);
                      setCurrentStep(1); // Add Evidence
                    }}
                    style={{ flex: 1, minHeight: '42px', fontSize: '14px' }}
                  >
                    View & Add Evidence
                  </button>

                  <button
                    className="btn btn-outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIncident(inc);
                      setCurrentStep(2); // Timeline
                    }}
                    style={{ minHeight: '42px', fontSize: '14px' }}
                  >
                    Timeline
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* --- STEP 1: ADD EVIDENCE & THUMBNAIL CATALOG --- */}
      {currentStep === 1 && selectedIncident && (
        <>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                  {selectedIncident.platform}
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                  {selectedIncident.title}
                </h2>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddEvidenceModal(true)}
                style={{ minHeight: '40px', padding: '8px 14px', fontSize: '14px' }}
              >
                <Plus size={16} /> Add Evidence
              </button>
            </div>
          </div>

          {/* Evidence Thumbnail Grid */}
          <ThumbGrid items={evidenceList} />

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              className="btn btn-outline"
              onClick={() => setCurrentStep(0)}
              style={{ flex: 1 }}
            >
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setCurrentStep(2)}
              style={{ flex: 1 }}
            >
              View Timeline ({evidenceList.length})
            </button>
          </div>
        </>
      )}

      {/* --- STEP 2: CHRONOLOGICAL TIMELINE --- */}
      {currentStep === 2 && selectedIncident && (
        <>
          <div className="card">
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
              Chronological Incident Timeline
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Events automatically ordered by date and time of occurrence for legal chain of custody.
            </p>
          </div>

          <Timeline items={evidenceList} />

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              className="btn btn-outline"
              onClick={() => setCurrentStep(1)}
              style={{ flex: 1 }}
            >
              Add More
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setCurrentStep(3)}
              style={{ flex: 1 }}
            >
              Review & Finalize
            </button>
          </div>
        </>
      )}

      {/* --- STEP 3: REVIEW & EDIT BEFORE EXPORT --- */}
      {currentStep === 3 && selectedIncident && (
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '6px' }}>
            Review Before Export
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Review or adjust details before compiling your report. Nothing is shared without your explicit consent.
          </p>

          <div className="form-group">
            <label className="form-label">Report Title</label>
            <input
              type="text"
              className="form-input"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Summary Statement for Police / Cybercell</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={reviewSummary}
              onChange={(e) => setReviewSummary(e.target.value)}
            />
          </div>

          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--bg)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
              Evidence Catalog Summary:
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text)' }}>
              • Total Artifacts: <strong>{evidenceList.length} items</strong>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text)' }}>
              • Integrity Hashes: <strong>SHA-256 computed for each item</strong>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text)' }}>
              • Encryption: <strong>AES-256-GCM at rest</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-outline"
              onClick={() => setCurrentStep(2)}
              style={{ flex: 1 }}
            >
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={handleGenerateReport}
              disabled={loading}
              style={{ flex: 2, minHeight: '52px', fontSize: '16px', fontWeight: 800 }}
            >
              <FileText size={20} /> Generate Report PDF
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 4: EXPORT DOWNLOADABLE PDF --- */}
      {currentStep === 4 && selectedIncident && (
        <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}
          >
            <CheckCircle size={36} color="var(--primary)" />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
            Evidence Report Ready
          </h2>

          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.4 }}>
            Your forensic incident dossier has been assembled with cover summary, timeline, image thumbnails, and SHA-256 integrity verification hashes.
          </p>

          <button
            className="btn btn-primary"
            onClick={handleDownloadPdf}
            style={{
              width: '100%',
              minHeight: '60px',
              fontSize: '18px',
              fontWeight: 800,
              marginBottom: '16px',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <Download size={22} /> Download PDF Dossier
          </button>

          <div
            style={{
              padding: '14px',
              backgroundColor: '#FFF7AE',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              color: '#4A3B00',
              textAlign: 'left',
              lineHeight: 1.4
            }}
          >
            <strong>Next Steps:</strong> You can submit this PDF directly to the National Cyber Crime Reporting Portal at{' '}
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--primary)', fontWeight: 700 }}
            >
              cybercrime.gov.in
            </a>{' '}
            or provide it to your nearest women's safety / cybercell station.
          </div>

          <button
            className="btn btn-outline"
            onClick={() => setCurrentStep(0)}
            style={{ marginTop: '20px', width: '100%' }}
          >
            Return to Incidents
          </button>
        </div>
      )}

      {/* Modal: New Incident */}
      {showNewIncidentModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--text)' }}>
              Create New Cyber Incident
            </h3>
            <form onSubmit={handleCreateIncident}>
              <div className="form-group">
                <label className="form-label">Incident Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Harassment on Instagram"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Platform</label>
                <select
                  className="form-select"
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                >
                  <option value="Instagram">Instagram</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="X (Twitter)">X (Twitter)</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Telegram">Telegram</option>
                  <option value="Snapchat">Snapchat</option>
                  <option value="Email">Email</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Accused Handle / Phone (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. @anon_stalker_90 or +9198..."
                  value={newAccused}
                  onChange={(e) => setNewAccused(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Brief Summary</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Describe the nature of harassment or threat..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowNewIncidentModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  Create Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Evidence */}
      {showAddEvidenceModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--text)' }}>
              Add Evidence to Incident
            </h3>
            <form onSubmit={handleAddEvidence}>
              <div className="form-group">
                <label className="form-label">Evidence Type</label>
                <select
                  className="form-select"
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                >
                  <option value="image">Screenshot / Photo (Auto SHA-256 & pHash)</option>
                  <option value="file">Document / File</option>
                  <option value="url">Web Link / Post URL</option>
                </select>
              </div>

              {evidenceType === 'url' ? (
                <div className="form-group">
                  <label className="form-label">Post or Profile URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://instagram.com/..."
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Upload File / Screenshot</label>
                  <input
                    type="file"
                    className="form-input"
                    accept={evidenceType === 'image' ? 'image/*' : '*/*'}
                    onChange={(e) => setEvidenceFile(e.target.files[0] || null)}
                    required
                  />
                  <div style={{ fontSize: '12px', color: 'var(--primary-dark)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> Automatically encrypted with AES-256-GCM at rest
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Date & Time of Occurrence</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={evidenceOccurredAt}
                  onChange={(e) => setEvidenceOccurredAt(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">User Description / Context</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Explain what this screenshot shows..."
                  value={evidenceDesc}
                  onChange={(e) => setEvidenceDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddEvidenceModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  Save Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
