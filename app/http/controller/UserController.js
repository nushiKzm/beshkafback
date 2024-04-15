const _ = require('lodash');
const bcrypt = require('bcrypt');
const UserModel = require("../../models/User")
const ProductModel = require("../../models/Product")
const CommentModel = require("../../models/Comment")
const ItemModel = require("../../models/Item")
const OrderModel = require("../../models/Order")
const {
  validateCreateUser,
  validateLoginUser
} = require('../validator/UserValidator');
// const { rest, repeat } = require('lodash');
// const { exist } = require('joi');


class UserController {
  //
  async login(req, res) {
    console.log("login...")
    const { error } = validateLoginUser(req.body);
    console.log("error...", error)
    if (error) return res.status(400).send({ message: error.message });
    let user = await UserModel.findOne({ username: req.body.username });
    if (!user)
      return res
        .status(400)
        .send({ message: 'کاربری با این ایمیل یا پسورد یافت نشد' });
    const result = await bcrypt.compare(req.body.password, user.password);
    if (!result)
      return res
        .status(400)
        .send({ message: 'کاربری با این ایمیل یا پسورد یافت نشد' });
    const token = user.generateAuthToken();
    console.log("token : ", token)
    let name = user.first_name == null || user.last_name == null ? user.username : `${user.first_name} ${user.last_name}`
    console.log("name : ", name)
    res.header("Access-Control-Expose-headers", "x-auth-token").header('x-auth-token', token).status(200).json({ "name": name });
  }


  //
  async getUserInfo(req, res) {
    console.log("getUserInfo...")
    let user = await UserModel.findOne({ _id: req.user._id }).select('-basket -username -password -__v');
    if (!user)
      return res
        .status(400)
        .send({ message: 'ابتدا وارد حساب کاربری خود شوید' });
    if (!user.size || !user.overall_height || !user.first_name || !user.last_name || !user.mobile || !user.address || !user.postal_code) {
      res.status(200).json({ "_id": user._id, "first_name": '', "last_name": '', "mobile": '', "address": '', "postal_code": '', "overall_height": 0, "size": 0 });
    }
    res.status(200).json(user);
  }


  //
  async register(req, res) {
    console.log("register...")
    const { error } = validateCreateUser(req.body);
    if (error) return res.status(400).send({ message: error.message });
    let user = await UserModel.findOne({ username: req.body.username });
    if (user)
      return res
        .status(400)
        .send({ message: 'کاربری با این ایمیل وجود دارد' });
    user = new UserModel(_.pick(req.body, ["username", "password"]))
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    user = await user.save();
    console.log("user: ", user)
    const token = user.generateAuthToken();
    // console.log("token : ", token)
    res.header("Access-Control-Expose-headers", "x-auth-token").header('x-auth-token', token).status(200).send({ success: true });
  }

  //
  async addCommentToProduct(req, res) {
    const { product_id } = req.params;
    const product = await ProductModel.findById(product_id);
    if (!product) return res.status(404).send('محصول مربوطه یافت نشد');
    const comment = await CommentModel.create({
      title: req.body.title,
      content: req.body.content,
      author: req.user._id
    });
    product.comments.push(comment._id)
    await product.save();
    res.send(true);
  }

  //
  async addOrder(req, res) {
    console.log("addOrder...")
    const { payable_price, size, overall_height, address, mobile, postal_code, last_name, first_name, payment_method } = req.body;
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).send('کاربر لاگین نیست');
    const order = await OrderModel.create({
      user_id: user._id,
      size,
      overall_height,
      address,
      mobile,
      postal_code,
      last_name,
      first_name,
      payment_method,
      items: user.basket,
      payable_price
    });
    if (order) {
      user.basket = []
      user.save();
      res.status(200).json({ "order_id": order._id, "bank_gateway_url": "" });
    } else {
      res.status(400).json('ثبت سفارش ناموفق');
    }
  }

  //
  async orderList(req, res) {
    console.log("orderList...")
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).send('کاربر لاگین نیست');
    let order_list = await OrderModel.find({ user_id: user._id }).populate({
      path: 'items',
      populate: {
        path: 'product_id',
      }
    })
    if (order_list) {
      res.status(200).send(order_list);
    } else {
      res.status(400).json('فچ اطلاعات ناموفق');
    }
  }

  //
  async paymentCheckOut(req, res) {
    console.log("paymentCheckOut...")
    const { order_id } = req.query;
    const order = await OrderModel.findById(order_id).populate({
      path: 'user_id',
      // select: { 'basket': 1, "name": 1 },
      // populate: {
      //   path: 'basket',
      //   select: { 'count': 1, "product_id": 1 },
      //   populate: {
      //     path: 'product_id',
      //     select: { 'title': 1, "price": 1, "previous_price": 1 },
      //   }
      // }
    });
    if (!order) return res.status(404).send('همچین سفارشی ثبت نشده است');
    switch (order.payment_status) {
      case '-1':
        res.status(200).json({ "purchase_success": false, "payable_price": order.payable_price, "payment_status": "پرداخت نشده", "order": order });
        break;
      case '0':
        res.status(200).json({ "purchase_success": false, "payable_price": order.payable_price, "payment_status": "در انتظار پرداخت", "order": order });
        break;
      case '1':
        res.status(200).json({ "purchase_success": true, "payable_price": order.payable_price, "payment_status": "پرداخت شده", "order": order });
        break;
      default:
        res.status(400).json({ "message": "استاتوس پرداخت دچار مشکل شد", "order": order });
        break;
    }
  }

  //
  async updateBasket(req, res) {
    console.log("update basket ...")
    const { product_id } = req.params;
    const user = await UserModel.findById(req.user._id).populate('basket');
    console.log("user : ", user);
    if (!user)
      return res
        .status(401)
        .send({ message: "شما کاربر لاگین شده نیستید" });
    if (!user.size || !user.overall_height)
      return res
        .status(401)
        .send({ message: "قبل از ثبت سفارش پروفایل خود را کامل کنید" });
    let is_exist = false;
    user.basket.forEach(element => {
      if (element.product_id == product_id) {
        is_exist = true;
        console.log(is_exist);
      }
    });
    if (is_exist) {
      return res
        .status(401)
        .send({ message: "محصول قبلا اضافه شده است" });
    } else {
      let item = new ItemModel({
        product_id,
      });
      await item.save();
      await user.basket.push(item._id);
      await user.save();
      res
        .status(200)
        .json({ "product_id": product_id, "_id": item._id, "count": item.count });
    }
  }

  //
  async basketList(req, res) {
    console.log("basketList...")
    const user = await UserModel.findById(req.user._id).select('basket').populate({
      path: 'basket',
      populate: {
        path: 'product_id',
      }
    });
    console.log("user : ", user)
    if (!user)
      return res
        .status(401)
        .send({ message: "شما کاربر لاگین شده نیستید" });
    let payable_price = 0
    let total_price = 0
    user.basket.forEach(element => {
      payable_price += (element.product_id.price * element.count)
    });
    user.basket.forEach(element => {
      total_price += (element.product_id.previous_price * element.count)
    });
    let shipping_cost = payable_price >= 250000 ? 0 : 30000;
    res
      .status(200)
      .json({ "cart_items": user.basket, "payable_price": payable_price, "total_price": total_price, "shipping_cost": shipping_cost });
  }

  //
  async countItems(req, res) {
    console.log("countItems...")
    const user = await UserModel.findById(req.user._id).select('basket').populate({
      path: 'basket',
    });
    let itemCount = 0;
    user.basket.forEach((element) => {
      itemCount += element.count
    })
    // console.log("user : ", user)
    // console.log("itemCount : ", itemCount)
    if (!user)
      return res
        .status(401)
        .send({ message: "شما کاربر لاگین شده نیستید" });
    res
      .status(200)
      .json({ "count": itemCount });
  }

  //
  async deleteItem(req, res) {//حذف یک ایتم سبد خرید
    console.log('deleteItem...');
    const id = req.params.id;
    const user = await UserModel.findById(req.user._id);
    if (!user)
      return res
        .status(401)
        .send({ message: "شما کاربر لاگین شده نیستید" });
    let oldBasketLength = user.basket.length;
    for (var i = 0; i < user.basket.length; i++) {
      if (user.basket[i] == id) {
        user.basket.splice(i, 1);
      }
    }
    let newBasketLength = user.basket.length;
    if (newBasketLength - oldBasketLength) {
      await user.save();
      const item = await ItemModel.deleteOne({ _id: id });
      if (item.deletedCount) {
        res.status(200).send("succes");
      }
      else {
        res.status(400).send('به دلیلی نامشخص چیزی حذف نشد');
      }
    } else {
      res.status(400).send('همچین محصولی در سبد خرید شما نیست');
    }
  }

  //
  async changeItemCount(req, res) {
    console.log("changeItemCount...");
    //تغییر تعداد یک ایتم سبد خرید
    const user = await UserModel.findById(req.user._id);
    if (!user)
      return res
        .status(401)
        .send({ message: "شما کاربر لاگین شده نیستید" });
    const item = await ItemModel.findOneAndUpdate({ _id: req.body.item_id }, {
      $set: _.pick(req.body, [
        'count'
      ])
    }, { new: true })
    console.log("item : ", item)

    res.status(200).send(item);
  }

  //
  async updateProfile(req, res) {
    console.log("updateProfile ...")
    const user = await UserModel.findByIdAndUpdate(req.user._id, {
      $set: _.pick(req.body, [
        'first_name',
        'last_name',
        'mobile',
        'address',
        'postal_code',
        'last_name',
        'size',
        'overall_height'
      ]),
    }, { new: true });
    if (!user)
      return res
        .status(401)
        .send({ message: "شما کاربر لاگین شده نیستید" });
    res.status(200).json(user);
  }

  //
  async searchProduct(req, res) {
    const {
      str, // product_id
      // page = 1,
      // limit = 5
    } = req.query;
    const product_list = await ProductModel.aggregate([
      { $match: { title: { $regex: `.*${str}.*`, $options: 'si' } } },
      {
        $project: { //properties to show : Select
          code: 1,
          title: 1,
          image: 1,
          description: 1,
          price: 1,
          previous_price: 1,
          discount: 1,
          score: 1,
          comments: 1,
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    // let page = 1
    // let limit = 5
    // const parsePage = parseInt(page, 10);
    // const parseLimit = parseInt(limit, 10);
    // const total = product_list.length;
    // const pages = Math.ceil(total / parseInt(limit, 10));
    // const end = parsePage * parseLimit;
    // const start = end - parseLimit;
    // const docs = product_list.slice(start, end);
    if (product_list.length == 0) {
      return res
        .status(401)
        .send({ message: "نتیجه ای یافت نشد" });
    }
    res.send(product_list)
  }
}

module.exports = new UserController();
