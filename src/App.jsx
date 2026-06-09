import { useState, useEffect, useMemo } from "react";
import HomePage from "./pages/HomePage";
import TeacherList from "./pages/TeacherList";
import SchedulePage from "./pages/SchedulePage";
import ManageTeachers from "./pages/ManageTeachers";
import ManageStudents from "./pages/ManageStudents";
import OverallSchedule from "./pages/OverallSchedule";
import FindAvailability from "./pages/FindAvailability";
import TrashHistory from "./pages/TrashHistory";
import CalendarPage from "./pages/CalendarPage";
import { getTrashCount, loadTeachers, loadStudents, loadSchedules, syncStudentsToTeachers } from "./utils/storage";
import "./App.css";

function App() {
  const [view, setView] = useState("home");
  const [category, setCategory] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [trashCount, setTrashCount] = useState(() => getTrashCount());

  // App-wide stats
  const stats = useMemo(() => {
    try {
      const teachers = loadTeachers() || {};
      const students = loadStudents() || [];
      
      let totalClasses = 0;
      students.filter(s => s.status === 'active').forEach(student => {
        // Only count classes if the student has an assigned teacher
        if (student.currentTeacher && student.schedules && Array.isArray(student.schedules)) {
          const activeSchedules = student.schedules.filter(sched => sched.days && sched.days.length > 0);
          totalClasses += activeSchedules.length;
        }
      });

      return {
        academyCount: teachers.academy?.length || 0,
        wfhCount: teachers.wfh?.length || 0,
        totalStudents: students.filter(s => s.status === 'active').length,
        totalClasses: totalClasses
      };
    } catch (err) {
      console.error("Error calculating stats:", err);
      return { academyCount: 0, wfhCount: 0, totalStudents: 0, totalClasses: 0 };
    }
  }, [view]);

  useEffect(() => {
    setTrashCount(getTrashCount());
  }, [view]);

  const handleViewChange = (newView) => {
    setView(newView);
    if (newView !== "teachers" && newView !== "schedule") {
      setCategory(null);
      setSelectedTeacher(null);
    }
  };

  const handleSelectCategory = (cat) => {
    setCategory(cat);
    setView("teachers");
  };

  const handleSelectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setView("schedule");
  };

  const handleBack = () => {
    if (view === "schedule") {
      setView("teachers");
      setSelectedTeacher(null);
    } else {
      setView("home");
      setCategory(null);
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>🤖 ICan</h1>
          <p>Academy Scheduler</p>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${view === "home" ? "active" : ""}`}
            onClick={() => handleViewChange("home")}
          >
            <span className="nav-icon">🏠</span>
            <div className="nav-info">
              <span className="nav-label">Dashboard</span>
            </div>
          </button>

          <button 
            className={`nav-item teachers-nav ${view === "teachers" || view === "manageTeachers" || view === "schedule" ? "active" : ""}`}
            onClick={() => handleViewChange("teachers")}
          >
            <div className="nav-icon">👩‍🏫</div>
            <div className="nav-info">
              <span className="nav-label">Teachers</span>
              <div className="nav-metrics">
                <span>{stats.academyCount} Academy</span>
                <span className="dot">•</span>
                <span>{stats.wfhCount} WFH</span>
              </div>
            </div>
          </button>

          <button 
            className={`nav-item students-nav ${view === "manageStudents" ? "active" : ""}`}
            onClick={() => handleViewChange("manageStudents")}
          >
            <div className="nav-icon">🎓</div>
            <div className="nav-info">
              <span className="nav-label">Students</span>
              <div className="nav-metrics">
                <span>{stats.totalStudents} Active</span>
                <span className="dot">•</span>
                <span>{stats.totalClasses} Classes</span>
              </div>
            </div>
          </button>

          <div className="nav-divider"></div>

          <button 
            className={`nav-item secondary ${view === "overallSchedule" ? "active" : ""}`}
            onClick={() => handleViewChange("overallSchedule")}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Overall Schedule</span>
          </button>

          <button 
            className={`nav-item secondary ${view === "calendar" ? "active" : ""}`}
            onClick={() => handleViewChange("calendar")}
          >
            <span className="nav-icon">📅</span>
            <span className="nav-label">Calendar & Notes</span>
          </button>

          <button 
            className={`nav-item secondary ${view === "findAvailability" ? "active" : ""}`}
            onClick={() => handleViewChange("findAvailability")}
          >
            <span className="nav-icon">🔍</span>
            <span className="nav-label">Find Availability</span>
          </button>

          <button 
            className={`nav-item secondary trash-nav ${view === "trash" ? "active" : ""}`}
            onClick={() => handleViewChange("trash")}
          >
            <span className="nav-icon">🗑️</span>
            <span className="nav-label">Trash {trashCount > 0 && `(${trashCount})`}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <p>v0.3.0 • AI Scheduler</p>
        </div>
      </aside>

      <main className="main-content">
        {view === "home" && (
          <HomePage
            stats={stats}
            onSelectCategory={handleSelectCategory}
            onManageStudents={() => handleViewChange("manageStudents")}
          />
        )}
        {view === "teachers" && (
          <TeacherList
            category={category}
            onSelectTeacher={handleSelectTeacher}
            onManageTeachers={() => handleViewChange("manageTeachers")}
            onBack={handleBack}
          />
        )}
        {view === "schedule" && (
          <SchedulePage
            teacherName={selectedTeacher}
            onBack={handleBack}
          />
        )}
        {view === "manageTeachers" && (
          <ManageTeachers onBack={handleBack} />
        )}
        {view === "manageStudents" && (
          <ManageStudents onBack={handleBack} />
        )}
        {view === "overallSchedule" && (
          <OverallSchedule onBack={handleBack} />
        )}
        {view === "findAvailability" && (
          <FindAvailability 
            onBack={handleBack} 
            onSelectTeacher={handleSelectTeacher}
          />
        )}
        {view === "calendar" && (
          <CalendarPage onBack={handleBack} />
        )}
        {view === "trash" && (
          <TrashHistory onBack={handleBack} />
        )}
      </main>
    </div>
  );
}

export default App;
