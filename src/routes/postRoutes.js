const express = require('express');
const postController = require('../controllers/postController');

const router = express.Router();

router.post('/create', postController.createPost);

router.get('/get', postController.getAllPosts);

router.get('/user/:id', postController.getUserPostsById);

router.get('/:id', postController.getPostById);

router.patch('/:id', postController.updatePost);

router.delete('/:id', postController.deletePost);

router.post('/:id/like', postController.likePost);

router.delete('/:id/like', postController.unlikePost);

module.exports = router;