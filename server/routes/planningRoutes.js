const express = require('express');
const { requireMentor } = require('../middlewares/roleCheck');
const controller = require('../controllers/planningController');

const router = express.Router();
router.use(requireMentor);
router.get('/', controller.getBoard);
router.post('/columns', controller.createColumn);
router.put('/columns/reorder', controller.reorderColumns);
router.put('/columns/:id', controller.updateColumn);
router.delete('/columns/:id', controller.deleteColumn);
router.post('/cards', controller.createCard);
router.put('/cards/reorder', controller.reorderCards);
router.put('/cards/:id', controller.updateCard);
router.delete('/cards/:id', controller.deleteCard);
router.post('/cards/:id/assign', controller.assignCard);
module.exports = router;
