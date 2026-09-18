import express from 'express';
import planContactSync from '../services/contact-sync.js';

const router = express.Router();

router.post('/plan', (req, res) => {
  try {
    const { incoming, existing } = req.body;
    const result = planContactSync(incoming, existing);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
