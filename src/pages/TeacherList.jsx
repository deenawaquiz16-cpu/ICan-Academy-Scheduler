import { useState, useEffect } from "react";
import { loadTeachers } from "../utils/storage";
import "../App.css";

function TeacherList({ category: initialCategory, onSelectTeacher, onManageTeachers, onBack }) {
  const [teachers] = useState(() => loadTeachers());
  const [activeCategory, setActiveCategory] = useState(initialCategory || "academy");
  const [searchTerm, setSearchTerm] = useState("");

  // Force Academy as default if WFH is empty and we haven't picked one
  useEffect(() => {
    const academyCount = teachers.academy?.length || 0;
    const wfhCount = teachers.wfh?.length || 0;
    
    if (!initialCategory) {
      if (academyCount > 0 && activeCategory !== "academy" && wfhCount === 0) {
        setActiveCategory("academy");
      }
    }
  }, [initialCategory, teachers, activeCategory]);

  const academyCount = teachers.academy?.length || 0;
  const wfhCount = teachers.wfh?.length || 0;

  const list = (teachers[activeCategory] || [])
    .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  const title = activeCategory === "academy" ? "Academy Teachers" : "Work From Home Teachers";
  const icon = activeCategory === "academy" ? "🏫" : "🏠";

  return (
    <div className="teacher-list-page">
      <div className="teacher-list-header">
        <div className="header-top">
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
          <h1>👩‍🏫 Teachers Directory</h1>
          <button className="manage-teachers-btn" onClick={onManageTeachers} title="Add, Edit or Delete Teachers">
            ⚙️ Manage
          </button>
        </div>

        {/* Category Toggle Tabs */}
        <div className="category-tabs" style={{ display: 'flex', gap: '10px', margin: '20px 0', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <button 
            onClick={() => setActiveCategory("academy")}
            className={activeCategory === "academy" ? "active" : ""}
            style={{
              padding: '10px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              background: activeCategory === "academy" ? '#4a90e2' : '#f0f0f0',
              color: activeCategory === "academy" ? 'white' : '#666',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🏫 Academy ({academyCount})
          </button>
          <button 
            onClick={() => setActiveCategory("wfh")}
            className={activeCategory === "wfh" ? "active" : ""}
            style={{
              padding: '10px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              background: activeCategory === "wfh" ? '#4a90e2' : '#f0f0f0',
              color: activeCategory === "wfh" ? 'white' : '#666',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🏠 WFH ({wfhCount})
          </button>
        </div>
        
        <div className="teacher-search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={`Search ${title}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="teacher-search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>✕</button>
          )}
        </div>
      </div>

      <div className="teacher-grid">
        {list.map((teacher) => (
          <button
            key={teacher}
            className="teacher-card"
            onClick={() => onSelectTeacher(teacher)}
          >
            <div className="teacher-avatar">
              {teacher.charAt(0)}
            </div>
            <span className="teacher-name">{teacher}</span>
            <span className="teacher-arrow">→</span>
          </button>
        ))}
        {list.length === 0 && (
          <p className="empty-list-msg" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#888' }}>
            {searchTerm ? "No teachers match your search." : `No teachers in the ${title} category yet.`}
          </p>
        )}
      </div>
    </div>
  );
}

export default TeacherList;
