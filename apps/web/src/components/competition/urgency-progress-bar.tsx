'use client';

interface UrgencyProgressBarProps {
  soldPercentage: number;
  ticketsRemaining: number;
  categoryColor: string;
}

export function UrgencyProgressBar({
  soldPercentage,
  ticketsRemaining,
  categoryColor,
}: UrgencyProgressBarProps) {
  const isAlmostGone = soldPercentage >= 80;
  const isLastFew = soldPercentage >= 95;

  // Lighter version of category color for gradient
  const lighterColor = `${categoryColor}CC`;

  return (
    <div>
      {/* CSS for animations */}
      <style>{`
        @keyframes progressShine {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes subtlePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }
        .progress-pulse {
          animation: subtlePulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* Labels */}
      <div className="flex justify-between items-center mb-2">
        <span style={{ fontSize: '13px', color: '#6b7088' }}>
          {isLastFew ? (
            <span style={{ color: '#EF4444', fontWeight: 700 }}>
              Last {ticketsRemaining} tickets!
            </span>
          ) : (
            `${ticketsRemaining} tickets remaining`
          )}
        </span>

        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: '13px',
              color: isAlmostGone ? '#EF4444' : '#6b7088',
              fontWeight: isAlmostGone ? 700 : 400,
            }}
          >
            {soldPercentage}% sold
          </span>

          {isAlmostGone && !isLastFew && (
            <span
              style={{
                padding: '3px 10px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#EF4444',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              Almost Gone!
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: '10px',
          background: '#f0f0f4',
          borderRadius: '5px',
          overflow: 'hidden',
        }}
      >
        <div
          className={isAlmostGone ? 'progress-pulse' : ''}
          style={{
            height: '100%',
            width: `${soldPercentage}%`,
            borderRadius: '5px',
            background: `linear-gradient(90deg, ${categoryColor}, ${lighterColor}, ${categoryColor})`,
            backgroundSize: '200% 100%',
            animation: `progressShine 2s ease infinite${isAlmostGone ? ', subtlePulse 2s ease-in-out infinite' : ''}`,
            transition: 'width 0.3s ease-out',
          }}
        />
      </div>
    </div>
  );
}
