const express = require('express');
const controller = require('../controllers/gamificationController');
const { requireMentor } = require('../middlewares/roleCheck');

const router = express.Router();
router.get('/dashboard', controller.dashboard);
router.get('/algorithm', controller.algorithm);
router.get('/activity', controller.activity);
router.put('/weeks/current', requireMentor, controller.updateWeek);
module.exports = router;
