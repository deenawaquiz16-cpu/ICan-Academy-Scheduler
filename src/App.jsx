import { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import HomePage from "./pages/HomePage";
import TeacherList from "./pages/TeacherList";
import SchedulePage from "./pages/SchedulePage";
import ManageTeachers from "./pages/ManageTeachers";
import ManageStudents from "./pages/ManageStudents";
import OverallSchedule from "./pages/OverallSchedule";
import FindAvailability from "./pages/FindAvailability";
import TrashHistory from "./pages/TrashHistory";
import CalendarPage from "./pages/CalendarPage";
import { getTrashCount, loadTeachers, loadStudents, syncStudentsToTeachers } from "./utils/storage";
import "./App.css";

function App() {
  const [view, setView] = useState("home");
  const [category, setCategory] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [trashCount, setTrashCount] = useState(() => getTrashCount());
  
  // Google Sheets Data State
  const [sheetData, setSheetData] = useState([]);
  const [loadingSheet, setLoadingSheet] = useState(false);

  const GOOGLE_CSV_LINK = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS69f9B9F04fB9bN0_yM-4w1_D-U9M2DclqLxtrktUYpiiclOt9lgQT2dEqB95QnFfTtc/pub?output=csv";

  useEffect(() => {
    const fetchSheetData = async () => {
      setLoadingSheet(true);
      try {
        const response = await fetch(GOOGLE_CSV_LINK);
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setSheetData(results.data);
            setLoadingSheet(false);
          },
          error: (error) => {
            console.error("PapaParse error:", error);
            setLoadingSheet(false);
          }
        });
      } catch (error) {
        console.error("Fetch error:", error);
        setLoadingSheet(false);
      }
    };

    fetchSheetData();
  }, []);

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
  }, [view]);

  useEffect(() => {
    syncStudentsToTeachers();
    setTrashCount(getTrashCount());
  }, []);

  const handleViewChange = (newView) => {
    setView(newView);
    setTrashCount(getTrashCount());
  };

  const handleSelectCategory = (cat) => {
    setCategory(cat);
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
          onLiveView={() => handleViewChange("liveView")}
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
      
      {view === "liveView" && (
        <div className="live-view-page">
          <div className="manage-header">
            <button className="back-btn" onClick={handleBack}>← Back</button>
            <h1>📡 Live Sheet Data</h1>
          </div>
          <div className="manage-section">
            {loadingSheet ? (
              <div className="loading-container">Loading live data...</div>
            ) : (
              <div className="student-table-container">
                <table className="student-table">
                  <thead>
                    <tr>
                      {sheetData.length > 0 && Object.keys(sheetData[0]).map(header => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheetData.map((row, idx) => (
                      <tr key={idx}>
                        {Object.keys(row).map(key => (
                          <td key={key}>{row[key]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Trash Button */}
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
