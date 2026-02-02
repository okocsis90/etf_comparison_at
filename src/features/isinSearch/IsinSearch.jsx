import { useState } from 'react';
import Reports from '../reports/Reports';
import './IsinSearch.css';

function IsinSearch() {
  const [isin, setIsin] = useState('');

  return (
    <div className="isin-search-container">
      <h1 className="isin-search-title">ETF Score Calculator</h1>
      <p className="isin-search-desc">Enter an ISIN to get started</p>
      <label htmlFor="isin-input" className="isin-search-label">ISIN</label>
      <input
        id="isin-input"
        type="text"
        placeholder="e.g. IE00BK5BQX27"
        value={isin}
        onChange={e => setIsin(e.target.value.toUpperCase())}
        className="isin-search-input"
        maxLength={12}
        autoFocus
        autoComplete="off"
      />
      <div style={{width: '100%'}}>
        <Reports isin={isin} />
      </div>
    </div>
  );
}

export default IsinSearch;
