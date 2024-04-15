const multer = require("multer");
const router = require('express').Router();
const controller = require('../http/controller/AdminController');

const Auth = require("../http/middleware/Auth")
const Admin = require("../http/middleware/Admin")

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
        //'uploads'
        //farghi nadidm to in 2
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname)
    }
})

var upload = multer({ storage: storage })

router.post('/login', controller.login);

router.post("/product/addProduct", [upload.single("productPhoto")], controller.addProduct)
// router.post("/product/addProduct", [Auth, Admin, upload.single("foodPhoto")], controller.addFood)
router.delete("/foods/deleteFood/:foodId", [Auth, Admin], controller.deleteFood)
router.put("/foods/updateFood/:foodId", [Auth, Admin], controller.updateFood)
router.get("/foods/getFoodList", [Auth, Admin], controller.getFoodList)



module.exports = router;
