// pages/index.tsx
import Head from 'next/head';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Client-only widget block (no SSR)
function WidgetCard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const base =
    (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
  const endpoint = `${base}/predict`;

  return (
    <>
      <div className="panel" suppressHydrationWarning>
        <div
          id="price-api-widget"
          data-endpoint={endpoint}
          data-apikey="changeme-in-dev"
          data-currency="EUR"
          data-locale="it-IT"
          data-plan="Free"
          data-burst-count="25"
        />
      </div>

      {/* load the widget script after hydration */}
      <Script src="/widget.v1.min.js" strategy="afterInteractive" />
    </>
  );
}

const ClientOnlyWidget = dynamic(() => Promise.resolve(WidgetCard), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <title>Vivi Solutions • AI Property Price Estimator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="wrap">
        <div className="hero">
          <div className="brand">
            <div className="logo" aria-hidden="true" />
            <div>
              <h1>Vivi Solutions • AI Property Price Estimator</h1>
              <p className="tagline">
                Un widget drop-in brandizzato per siti immobiliari. Veloce. Elegante. Monetizzabile.
              </p>
            </div>
          </div>
          <span className="pill">Demo environment</span>
        </div>

        {/* Widget */}
        <ClientOnlyWidget />

        <div className="section-title">Embed snippet</div>
        <div className="panel">
          <pre className="code" aria-label="Embed code">{String.raw`
<div id="price-api-widget"
     data-endpoint="https://api.yourdomain.com/predict"
     data-apikey="YOUR_API_KEY"
     data-currency="EUR"
     data-locale="it-IT"
     data-plan="Business"></div>
<script defer src="https://cdn.yourdomain.com/widget.js"></script>`}</pre>
          <p className="tagline">
            Need a one-line install + CDN? We’ll host <code>widget.js</code> for you.
          </p>
        </div>
      </div>

      {/* styles from your HTML, injected as global CSS */}
      <style jsx global>{`
        :root{
          --vs-bg:#0b1020; --vs-panel:#121933; --vs-text:#eaf2ff; --vs-sub:#a6b5d8;
          --vs-accent:#6ee7d2; --vs-accent-2:#8b5cf6; --vs-stroke:#243056;
          --vs-success:#34d399; --vs-danger:#ef4444; --vs-muted:#7c8cb5;
          --radius:14px; --shadow:0 10px 30px rgba(2,6,23,.35);
        }
        html,body{height:100%}
        body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:var(--vs-text);
          background: radial-gradient(1200px 800px at 15% -10%, rgba(110,231,210,.15), transparent 60%),
                      radial-gradient(900px 700px at 120% 20%, rgba(139,92,246,.18), transparent 55%),
                      var(--vs-bg);
        }
        .wrap{max-width:980px;margin:56px auto;padding:0 20px}
        .hero{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:22px}
        .brand{display:flex;align-items:center;gap:14px}
        .logo{width:42px;height:42px;border-radius:12px;background:
              linear-gradient(135deg,var(--vs-accent),var(--vs-accent-2));box-shadow:var(--shadow);position:relative}
        .logo::after{content:"V";position:absolute;inset:0;display:grid;place-items:center;color:#0b1020;font-weight:800;letter-spacing:.5px}
        h1{margin:0;font-size:clamp(1.4rem,2vw + .8rem,2rem)}
        .tagline{color:var(--vs-sub);margin:6px 0 0}
        .pill{border:1px solid var(--vs-stroke);color:var(--vs-sub);padding:8px 12px;border-radius:999px;backdrop-filter:blur(6px)}
        .panel{background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,0)),var(--vs-panel);
               border:1px solid var(--vs-stroke);border-radius:var(--radius);box-shadow:var(--shadow);padding:18px}
        .code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:#0f152b;color:#e5e7eb;
              padding:12px;border-radius:12px;border:1px solid var(--vs-stroke);overflow:auto}
        .section-title{margin:26px 0 10px;color:var(--vs-muted);font-size:.95rem;letter-spacing:.2px}
        a{color:var(--vs-accent)}
      `}</style>
    </>
  );
}
