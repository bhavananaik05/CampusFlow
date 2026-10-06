const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

const updateAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const hashedPassword = await bcrypt.hash(
            process.env.ADMIN_PASSWORD,
            10
        );

        const admin = await User.findOneAndUpdate(
            {
                email: process.env.ADMIN_EMAIL
            },
            {
                password: hashedPassword
            },
            {
                new: true
            }
        );

        if (!admin) {
            console.log("Admin account not found");
        } else {
            console.log("Admin password updated successfully");
        }

        await mongoose.disconnect();
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

updateAdmin();