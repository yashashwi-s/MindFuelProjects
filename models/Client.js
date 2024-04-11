const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
    organization: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    website: {
        type: String
    },
    password: {
        type: String,
        required: true,
        minlength: [6, "Password must be at least 6 characters long"]
    },
    confirmPassword: {
        type: String,
    }
});

const Client = mongoose.model("Client", clientSchema);

module.exports = Client;
