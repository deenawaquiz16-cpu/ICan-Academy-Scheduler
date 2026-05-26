import { useState } from "react";
import { loadTeachers } from "../utils/storage";
import "../App.css";

function TeacherList({ category: initialCategory, onSelectTeacher, onBack }) {
  const [teachers] = useState(() => loadTeachers());
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState("");

  // If no category selected yet, show selection screen
  if (!activeCategory) {
    return (
      <div className="teacher-list-page">
        <div className="teacher-list-header">
          <div className="header-top">
            <button className="back-btn" onClick={onBack}>
              ← Back
            </button>
            <h1>👩‍🏫 Teachers Directory</h1>
          </div>
        </div>

        <div className="category-selection-grid">
          <button className="category-select-card academy" onClick={() => setActiveCategory("academy")}>
            <div className="card-icon">🏫</div>
            <h2>Academy Teachers</h2>
            <p>{teachers.academy?.length || 0} Teachers</p>
          </button>
          <button className="category-select-card wfh" onClick={() => setActiveCategory("wfh")}>
            <div className="card-icon">🏠</div>
            <h2>Work From Home</h2>
            <p>{teachers.wfh?.length || 0} Teachers</p>
          </button>
        </div>
      </div>
    );
  }

  const title = activeCategory === "academy" ? "Academy Teachers" : "Work From Home Teachers";
  const icon = activeCategory === "academy" ? "🏫" : "🏠";

  const list = (teachers[activeCategory] || [])
    .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="teacher-list-page">
      <div className="teacher-list-header">
        <div className="header-top">
          <button className="back-btn" onClick={() => initialCategory ? onBack() : setActiveCategory(null)}>
            ← Back
          </button>
          <h1>{icon} {title}</h1>
          <span className="teacher-count">{list.length} teacher{list.length !== 1 ? "s" : ""}</span>
        </div>
...
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
