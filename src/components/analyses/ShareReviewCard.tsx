import { forwardRef } from 'react';
import { SignedImage } from '@/components/ui/SignedImage';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ShareReviewCardProps {
  type: 'win' | 'loss';
  market: string;
  imageUrl: string;
  imageUrlAfter?: string | null;
  caption?: string | null;
  date: string;
}

const MARKET_LABELS: Record<string, string> = {
  forex: 'Forex',
  crypto: 'Cripto',
  propfirm: 'PropFirm',
};

export const ShareReviewCard = forwardRef<HTMLDivElement, ShareReviewCardProps>(
  ({ type, market, imageUrl, imageUrlAfter, caption, date }, ref) => {
    const isBA = !!imageUrlAfter;
    const isWin = type === 'win';

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          minHeight: 1080,
          background: 'linear-gradient(135deg, #0b1020 0%, #1a1f3a 50%, #0b1020 100%)',
          padding: 56,
          color: '#fff',
          fontFamily: 'Inter, system-ui, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: isWin ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                border: `2px solid ${isWin ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isWin ? (
                <TrendingUp size={32} color="#22c55e" />
              ) : (
                <TrendingDown size={32} color="#ef4444" />
              )}
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>
                {isWin ? 'Acerto' : 'Erro'}
              </div>
              <div style={{ fontSize: 18, opacity: 0.7 }}>
                {MARKET_LABELS[market] || market} · {date}
              </div>
            </div>
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 18,
              opacity: 0.6,
              letterSpacing: 2,
            }}
          >
            C-RISCO
          </div>
        </div>

        {/* Images */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isBA ? '1fr 1fr' : '1fr',
            gap: 16,
            background: 'rgba(255,255,255,0.04)',
            padding: 16,
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ position: 'relative' }}>
            <SignedImage
              storedUrl={imageUrl}
              alt="Antes"
              style={{
                width: '100%',
                height: isBA ? 560 : 720,
                objectFit: 'cover',
                borderRadius: 16,
                display: 'block',
              }}
              crossOrigin="anonymous"
            />
            {isBA && (
              <div style={tagStyle}>ANTES</div>
            )}
          </div>
          {isBA && (
            <div style={{ position: 'relative' }}>
              <SignedImage
                storedUrl={imageUrlAfter!}
                alt="Depois"
                style={{
                  width: '100%',
                  height: 560,
                  objectFit: 'cover',
                  borderRadius: 16,
                  display: 'block',
                }}
                crossOrigin="anonymous"
              />
              <div style={tagStyle}>DEPOIS</div>
            </div>
          )}
        </div>

        {/* Caption */}
        {caption && (
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: 28,
              fontSize: 26,
              lineHeight: 1.4,
              flex: 1,
            }}
          >
            "{caption}"
          </div>
        )}
      </div>
    );
  }
);

const tagStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  left: 12,
  background: 'rgba(0,0,0,0.7)',
  backdropFilter: 'blur(8px)',
  padding: '6px 14px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: 1,
};

ShareReviewCard.displayName = 'ShareReviewCard';
