const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

module.exports = router;
