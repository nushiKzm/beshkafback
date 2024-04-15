const mongoose = require('mongoose');


const schemeComment = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    }
    // score: Number,
},
    {
        timestamps: true
    }
);


const model = mongoose.model('comment', schemeComment);

module.exports = model;
