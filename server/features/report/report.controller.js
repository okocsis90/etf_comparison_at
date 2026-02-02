import { getReportData } from './report.service.js';

export async function fetchReportHandler(req, res) {
  const { isin } = req.query;
  if (!isin) return res.status(400).json({ error: 'ISIN required' });

  try {
    const result = await getReportData(isin);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch or parse page', details: err.message });
  }
}
