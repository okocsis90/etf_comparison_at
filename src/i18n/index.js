const translations = {
  de: {
    appTitle: 'ETF Comparison AT',
    tabs: {
      analyser: {
        label: 'ETF Analyser',
        title: 'ETF Score Analyser',
        description: 'Geben Sie eine ISIN ein, um ausschüttungsgleiche Erträge, Konsistenz und Preisvergleiche für österreichische Steuerzwecke zu berechnen.',
      },
      compare: {
        label: 'ETFs vergleichen',
        title: 'ETF-Vergleich',
        description: 'Vergleichen Sie 2 bis 4 ETFs nebeneinander über alle österreichischen Steuereffizienzmetriken. Der beste Wert jeder Zeile wird hervorgehoben.',
      },
    },
    common: {
      isinLabel: 'ISIN',
      isinPlaceholder: 'e.g. IE00B4L5Y983',
      invalidIsin: 'Invalid ISIN',
      invalidIsinDetailed: 'Invalid ISIN — must be 2 letters + 9 alphanumeric + 1 check digit (e.g. IE00B4L5Y983)',
      etfLabel: 'ETF {idx}',
      na: 'N/A',
    },
    actions: {
      addEtf: 'Add ETF',
      compare: 'Compare',
      recalculate: 'Recalculate',
      analyse: 'Analyse',
    },
    lang: { de: 'Deutsch (AT)', en: 'English' },
    labels: { taxEfficiency: 'Tax Efficiency', score: 'Score', report: 'Report', reports_plural: 'Reports' },
    etfComparison: {
      search_intro: 'Enter {min}–{max} ISINs to compare their Austrian tax efficiency metrics side by side.',
      staleResults: 'Your inputs have changed. Click <strong>Recalculate</strong> to update the comparison.',
      need_at_least_two: 'At least 2 ETFs must load successfully to show a comparison.',
    },
    reportTable: {
      title: 'Per-Report Detail',
      colDate: 'Report Date',
      colDeemedEur: 'Deemed Income (EUR)',
      colPriceEur: 'ETF Price (EUR)',
      colDeemedPct: 'Deemed / Price',
    },
    reportChart: {
      title: 'Yearly Report Metrics',
      deemedIncome: 'Deemed Income',
      etfPrice: 'ETF Price',
      deemedPct: 'Deemed / Price %',
    },
    confidence: {
      badge_label: 'DATA QUALITY',
      title: 'Data Confidence — {label}',
      based_on: 'Based on <strong>{n}</strong> yearly report{plural}',
      legend: 'Preliminary (<3) · Limited (3–4) · Moderate (5–6) · Reliable (7–8) · Comprehensive (9+)',
      sublabels: {
        1: '1–2 reports',
        2: '3–4 reports',
        3: '5–6 reports',
        4: '7–8 reports',
        5: '9+ reports',
      },
    },
    confidence: {
      badge_label: 'DATA QUALITY',
      title: 'Data Confidence — {label}',
      based_on: 'Based on <strong>{n}</strong> yearly report{plural}',
      legend: 'Preliminary (<3) · Limited (3–4) · Moderate (5–6) · Reliable (7–8) · Comprehensive (9+)',
      sublabels: {
        1: '1–2 reports',
        2: '3–4 reports',
        3: '5–6 reports',
        4: '7–8 reports',
        5: '9+ reports',
      },
    },
    taxBadge: {
      title: 'Austrian Tax Efficiency — {score}/100',
      taxBurden: 'Tax Burden',
      avg_deemed_prefix: 'avg deemed/price:',
      consistency: 'Consistency',
      deemed_label: 'Deemed / Gains',
      of_total_gains: 'of total gains taxed annually',
      deemed_excluded: 'excluded (gains not positive or ratio out of range)',
      click_for_methodology: 'Click for full methodology',
    },
    common: {
      isinLabel: 'ISIN',
      isinPlaceholder: 'z.B. IE00B4L5Y983',
      invalidIsin: 'Ungültige ISIN',
      invalidIsinDetailed: 'Invalid ISIN — must be 2 letters + 9 alphanumeric + 1 check digit (e.g. IE00B4L5Y983)',
      etfLabel: 'ETF {idx}',
    },
    actions: {
      addEtf: 'ETF hinzufügen',
      compare: 'Vergleichen',
      recalculate: 'Neu berechnen',
      analyse: 'Analysieren',
    },
    lang: { de: 'Deutsch (AT)', en: 'English' },
    labels: { taxEfficiency: 'Steuereffizienz', score: 'Score', report: 'Bericht', reports_plural: 'Berichte' },
    etfComparison: {
      search_intro: 'Geben Sie {min}–{max} ISINs ein, um deren österreichische Steuereffizienzmetriken nebeneinander zu vergleichen.',
      staleResults: 'Ihre Eingaben haben sich geändert. Klicken Sie auf <strong>Neu berechnen</strong>, um den Vergleich zu aktualisieren.',
      need_at_least_two: 'Mindestens 2 ETFs müssen erfolgreich geladen werden, um einen Vergleich anzuzeigen.',
    },
    reportTable: {
      title: 'Per-Report Detail',
      colDate: 'Report-Datum',
      colDeemedEur: 'Ausschüttungsgleiche Erträge (EUR)',
      colPriceEur: 'ETF-Preis (EUR)',
      colDeemedPct: 'Ausschüttungsgl. / Preis',
    },
    reportChart: {
      title: 'Yearly Report Metrics',
      deemedIncome: 'Deemed Income',
      etfPrice: 'ETF Price',
      deemedPct: 'Deemed / Price %',
    },
    scoreDialog: {
      header: 'Tax Efficiency Score: {score} / 100',
      header_sub: 'Wie Ihr ETF für österreichische Steuerzwecke bewertet wird',
      taxBurden_title: 'Tax Burden',
      consistency_title: 'Vorhersagbarkeit (Konsistenz)',
      deemed_title: 'Ausschüttungsgleiche vs. Gesamtgewinne',
      deemed_excluded: 'Ausgeschlossen — Gesamtgewinne sind nicht positiv oder das Verhältnis liegt außerhalb von 0–200 %. Das Gewicht der Komponente wurde auf die anderen Komponenten verteilt.',
      grade_thresholds: 'Notengrenzen',
      score_gte: 'Punktzahl ≥ {min}',
      of_total_score: 'des Gesamtwertes',
      context1: 'In Österreich müssen Sie bei thesaurierenden ETFs ("Meldefonds") jährlich KESt (27,5 %) auf ausschüttungsgleiche Erträge zahlen — auch wenn Sie nie verkaufen. Dieser Score misst die Höhe dieser jährlichen Steuerbelastung und wie gut Sie dafür planen können. Höher ist besser.',
      cvVsMaxSwing: 'Die Predictability-Komponente der Note verwendet CV (Variationskoeffizient), um typische, relative Jahr-zu-Jahr-Variabilität um den Mittelwert zu erfassen. Zusätzlich zeigen wir unter "Consistency Metrics" die Kennzahl "Max Swing" an; Max Swing berichtet den schlimmsten absoluten Jahr-zu-Jahr-Sprung, ist aber nicht direkt Teil der numerischen Note. Zusammen zeigen sie typische Streuung (CV) und Extrembewegungen (Max Swing).',
      taxBurden_example: 'Ihr Wert: durchschnittlicher ausschüttungsgleicher Ertrag / ETF-Preis = {pct} % pro Jahr',
      taxBurden_explain: 'Der jährliche ausschüttungsgleiche Ertrag als Prozentsatz Ihres ETF-Preises ist die direkteste Messgröße für die jährliche Steuerverpflichtung. Beispiel: 0,2 % bedeutet etwa 0,2 % × 27,5 % ≈ 0,055 % Kosten pro Jahr.',
      taxBurden_formula: 'score = max(0, 100 × (1 − avg% / 2))',
      taxBurden_plain: 'Kurz gesagt: wir skalieren den durchschnittlichen jährlichen Prozentsatz auf 0–100, wobei 0 % → 100 und 2 % → 0.',
      cv_label: 'Variationskoeffizient (CV):',
      cv_unavailable: '— (unzureichende Daten oder Mittelwert zu klein)',
      cv_explain: 'CV = Standardabweichung ÷ Mittelwert der jährlichen Verhältniswerte (ausschüttungsgleiche Erträge / Preis). Ein niedriger CV bedeutet stabile jährliche Werte. CV ist undefiniert, wenn der Mittelwert praktisch null ist oder weniger als zwei Berichte vorliegen; in diesen Fällen wird ein neutraler Vorhersagewert verwendet.',
      cv_formula: 'score = max(0, 100 × (1 − CV / 1.5))',
      cv_neutral_applied: 'neutral 50 pts applied — CV undefined',
      cv_example: 'Beispiel: CV = 0,3 → score ≈ 100 × (1 − 0,3 / 1,5) ≈ 80.',
      deemed_explain: 'Von allen Gewinnen, die Ihr ETF im Analysezeitraum erzielt hat, wurde dieser Anteil jährlich als ausschüttungsgleicher Ertrag besteuert, anstatt bei Verkauf versteuert zu werden. Ein kleinerer Anteil bedeutet mehr Steuerstundung bis zum Verkauf.',
      deemed_formula: 'score = max(0, 100 − deemedToTotalGains%)',
      deemed_example: 'Beispiel: wenn ausschüttungsgleiche Erträge 10 % der Gesamtgewinne ausmachen → score = 100 − 10 = 90. Ist das Verhältnis nicht vorhanden oder liegt es außerhalb von 0–200 %, wird die Komponente ausgeschlossen und ihr Gewicht auf die anderen Komponenten verteilt.',
      deemed_ratio_prefix: 'Ausschüttungsgleiche Erträge / Gesamtgewinne =',
    },
    grades: {
      A: 'Ausgezeichnet',
      B: 'Gut',
      C: 'Mässig',
      D: 'Schwach',
      E: 'Hohe Steuerbelastung',
    },
    comparison: {
      metric_label: 'Metrik',
      reports_tooltip: 'Anzahl verfügbarer Jahresberichte. Mehr Berichte = zuverlässigere Analyse.',
      maxSwing_tooltip: 'Worst-case Jahr-zu-Jahr-Schwankung der ausschüttungsgleichen Erträge als Prozentsatz des durchschnittlichen ETF-Preises.',
      cv_tooltip: 'Variationskoeffizient (CV) = Standardabweichung ÷ Mittelwert der jährlichen Verhältniswerte. Kleiner = stabiler. Bei zu kleinem Mittelwert oder <2 Berichten ist CV nicht verfügbar; verwenden Sie Max Swing für Worst-Case-Sprünge.',
      metric_overallScore: 'Overall Score',
      overallScore_tooltip: 'Composite tax efficiency score (0–100). Combines tax burden, predictability, and the share of deemed vs total gains. Higher is better.',
      predictability_tooltip: 'How predictable the annual deemed income is. Computed from the Coefficient of Variation (CV = stddev / mean) of yearly deemed/price ratios and mapped to 0–100 (higher = more predictable). CV may be unavailable when the mean is too small or when there are fewer than 2 reports; in such cases a neutral predictability is shown.',
      metric_reportsAvailable: 'Reports Available',
    },
    etfScore: {
      currentPrice_tooltip: 'Aktueller verfügbarer ETF-Preis in EUR',
      periodStart_tooltip: 'ETF-Preis zu Beginn des ersten Geschäftsjahres (laut OeKB-Steuerbericht), in EUR',
      periodEnd_tooltip: 'ETF-Preis am Ende des letzten Geschäftsjahres (laut OeKB-Steuerbericht), in EUR',
      totalGains_tooltip: 'Preiszuwachs über den Analysezeitraum in EUR. Die Daten stammen aus OeKB-Steuerberichten.',
      avgDeemedToCurrent_tooltip: 'Durchschnittlicher jährlicher ausschüttungsgleicher Ertrag als Prozentsatz des aktuellen ETF-Preises — nützlich zum Vergleich der laufenden Steuerbelastung zwischen ETFs.',
      predictability_tooltip: 'Misst, wie stabil der jährliche ausschüttungsgleiche Ertrag relativ zu seinem Mittelwert ist. CV wird berechnet und auf 0–100 skaliert (höher = stabiler). CV ist nicht verfügbar bei zu kleinem Mittelwert oder <2 Berichten.',
      section_priceOverview: 'Preisübersicht',
      section_deemedIncome: 'Ausschüttungsgleiche Erträge',
      section_consistency: 'Konsistenzmetriken',
      metric_currentPrice: 'Aktueller ETF-Preis',
      metric_pricePeriodStart: 'Preis zu Periodenbeginn',
      metric_pricePeriodEnd: 'Preis am Periodenende',
      metric_totalGainsPeriod: 'Gesamtgewinne (Periode)',
      metric_totalDeemedGains: 'Summe ausschüttungsgleicher Erträge',
      metric_deemedToTotal: 'Ausschüttungsgleiche / Gesamtgewinne',
      metric_avgDeemedPerYear: 'Durchschn. Ausschüttungsgleiche / Jahr',
      metric_avgDeemedToCurrent: 'Durchschn. Ausschüttungsgleiche / Aktueller Preis',
      metric_avgDeemedEtfPct: 'Durchschn. Ausschüttungsgleiche / ETF-Preis %',
      metric_maxDeemedDiff: 'Max. Differenz ausgeschüttungsgl.',
      metric_maxSwingAvgPrice: 'Max Swing / Durchschn. Preis',
      metric_predictabilityScore: 'Vorhersagbarkeit (Predictability)'
    }
  ,
  sections: {
    taxEfficiency: 'Steuereffizienz',
    priceOverview: 'Preisübersicht',
    deemedIncome: 'Ausschüttungsgleiche Erträge',
    consistency: 'Konsistenz'
  }
  },
  en: {
    appTitle: 'ETF Comparison AT',
    tabs: {
      analyser: {
        label: 'ETF Analyser',
        title: 'ETF Score Analyser',
        description: 'Enter an ISIN to calculate deemed income metrics, consistency scores, and price comparisons for Austrian tax purposes.',
      },
      compare: {
        label: 'Compare ETFs',
        title: 'ETF Comparison',
        description: 'Compare 2 to 4 ETFs side by side across all Austrian tax efficiency metrics. The best value in each row is highlighted.',
      },
    },
    common: {
      isinLabel: 'ISIN',
      isinPlaceholder: 'e.g. IE00B4L5Y983',
      invalidIsin: 'Invalid ISIN',
      invalidIsinDetailed: 'Invalid ISIN — must be 2 letters + 9 alphanumeric + 1 check digit (e.g. IE00B4L5Y983)',
      etfLabel: 'ETF {idx}',
    },
    actions: {
      addEtf: 'Add ETF',
      compare: 'Compare',
      recalculate: 'Recalculate',
      analyse: 'Analyse',
    },
    lang: { de: 'Deutsch (AT)', en: 'English' },
    labels: { taxEfficiency: 'Tax Efficiency', score: 'Score', report: 'Report', reports_plural: 'Reports' },
    etfComparison: {
      search_intro: 'Enter {min}–{max} ISINs to compare their Austrian tax efficiency metrics side by side.',
      staleResults: 'Your inputs have changed. Click <strong>Recalculate</strong> to update the comparison.',
      need_at_least_two: 'At least 2 ETFs must load successfully to show a comparison.',
    },
    reportTable: {
      title: 'Per-Report Detail',
      colDate: 'Report Date',
      colDeemedEur: 'Deemed Income (EUR)',
      colPriceEur: 'ETF Price (EUR)',
      colDeemedPct: 'Deemed / Price',
    },
    reportChart: {
      title: 'Yearly Report Metrics',
      deemedIncome: 'Deemed Income',
      etfPrice: 'ETF Price',
      deemedPct: 'Deemed / Price %',
    },
    taxBadge: {
      title: 'Austrian Tax Efficiency — {score}/100',
      taxBurden: 'Tax Burden',
      avg_deemed_prefix: 'avg deemed/price:',
      consistency: 'Consistency',
      deemed_label: 'Deemed / Gains',
      of_total_gains: 'of total gains taxed annually',
      deemed_excluded: 'excluded (gains not positive or ratio out of range)',
      click_for_methodology: 'Click for full methodology',
    },
    scoreDialog: {
      header: 'Tax Efficiency Score: {score} / 100',
      header_sub: 'How your ETF is rated for Austrian tax purposes',
      taxBurden_title: 'Tax Burden',
      consistency_title: 'Predictability (Consistency)',
      deemed_title: 'Deemed vs Total Gains',
      deemed_excluded: 'Excluded from this calculation — total gains are non-positive or the ratio falls outside the 0–200 % range. The component weight was redistributed to the other components.',
      grade_thresholds: 'Grade Thresholds',
      score_gte: 'score ≥ {min}',
      of_total_score: 'of total score',
      context1: 'In Austria, accumulating ETFs ("Meldefonds") require you to pay KESt (27.5 %) on deemed income every year — even if you never sell. This score measures the size of that annual tax burden and how predictably you can plan for it. Higher is better.',
      cvVsMaxSwing: 'The grade\'s predictability component uses CV (Coefficient of Variation) to capture typical, relative year-to-year variability around the average. We also surface a complementary metric called "Max Swing" in the main results (under "Consistency Metrics"); Max Swing reports the worst-case absolute year-to-year jump but is not directly part of the numeric grade. Showing both helps you see typical dispersion (CV) and extreme jumps (Max Swing).',
      taxBurden_example: 'Your value: avg deemed income / ETF price = {pct} % per year',
      taxBurden_explain: 'The annual deemed income as a percentage of your ETF price is the most direct measure of the yearly tax obligation. Example: 0.2 % → 0.2 % × 27.5 % ≈ 0.055 % cost per year.',
      taxBurden_formula: 'score = max(0, 100 × (1 − avg% / 2))',
      taxBurden_plain: 'In plain terms: we map the average annual deemed % to a 0–100 score with 0 % → 100 and 2 % → 0.',
      cv_label: 'Coefficient of Variation (CV):',
      cv_unavailable: '— (insufficient data or mean too small)',
      cv_explain: 'CV = standard deviation ÷ mean of the yearly deemed/price ratios. A low CV means stable yearly values. CV is undefined when the mean is effectively zero or when fewer than two reports exist; in those cases we show a neutral predictability value.',
      cv_formula: 'score = max(0, 100 × (1 − CV / 1.5))',
      cv_neutral_applied: 'neutral 50 pts applied — CV undefined',
      cv_example: 'Example: CV = 0.3 → score ≈ 100 × (1 − 0.3 / 1.5) ≈ 80.',
      deemed_explain: 'Of all the gains your ETF produced over the analysis period, this fraction was taxed annually as deemed income instead of being taxed when you sell. A lower fraction means more gains are tax-deferred until sale.',
      deemed_formula: 'score = max(0, 100 − deemedToTotalGains%)',
      deemed_example: 'Example: if deemed gains = 10 % of total gains → score = 100 − 10 = 90. If the ratio is missing or outside 0–200 %, the component is excluded and its weight is redistributed to the other components.',
      deemed_ratio_prefix: 'Deemed gains / total price gains =',
    },
    grades: {
      A: 'Excellent',
      B: 'Good',
      C: 'Moderate',
      D: 'Poor',
      E: 'High Tax Drag',
    },
    comparison: {
      metric_label: 'Metric',
      reports_tooltip: 'Number of yearly reports available. More reports = more reliable analysis.',
      maxSwing_tooltip: 'Worst-case year-to-year swing in deemed income as % of average ETF price.',
      cv_tooltip: 'Coefficient of Variation (CV) = standard deviation ÷ mean of yearly deemed/price ratios. Lower = more stable. CV is undefined when the mean is too small relative to the data or when there are fewer than 2 reports; use Max Swing for worst-case jumps.',
      metric_overallScore: 'Overall Score',
      overallScore_tooltip: 'Composite tax efficiency score (0–100). Combines tax burden, predictability, and the share of deemed vs total gains. Higher is better.',
      predictability_tooltip: 'How predictable the annual deemed income is. Computed from the Coefficient of Variation (CV = stddev / mean) of yearly deemed/price ratios and mapped to 0–100 (higher = more predictable). CV may be unavailable when the mean is too small or when there are fewer than 2 reports; in such cases a neutral predictability is shown.',
      metric_reportsAvailable: 'Reports Available',
    },
    etfScore: {
      currentPrice_tooltip: 'Latest available ETF price in EUR',
      periodStart_tooltip: 'ETF price at the start of the first business year (as reported in the OeKB fund tax report), in EUR',
      periodEnd_tooltip: 'ETF price at the end of the last business year (as reported in the OeKB fund tax report), in EUR',
      totalGains_tooltip: 'Price appreciation over the analysis period in EUR. Dates come from the OeKB fund tax reports.',
      avgDeemedToCurrent_tooltip: 'Average yearly deemed income as a percentage of the current ETF price — useful for comparing the ongoing annual tax burden between ETFs.',
      predictability_tooltip: 'Measures how stable the annual deemed income is relative to its average. We compute the Coefficient of Variation (CV = stddev / mean) and map it to 0–100 (higher = more predictable). CV can be unavailable for too-small means or <2 reports.',
      section_priceOverview: 'Price Overview',
      section_deemedIncome: 'Deemed Income (Ausschüttungsgleiche Erträge)',
      section_consistency: 'Consistency Metrics',
      metric_currentPrice: 'Current ETF Price',
      metric_pricePeriodStart: 'Price at Period Start',
      metric_pricePeriodEnd: 'Price at Period End',
      metric_totalGainsPeriod: 'Total Gains (Period)',
      metric_totalDeemedGains: 'Total Deemed Gains',
      metric_deemedToTotal: 'Deemed / Total Gains',
      metric_avgDeemedPerYear: 'Avg Deemed Income / Year',
      metric_avgDeemedToCurrent: 'Avg Deemed / Current Price',
      metric_avgDeemedEtfPct: 'Avg Deemed / ETF Price %',
      metric_maxDeemedDiff: 'Max Deemed Income Diff',
      metric_maxSwingAvgPrice: 'Max Swing / Avg Price',
      metric_predictabilityScore: 'Predictability Score'
    }
  ,
  sections: {
    taxEfficiency: 'Tax Efficiency',
    priceOverview: 'Price Overview',
    deemedIncome: 'Deemed Income',
    consistency: 'Consistency'
  }
  }
};

let current = 'de';

export function t(key, vars = {}) {
  const parts = key.split('.');
  let s = translations[current];
  for (const p of parts) {
    if (!s) break;
    s = s[p];
  }
  if (typeof s !== 'string') return key;
  // simple variable interpolation {name}
  return s.replace(/\{([^}]+)\}/g, (_, name) => (vars[name] != null ? String(vars[name]) : `{${name}}`));
}

export function setLocale(locale) {
  if (translations[locale]) current = locale;
}

export function getLocale() { return current; }

export default translations;






















