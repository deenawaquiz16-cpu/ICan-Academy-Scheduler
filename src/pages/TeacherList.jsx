import { useState } from "react";
import { loadTeachers } from "../utils/storage";
import "../App.css";

function TeacherList({ category, onSelectTeacher, onBack }) {
  const [teachers] = useState(() => loadTeachers());
  const [searchTerm, setSearchTerm] = useState("");
  
  const title = category === "academy" ? "Academy Teachers" : "Work From Home Teachers";
  const icon = category === "academy" ? "🏫" : "🏠";
  
  const list = (teachers[category] || [])
    .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="teacher-list-page">
      <div className="teacher-list-header">
        <div className="header-top">
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
          <h1>{icon} {title}</h1>
          <span className="teacher-count">{list.length} teacher{list.length !== 1 ? "s" : ""}</span>
        </div>
        
        <div className="teacher-search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search teacher name..."
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
          <p className="empty-list-msg">
            {searchTerm ? "No teachers match your search." : "No teachers in this category yet."}
          </p>
        )}
      </div>
    </div>
  );
}

export default TeacherList;
