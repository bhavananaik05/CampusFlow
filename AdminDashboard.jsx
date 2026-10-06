import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const API = import.meta.env.VITE_API_URL;

function AdminDashboard() {
    const [requests, setRequests] = useState([]);

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        assigned: 0,
        inProgress: 0,
        completed: 0
    });

    const [search, setSearch] = useState("");

    // NEW FILTERS
    const [statusFilter, setStatusFilter] = useState("All");
    const [departmentFilter, setDepartmentFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [sortBy, setSortBy] = useState("newest");

    // NOTIFICATIONS
    const [notifications, setNotifications] = useState([]);

    const token = localStorage.getItem("token");

    const headers = {
        Authorization: `Bearer ${token}`
    };

    // ==========================================
    // FETCH DATA
    // ==========================================

    const fetchData = async () => {
        try {
            const requestsResponse = await axios.get(
                `${API}/requests/admin`,
                { headers }
            );

            const statsResponse = await axios.get(
                `${API}/requests/statistics`,
                { headers }
            );

            setRequests(requestsResponse.data);
            setStats(statsResponse.data);

        } catch (error) {
            console.error("Dashboard error:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ==========================================
    // GET DEPARTMENTS
    // ==========================================

    const departments = [
        ...new Set(
            requests
                .map((request) => request.department)
                .filter(Boolean)
        )
    ];

    // ==========================================
    // PRIORITY VALUE
    // ==========================================

    const priorityValue = {
        Urgent: 3,
        High: 2,
        Normal: 1
    };

    // ==========================================
    // ESTIMATED COMPLETION
    // ==========================================

    const getEstimatedTime = (request) => {
        if (request.status === "Completed") {
            return "Completed";
        }

        const created = new Date(request.createdAt);

        let hours = 72;

        if (request.priority === "Urgent") {
            hours = 2;
        } else if (request.priority === "High") {
            hours = 24;
        }

        const deadline = new Date(
            created.getTime() + hours * 60 * 60 * 1000
        );

        const remaining =
            deadline.getTime() - Date.now();

        if (remaining <= 0) {
            return "⚠️ Overdue";
        }

        const remainingHours = Math.ceil(
            remaining / (1000 * 60 * 60)
        );

        if (remainingHours < 24) {
            return `${remainingHours} hour(s) left`;
        }

        const days = Math.ceil(remainingHours / 24);

        return `${days} day(s) left`;
    };

    // ==========================================
    // AVERAGE RESOLUTION TIME
    // ==========================================

    const averageResolutionTime = useMemo(() => {
        const completedRequests = requests.filter(
            (request) =>
                request.status === "Completed" &&
                request.completedAt &&
                request.createdAt
        );

        if (completedRequests.length === 0) {
            return "N/A";
        }

        let totalHours = 0;

        completedRequests.forEach((request) => {
            const start = new Date(request.createdAt);
            const end = new Date(request.completedAt);

            const hours =
                (end.getTime() - start.getTime()) /
                (1000 * 60 * 60);

            totalHours += hours;
        });

        return (
            totalHours / completedRequests.length
        ).toFixed(1) + " hrs";
    }, [requests]);

    // ==========================================
    // DEPARTMENT WORKLOAD
    // ==========================================

    const departmentWorkload = useMemo(() => {
        const workload = {};

        requests.forEach((request) => {
            const department =
                request.department || "General";

            if (!workload[department]) {
                workload[department] = {
                    total: 0,
                    pending: 0,
                    completed: 0
                };
            }

            workload[department].total++;

            if (request.status !== "Completed") {
                workload[department].pending++;
            }

            if (request.status === "Completed") {
                workload[department].completed++;
            }
        });

        return workload;
    }, [requests]);

    // ==========================================
    // SEARCH + FILTER + SORT
    // ==========================================

    const filteredRequests = useMemo(() => {
        let result = [...requests];

        // SEARCH
        const searchText =
            search.trim().toLowerCase();

        if (searchText) {
            result = result.filter((request) => {
                return (
                    request.requestId
                        ?.toLowerCase()
                        .includes(searchText) ||

                    request.student?.name
                        ?.toLowerCase()
                        .includes(searchText) ||

                    request.serviceType
                        ?.toLowerCase()
                        .includes(searchText) ||

                    request.department
                        ?.toLowerCase()
                        .includes(searchText)
                );
            });
        }

        // STATUS FILTER
        if (statusFilter !== "All") {
            result = result.filter(
                (request) =>
                    request.status === statusFilter
            );
        }

        // DEPARTMENT FILTER
        if (departmentFilter !== "All") {
            result = result.filter(
                (request) =>
                    request.department ===
                    departmentFilter
            );
        }

        // PRIORITY FILTER
        if (priorityFilter !== "All") {
            result = result.filter(
                (request) =>
                    request.priority ===
                    priorityFilter
            );
        }

        // SORT
        result.sort((a, b) => {
            if (sortBy === "newest") {
                return (
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
                );
            }

            if (sortBy === "oldest") {
                return (
                    new Date(a.createdAt) -
                    new Date(b.createdAt)
                );
            }

            if (sortBy === "priority") {
                return (
                    priorityValue[b.priority] -
                    priorityValue[a.priority]
                );
            }

            return 0;
        });

        return result;

    }, [
        requests,
        search,
        statusFilter,
        departmentFilter,
        priorityFilter,
        sortBy
    ]);

    // ==========================================
    // AUTO ASSIGN STAFF
    // ==========================================

    const getAutomaticStaff = (department) => {
        const staff = {
            "Exam Cell": "Exam Cell Staff",
            "Library": "Library Staff",
            "Library Department": "Library Staff",
            "Hostel": "Hostel Staff",
            "Hostel Department": "Hostel Staff",
            "Maintenance": "Maintenance Staff",
            "Maintenance Department":
                "Maintenance Staff",
            "Academic": "Academic Staff",
            "Academic Department":
                "Academic Staff",
            "Laboratory": "Lab Staff",
            "Laboratory Department":
                "Lab Staff"
        };

        return (
            staff[department] ||
            "Admin Staff"
        );
    };

    // ==========================================
    // UPDATE REQUEST
    // ==========================================

    const updateRequest = async (
        id,
        status,
        assignedTo,
        priority
    ) => {
        try {
            await axios.put(
                `${API}/requests/${id}`,
                {
                    status,
                    assignedTo,
                    priority
                },
                {
                    headers
                }
            );

            addNotification(
                `Request updated successfully`
            );

            fetchData();

        } catch (error) {
            console.error(error);

            alert(
                error.response?.data?.message ||
                "Update failed"
            );
        }
    };

    // ==========================================
    // AUTO ASSIGN
    // ==========================================

    const autoAssign = async (request) => {
        const staff =
            getAutomaticStaff(
                request.department
            );

        await updateRequest(
            request._id,
            request.status,
            staff,
            request.priority
        );

        addNotification(
            `${request.requestId} automatically assigned to ${staff}`
        );
    };

    // ==========================================
    // PRIORITY CHANGE
    // ==========================================

    const changePriority = async (
        request,
        priority
    ) => {
        await updateRequest(
            request._id,
            request.status,
            request.assignedTo,
            priority
        );

        addNotification(
            `${request.requestId} priority changed to ${priority}`
        );
    };

    // ==========================================
    // NOTIFICATIONS
    // ==========================================

    const addNotification = (message) => {
        const notification = {
            id: Date.now(),
            message
        };

        setNotifications((old) => [
            notification,
            ...old
        ]);

        setTimeout(() => {
            setNotifications((old) =>
                old.filter(
                    (item) =>
                        item.id !==
                        notification.id
                )
            );
        }, 4000);
    };

    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (date) => {
        if (!date) {
            return "—";
        }

        return new Date(date).toLocaleString(
            "en-IN"
        );
    };

    // ==========================================
    // DASHBOARD
    // ==========================================

    return (
        <div>

            <Navbar title="Admin Portal" />

            {/* NOTIFICATIONS */}

            <div className="notification-container">

                {notifications.map(
                    (notification) => (

                        <div
                            key={notification.id}
                            className="notification"
                        >
                            🔔 {notification.message}
                        </div>

                    )
                )}

            </div>


            <main className="dashboard">

                {/* HEADER */}

                <section className="welcome">

                    <div>

                        <h1>
                            Admin Dashboard
                        </h1>

                        <p>
                            Manage campus service
                            requests.
                        </p>

                    </div>

                    <div className="student-icon">
                        🏢
                    </div>

                </section>


                {/* STATISTICS */}

                <section className="stats-grid">

                    <div className="stat-card">
                        <span>Total</span>

                        <strong>
                            {stats.total}
                        </strong>
                    </div>


                    <div className="stat-card">
                        <span>Pending</span>

                        <strong>
                            {stats.pending}
                        </strong>
                    </div>


                    <div className="stat-card">
                        <span>Assigned</span>

                        <strong>
                            {stats.assigned}
                        </strong>
                    </div>


                    <div className="stat-card">
                        <span>In Progress</span>

                        <strong>
                            {stats.inProgress}
                        </strong>
                    </div>


                    <div className="stat-card">
                        <span>Completed</span>

                        <strong>
                            {stats.completed}
                        </strong>
                    </div>


                    <div className="stat-card">
                        <span>Avg Resolution</span>

                        <strong>
                            {averageResolutionTime}
                        </strong>
                    </div>

                </section>


                {/* REQUEST SECTION */}

                <section className="card">

                    <div className="table-top">

                        <h2>
                            Service Requests
                        </h2>

                        <input
                            className="search"
                            placeholder="🔍 Search requests..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    {/* FILTERS */}

                    <div className="filters">

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                        >

                            <option value="All">
                                All Status
                            </option>

                            <option>
                                Pending
                            </option>

                            <option>
                                Assigned
                            </option>

                            <option>
                                In Progress
                            </option>

                            <option>
                                Completed
                            </option>

                        </select>


                        <select
                            value={
                                departmentFilter
                            }
                            onChange={(e) =>
                                setDepartmentFilter(
                                    e.target.value
                                )
                            }
                        >

                            <option value="All">
                                All Departments
                            </option>

                            {departments.map(
                                (department) => (

                                    <option
                                        key={
                                            department
                                        }
                                        value={
                                            department
                                        }
                                    >
                                        {department}
                                    </option>

                                )
                            )}

                        </select>


                        <select
                            value={
                                priorityFilter
                            }
                            onChange={(e) =>
                                setPriorityFilter(
                                    e.target.value
                                )
                            }
                        >

                            <option value="All">
                                All Priority
                            </option>

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


                        <select
                            value={sortBy}
                            onChange={(e) =>
                                setSortBy(
                                    e.target.value
                                )
                            }
                        >

                            <option value="newest">
                                Newest First
                            </option>

                            <option value="oldest">
                                Oldest First
                            </option>

                            <option value="priority">
                                Highest Priority
                            </option>

                        </select>

                    </div>


                    {/* TABLE */}

                    <div className="table-container">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Request ID
                                    </th>

                                    <th>
                                        Student
                                    </th>

                                    <th>
                                        Service
                                    </th>

                                    <th>
                                        Department
                                    </th>

                                    <th>
                                        Priority
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Assigned To
                                    </th>

                                    <th>
                                        Estimated Time
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredRequests.map(
                                    (request) => (

                                        <tr
                                            key={
                                                request._id
                                            }
                                        >

                                            {/* REQUEST ID */}

                                            <td>
                                                <strong>
                                                    {
                                                        request.requestId
                                                    }
                                                </strong>
                                            </td>


                                            {/* STUDENT */}

                                            <td>
                                                {
                                                    request
                                                        .student
                                                        ?.name
                                                }
                                            </td>


                                            {/* SERVICE */}

                                            <td>
                                                {
                                                    request.serviceType
                                                }
                                            </td>


                                            {/* DEPARTMENT */}

                                            <td>
                                                {
                                                    request.department
                                                }
                                            </td>


                                            {/* PRIORITY */}

                                            <td>

                                                <select
                                                    value={
                                                        request.priority
                                                    }
                                                    onChange={(e) =>
                                                        changePriority(
                                                            request,
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

                                            </td>


                                            {/* STATUS */}

                                            <td>

                                                <select
                                                    value={
                                                        request.status
                                                    }
                                                    onChange={(e) =>
                                                        updateRequest(
                                                            request._id,
                                                            e.target.value,
                                                            request.assignedTo,
                                                            request.priority
                                                        )
                                                    }
                                                >

                                                    <option>
                                                        Pending
                                                    </option>

                                                    <option>
                                                        Assigned
                                                    </option>

                                                    <option>
                                                        In Progress
                                                    </option>

                                                    <option>
                                                        Completed
                                                    </option>

                                                </select>

                                            </td>


                                            {/* ASSIGNED */}

                                            <td>

                                                <input
                                                    className="assign-input"
                                                    placeholder="Staff name"
                                                    defaultValue={
                                                        request.assignedTo ||
                                                        ""
                                                    }
                                                    onBlur={(e) =>
                                                        updateRequest(
                                                            request._id,
                                                            request.status,
                                                            e.target.value,
                                                            request.priority
                                                        )
                                                    }
                                                />

                                                <button
                                                    className="auto-btn"
                                                    onClick={() =>
                                                        autoAssign(
                                                            request
                                                        )
                                                    }
                                                >
                                                    Auto Assign
                                                </button>

                                            </td>


                                            {/* ETA */}

                                            <td>

                                                <span
                                                    className={
                                                        getEstimatedTime(
                                                            request
                                                        ) ===
                                                        "⚠️ Overdue"
                                                            ? "overdue"
                                                            : ""
                                                    }
                                                >

                                                    {
                                                        getEstimatedTime(
                                                            request
                                                        )
                                                    }

                                                </span>

                                            </td>


                                            {/* ACTION */}

                                            <td>

                                                <button
                                                    className="small-btn"
                                                    onClick={() =>
                                                        updateRequest(
                                                            request._id,
                                                            "In Progress",
                                                            request.assignedTo,
                                                            request.priority
                                                        )
                                                    }
                                                >
                                                    Process
                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>


                        {filteredRequests.length ===
                            0 && (

                            <div className="empty">
                                No matching requests.
                            </div>

                        )}

                    </div>

                </section>


                {/* DEPARTMENT WORKLOAD */}

                <section className="card workload-card">

                    <h2>
                        Department-wise Workload
                    </h2>


                    <div className="workload-grid">

                        {Object.entries(
                            departmentWorkload
                        ).map(
                            ([
                                department,
                                data
                            ]) => (

                                <div
                                    className="workload-item"
                                    key={
                                        department
                                    }
                                >

                                    <div className="workload-title">

                                        <strong>
                                            {department}
                                        </strong>

                                        <span>
                                            {
                                                data.total
                                            } requests
                                        </span>

                                    </div>


                                    <div className="workload-bar">

                                        <div
                                            className="workload-progress"
                                            style={{
                                                width:
                                                    `${Math.min(
                                                        100,
                                                        data.total * 10
                                                    )}%`
                                            }}
                                        />

                                    </div>


                                    <div className="workload-info">

                                        <span>
                                            Active:{" "}
                                            {
                                                data.pending
                                            }
                                        </span>

                                        <span>
                                            Completed:{" "}
                                            {
                                                data.completed
                                            }
                                        </span>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                </section>


                {/* REQUEST INFORMATION */}

                <section className="card">

                    <h2>
                        Smart Request Management
                    </h2>

                    <div className="feature-grid">

                        <div>
                            🤖
                            <strong>
                                Automatic Assignment
                            </strong>

                            <p>
                                Assign requests to
                                the correct staff
                                based on department.
                            </p>
                        </div>


                        <div>
                            🚨
                            <strong>
                                Priority Management
                            </strong>

                            <p>
                                Mark requests as
                                Normal, High or
                                Urgent.
                            </p>
                        </div>


                        <div>
                            ⏱️
                            <strong>
                                Estimated Completion
                            </strong>

                            <p>
                                Urgent requests:
                                2 hours
                                <br />
                                High requests:
                                24 hours
                                <br />
                                Normal requests:
                                72 hours
                            </p>
                        </div>


                        <div>
                            🔔
                            <strong>
                                Notifications
                            </strong>

                            <p>
                                Admin receives
                                in-app notifications
                                when requests are
                                updated.
                            </p>
                        </div>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default AdminDashboard;