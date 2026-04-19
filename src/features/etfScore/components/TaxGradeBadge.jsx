import { Box, Typography, Tooltip } from '@mui/material';
import { GRADE_COLORS } from '../config/gradeConfig';
import { useTranslation } from '../../../i18n/LanguageProvider';

/**
 * Coloured grade badge shown in the top-right corner of the result panel.
 * Hovering shows a quick score summary; clicking opens the full methodology dialog.
 *
 * @param {{
 *   grade: 'A'|'B'|'C'|'D'|'E',
 *   score: number,
 *   breakdown: import('./ScoreBreakdownDialog').ScoreBreakdown,
 *   onClick: () => void,
 * }} props
 */
export default function TaxGradeBadge({ grade, score, breakdown, onClick }) {
  const color = GRADE_COLORS[grade] ?? '#546e7a';
  const { t } = useTranslation();

  const tooltipContent = (
    <Box sx={{ p: 0.5, maxWidth: 260 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={1}>
        {t('taxBadge.title', { score })}
      </Typography>

      <Typography variant="caption" display="block">
        <strong>{t('taxBadge.taxBurden')}</strong> ({Math.round(breakdown.taxBurden.weight * 100)} %):&nbsp;
        {breakdown.taxBurden.score}/100
        <br />
        {t('taxBadge.avg_deemed_prefix')} {breakdown.taxBurden.avgDeemedToEtfPricePct.toFixed(3)} %
      </Typography>

      <Typography variant="caption" display="block" mt={0.75}>
        <strong>{t('taxBadge.consistency')}</strong> ({Math.round(breakdown.consistency.weight * 100)} %):&nbsp;
        {breakdown.consistency.score}/100
        {breakdown.consistency.coefficientOfVariation !== null
          ? <> ({t('scoreDialog.cv_label')} {breakdown.consistency.coefficientOfVariation.toFixed(3)})</>
          : <> ({t('scoreDialog.cv_unavailable')})</>}
      </Typography>

      {breakdown.deemedToGains.included ? (
        <Typography variant="caption" display="block" mt={0.75}>
          <strong>{t('taxBadge.deemed_label')}</strong> ({Math.round(breakdown.deemedToGains.weight * 100)} %):&nbsp;
          {breakdown.deemedToGains.score}/100
          <br />
          {breakdown.deemedToGains.deemedGainsToTotalGainsPct.toFixed(1)} % {t('taxBadge.of_total_gains')}
        </Typography>
      ) : (
        <Typography variant="caption" display="block" mt={0.75} sx={{ opacity: 0.7 }}>
          <strong>{t('taxBadge.deemed_label')}</strong>: {t('taxBadge.deemed_excluded')}
        </Typography>
      )}

      <Typography variant="caption" display="block" mt={1} sx={{ opacity: 0.7, fontStyle: 'italic' }}>
        {t('taxBadge.click_for_methodology')}
      </Typography>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="left">
      <Box
        onClick={onClick}
        sx={{
          bgcolor: color,
          color: 'white',
          borderRadius: 2,
          px: 2.5,
          py: 1.5,
          textAlign: 'center',
          cursor: 'pointer',
          minWidth: 90,
          boxShadow: 3,
          userSelect: 'none',
          transition: 'transform 0.15s, box-shadow 0.15s',
          '&:hover':  { transform: 'scale(1.04)', boxShadow: 6 },
          '&:active': { transform: 'scale(0.98)' },
        }}
      >
        <Typography variant="h2" fontWeight={900} lineHeight={1} color="inherit">
          {grade}
        </Typography>
          <Typography variant="caption" fontWeight={700} color="inherit" display="block" mt={0.5} letterSpacing={0.5}>
          {t('labels.taxEfficiency')}
        </Typography>
        <Typography variant="caption" color="inherit" sx={{ opacity: 0.85 }}>
          {t(`grades.${grade}`)}
        </Typography>
      </Box>
    </Tooltip>
  );
}

