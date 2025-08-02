const Message = require('../models/message');
const Conversation = require('../models/conversation');

const messageController = {
    async sendMessage(req, res) {
        try {
            const { conversation_id, content } = req.body;
            const sender_id = 'b2ecc8ae-9e16-42eb-915f-d2e1e2022f6c';

            if (!conversation_id || !content) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    details: 'Both conversation_id and content are required'
                });
            }

            const conversation = await Conversation.findById(conversation_id);
            if (!conversation) {
                return res.status(404).json({
                    error: 'Conversation not found',
                    details: `No conversation with ID ${conversation_id} exists`
                });
            }

            if (![conversation.user1, conversation.user2].includes(sender_id)) {
                return res.status(403).json({
                    error: 'Unauthorized',
                    details: 'You are not a participant in this conversation'
                });
            }

            const message = await Message.create({
                conversation_id,
                sender_id,
                content
            });

            const io = req.app.get('io');

            io.to(`convo_${conversation_id}`).emit('newMessage', {
                action: 'create',
                message: message
            });

            res.status(201).json({
                message: 'Message sent successfully',
                data: message
            });




        } catch (error) {
            res.status(500).json({
                error: 'Failed to send message',
                details: error.message
            });
        }


    },

    async getMessages(req, res) {
        try {
            const { conversationId } = req.params;
            const userId = 'b2ecc8ae-9e16-42eb-915f-d2e1e2022f6c';

            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({ error: 'Conversation not found' });
            }

            if (![conversation.user1, conversation.user2].includes(userId)) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            const { limit = 50, offset = 0 } = req.query;
            const messages = await Message.findByConversation(conversationId, limit, offset);

            await Message.markAsSeen(conversationId, userId);

            const io = req.app.get('io');
            try {
                io.to(`convo_${conversationId}`).emit('messagesRead', {
                    conversationId,
                    readerId: userId
                });
            } catch (e) {
                console.error('Socket emit error:', e);
            }

            return res.json({
                message: 'Messages retrieved successfully',
                data: messages,
                meta: {
                    conversationId,
                    totalCount: messages.length,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            });

        } catch (error) {
            return res.status(500).json({
                error: 'Failed to retrieve messages',
                details: error.message
            });
        }
    }
    ,

    async deleteMessage(req, res) {
        try {
            const { messageId } = req.params;
            const userId = 'b2ecc8ae-9e16-42eb-915f-d2e1e2022f6c';

            const deletedMessage = await Message.delete(messageId, userId);
            if (!deletedMessage) {
                return res.status(404).json({
                    error: 'Message not found or unauthorized',
                    details: 'The message either does not exist or you are not the sender'
                });
            }

            const io = req.app.get('io');
            io.to(`convo_${deletedMessage.conversation_id}`).emit('messageDeleted', {
                action: 'delete',
                messageId: deletedMessage.id,
                conversationId: deletedMessage.conversation_id
            });

            res.json({
                message: 'Message deleted successfully',
                data: deletedMessage
            });




        } catch (error) {
            res.status(500).json({
                error: 'Failed to delete message',
                details: error.message
            });
        }
    },

    async markMessagesAsSeen(req, res) {
        try {
            const { conversationId } = req.params;
            const userId = 'b2ecc8ae-9e16-42eb-915f-d2e1e2022f6c';

            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({
                    error: 'Conversation not found',
                    details: `No conversation with ID ${conversationId} exists`
                });
            }

            if (![conversation.user1, conversation.user2].includes(userId)) {
                return res.status(403).json({
                    error: 'Unauthorized',
                    details: 'You are not a participant in this conversation'
                });
            }

            const updatedMessages = await Message.markAsSeen(conversationId, userId);

            res.json({
                message: 'Messages marked as seen',
                data: {
                    conversationId,
                    markedCount: updatedMessages.length
                }
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to mark messages as seen',
                details: error.message
            });
        }
    }
};

module.exports = messageController;