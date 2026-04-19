import { Box, Typography, Tooltip } from '@mui/material';
import { useTranslation } from '../../../i18n/LanguageProvider';

/**
 * Colour and sub-label for each confidence level.
 * Levels 1–5 map directly to the confidenceLevel field returned by the API.
 */
const CONFIDENCE_CONFIG = {
  1: { color: '#78909c' },
  2: { color: '#ef6c00' },
  3: { color: '#f9a825' },
  4: { color: '#558b2f' },
  5: { color: '#1b5e20'  },
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
  const { t } = useTranslation();
  const { color } = CONFIDENCE_CONFIG[level] ?? CONFIDENCE_CONFIG[1];
  const sublabel = t(`confidence.sublabels.${level}`);
  const levelName = t(`confidence.levels.${level}`) || label;

  const tooltipContent = (
    <Box sx={{ p: 0.5, maxWidth: 240 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.75}>
        {t('confidence.title', { label: levelName })}
      </Typography>
      <Typography variant="caption" display="block" mb={0.75}>
        {t('confidence.based_on', { n: totalReports })}
      </Typography>
      <Typography variant="caption" display="block" color="text.secondary">
        {t('confidence.legend')}
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
          {t('confidence.badge_label')}
        </Typography>
        <Typography variant="h6" fontWeight={800} color="inherit" lineHeight={1.2} mt={0.25}>
          {levelName}
        </Typography>
        <Typography variant="caption" color="inherit" sx={{ opacity: 0.85 }}>
          {sublabel}
        </Typography>
      </Box>
    </Tooltip>
  );
}

