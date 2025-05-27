const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const conversationController = require('../controllers/conversationController');


router.post('/conversations', conversationController.createConversation);
router.get('/conversations/:userId', conversationController.getUserConversations);
router.get('/conversations/single/:id', conversationController.getConversation);
router.delete('/conversations/:id', conversationController.deleteConversation);

router.post('/messages', messageController.sendMessage);
router.get('/conversations/:conversationId/messages', messageController.getMessages);
router.delete('/messages/:messageId', messageController.deleteMessage);
router.patch('/conversations/:conversationId/messages/seen', messageController.markMessagesAsSeen);

module.exports = router;