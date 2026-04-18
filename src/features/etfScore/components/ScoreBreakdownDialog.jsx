import { Box, Typography, Divider, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { GRADE_COLORS, GRADE_ROWS, scoreToColor } from '../config/gradeConfig';

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

function ComponentBlock({ title, weight, score, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.25 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          {title}
          <Typography component="span" variant="caption" color="text.secondary" ml={1}>
            ({Math.round(weight * 100)} % of total score)
          </Typography>
        </Typography>
        <Typography variant="subtitle2" fontWeight={700} color={scoreToColor(score ?? 0)}>
          {score ?? 'N/A'} / 100
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
              Tax Efficiency Score: {score} / 100
            </Typography>
            <Typography variant="caption" color="text.secondary">
              How your ETF is rated for Austrian tax purposes
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
          In Austria, accumulating ETFs ("Meldefonds") require you to pay KESt (27.5 %) on
          deemed income (<em>ausschüttungsgleiche Erträge</em>) every year — even if you never
          sell. This score measures the size of that annual tax burden and how predictably you
          can plan for it. <strong>Higher is better.</strong>
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {/* Component 1: Tax Burden */}
        <ComponentBlock title="Tax Burden" weight={taxBurden.weight} score={taxBurden.score}>
          <Typography variant="caption" color="text.secondary" display="block">
            Your value: avg deemed income / ETF price =&nbsp;
            <strong>{taxBurden.avgDeemedToEtfPricePct.toFixed(3)} %</strong> per year
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            The annual deemed income as a percentage of your ETF price is the most direct measure
            of yearly tax obligation. For example, an ETF with 0.2 % deemed/price implies an annual
            KESt cost of 0.2 % × 27.5 % ≈ 0.055 % of your holding value each year.
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}
            sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 1, py: 0.5, borderRadius: 1 }}>
            score = max(0, 100 × (1 − avg% / 2))
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            In plain terms: we map the average annual deemed % to a 0–100 score by treating 0 % → 100
            and 2 % → 0 (linear scaling). Example: avg% = 0.5 % → score ≈ 100 × (1 − 0.5 / 2) = 75.
          </Typography>
        </ComponentBlock>

        {/* Component 2: Consistency */}
        <ComponentBlock title="Predictability (Consistency)" weight={consistency.weight} score={consistency.score}>
          <Typography variant="caption" color="text.secondary" display="block">
            Coefficient of Variation (CV):&nbsp;
            <strong>
              {consistency.coefficientOfVariation !== null
                ? consistency.coefficientOfVariation.toFixed(3)
                : '— (fewer than 2 reports)'}
            </strong>
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            CV = standard deviation ÷ mean of the yearly deemed/price ratios. A low CV means the
            annual deemed income is stable (easy to forecast). A high CV means the yearly values
            vary a lot relative to their average, which makes planning difficult. Unlike the Max
            Swing metric, CV is scale-independent: an ETF can have high levels of deemed income
            but still be predictable if the CV is small.
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}
            sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 1, py: 0.5, borderRadius: 1 }}>
            score = max(0, 100 × (1 − CV / 1.5))
            {consistency.coefficientOfVariation === null && '  [neutral 50 pts applied]'}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            Example: CV = 0.3 → score ≈ 100 × (1 − 0.3 / 1.5) ≈ 80. The divisor 1.5 scales typical CV
            values into the 0–100 range used for the score.
          </Typography>
        </ComponentBlock>

        {/* Component 3: Deemed vs Total Gains */}
        <ComponentBlock
          title="Deemed vs Total Gains"
          weight={deemedToGains.weight}
          score={deemedToGains.score ?? 0}
        >
          {deemedToGains.included ? (
            <>
              <Typography variant="caption" color="text.secondary" display="block">
                Deemed gains / total price gains =&nbsp;
                <strong>{deemedToGains.deemedGainsToTotalGainsPct.toFixed(1)} %</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                Of all the gains your ETF produced over the analysis period, this fraction was
                taxed annually as deemed income instead of being taxed when you sell. A lower
                fraction means more gains are tax-deferred until sale.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}
                sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 1, py: 0.5, borderRadius: 1 }}>
                score = max(0, 100 − deemedToTotalGains%)
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                Example: if deemed gains = 10 % of total gains → score = 100 − 10 = 90. If the
                ratio is missing or outside 0–200 %, the component is excluded and its weight is
                redistributed to the other components.
              </Typography>
            </>
          ) : (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontStyle: 'italic' }}>
              Excluded from this calculation — total gains are non-positive or the ratio falls
              outside the 0–200 % range. The 15 % weight was redistributed proportionally
              between the other two components.
            </Typography>
          )}
        </ComponentBlock>

        <Divider sx={{ mb: 2 }} />

        {/* Grade thresholds */}
        <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
          Grade Thresholds
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {GRADE_ROWS.map(({ grade: g, min, label }) => (
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
                <Typography variant="caption" fontWeight={700} display="block" lineHeight={1.2}>{label}</Typography>
                <Typography variant="caption" color="text.secondary">score ≥ {min}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

