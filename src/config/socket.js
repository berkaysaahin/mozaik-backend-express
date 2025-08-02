module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinConversation', (conversationId) => {
      socket.join(`convo_${conversationId}`);
      console.log(`Client joined conversation ${conversationId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
    
    socket.on('sendMessage', async ({ conversationId, message }) => {
  io.to(`convo_${conversationId}`).emit('newMessage', {
    action: 'create',
    message
  });
});
  
  });
};