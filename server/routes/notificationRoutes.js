const express = require('express');
const controller = require('../controllers/notificationController');

const router = express.Router();
router.get('/settings', controller.getSettings);
router.put('/settings', controller.updateSettings);
router.get('/vapid-public-key', controller.publicKey);
router.post('/subscriptions', controller.subscribe);
router.delete('/subscriptions', controller.unsubscribe);
module.exports = router;
