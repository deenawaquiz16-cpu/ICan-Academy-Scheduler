import { useState } from "react";
import {
  loadTrash,
  restoreFromTrash,
  permanentlyDeleteFromTrash,
  emptyTrash,
} from "../utils/storage";
import "../App.css";
import "./ManageStudents.css";

function TrashHistory({ onBack }) {
  const [trash, setTrash] = useState(() => loadTrash());
  const [restoredId, setRestoredId] = useState(null);

  const handleRestore = (trashId) => {
    if (!confirm("Restore this student?")) return;
    const { trash: updatedTrash } = restoreFromTrash(trashId);
    setTrash(updatedTrash);
    setRestoredId(trashId);
    setTimeout(() => setRestoredId(null), 2000);
  };

  const handlePermanentDelete = (trashId) => {
    if (!confirm("Permanently delete? This cannot be undone.")) return;
    const updatedTrash = permanentlyDeleteFromTrash(trashId);
    setTrash(updatedTrash);
  };

  const handleEmptyTrash = () => {
    if (!confirm("Empty entire trash? All items will be permanently deleted.")) return;
    emptyTrash();
    setTrash([]);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    if (status === "active") return "🟢 Active";
    if (status === "on-break") return "🟡 On Break";
    if (status === "stopped") return "🔴 Stopped";
    return "—";
  };

  return (
    <div className="manage-page">
      <div className="manage-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>🗑️ Trash & Recovery</h1>
      </div>

      <div className="manage-section">
        <div className="manage-section-header">
          <h2>Deleted Students</h2>
          <div className="header-right">
            <span className="student-count">{trash.length} item{trash.length !== 1 ? "s" : ""}</span>
            {trash.length > 0 && (
              <button className="empty-trash-btn" onClick={handleEmptyTrash}>
                Empty Trash
              </button>
            )}
          </div>
        </div>

        {trash.length === 0 ? (
          <div className="trash-empty-state">
            <div className="trash-empty-icon">♻️</div>
            <h3>Trash is Empty</h3>
            <p>Deleted students will appear here for recovery.</p>
          </div>
        ) : (
          <div className="trash-table-container">
            <table className="trash-table">
              <thead>
                <tr>
                  <th className="trash-col-name">Name</th>
                  <th className="trash-col-grade">Grade</th>
                  <th className="trash-col-status">Status</th>
                  <th className="trash-col-teacher">Teacher</th>
                  <th className="trash-col-date">Deleted</th>
                  <th className="trash-col-actions"></th>
                </tr>
              </thead>
              <tbody>
                {trash.map((item) => {
                  const student = item.data;
                  return (
                    <tr key={item.id} className="trash-row">
                      <td className="trash-col-name">
                        <span className="trash-name-en">{student.name}</span>
                      </td>
                      <td className="trash-col-grade">{student.gradeLevel || "—"}</td>
                      <td className="trash-col-status">{getStatusBadge(student.status)}</td>
                      <td className="trash-col-teacher">{student.currentTeacher || "—"}</td>
                      <td className="trash-col-date">{formatDate(item.deletedAt)}</td>
                      <td className="trash-col-actions">
                        <button
                          className={`trash-restore-btn ${restoredId === item.id ? "flash" : ""}`}
                          onClick={() => handleRestore(item.id)}
                          title="Restore"
                        >
                          {restoredId === item.id ? "✓" : "♻️"}
                        </button>
                        <button
                          className="trash-perm-delete-btn"
                          onClick={() => handlePermanentDelete(item.id)}
                          title="Delete forever"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrashHistory;
