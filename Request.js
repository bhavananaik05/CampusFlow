const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        requestId: {
            type: String,
            unique: true,
            required: true
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        serviceType: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        department: {
            type: String,
            required: true
        },

        priority: {
            type: String,
            enum: ["Normal", "High", "Urgent"],
            default: "Normal"
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Assigned",
                "In Progress",
                "Completed"
            ],
            default: "Pending"
        },

        assignedTo: {
            type: String,
            default: ""
        },

        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Request", requestSchema);