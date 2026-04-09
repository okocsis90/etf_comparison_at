import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import { isValidIsin } from '../../utils/isinValidator';
import { fetchScore } from './api/comparisonApi';
import EtfComparisonResult from './components/EtfComparisonResult';

const MIN_ETFS = 2;
const MAX_ETFS = 4;

export default function EtfComparisonSearch() {
  const [inputs, setInputs] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const validCount = inputs.filter((v) => isValidIsin(v.trim().toUpperCase())).length;
  const canCompare = validCount >= MIN_ETFS && !loading;

  const handleChange = (index, value) => {
    setInputs((prev) => prev.map((v, i) => (i === index ? value.toUpperCase() : v)));
  };

  const handleAdd = () => {
    if (inputs.length < MAX_ETFS) setInputs((prev) => [...prev, '']);
  };

  const handleRemove = (index) => {
    setInputs((prev) => prev.filter((_, i) => i !== index));
    setResults(null);
  };

  const handleCompare = async () => {
    const isins = inputs.map((v) => v.trim().toUpperCase()).filter(isValidIsin);
    setLoading(true);
    setResults(null);
    const settled = await Promise.allSettled(isins.map((isin) => fetchScore(isin)));
    setResults(
      settled.map((r, i) => ({
        isin: isins[i],
        data: r.status === 'fulfilled' ? r.value : null,
        error: r.status === 'rejected' ? (r.reason?.message ?? 'Unknown error') : null,
      }))
    );
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Enter {MIN_ETFS}–{MAX_ETFS} ISINs to compare their Austrian tax efficiency metrics side by side.
      </Typography>

      {/* ── ISIN inputs ────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        {inputs.map((val, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              label={`ETF ${i + 1}`}
              placeholder="e.g. IE00B4L5Y983"
              value={val}
              onChange={(e) => handleChange(i, e.target.value)}
              error={val.length > 0 && !isValidIsin(val)}
              helperText={val.length > 0 && !isValidIsin(val) ? 'Invalid ISIN' : ' '}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color={val.length > 0 && !isValidIsin(val) ? 'error' : 'action'} />
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
            {inputs.length > MIN_ETFS && (
              <IconButton onClick={() => handleRemove(i)} sx={{ mt: 1 }} color="error" size="small">
                <DeleteOutlineIcon />
              </IconButton>
            )}
          </Box>
        ))}
      </Box>

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        {inputs.length < MAX_ETFS && (
          <Button startIcon={<AddIcon />} variant="outlined" onClick={handleAdd} size="medium">
            Add ETF
          </Button>
        )}
        <Button
          variant="contained"
          size="large"
          onClick={handleCompare}
          disabled={!canCompare}
          sx={{ px: 4 }}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : 'Compare'}
        </Button>
      </Box>

      {/* ── Results ────────────────────────────────────────────────────────── */}
      {results && !loading && <EtfComparisonResult results={results} />}
    </Box>
  );
}

