import express from 'express';
import { fetchReportHandler } from './report.controller.js';

const router = express.Router();

router.get('/fetch-report', fetchReportHandler);

export default router;
