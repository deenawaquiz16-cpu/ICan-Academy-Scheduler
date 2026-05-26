import { useState } from "react";
import { loadTeachers, addTeacher, editTeacher, deleteTeacher } from "../utils/storage";
import "../App.css";

function ManageTeachers({ onBack }) {
  const [teachers, setTeachers] = useState(() => loadTeachers());
  const [editingCategory, setEditingCategory] = useState(null); // "academy" or "wfh"
  const [editingName, setEditingName] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (category) => {
    const name = inputValue.trim();
    if (!name) return;
    const updated = addTeacher(category, name);
    setTeachers(updated);
    setInputValue("");
    setIsAdding(false);
  };

  const handleEdit = (category, oldName) => {
    const newName = inputValue.trim();
    if (!newName) return;
    const updated = editTeacher(category, oldName, newName);
    setTeachers(updated);
    setInputValue("");
    setEditingName(null);
  };

  const handleDelete = (category, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const updated = deleteTeacher(category, name);
    setTeachers(updated);
  };

  const startEdit = (name) => {
    setEditingName(name);
    setInputValue(name);
  };

  const cancelEdit = () => {
    setEditingName(null);
    setInputValue("");
    setIsAdding(false);
  };

  return (
    <div className="manage-page">
      <div className="manage-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h1>👩‍🏫 Manage Teachers</h1>
      </div>

      {["academy", "wfh"].map((category) => {
        const sortedList = (teachers[category] || []).sort((a, b) => a.localeCompare(b));
        return (
        <div key={category} className="manage-section">
          <div className="manage-section-header">
            <h2>{category === "academy" ? "🏫 Academy Teachers" : "🏠 Work From Home Teachers"}</h2>
            <div className="header-right">
              <span className="section-count">{sortedList.length}</span>
              <button
                className="add-btn"
                onClick={() => {
                  setEditingCategory(category);
                  setIsAdding(true);
                  setInputValue("");
                }}
              >
                + Add Teacher
              </button>
            </div>
          </div>

          {isAdding && editingCategory === category && (
            <div className="manage-input-row">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter teacher name"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAdd(category)}
              />
              <div className="manage-input-actions">
                <button className="confirm-btn" onClick={() => handleAdd(category)}>
                  ✓
                </button>
                <button className="cancel-small-btn" onClick={cancelEdit}>
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="manage-list">
            {sortedList.map((name) => (
              <div key={name} className="manage-item">
                {editingName === name ? (
                  <>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleEdit(category, name)}
                    />
                    <div className="manage-input-actions">
                      <button className="confirm-btn" onClick={() => handleEdit(category, name)}>
                        ✓
                      </button>
                      <button className="cancel-small-btn" onClick={cancelEdit}>
                        ✕
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="manage-item-name">{name}</span>
                    <div className="manage-item-actions">
                      <button className="edit-btn" onClick={() => startEdit(name)}>
                        ✏️
                      </button>
                      <button className="delete-item-btn" onClick={() => handleDelete(category, name)}>
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        );
      })}
    </div>
  );
}

export default ManageTeachers;
