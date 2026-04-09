import { Box, Typography, Tooltip } from '@mui/material';

/**
 * Colour and sub-label for each confidence level.
 * Levels 1–5 map directly to the confidenceLevel field returned by the API.
 */
const CONFIDENCE_CONFIG = {
  1: { color: '#78909c', sublabel: '1–2 reports' },
  2: { color: '#ef6c00', sublabel: '3–4 reports' },
  3: { color: '#f9a825', sublabel: '5–6 reports' },
  4: { color: '#558b2f', sublabel: '7–8 reports' },
  5: { color: '#1b5e20', sublabel: '9+ reports'  },
};

/**
 * Badge showing how much data backs the current analysis.
 * Displayed alongside the TaxGradeBadge in the result header.
 *
 * @param {{
 *   level: 1|2|3|4|5,
 *   label: string,
 *   totalReports: number,
 * }} props
 */
export default function ConfidenceBadge({ level, label, totalReports }) {
  const { color, sublabel } = CONFIDENCE_CONFIG[level] ?? CONFIDENCE_CONFIG[1];

  const tooltipContent = (
    <Box sx={{ p: 0.5, maxWidth: 240 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.75}>
        Data Confidence — {label}
      </Typography>
      <Typography variant="caption" display="block" mb={0.75}>
        Based on <strong>{totalReports} yearly report{totalReports !== 1 ? 's' : ''}</strong>.
        More years of data reveal long-term patterns in deemed income and reduce the
        influence of any single unusual year on the analysis.
      </Typography>
      <Typography variant="caption" display="block" color="text.secondary">
        Preliminary (&lt;3) · Limited (3–4) · Moderate (5–6) · Reliable (7–8) · Comprehensive (9+)
      </Typography>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="left">
      <Box
        sx={{
          bgcolor: color,
          color: 'white',
          borderRadius: 2,
          px: 2.5,
          py: 1.5,
          textAlign: 'center',
          cursor: 'help',
          minWidth: 90,
          boxShadow: 3,
          userSelect: 'none',
        }}
      >
        <Typography variant="caption" fontWeight={700} color="inherit" display="block" letterSpacing={0.5}>
          DATA QUALITY
        </Typography>
        <Typography variant="h6" fontWeight={800} color="inherit" lineHeight={1.2} mt={0.25}>
          {label}
        </Typography>
        <Typography variant="caption" color="inherit" sx={{ opacity: 0.85 }}>
          {sublabel}
        </Typography>
      </Box>
    </Tooltip>
  );
}

