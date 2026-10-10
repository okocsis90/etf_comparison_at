import { Box } from '@mui/material';

export default function BrandLogo({ size = 36 }) {
  return (
    <Box
      component="img"
      src="/etf-icon.svg"
      alt=""
      aria-hidden="true"
      sx={{
        width: size,
        height: size,
        borderRadius: '10px',
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
      }}
    />
  );
}
