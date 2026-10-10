import { Card, CardContent, Typography, Box, Tooltip } from '@mui/material';
import { lighten } from '@mui/material/styles';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

/**
 * Generic metric display card.
 * Renders a titled value with an optional subtitle, a coloured top border,
 * and an optional info tooltip.
 *
 * @param {{
 *   title: string,
 *   value: string,
 *   subtitle?: string,
 *   color?: string,
 *   tooltip?: string,
 * }} props
 */
export default function MetricCard({ title, value, subtitle, color, tooltip }) {
  const valueColor = color || '#155e85';

  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        borderTop: (theme) => `4px solid ${theme.palette.mode === 'dark' ? lighten(valueColor, 0.32) : valueColor}`,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 6 },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
            {title}
          </Typography>
          {tooltip && (
            <Tooltip title={tooltip} arrow placement="top">
              <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }} />
            </Tooltip>
          )}
        </Box>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            color: (theme) => theme.palette.mode === 'dark'
              ? (color ? lighten(valueColor, 0.38) : 'text.primary')
              : color || 'text.primary',
          }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
