const express = require('express');
const { protect, logout } = require('../controllers/auth');

const router = express.Router();

const {
  signUp,
  logIn,
  forgotPassword,
  resetPassword,
  changePassword,
} = require('../controllers/auth');

const {
  getAllUsers,
  addUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
} = require('../controllers/usersController');

router.post('/signup', signUp);
router.post('/login', logIn);
router.get('/logout', protect, logout);
router.post('/forgotpassword', forgotPassword);
router.post('/resetpassword/:token', resetPassword);
router.patch('/changepassword', protect, changePassword);

router.patch('/updateme', protect, updateMe);
router.delete('/deleteme', protect, deleteMe);

router.route('/').get(getAllUsers).post(addUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
