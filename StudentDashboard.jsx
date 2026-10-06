import React, { useEffect, useState } from "react";
import axios from "axios";

import Navbar from "../components/Navbar";

const API = import.meta.env.VITE_API_URL;

function StudentDashboard() {
    const [requests, setRequests] = useState([]);

    const [notifications, setNotifications] = useState([]);

    const [serviceType, setServiceType] =
        useState("Bonafide Certificate");

    const [description, setDescription] =
        useState("");

    const [priority, setPriority] =
        useState("Normal");

    const [message, setMessage] =
        useState("");

    const token = localStorage.getItem("token");

    const fetchRequests = async () => {
        try {
            const response = await axios.get(
                `${API}/requests/student`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setRequests(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await axios.get(
                `${API}/notifications`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setNotifications(response.data);
        } catch (error) {
            console.error(
                "Notification error:",
                error
            );
        }
    };

    useEffect(() => {
        fetchRequests();
        fetchNotifications();
    }, []);

    const submitRequest = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(
                `${API}/requests`,
                {
                    serviceType,
                    description,
                    priority
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(
                `Request ${response.data.request.requestId} created successfully!`
            );

            setDescription("");

            fetchRequests();
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to create request"
            );
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.put(
                `${API}/notifications/${id}/read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            fetchNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    const getStatusClass = (status) => {
        return status
            .toLowerCase()
            .replaceAll(" ", "-");
    };

    return (
        <div>
            <Navbar title="Student Portal" />

            <main className="dashboard">

                <section className="welcome">
                    <div>
                        <h1>
                            Student Dashboard
                        </h1>

                        <p>
                            Request and track
                            your campus services.
                        </p>
                    </div>

                    <div className="student-icon">
                        🎓
                    </div>
                </section>


                {/* NOTIFICATIONS */}

                <section className="card notification-card">

                    <div className="notification-header">
                        <h2>
                            🔔 Notifications
                        </h2>

                        <span>
                            {
                                notifications.filter(
                                    (notification) =>
                                        !notification.read
                                ).length
                            }{" "}
                            unread
                        </span>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="empty">
                            No notifications yet.
                        </div>
                    ) : (
                        <div className="notification-list">

                            {notifications.map(
                                (notification) => (

                                    <div
                                        key={
                                            notification._id
                                        }
                                        className={
                                            notification.read
                                                ? "notification read"
                                                : "notification unread"
                                        }
                                    >

                                        <p>
                                            {
                                                notification.message
                                            }
                                        </p>

                                        <small>
                                            {
                                                new Date(
                                                    notification.createdAt
                                                ).toLocaleString()
                                            }
                                        </small>

                                        {!notification.read && (
                                            <button
                                                className="small-btn"
                                                onClick={() =>
                                                    markAsRead(
                                                        notification._id
                                                    )
                                                }
                                            >
                                                Mark as Read
                                            </button>
                                        )}

                                    </div>
                                )
                            )}

                        </div>
                    )}

                </section>


                <div className="student-grid">

                    <section className="card">

                        <h2>
                            Create Service Request
                        </h2>

                        <form
                            onSubmit={submitRequest}
                        >

                            <label>
                                Service
                            </label>

                            <select
                                value={serviceType}
                                onChange={(e) =>
                                    setServiceType(
                                        e.target.value
                                    )
                                }
                            >
                                <option>
                                    Bonafide Certificate
                                </option>

                                <option>
                                    Transcript
                                </option>

                                <option>
                                    Lab Equipment
                                </option>

                                <option>
                                    Maintenance
                                </option>

                                <option>
                                    Leave Application
                                </option>

                                <option>
                                    Hostel Issue
                                </option>

                                <option>
                                    Library Service
                                </option>
                            </select>


                            <label>
                                Priority
                            </label>

                            <select
                                value={priority}
                                onChange={(e) =>
                                    setPriority(
                                        e.target.value
                                    )
                                }
                            >
                                <option>
                                    Normal
                                </option>

                                <option>
                                    High
                                </option>

                                <option>
                                    Urgent
                                </option>
                            </select>


                            <label>
                                Description
                            </label>

                            <textarea
                                placeholder="Describe your request..."
                                value={description}
                                onChange={(e) =>
                                    setDescription(
                                        e.target.value
                                    )
                                }
                                required
                            />


                            <button
                                className="primary-btn"
                            >
                                Submit Request
                            </button>

                        </form>


                        {message && (
                            <div className="success">
                                {message}
                            </div>
                        )}

                    </section>


                    <section className="card">

                        <h2>
                            My Requests
                        </h2>

                        {requests.length === 0 ? (
                            <div className="empty">
                                No requests yet.
                            </div>
                        ) : (
                            <div className="request-list">

                                {requests.map(
                                    (request) => (

                                        <div
                                            className="request-card"
                                            key={
                                                request._id
                                            }
                                        >

                                            <div className="request-header">

                                                <strong>
                                                    {
                                                        request.requestId
                                                    }
                                                </strong>

                                                <span
                                                    className={
                                                        `status ${getStatusClass(
                                                            request.status
                                                        )}`
                                                    }
                                                >
                                                    {
                                                        request.status
                                                    }
                                                </span>

                                            </div>


                                            <h3>
                                                {
                                                    request.serviceType
                                                }
                                            </h3>


                                            <p>
                                                {
                                                    request.description
                                                }
                                            </p>


                                            <div className="request-info">

                                                <span>
                                                    🏢{" "}
                                                    {
                                                        request.department
                                                    }
                                                </span>

                                                <span>
                                                    ⚡{" "}
                                                    {
                                                        request.priority
                                                    }
                                                </span>

                                            </div>


                                            {request.assignedTo && (
                                                <small>
                                                    Assigned to:{" "}
                                                    {
                                                        request.assignedTo
                                                    }
                                                </small>
                                            )}

                                        </div>

                                    )
                                )}

                            </div>
                        )}

                    </section>

                </div>

            </main>

        </div>
    );
}

export default StudentDashboard;