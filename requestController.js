const Request = require("../models/Request");
const Notification = require("../models/Notification");

const getDepartment = (serviceType) => {
    const departments = {
        "Bonafide Certificate": "Exam Cell",
        "Transcript": "Exam Cell",
        "Lab Equipment": "Laboratory",
        "Maintenance": "Maintenance Department",
        "Leave Application": "Academic Department",
        "Hostel Issue": "Hostel Department",
        "Library Service": "Library"
    };

    return departments[serviceType] || "General Administration";
};

exports.createRequest = async (req, res) => {
    try {
        const {
            serviceType,
            description,
            priority
        } = req.body;

        if (!serviceType || !description) {
            return res.status(400).json({
                message: "Service type and description are required"
            });
        }

        const requestId =
            "REQ-" +
            Date.now().toString().slice(-6);

        const department =
            getDepartment(serviceType);

        const request = await Request.create({
            requestId,
            student: req.user.id,
            serviceType,
            description,
            priority: priority || "Normal",
            department
        });

        const populatedRequest =
            await request.populate("student", "name email");

        res.status(201).json({
            message: "Request created successfully",
            request: populatedRequest
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

exports.getStudentRequests = async (req, res) => {
    try {
        const requests = await Request.find({
            student: req.user.id
        }).sort({
            createdAt: -1
        });

        res.json(requests);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

exports.getAllRequests = async (req, res) => {
    try {
        const requests = await Request.find()
            .populate("student", "name email")
            .sort({
                createdAt: -1
            });

        res.json(requests);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

exports.updateRequest = async (req, res) => {
    try {
        const { status, assignedTo, priority } =
            req.body;

        const request =
            await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                message: "Request not found"
            });
        }

        if (status) {
    request.status = status;

    if (status === "Completed") {
        request.completedAt = new Date();
    }

    await Notification.create({
        user: request.student,
        message: `Your request ${request.requestId} status has been changed to ${status}.`,
        requestId: request.requestId
    });
}
        if (assignedTo !== undefined) {
            request.assignedTo = assignedTo;
        }

        if (priority) {
            request.priority = priority;
        }

        await request.save();

        const updated =
            await request.populate(
                "student",
                "name email"
            );

        res.json({
            message: "Request updated",
            request: updated
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

exports.getStatistics = async (req, res) => {
    try {
        const total = await Request.countDocuments();

        const pending =
            await Request.countDocuments({
                status: "Pending"
            });

        const assigned =
            await Request.countDocuments({
                status: "Assigned"
            });

        const inProgress =
            await Request.countDocuments({
                status: "In Progress"
            });

        const completed =
            await Request.countDocuments({
                status: "Completed"
            });

        res.json({
            total,
            pending,
            assigned,
            inProgress,
            completed
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};