//آیتم سبد خرید
const mongoose = require('mongoose');

const schemaItem = new mongoose.Schema({
    count: { type: Number, default: 1 },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "product" }
});

const model = mongoose.model('item', schemaItem);

module.exports = model;
