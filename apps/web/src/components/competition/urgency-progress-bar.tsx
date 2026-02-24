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

  // Darker version of category color for gradient
  const darkerColor = categoryColor;

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
        @keyframes cursorGlow {
          0%, 100% { box-shadow: 0 0 8px ${categoryColor}4D; }
          50% { box-shadow: 0 0 12px ${categoryColor}66; }
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
            `${ticketsRemaining.toLocaleString()} tickets remaining`
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

      {/* Progress bar with cursor dot */}
      <div
        style={{
          height: '10px',
          background: '#f0f0f4',
          borderRadius: '5px',
          position: 'relative',
        }}
      >
        <div
          className={isAlmostGone ? 'progress-pulse' : ''}
          style={{
            height: '100%',
            width: `${soldPercentage}%`,
            borderRadius: '5px',
            backgroundImage: `linear-gradient(90deg, ${lighterColor}, ${darkerColor})`,
            backgroundSize: '200% 100%',
            animation: `progressShine 2.5s ease-in-out infinite${isAlmostGone ? ', subtlePulse 2s ease-in-out infinite' : ''}`,
            transition: 'width 0.3s ease-out',
            position: 'relative',
          }}
        >
          {/* Shine overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              backgroundSize: '200% 100%',
              animation: 'progressShine 2.5s ease-in-out infinite',
            }}
          />
        </div>

        {/* Cursor dot at the end of progress */}
        {soldPercentage > 0 && soldPercentage < 100 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${soldPercentage}%`,
              transform: 'translate(-50%, -50%)',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: categoryColor,
              border: '2px solid #ffffff',
              boxShadow: `0 0 8px ${categoryColor}4D`,
              animation: 'cursorGlow 2s ease-in-out infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}
