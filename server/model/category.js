const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    CategoryName: {
        type: String,
        required: true,
        unique: true
    },
    list: { type: String, enum: ['listed', 'unlisted'], default: 'listed' }, // Change from 'delete' to 'unlist'

    discription: {
        type: String,
    },
    image: {
        type: String, // You can store the path of the image as a string
        required: true
    }
});

const Categorydb = mongoose.model('Categorydb', categorySchema);

module.exports = Categorydb;
