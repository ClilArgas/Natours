const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
//Middlewares runs in suqeunce so if we put the protect middleware on the router before all the functions who need the protect method it will work for every methods who needs it after
router.use(authController.protect);

router.patch(
  '/updatePassword',

  authController.updatePassword
);
router.get(
  '/me',

  userController.getMe,
  userController.getUser
);
router.patch(
  '/updateMe',
  userController.uploadImage,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);
// restrict all the actions on the users in genrals to only admins
router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
