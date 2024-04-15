const mongoose = require('mongoose');

const schemeBanner = new mongoose.Schema({
    image: String,
    link_type: { type: Number, default: 2 },
    link_value: { type: String, default: "0" },
},
    {
        timestamps: true
    }
);

const model = mongoose.model('banner', schemeBanner);

module.exports = model;

