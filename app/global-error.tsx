'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
          background: '#0b0f1a',
          color: '#e6e9f0',
        }}
      >
        <div style={{ textAlign: 'center', padding: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>เกิดข้อผิดพลาดร้ายแรง</h1>
          <p style={{ marginTop: 8, color: '#8b94ad' }}>
            {error.digest ? `รหัส: ${error.digest}` : 'กรุณาลองใหม่อีกครั้ง'}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#5b8cff',
              color: '#0b0f1a',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ลองอีกครั้ง
          </button>
        </div>
      </body>
    </html>
  );
}
