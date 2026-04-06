import { Card, CardContent, Typography, Box, Tooltip } from '@mui/material';
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
  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        borderTop: `4px solid ${color || '#1976d2'}`,
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
        <Typography variant="h5" fontWeight={700} color={color || 'text.primary'}>
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

