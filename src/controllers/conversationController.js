const Conversation = require('../models/conversation');
const Message = require('../models/message');

const conversationController = {
    async createConversation(req, res) {
        try {
            const { user1, user2 } = req.body;

            if (!user1 || !user2) {
                return res.status(400).json({
                    error: 'Both user IDs are required',
                    details: 'Provide user1 and user2 in the request body'
                });
            }

            const conversation = await Conversation.create(user1, user2);

            res.status(201).json(conversation);
        } catch (error) {
            if (error.message.includes('violates foreign key constraint')) {
                return res.status(400).json({
                    error: 'Invalid user ID provided',
                    details: 'One or both users do not exist'
                });
            }
            res.status(500).json({
                error: 'Failed to create conversation',
                details: error.message
            });
        }
    },

    async getUserConversations(req, res) {
        try {
            const { userId } = req.params;

            if (!isValidUUID(userId)) {
                return res.status(400).json({ error: 'Invalid user ID format' });
            }

            const conversations = await Conversation.findByUserId(userId);

           
            return res.status(200).json(conversations);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to fetch conversations',
                details: error.message
            });
        }
    },

    async getConversation(req, res) {
        try {
            const { id } = req.params;
            const conversation = await Conversation.findById(id);

            if (!conversation) {
                return res.status(404).json({
                    error: 'Conversation not found',
                    details: `No conversation with ID ${id} exists`
                });
            }

            res.json(conversation);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to fetch conversation',
                details: error.message
            });
        }
    },

    async deleteConversation(req, res) {
        try {
            const { id } = req.params;
            const conversation = await Conversation.delete(id);

            if (!conversation) {
                return res.status(404).json({
                    error: 'Conversation not found',
                    details: `No conversation with ID ${id} exists`
                });
            }

            await Message.deleteByConversationId(id);

            res.json({
                message: 'Conversation deleted successfully',
                deletedConversation: conversation
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to delete conversation',
                details: error.message
            });
        }
    }
};

function isValidUUID(uuid) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
}

module.exports = conversationController;