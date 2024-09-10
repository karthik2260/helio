const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    offerName: {
        type: String,
        required: true
    },
    product_name: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    },
    category_name: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categorydb'
    },
    discount_Percentage: {
        type: Number
    },
    startingDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        default: function() {
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + 30); // Set default expiry to 30 days from now
            return currentDate;
        }
    },
    status: {
        type: String,
        default: 'active',
        enum: ["active", "blocked"]
    }
});

const offerdb = mongoose.model("offerdb", offerSchema);

module.exports = offerdb;