const router = require('express').Router();
const AdminRoutes = require('./AdminRoutes');
const SuperAdminRoutes = require('./SuperAdminRoutes');
const UserRoutes = require('./UserRoutes');

router.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, x-auth-token, Content-Type, Accept'
    )
    res.header('x-auth-token', ' 3.2.1')
    next()
})

router.use('/admin', AdminRoutes);
router.use('/restaurant', SuperAdminRoutes);
router.use('/user', UserRoutes);


module.exports = router;
