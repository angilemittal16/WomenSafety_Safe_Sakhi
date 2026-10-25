import React from 'react';

const STEPS = ['Incident', 'Evidence', 'Timeline', 'Review', 'Export'];

export function Stepper({ currentStep, onStepClick }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 10px',
        marginBottom: '18px',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}
      role="navigation"
      aria-label="Cyber Safety Incident Stepper"
    >
      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;

        return (
          <React.Fragment key={step}>
            <button
              onClick={() => onStepClick && onStepClick(idx)}
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: onStepClick ? 'pointer' : 'default',
                opacity: idx > currentStep + 1 ? 0.45 : 1
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: isActive
                    ? 'var(--primary)'
                    : isCompleted
                    ? 'var(--primary-dark)'
                    : 'var(--primary-light)',
                  color: isActive || isCompleted ? '#FFFFFF' : 'var(--text)',
                  fontSize: '12px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                {idx + 1}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)'
                }}
              >
                {step}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: idx < currentStep ? 'var(--primary)' : 'var(--border-subtle)',
                  margin: '0 4px',
                  marginBottom: '14px'
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
