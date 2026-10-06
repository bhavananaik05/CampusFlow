import React from "react";
import { useNavigate } from "react-router-dom";

function Navbar({ title }) {

    const navigate = useNavigate();

    const user =
        JSON.parse(
            localStorage.getItem("user")
        );

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };

    return (
        <nav className="navbar">

            <div>
                <h2>CampusFlow</h2>
                <span>{title}</span>
            </div>

            <div className="nav-right">
                <span>
                    👤 {user?.name}
                </span>

                <button
                    className="logout-btn"
                    onClick={logout}
                >
                    Logout
                </button>
            </div>

        </nav>
    );
}

export default Navbar;