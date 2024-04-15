const mongoose = require('mongoose');

const schemeProduct = new mongoose.Schema({
  // code: { type: Number },
  title: { type: String, required: true },
  image: String,
  description: { type: String, required: true },
  price: { type: Number, required: true },
  previous_price: { type: Number },
  discount: { type: Number },
  score: { type: Number, default: 0 },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "comment",
  }],
  ready: { type: Boolean, default: false }
},
  {
    timestamps: true
  }
);


const model = mongoose.model('product', schemeProduct);

module.exports = model;

