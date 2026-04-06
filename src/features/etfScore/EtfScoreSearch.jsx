import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { isValidIsin } from '../../utils/isinValidator';
import { fetchScore } from '../../api/scoreApi';
import EtfScoreResult from './EtfScoreResult';

export default function EtfScoreSearch() {
  const [input, setInput] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const normalized = input.trim().toUpperCase();
  const formatError = touched && normalized.length > 0 && !isValidIsin(normalized)
    ? 'Invalid ISIN — must be 2 letters + 9 alphanumeric + 1 check digit (e.g. IE00B4L5Y983)'
    : null;
  const canSearch = isValidIsin(normalized) && !loading;

  const handleSearch = async () => {
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await fetchScore(normalized);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <Box>
      {/* Search row */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <TextField
          label="ISIN"
          placeholder="e.g. IE00B4L5Y983"
          value={input}
          onChange={(e) => { setInput(e.target.value); setTouched(true); }}
          onKeyDown={handleKeyDown}
          error={Boolean(formatError)}
          helperText={formatError || ' '}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color={formatError ? 'error' : 'action'} />
                </InputAdornment>
              ),
            },
            htmlInput: {
              maxLength: 12,
              style: { textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'monospace' },
            },
          }}
          sx={{ width: 320 }}
        />
        <Button
          variant="contained"
          size="large"
          onClick={handleSearch}
          disabled={!canSearch}
          sx={{ height: 56, px: 4, mt: 0 }}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : 'Analyse'}
        </Button>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {result && !loading && (
        <Box sx={{ mt: 4 }}>
          <EtfScoreResult data={result} />
        </Box>
      )}
    </Box>
  );
}

