import { Box, Typography, Divider, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { GRADE_COLORS, GRADE_ROWS, scoreToColor } from '../config/gradeConfig';
import { useTranslation } from '../../../i18n/LanguageProvider';

// ── File-local sub-components ─────────────────────────────────────────────────
// ScoreBar and ComponentBlock are only used inside this dialog, so they live
// here rather than as separate files.

function ScoreBar({ score }) {
  return (
    <Box sx={{ height: 8, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden', mt: 0.5, mb: 1 }}>
      <Box
        sx={{
          height: '100%',
          width: `${score}%`,
          bgcolor: scoreToColor(score),
          borderRadius: 1,
          transition: 'width 0.6s ease',
        }}
      />
    </Box>
  );
}

function ComponentBlock({ title, weight, score, children, t }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.25 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          {title}
          <Typography component="span" variant="caption" color="text.secondary" ml={1}>
            ({Math.round(weight * 100)}% {t('scoreDialog.of_total_score')})
          </Typography>
        </Typography>
        <Typography variant="subtitle2" fontWeight={700} color={scoreToColor(score ?? 0)}>
          {score ?? t('common.na')} / 100
        </Typography>
      </Box>
      <ScoreBar score={score ?? 0} />
      {children}
    </Box>
  );
}

// ── Dialog ────────────────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   taxBurden: { score: number, weight: number, avgDeemedToEtfPricePct: number },
 *   consistency: { score: number, weight: number, coefficientOfVariation: number|null },
 *   deemedToGains: { score: number|null, weight: number, deemedGainsToTotalGainsPct: number|null, included: boolean },
 * }} ScoreBreakdown
 */

/**
 * Full methodology dialog opened when the user clicks the TaxGradeBadge.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   grade: 'A'|'B'|'C'|'D'|'E',
 *   score: number,
 *   breakdown: ScoreBreakdown,
 * }} props
 */
export default function ScoreBreakdownDialog({ open, onClose, grade, score, breakdown }) {
  const { t } = useTranslation();
  if (!breakdown) return null;
  const { taxBurden, consistency, deemedToGains } = breakdown;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle sx={{ pr: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              bgcolor: GRADE_COLORS[grade],
              color: 'white',
              borderRadius: 1.5,
              px: 1.5,
              py: 0.25,
              fontWeight: 900,
              fontSize: '1.4rem',
              lineHeight: 1.3,
            }}
          >
            {grade}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              {t('scoreDialog.header', { score })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('scoreDialog.header_sub')}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Context */}
        <Typography variant="body2" color="text.secondary" mb={3}>
          {t('scoreDialog.context1')}
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={3}>
          {t('scoreDialog.cvVsMaxSwing')}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {/* Component 1: Tax Burden */}
        <ComponentBlock t={t} title={t('scoreDialog.taxBurden_title')} weight={taxBurden.weight} score={taxBurden.score}>
          <Typography variant="caption" color="text.secondary" display="block">
            {t('scoreDialog.taxBurden_example', { pct: taxBurden.avgDeemedToEtfPricePct.toFixed(3) })}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            {t('scoreDialog.taxBurden_explain')}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}
            sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 1, py: 0.5, borderRadius: 1 }}>
            {t('scoreDialog.taxBurden_formula')}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            {t('scoreDialog.taxBurden_plain')}
          </Typography>
        </ComponentBlock>

        {/* Component 2: Consistency */}
        <ComponentBlock t={t} title={t('scoreDialog.consistency_title')} weight={consistency.weight} score={consistency.score}>
          <Typography variant="caption" color="text.secondary" display="block">
            {t('scoreDialog.cv_label')}&nbsp;
            <strong>
              {consistency.coefficientOfVariation !== null
                ? consistency.coefficientOfVariation.toFixed(3)
                : t('scoreDialog.cv_unavailable')}
            </strong>
          </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                {t('scoreDialog.cv_explain')}
              </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}
            sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 1, py: 0.5, borderRadius: 1 }}>
            {t('scoreDialog.cv_formula')}
            {consistency.coefficientOfVariation === null && `  [${t('scoreDialog.cv_neutral_applied')}]`}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            {t('scoreDialog.cv_example')}
          </Typography>
        </ComponentBlock>

        {/* Component 3: Deemed vs Total Gains */}
        <ComponentBlock
          t={t}
          title={t('scoreDialog.deemed_title')}
          weight={deemedToGains.weight}
          score={deemedToGains.score ?? 0}
        >
          {deemedToGains.included ? (
            <>
              <Typography variant="caption" color="text.secondary" display="block">
                {t('scoreDialog.deemed_ratio_prefix')}&nbsp;
                <strong>{deemedToGains.deemedGainsToTotalGainsPct.toFixed(1)} %</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                {t('scoreDialog.deemed_explain')}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}
                sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 1, py: 0.5, borderRadius: 1 }}>
                {t('scoreDialog.deemed_formula')}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                {t('scoreDialog.deemed_example') || ''}
              </Typography>
            </>
          ) : (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontStyle: 'italic' }}>
              {t('scoreDialog.deemed_excluded')}
            </Typography>
          )}
        </ComponentBlock>

        <Divider sx={{ mb: 2 }} />

        {/* Grade thresholds */}
        <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
          {t('scoreDialog.grade_thresholds')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {GRADE_ROWS.map(({ grade: g, min }) => (
            <Box
              key={g}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                border: `2px solid ${g === grade ? GRADE_COLORS[g] : 'transparent'}`,
                bgcolor: g === grade ? `${GRADE_COLORS[g]}18` : 'grey.100',
                borderRadius: 1.5,
                px: 1.5,
                py: 0.75,
                minWidth: 110,
              }}
            >
              <Box sx={{ bgcolor: GRADE_COLORS[g], color: 'white', borderRadius: 1, px: 0.75, fontWeight: 900, fontSize: '1rem', lineHeight: 1.4 }}>
                {g}
              </Box>
              <Box>
                <Typography variant="caption" fontWeight={700} display="block" lineHeight={1.2}>{t(`grades.${g}`)}</Typography>
                <Typography variant="caption" color="text.secondary">{t('scoreDialog.score_gte', { min })}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

