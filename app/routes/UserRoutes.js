const multer = require("multer");
const router = require('express').Router();
const controller = require('../http/controller/AdminController');
const userController = require('../http/controller/UserController');

const Auth = require("../http/middleware/Auth")


router.post('/login', userController.login);
router.post('/register', userController.register);
router.post('/updateProfile', [Auth], userController.updateProfile);
router.get('/info', [Auth], userController.getUserInfo);

router.get('/banner/slider', controller.getBanner);

router.get('/productList', controller.getListForUser);
router.get('/productDetail/:id', controller.getOneForUser);
router.get('/searchProduct', userController.searchProduct);

router.post('/addCommentProduct/:product_id', [Auth], userController.addCommentToProduct);
router.get('/productComments/:product_id', controller.getProductComments);

router.get('/updateBasket/:product_id', [Auth], userController.updateBasket);
router.get('/basketList', [Auth], userController.basketList);
router.delete('/removeItemFromBasket/:id', [Auth], userController.deleteItem);
router.post('/changeItemCount', [Auth], userController.changeItemCount);
router.get('/countItems', [Auth], userController.countItems);

router.post('/addOrder', [Auth], userController.addOrder);
router.get('/orderList', [Auth], userController.orderList);
router.get('/checkout', userController.paymentCheckOut);


module.exports = router;
