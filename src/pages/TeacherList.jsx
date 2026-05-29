import { useState, useEffect } from "react";
import { loadTeachers } from "../utils/storage";
import "../App.css";

function TeacherList({ category: initialCategory, onSelectTeacher, onBack }) {
  const [teachers] = useState(() => loadTeachers());
  const [activeCategory, setActiveCategory] = useState(initialCategory || "academy");
  const [searchTerm, setSearchTerm] = useState("");

  // Auto-select the category that has data if we're not sure which one to show
  useEffect(() => {
    if (!initialCategory) {
      const academyCount = teachers.academy?.length || 0;
      const wfhCount = teachers.wfh?.length || 0;
      if (academyCount === 0 && wfhCount > 0) {
        setActiveCategory("wfh");
      } else if (academyCount > 0) {
        setActiveCategory("academy");
      }
    }
  }, [initialCategory, teachers]);

  const list = (teachers[activeCategory] || [])
    .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  const academyCount = teachers.academy?.length || 0;
  const wfhCount = teachers.wfh?.length || 0;

  return (
    <div className="teacher-list-page">
      <div className="teacher-list-header">
        <div className="header-top">
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
          <h1>👩‍🏫 Teachers Directory</h1>
        </div>

        {/* Category Toggle Tabs */}
        <div className="category-tabs" style={{ display: 'flex', gap: '10px', margin: '20px 0', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <button 
            onClick={() => setActiveCategory("academy")}
            style={{
              padding: '10px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              background: activeCategory === "academy" ? '#4a90e2' : '#f0f0f0',
              color: activeCategory === "academy" ? '#white' : '#666',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🏫 Academy ({academyCount})
          </button>
          <button 
            onClick={() => setActiveCategory("wfh")}
            style={{
              padding: '10px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              background: activeCategory === "wfh" ? '#4a90e2' : '#f0f0f0',
              color: activeCategory === "wfh" ? '#white' : '#666',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🏠 Work From Home ({wfhCount})
          </button>
        </div>
        
        <div className="teacher-search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={`Search in ${activeCategory === 'academy' ? 'Academy' : 'WFH'}...`}
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
            {searchTerm ? "No teachers match your search." : `No teachers in the ${activeCategory === 'academy' ? 'Academy' : 'Work From Home'} category yet.`}
          </p>
        )}
      </div>
    </div>
  );
}

export default TeacherList;
