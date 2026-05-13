import { useEffect, useState } from "react";
import { NOTE_EVENT, readNote, saveNote } from "../operatorNotes";

function preview(note) {
  return note.length > 42 ? `${note.slice(0, 39)}...` : note;
}

function OperatorNote({ noteKey, label = "Note" }) {
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    const nextNote = readNote(noteKey);
    setNote(nextNote);
    setDraft(nextNote);

    function syncNote() {
      const synced = readNote(noteKey);
      setNote(synced);
      setDraft(synced);
    }

    window.addEventListener(NOTE_EVENT, syncNote);
    window.addEventListener("storage", syncNote);
    return () => {
      window.removeEventListener(NOTE_EVENT, syncNote);
      window.removeEventListener("storage", syncNote);
    };
  }, [noteKey]);

  function startEdit(event) {
    event.preventDefault();
    event.stopPropagation();
    setDraft(note);
    setEditing(true);
  }

  function commitNote(event) {
    event.preventDefault();
    event.stopPropagation();

    const saved = saveNote(noteKey, draft);
    setStorageAvailable(saved);
    if (saved) {
      const nextNote = readNote(noteKey);
      setNote(nextNote);
      setDraft(nextNote);
      setEditing(false);
    }
  }

  function removeNote(event) {
    event.preventDefault();
    event.stopPropagation();

    const saved = saveNote(noteKey, "");
    setStorageAvailable(saved);
    if (saved) {
      setNote("");
      setDraft("");
      setEditing(false);
    }
  }

  return (
    <div className={`operator-note ${note ? "has-note" : ""}`}>
      {note && (
        <span className="note-chip" title={note}>
          Known: {preview(note)}
        </span>
      )}
      <button className="note-action" type="button" onClick={startEdit}>
        {note ? "Edit" : "Note"}
      </button>
      {note && (
        <button className="note-remove" type="button" onClick={removeNote} aria-label={`Remove note for ${label}`}>
          Remove
        </button>
      )}
      {!storageAvailable && <span className="note-storage">Session only</span>}
      {editing && (
        <form className="note-editor" onSubmit={commitNote}>
          <input
            aria-label={`Operator note for ${label}`}
            value={draft}
            onClick={event => event.stopPropagation()}
            onChange={event => setDraft(event.target.value)}
            maxLength={180}
            placeholder="Known issue note"
          />
          <button type="submit">Save</button>
          <button type="button" onClick={() => setEditing(false)}>Cancel</button>
        </form>
      )}
    </div>
  );
}

export default OperatorNote;
