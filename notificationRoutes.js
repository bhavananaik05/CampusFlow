const express = require("express");

const {
    authMiddleware
} = require("../middleware/authMiddleware");

const Notification = require("../models/Notification");

const router = express.Router();


// Get notifications for logged-in user
router.get(
    "/",
    authMiddleware,
    async (req, res) => {
        try {
            const notifications =
                await Notification.find({
                    user: req.user.id
                }).sort({
                    createdAt: -1
                });

            res.json(notifications);

        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
);


// Mark notification as read
router.put(
    "/:id/read",
    authMiddleware,
    async (req, res) => {
        try {
            const notification =
                await Notification.findOneAndUpdate(
                    {
                        _id: req.params.id,
                        user: req.user.id
                    },
                    {
                        read: true
                    },
                    {
                        new: true
                    }
                );

            if (!notification) {
                return res.status(404).json({
                    message: "Notification not found"
                });
            }

            res.json(notification);

        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
);


module.exports = router;