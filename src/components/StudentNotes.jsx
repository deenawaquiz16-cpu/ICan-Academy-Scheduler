import { useState, useEffect } from "react";
import "./StudentNotes.css";

function StudentNotes() {
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem("ican-academy-student-notes");
    return saved || "";
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem("ican-academy-student-notes", notes);
      setIsSaving(false);
    }, 500); // Debounce save

    return () => clearTimeout(timeout);
  }, [notes]);

  const handleChange = (e) => {
    setNotes(e.target.value);
    setIsSaving(true);
  };

  return (
    <div className="dashboard-card student-notes-card">
      <div className="card-header-with-action">
        <h2>📝 Student Important Notes / Memo</h2>
        {isSaving ? (
          <span className="saving-indicator">Saving...</span>
        ) : (
          <span className="saved-indicator">✓ Saved</span>
        )}
      </div>
      <div className="notes-container">
        <textarea
          className="notes-textarea"
          placeholder="Write down important student updates, reminders, or general memos here..."
          value={notes}
          onChange={handleChange}
        />
      </div>
      <div className="notes-footer">
        <p>This memo is saved automatically and shared across your session.</p>
      </div>
    </div>
  );
}

export default StudentNotes;
