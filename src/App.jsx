import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:8080";

function App() {
  /* =========================
     AUTH
  ========================= */

  const [isRegister, setIsRegister] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const [currentUser, setCurrentUser] = useState(null);

  const [message, setMessage] = useState("");
  const [activePage, setActivePage] = useState("dashboard");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  /* =========================
     SKILLS
  ========================= */

  const [skills, setSkills] = useState(() => {
    const saved = localStorage.getItem("mySkills");
    return saved ? JSON.parse(saved) : [];
  });

  const [skillName, setSkillName] = useState("");
  const [skillType, setSkillType] = useState("TEACH");

  useEffect(() => {
    localStorage.setItem("mySkills", JSON.stringify(skills));
  }, [skills]);

  /* =========================
     SESSIONS
  ========================= */

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [sessionForm, setSessionForm] = useState({
    exchangeRequestId: "",
    scheduledAt: "",
    durationMinutes: 60,
    meetingLink: "",
  });

  /* =========================
     LOAD CURRENT USER
  ========================= */

  const loadCurrentUser = async (email) => {
    try {
      const response = await fetch(`${API}/api/users`);

      if (!response.ok) {
        return;
      }

      const users = await response.json();

      const user = users.find(
        (item) =>
          item.email &&
          item.email.toLowerCase() === email.toLowerCase()
      );

      if (user) {
        setCurrentUser(user);
        localStorage.setItem(
          "skillswap_user",
          JSON.stringify(user)
        );
      }
    } catch (error) {
      console.error("Unable to load user:", error);
    }
  };

  /* =========================
     RESTORE USER AFTER REFRESH
  ========================= */

  useEffect(() => {
    const email = localStorage.getItem("userEmail");

    if (email && isLoggedIn) {
      const savedUser = localStorage.getItem("skillswap_user");

      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem("skillswap_user");
        }
      }

      loadCurrentUser(email);
    }
  }, [isLoggedIn]);

  /* =========================
     LOAD SESSIONS
  ========================= */

  const loadSessions = async () => {
    setLoadingSessions(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/api/sessions`);

      if (!response.ok) {
        throw new Error("Failed to load sessions");
      }

      const data = await response.json();

      setSessions(data);
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to load sessions. Make sure Spring Boot is running."
      );
    } finally {
      setLoadingSessions(false);
    }
  };

  /* =========================
     LOAD SESSIONS WHEN PAGE OPENS
  ========================= */

  useEffect(() => {
    if (isLoggedIn && activePage === "sessions") {
      loadSessions();
    }
  }, [isLoggedIn, activePage]);

  /* =========================
     FORM CHANGE
  ========================= */

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setMessage("");
  };

  /* =========================
     REGISTER / LOGIN
  ========================= */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    /* REGISTER */

    if (isRegister) {
      try {
        const response = await fetch(
          `${API}/api/auth/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              password: formData.password,
            }),
          }
        );

        if (response.ok) {
          setMessage(
            "Registration successful! Please login."
          );

          setFormData({
            name: "",
            email: "",
            password: "",
          });

          setIsRegister(false);
        } else {
          const errorText = await response.text();

          setMessage(
            errorText ||
              "Registration failed. Please try again."
          );
        }
      } catch (error) {
        console.error(error);

        setMessage(
          "Cannot connect to the server. Make sure Spring Boot is running."
        );
      }

      return;
    }

    /* LOGIN */

    try {
      const response = await fetch(
        `${API}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "userEmail",
          formData.email
        );

        setIsLoggedIn(true);
        setActivePage("dashboard");
        setMessage("");

        await loadCurrentUser(formData.email);

        setFormData({
          name: "",
          email: "",
          password: "",
        });
      } else {
        const errorText = await response.text();

        setMessage(
          errorText ||
            "Invalid email or password."
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Cannot connect to the server. Make sure Spring Boot is running."
      );
    }
  };

  /* =========================
     SWITCH LOGIN / REGISTER
  ========================= */

  const switchMode = () => {
    setIsRegister(!isRegister);

    setFormData({
      name: "",
      email: "",
      password: "",
    });

    setMessage("");
  };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("skillswap_user");

    setCurrentUser(null);
    setIsLoggedIn(false);
    setActivePage("dashboard");
    setIsRegister(false);
    setMessage("");
  };

  /* =========================
     ADD SKILL
  ========================= */

  const addSkill = () => {
    if (!skillName.trim()) {
      setMessage("Please enter a skill name.");
      return;
    }

    const newSkill = {
      id: Date.now(),
      name: skillName.trim(),
      type: skillType,
    };

    setSkills([...skills, newSkill]);

    setSkillName("");
    setSkillType("TEACH");
    setMessage("Skill added successfully!");
  };

  /* =========================
     DELETE SKILL
  ========================= */

  const deleteSkill = (id) => {
    setSkills(
      skills.filter((skill) => skill.id !== id)
    );

    setMessage("Skill removed.");
  };

  /* =========================
     CREATE SESSION
  ========================= */

  const createSession = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!sessionForm.exchangeRequestId) {
      setMessage("Please enter the accepted exchange request ID.");
      return;
    }

    if (!sessionForm.scheduledAt) {
      setMessage("Please select a session date and time.");
      return;
    }

    if (!sessionForm.durationMinutes) {
      setMessage("Please enter the session duration.");
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/sessions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            exchangeRequest: {
              id: Number(sessionForm.exchangeRequestId),
            },
            scheduledAt: sessionForm.scheduledAt,
            durationMinutes: Number(
              sessionForm.durationMinutes
            ),
            meetingLink:
              sessionForm.meetingLink.trim() || null,
            status: "SCHEDULED",
          }),
        }
      );

      if (response.ok) {
        setMessage(
          "Session scheduled successfully! 📅"
        );

        setSessionForm({
          exchangeRequestId: "",
          scheduledAt: "",
          durationMinutes: 60,
          meetingLink: "",
        });

        await loadSessions();
      } else {
        const errorText = await response.text();

        console.error(errorText);

        setMessage(
          "Could not create session. Make sure the exchange request ID is valid."
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Cannot connect to the Sessions API."
      );
    }
  };

  /* =========================
     UPDATE SESSION STATUS
  ========================= */

  const updateSessionStatus = async (
    sessionId,
    status
  ) => {
    try {
      const response = await fetch(
        `${API}/api/sessions/${sessionId}/status/${status}`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error("Status update failed");
      }

      setMessage(
        `Session marked as ${status.toLowerCase()}.`
      );

      await loadSessions();
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to update session status."
      );
    }
  };

  /* =========================
     DELETE SESSION
  ========================= */

  const deleteSession = async (sessionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this session?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/sessions/${sessionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setMessage("Session deleted.");

      await loadSessions();
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to delete the session."
      );
    }
  };

  /* =========================
     FORMAT SESSION DATE
  ========================= */

  const formatDate = (dateTime) => {
    if (!dateTime) {
      return "Not available";
    }

    try {
      return new Date(dateTime).toLocaleString();
    } catch {
      return dateTime;
    }
  };

  /* =========================
     DASHBOARD COUNTS
  ========================= */

  const teachingCount = skills.filter(
    (skill) => skill.type === "TEACH"
  ).length;

  const learningCount = skills.filter(
    (skill) => skill.type === "LEARN"
  ).length;

  /* =========================
     AUTH PAGE
  ========================= */

  if (!isLoggedIn) {
    return (
      <div className="app">

        <div className="auth-container">

          {/* BRAND */}

          <div className="brand-section">

            <div className="logo">
              S
            </div>

            <h1>
              SkillSwap Campus
            </h1>

            <p>
              Learn together.
              <br />
              Teach together.
              <br />
              Grow together.
            </p>

          </div>

          {/* FORM */}

          <div className="form-section">

            <h2>
              {isRegister
                ? "Create Account"
                : "Welcome Back"}
            </h2>

            <p className="subtitle">
              {isRegister
                ? "Join your campus skill exchange community"
                : "Sign in to continue to SkillSwap"}
            </p>

            <form onSubmit={handleSubmit}>

              {isRegister && (
                <div className="input-group">

                  <label>
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />

                </div>
              )}

              <div className="input-group">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="input-group">

                <label>
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

              </div>

              {message && (
                <div className="message">
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="submit-btn"
              >
                {isRegister
                  ? "Create Account"
                  : "Login"}
              </button>

            </form>

            <p className="switch-text">

              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}

              <button
                className="switch-btn"
                onClick={switchMode}
              >
                {isRegister
                  ? "Login"
                  : "Register"}
              </button>

            </p>

          </div>

        </div>

      </div>
    );
  }

  /* =========================
     DASHBOARD
  ========================= */

  return (
    <div className="dashboard">

      {/* NAVBAR */}

      <nav className="dashboard-nav">

        <div className="dashboard-logo">

          <div className="small-logo">
            S
          </div>

          <span>
            SkillSwap Campus
          </span>

        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >

          {currentUser && (
            <span
              style={{
                fontSize: "14px",
                color: "#555",
              }}
            >
              {currentUser.name}
            </span>
          )}

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </nav>

      {/* MAIN */}

      <main className="dashboard-content">

        {/* =========================
            DASHBOARD HOME
        ========================= */}

        {activePage === "dashboard" && (
          <>

            <section className="welcome-section">

              <div>

                <p className="welcome-small">
                  STUDENT DASHBOARD
                </p>

                <h1>
                  Welcome to SkillSwap 👋
                </h1>

                <p>
                  Share what you know.
                  Learn what you need.
                  Connect with your campus community.
                </p>

              </div>

            </section>

            {/* STATS */}

            <section className="stats-grid">

              <div className="stat-card">

                <div className="stat-icon">
                  🎓
                </div>

                <div>
                  <h3>
                    {teachingCount}
                  </h3>

                  <p>
                    Skills Teaching
                  </p>
                </div>

              </div>

              <div className="stat-card">

                <div className="stat-icon">
                  📚
                </div>

                <div>
                  <h3>
                    {learningCount}
                  </h3>

                  <p>
                    Skills Learning
                  </p>
                </div>

              </div>

              <div className="stat-card">

                <div className="stat-icon">
                  🤝
                </div>

                <div>
                  <h3>
                    0
                  </h3>

                  <p>
                    Matches
                  </p>
                </div>

              </div>

              <div className="stat-card">

                <div className="stat-icon">
                  🪙
                </div>

                <div>
                  <h3>
                    0
                  </h3>

                  <p>
                    Credits
                  </p>
                </div>

              </div>

            </section>

            <h2 className="section-title">
              SkillSwap
            </h2>

            {/* FEATURES */}

            <section className="feature-grid">

              {/* MY SKILLS */}

              <div className="feature-card">

                <div className="feature-icon">
                  🎯
                </div>

                <h3>
                  My Skills
                </h3>

                <p>
                  Add skills you can teach
                  and skills you want to learn.
                </p>

                <button
                  onClick={() =>
                    setActivePage("skills")
                  }
                >
                  Add Skills
                </button>

              </div>

              {/* MATCHES */}

              <div className="feature-card">

                <div className="feature-icon">
                  🔎
                </div>

                <h3>
                  Find Matches
                </h3>

                <p>
                  Discover students who can
                  teach the skills you want to learn.
                </p>

                <button
                  onClick={() =>
                    setActivePage("matches")
                  }
                >
                  Find Matches
                </button>

              </div>

              {/* REQUESTS */}

              <div className="feature-card">

                <div className="feature-icon">
                  📩
                </div>

                <h3>
                  Exchange Requests
                </h3>

                <p>
                  Send and manage your
                  skill exchange requests.
                </p>

                <button
                  onClick={() =>
                    setActivePage("requests")
                  }
                >
                  View Requests
                </button>

              </div>

              {/* SESSIONS */}

              <div className="feature-card">

                <div className="feature-icon">
                  📅
                </div>

                <h3>
                  Sessions
                </h3>

                <p>
                  Schedule and manage your
                  peer-learning sessions.
                </p>

                <button
                  onClick={() =>
                    setActivePage("sessions")
                  }
                >
                  View Sessions
                </button>

              </div>

              {/* REVIEWS */}

              <div className="feature-card">

                <div className="feature-icon">
                  ⭐
                </div>

                <h3>
                  Reviews
                </h3>

                <p>
                  Rate your learning experience
                  and build your reputation.
                </p>

                <button
                  onClick={() =>
                    setActivePage("reviews")
                  }
                >
                  My Reviews
                </button>

              </div>

              {/* SKILL CHAINS */}

              <div className="feature-card">

                <div className="feature-icon">
                  🔗
                </div>

                <h3>
                  Skill Chains
                </h3>

                <p>
                  Build a chain where students
                  teach and learn from one another.
                </p>

                <button
                  onClick={() =>
                    setActivePage("chains")
                  }
                >
                  Explore Chains
                </button>

              </div>

            </section>

          </>
        )}

        {/* =========================
            MY SKILLS
        ========================= */}

        {activePage === "skills" && (
          <section>

            <button
              className="logout-btn"
              onClick={() =>
                setActivePage("dashboard")
              }
            >
              ← Back
            </button>

            <div className="welcome-section">

              <p className="welcome-small">
                MY SKILLS
              </p>

              <h1>
                Manage Your Skills
              </h1>

              <p>
                Tell the campus what you can teach
                and what you want to learn.
              </p>

            </div>

            <div className="feature-card">

              <h3>
                Add a Skill
              </h3>

              <br />

              <div className="input-group">

                <label>
                  Skill Name
                </label>

                <input
                  type="text"
                  placeholder="Example: Python"
                  value={skillName}
                  onChange={(e) =>
                    setSkillName(e.target.value)
                  }
                />

              </div>

              <div className="input-group">

                <label>
                  Skill Type
                </label>

                <select
                  value={skillType}
                  onChange={(e) =>
                    setSkillType(e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "10px",
                    border: "1px solid #d7dce5",
                    fontSize: "15px",
                  }}
                >

                  <option value="TEACH">
                    I can Teach
                  </option>

                  <option value="LEARN">
                    I want to Learn
                  </option>

                </select>

              </div>

              {message && (
                <div className="message">
                  {message}
                </div>
              )}

              <button
                className="submit-btn"
                onClick={addSkill}
              >
                + Add Skill
              </button>

            </div>

            <br />

            <h2 className="section-title">
              My Current Skills
            </h2>

            <section className="feature-grid">

              {skills.length === 0 ? (

                <div className="feature-card">

                  <h3>
                    No skills added yet
                  </h3>

                  <p>
                    Add your first teaching or
                    learning skill above.
                  </p>

                </div>

              ) : (

                skills.map((skill) => (

                  <div
                    className="feature-card"
                    key={skill.id}
                  >

                    <div className="feature-icon">
                      {skill.type === "TEACH"
                        ? "🎓"
                        : "📚"}
                    </div>

                    <h3>
                      {skill.name}
                    </h3>

                    <p>
                      {skill.type === "TEACH"
                        ? "You can teach this skill."
                        : "You want to learn this skill."}
                    </p>

                    <button
                      onClick={() =>
                        deleteSkill(skill.id)
                      }
                      style={{
                        background: "#dc2626",
                      }}
                    >
                      Remove
                    </button>

                  </div>

                ))

              )}

            </section>

          </section>
        )}

        {/* =========================
            MATCHES
        ========================= */}

        {activePage === "matches" && (
          <section>

            <button
              className="logout-btn"
              onClick={() =>
                setActivePage("dashboard")
              }
            >
              ← Back
            </button>

            <div className="welcome-section">

              <p className="welcome-small">
                MATCHING
              </p>

              <h1>
                Find Skill Matches 🔎
              </h1>

              <p>
                Students who can teach the skills
                you want to learn will appear here.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                🤝
              </div>

              <h3>
                Smart Matching
              </h3>

              <p>
                Your learning skills will be compared
                with other students' teaching skills.
              </p>

              <button
                onClick={() =>
                  setMessage(
                    "Matching system is ready."
                  )
                }
              >
                Search Matches
              </button>

              {message && (
                <div className="message">
                  {message}
                </div>
              )}

            </div>

          </section>
        )}

        {/* =========================
            REQUESTS
        ========================= */}

        {activePage === "requests" && (
          <section>

            <button
              className="logout-btn"
              onClick={() =>
                setActivePage("dashboard")
              }
            >
              ← Back
            </button>

            <div className="welcome-section">

              <p className="welcome-small">
                EXCHANGE REQUESTS
              </p>

              <h1>
                Skill Exchange Requests 📩
              </h1>

              <p>
                Manage requests from students
                interested in exchanging skills.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                📭
              </div>

              <h3>
                No Requests Yet
              </h3>

              <p>
                Your incoming and outgoing exchange
                requests will appear here.
              </p>

            </div>

          </section>
        )}

        {/* =========================
            SESSIONS
        ========================= */}

        {activePage === "sessions" && (
          <section>

            <button
              className="logout-btn"
              onClick={() =>
                setActivePage("dashboard")
              }
            >
              ← Back
            </button>

            <div className="welcome-section">

              <p className="welcome-small">
                LEARNING SESSIONS
              </p>

              <h1>
                My Sessions 📅
              </h1>

              <p>
                Schedule and manage your
                peer-learning sessions.
              </p>

            </div>

            {/* CREATE SESSION */}

            <div className="feature-card">

              <h3>
                Schedule a New Session
              </h3>

              <p>
                Create a session from an accepted
                exchange request.
              </p>

              <form onSubmit={createSession}>

                <div className="input-group">

                  <label>
                    Accepted Exchange Request ID
                  </label>

                  <input
                    type="number"
                    min="1"
                    placeholder="Example: 1"
                    value={
                      sessionForm.exchangeRequestId
                    }
                    onChange={(e) =>
                      setSessionForm({
                        ...sessionForm,
                        exchangeRequestId:
                          e.target.value,
                      })
                    }
                    required
                  />

                  <small>
                    Enter the ID of an accepted
                    exchange request.
                  </small>

                </div>

                <div className="input-group">

                  <label>
                    Date & Time
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      sessionForm.scheduledAt
                    }
                    onChange={(e) =>
                      setSessionForm({
                        ...sessionForm,
                        scheduledAt:
                          e.target.value,
                      })
                    }
                    required
                  />

                </div>

                <div className="input-group">

                  <label>
                    Duration (minutes)
                  </label>

                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={
                      sessionForm.durationMinutes
                    }
                    onChange={(e) =>
                      setSessionForm({
                        ...sessionForm,
                        durationMinutes:
                          e.target.value,
                      })
                    }
                    required
                  />

                </div>

                <div className="input-group">

                  <label>
                    Meeting Link
                  </label>

                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={
                      sessionForm.meetingLink
                    }
                    onChange={(e) =>
                      setSessionForm({
                        ...sessionForm,
                        meetingLink:
                          e.target.value,
                      })
                    }
                  />

                </div>

                {message && (
                  <div className="message">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className="submit-btn"
                >
                  📅 Schedule Session
                </button>

              </form>

            </div>

            <br />

            {/* SESSION LIST */}

            <h2 className="section-title">
              Scheduled Sessions
            </h2>

            {loadingSessions ? (

              <div className="feature-card">

                <h3>
                  Loading sessions...
                </h3>

              </div>

            ) : sessions.length === 0 ? (

              <div className="feature-card">

                <div className="feature-icon">
                  📭
                </div>

                <h3>
                  No Sessions Scheduled
                </h3>

                <p>
                  Your scheduled learning sessions
                  will appear here.
                </p>

              </div>

            ) : (

              <section className="feature-grid">

                {sessions.map((session) => (

                  <div
                    className="feature-card"
                    key={session.id}
                  >

                    <div className="feature-icon">
                      📅
                    </div>

                    <h3>
                      Session #{session.id}
                    </h3>

                    <p>
                      <strong>Date:</strong>{" "}
                      {formatDate(
                        session.scheduledAt
                      )}
                    </p>

                    <p>
                      <strong>Duration:</strong>{" "}
                      {session.durationMinutes} minutes
                    </p>

                    <p>
                      <strong>Status:</strong>{" "}
                      {session.status}
                    </p>

                    {session.exchangeRequest && (
                      <p>
                        <strong>
                          Exchange Request:
                        </strong>{" "}
                        #
                        {
                          session.exchangeRequest
                            .id
                        }
                      </p>
                    )}

                    {session.meetingLink && (
                      <p>

                        <strong>
                          Meeting:
                        </strong>{" "}

                        <a
                          href={
                            session.meetingLink
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          Join Meeting
                        </a>

                      </p>
                    )}

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginTop: "15px",
                      }}
                    >

                      {session.status ===
                        "SCHEDULED" && (
                        <>
                          <button
                            onClick={() =>
                              updateSessionStatus(
                                session.id,
                                "COMPLETED"
                              )
                            }
                          >
                            ✓ Complete
                          </button>

                          <button
                            onClick={() =>
                              updateSessionStatus(
                                session.id,
                                "CANCELLED"
                              )
                            }
                            style={{
                              background:
                                "#dc2626",
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      <button
                        onClick={() =>
                          deleteSession(
                            session.id
                          )
                        }
                        style={{
                          background:
                            "#6b7280",
                        }}
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                ))}

              </section>

            )}

          </section>
        )}

        {/* =========================
            REVIEWS
        ========================= */}

        {activePage === "reviews" && (
          <section>

            <button
              className="logout-btn"
              onClick={() =>
                setActivePage("dashboard")
              }
            >
              ← Back
            </button>

            <div className="welcome-section">

              <p className="welcome-small">
                REVIEWS
              </p>

              <h1>
                My Reviews ⭐
              </h1>

              <p>
                View feedback from your
                peer-learning sessions.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                ⭐
              </div>

              <h3>
                No Reviews Yet
              </h3>

              <p>
                Reviews will appear after
                completed learning sessions.
              </p>

            </div>

          </section>
        )}

        {/* =========================
            SKILL CHAINS
        ========================= */}

        {activePage === "chains" && (
          <section>

            <button
              className="logout-btn"
              onClick={() =>
                setActivePage("dashboard")
              }
            >
              ← Back
            </button>

            <div className="welcome-section">

              <p className="welcome-small">
                SKILL CHAINS
              </p>

              <h1>
                Skill Chains 🔗
              </h1>

              <p>
                Connect multiple students through
                a chain of teaching and learning.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                🔗
              </div>

              <h3>
                Peer Skill Chain
              </h3>

              <p>
                Example: Student A teaches Python
                to Student B, B teaches SQL to C,
                and C teaches React to A.
              </p>

              <button
                onClick={() =>
                  setMessage(
                    "Skill Chain creation will be connected to the backend next."
                  )
                }
              >
                Create Chain
              </button>

              {message && (
                <div className="message">
                  {message}
                </div>
              )}

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

export default App;