const express = require('express');
const userController = require('../controllers/userController');
const {verifyJWT} = require('../middleware/verifyJWT');

const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/userList', verifyJWT, userController.getAllUsers);
router.get('/:userId',  userController.getUser);
router.patch('/:userId', verifyJWT, userController.updateProfile);
router.delete('/deleteUser', verifyJWT, userController.deleteUser);

module.exports = router;