const express = require("express");

const {
    authMiddleware,
    adminOnly
} = require("../middleware/authMiddleware");

const {
    createRequest,
    getStudentRequests,
    getAllRequests,
    updateRequest,
    getStatistics
} = require("../controllers/requestController");

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    createRequest
);

router.get(
    "/student",
    authMiddleware,
    getStudentRequests
);

router.get(
    "/admin",
    authMiddleware,
    adminOnly,
    getAllRequests
);

router.get(
    "/statistics",
    authMiddleware,
    adminOnly,
    getStatistics
);

router.put(
    "/:id",
    authMiddleware,
    adminOnly,
    updateRequest
);

module.exports = router;