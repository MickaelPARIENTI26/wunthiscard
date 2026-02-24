'use client';

import { useState } from 'react';
import { ChevronRight, Mail } from 'lucide-react';

export function FreeEntryAccordion() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {/* Trigger - Very subtle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="free-entry-link flex items-center gap-2"
        style={{
          padding: '0',
          background: 'transparent',
          border: 'none',
          color: isOpen ? '#6b7088' : '#9a9eb0',
          fontSize: '12px',
          fontWeight: 400,
          cursor: 'pointer',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#6b7088';
          const chevron = e.currentTarget.querySelector('.chevron-icon') as HTMLElement;
          if (chevron && !isOpen) {
            chevron.style.transform = 'translateX(2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.color = '#9a9eb0';
          }
          const chevron = e.currentTarget.querySelector('.chevron-icon') as HTMLElement;
          if (chevron && !isOpen) {
            chevron.style.transform = 'translateX(0)';
          }
        }}
      >
        <Mail style={{ width: '12px', height: '12px' }} />
        <span>Free postal entry available</span>
        <ChevronRight
          className="chevron-icon"
          style={{
            width: '12px',
            height: '12px',
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Accordion Content */}
      <div
        style={{
          maxHeight: isOpen ? '300px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        <div
          style={{
            marginTop: '8px',
            padding: '16px 20px',
            background: '#F7F7FA',
            borderRadius: '12px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          {/* Description */}
          <p style={{ fontSize: '13px', color: '#6b7088', lineHeight: 1.6, marginBottom: '10px', margin: 0 }}>
            Send a handwritten postcard with your full name, email address, and competition name to:
          </p>

          {/* Address Box */}
          <div
            style={{
              margin: '10px 0',
              padding: '12px 16px',
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e', lineHeight: 1.5, margin: 0 }}>
              WinUCard Ltd<br />
              123 Competition Street<br />
              London, EC1A 1BB<br />
              United Kingdom
            </p>
          </div>

          {/* Additional Info */}
          <p style={{ fontSize: '11px', color: '#9a9eb0', margin: 0 }}>
            One entry per postcard. Must arrive before the draw date.
          </p>
        </div>
      </div>
    </div>
  );
}
