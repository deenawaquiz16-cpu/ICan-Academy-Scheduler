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
  console.log("App component: rendering, current view:", view);
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
        if (student.schedules && Array.isArray(student.schedules)) {
          student.schedules.forEach(sched => {
            if (sched.days) {
              const days = Array.isArray(sched.days) 
                ? sched.days 
                : (typeof sched.days === 'string' ? (sched.days.match(/.{1,3}/g) || []) : []);
              totalClasses += days.length;
            }
          });
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
  }, [view]); // Recalculate when navigating back to home or changing views

  useEffect(() => {
    // Force a sync on load to ensure teacher schedules match student data
    syncStudentsToTeachers();
    setTrashCount(getTrashCount());
  }, []);

  const handleViewChange = (newView) => {
    setView(newView);
    setTrashCount(getTrashCount());
  };

  const handleSelectCategory = (cat) => {
    let targetCat = cat;
    // Auto-select category if one is empty
    if (!cat) {
      const teachers = loadTeachers();
      const academyCount = teachers.academy?.length || 0;
      const wfhCount = teachers.wfh?.length || 0;
      
      if (academyCount > 0 && wfhCount === 0) targetCat = "academy";
      else if (wfhCount > 0 && academyCount === 0) targetCat = "wfh";
    }
    
    setCategory(targetCat);
    handleViewChange("teachers");
  };

  const handleSelectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    handleViewChange("schedule");
  };

  const handleBack = () => {
    let nextView = "home";
    if (view === "schedule") {
      nextView = "teachers";
      setSelectedTeacher(null);
    } else if (view === "teachers") {
      nextView = "home";
      setCategory(null);
    }
    setView(nextView);
    setTrashCount(getTrashCount());
  };

  return (
    <div className="app">
      {view === "home" && (
        <HomePage
          onSelectCategory={handleSelectCategory}
          onManageTeachers={() => handleViewChange("manageTeachers")}
          onManageStudents={() => handleViewChange("manageStudents")}
          onOverallSchedule={() => handleViewChange("overallSchedule")}
          onFindAvailability={() => handleViewChange("findAvailability")}
          onCalendar={() => handleViewChange("calendar")}
          stats={stats}
        />
      )}
      {view === "teachers" && (
        <TeacherList
          category={category}
          onSelectTeacher={handleSelectTeacher}
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

      {/* Global Trash Button — visible on every page except trash itself */}
      {view !== "trash" && (
        <button className="global-trash-btn" onClick={() => handleViewChange("trash")} title={`Trash & Recovery (${trashCount} items)`}>
          🗑️
          {trashCount > 0 && <span className="trash-count-badge">{trashCount}</span>}
        </button>
      )}
    </div>
  );
}

export default App;
