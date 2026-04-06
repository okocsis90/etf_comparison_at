import { Typography } from '@mui/material';

/**
 * Overline-style section heading used throughout EtfScoreResult.
 * @param {{ children: React.ReactNode }} props
 */
export default function SectionTitle({ children }) {
  return (
    <Typography
      variant="overline"
      color="text.secondary"
      fontWeight={700}
      letterSpacing={1}
      display="block"
      mb={1.5}
    >
      {children}
    </Typography>
  );
}

