const ProductModel = require('../../models/Product');
const BannerModel = require('../../models/Banner');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const {
  validateCreateRestaurant,
  validateUpdateRestaurant,
  loginValidator,
  foodValidator,
  productValidator
} = require('../validator/ProductValidator');
const { rest } = require('lodash');

class AdminController {
  async getList(req, res) {
    const list = await RestaurantModel.find()
      .select('name description score adminUsername pic address')
      .limit(20);
    res.send(list);
  }

  async getListForUser(req, res) {
    console.log("getListForUser...")
    let { sort } = req.query;
    console.log("sort :", sort)

    let list;

    switch (parseInt(sort)) {
      case 1://popular
        list = await ProductModel.find()
          .select('-comments')
          .sort({ score: -1 });
        console.log("sort 1 Done")
        break;

      case 4://ready
        console.log("backend in sort:4");
        list = await ProductModel.find({ ready: true })
          .select('-comments')
        // .sort({ timestamp: -1 });
        break;

      case 0://latest
      default:
        list = await ProductModel.find()
          .select('-comments')
          .sort({ createdAt: -1 });
        //updateAt or createAt
        break;

    }
    res.send(list);
  }

  async getProductComments(req, res) {
    let { product_id } = req.params;
    const data = await ProductModel.findById(product_id).select('comments').populate({
      path: 'comments',
      options: { sort: { 'createdAt': -1 } },
      populate: {
        path: 'author',
        select: { username: 1 }
      }
    });
    if (!data) return res.status(404).send('not found');
    res.send(data.comments);
  }


  async getBanner(req, res) {
    const list = await BannerModel.find()
    res.send(list);
  }

  async getOne(req, res) {
    const id = req.params.id;
    const data = await RestaurantModel.findById(id).select('-adminPassword');
    if (!data) return res.status(404).send('not found');
    res.send(data);
  }



  async getOneForUser(req, res) {
    const id = req.params.id;
    const data = await ProductModel.findById(id);
    if (!data) return res.status(404).send('not found');
    res.send(data);
  }

  async create(req, res) {
    const { error } = validateCreateRestaurant(req.body);
    if (error) return res.status(400).send(error.message);
    let restaurant = new RestaurantModel(
      _.pick(req.body, [
        'name',
        'description',
        'address',
        'adminUsername',
        'adminPassword',
      ]),
    );
    const salt = await bcrypt.genSalt(10);
    restaurant.adminPassword = await bcrypt.hash(
      restaurant.adminPassword,
      salt,
    );
    restaurant = await restaurant.save();
    res.send(restaurant);
  }

  async update(req, res) {
    const id = req.params.id;
    const { error } = validateUpdateRestaurant(req.body);
    if (error) return res.status(400).send(error.message);
    const result = await RestaurantModel.findByIdAndUpdate(id, {
      $set: _.pick(req.body, [
        'name',
        'description',
        'address',
        'adminUsername',
        'adminPassword',
      ]),
    }, { new: true });
    if (!result) return res.status(404).send('not found');
    res.send(
      _.pick(result, [
        'name',
        'description',
        'address',
        'adminUsername',
        'adminPassword',
      ]),
    );
  }

  async delete(req, res) {
    const id = req.params.id;
    const result = await RestaurantModel.findByIdAndRemove(id);
    res.status(200).send();
  }

  async login(req, res) {
    const { error } = loginValidator(req.body);
    if (error) return res.status(400).send({ message: error.message });

    let restaurant = await RestaurantModel.findOne({ adminUsername: req.body.username });
    if (!restaurant)
      return res
        .status(400)
        .send({ message: 'رستورانی با این نام کاربری یا پسورد یافت نشد' });

    const result = await bcrypt.compare(req.body.password, restaurant.adminPassword);
    if (!result)
      return res
        .status(400)
        .send({ message: 'رستورانی با این نام کاربری یا پسورد یافت نشد' });

    const token = restaurant.generateAuthToken();
    res.header("Access-Control-Expose-headers", "x-auth-token").header('x-auth-token', token).status(200).send({ success: true });

  }

  async addProduct(req, res) {
    console.log(req.file);
    console.log("body: ", req.body);
    const { error } = productValidator(req.body);
    if (error) return res.status(400).send(error.message);
    let product = new ProductModel(
      _.pick(req.body, [
        'title',
        'description',
        'price',
        'previous_price',
      ]),
    );
    product.image = req.file.path
    //:برای قابل استفاده کردن این ادرس برای کاربر
    //uploads\\flower.jpg -> http://localhost:3000/flower.jpg
    product = await product.save();
    res.send(product);
  }

  async deleteFood(req, res) {
    const restaurant = await RestaurantModel.findOne({ adminUsername: req.user.username });
    if (!restaurant) return res.status(404).send("رستوران مربوطه پیدا نشد");
    const foodId = req.params.foodId;
    const foundFood = restaurant.menu.id(foodId);
    if (foundFood)
      foundFood.remove();
    await restaurant.save();
    res.send(true);
  }

  async updateFood(req, res) {
    const restaurant = await RestaurantModel.findOne({ adminUsername: req.user.username });
    if (!restaurant) return res.status(404).send("رستوران مربوطه پیدا نشد");
    const foodId = req.params.foodId;
    const foundFood = restaurant.menu.id(foodId);
    if (foundFood) {
      if (req.body.name)
        foundFood.name = req.body.name;
      if (req.body.description)
        foundFood.description = req.body.description;
      if (req.body.price)
        foundFood.price = req.body.price;
    }
    await restaurant.save();
    res.send(true);
  }

  async getFoodList(req, res) {
    const restaurant = await RestaurantModel.findOne({ adminUsername: req.user.username });
    if (!restaurant) return res.status(404).send("رستوران مربوطه پیدا نشد");
    res.send(restaurant.menu);
  }

  async setFoodPhoto(req, res) {
    console.log(req.file);
    res.send(req.file)
  }

}

module.exports = new AdminController();
