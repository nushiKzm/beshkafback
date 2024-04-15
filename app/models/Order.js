const mongoose = require('mongoose');

const schemaOrder = new mongoose.Schema({
    first_name: { type: String, required: true, },
    last_name: { type: String, required: true, },
    postal_code: { type: String, required: true, },
    mobile: { type: String, required: true, },
    address: { type: String, required: true, },
    overall_height: { type: Number, required: true, },
    size: { type: Number, required: true, },
    payment_method: { type: String },
    payment_status: { type: String, default: 1, },
    //-1 نشده
    //0 درانتظار
    //1 شد
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "item" }],
    payable_price: { type: Number, required: true, },
},
    {
        timestamps: true
    }
);

const model = mongoose.model('order', schemaOrder);

module.exports = model;
