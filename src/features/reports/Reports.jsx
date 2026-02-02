import { useState, useEffect } from 'react';
import './Reports.css';

function Reports({ isin }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isin) {
      setHtml('');
      setError(null);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setHtml('');
      try {
        // Note: Direct fetch will likely fail due to CORS. This is a placeholder for future server-side proxy or scraping solution.
        const response = await fetch(`https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f?isin=${isin}`);
        if (!response.ok) {
          setError('Failed to fetch');
          return;
        }
        const text = await response.text();
        setHtml(text);
      } catch {
        setError('Failed to fetch or CORS error.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isin]);

  return (
    <div className="reports-container">
      <h2 className="reports-title">ETF Reports Fetcher</h2>
      {loading && <p className="reports-loading">Loading...</p>}
      {error && <p className="reports-error">{error}</p>}
      {/* For now, just show a placeholder. In the future, parse and display extracted data. */}
      {html && <pre className="reports-html-preview">{html.slice(0, 1000)}...</pre>}
    </div>
  );
}

export default Reports;
