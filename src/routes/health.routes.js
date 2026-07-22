const express = require('express');
const router = express.Router();

<<<<<<< HEAD
router.get('/api/health', (req, res) => {
=======
router.get('/health', (req, res) => {
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
    res.json({ status: 'OK', timestamp: new Date() });
});

module.exports = router;
