const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/user', userController.getUser);
router.get('/userList', userController.getAllUsers);
router.delete('/deleteUser', userController.deleteUser);

module.exports = router;