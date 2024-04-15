const mongoose = require('mongoose');
const config = require('config');
const jwt = require('jsonwebtoken');

const schema = new mongoose.Schema({
  username: { type: String, required: true, },
  password: { type: String, required: true, },
  first_name: String,
  last_name: String,
  mobile: String,
  address: String,
  postal_code: String,
  overall_height: Number,
  size: Number,
  basket: [{ type: mongoose.Schema.Types.ObjectId, ref: "item", }]
});

schema.methods.generateAuthToken = function () {
  console.log("generateAuthToken...")
  const data = {
    _id: this._id,
    username: this.username,
    role: "user",
  };

  return jwt.sign(data, config.get('jwtPrivateKey'));
};

const model = mongoose.model('user', schema);

module.exports = model;

