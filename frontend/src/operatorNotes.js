export const NOTE_EVENT = "konhomelab:operator-notes";
const NOTE_KEY = "konhomelab:operator-notes";

function readAllNotes() {
  try {
    const stored = window.localStorage?.getItem(NOTE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function writeAllNotes(notes) {
  try {
    window.localStorage?.setItem(NOTE_KEY, JSON.stringify(notes));
    window.dispatchEvent(new CustomEvent(NOTE_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function readNote(key) {
  return readAllNotes()[key] || "";
}

export function saveNote(key, note) {
  const notes = readAllNotes();
  const value = String(note || "").trim();

  if (value) {
    notes[key] = value.slice(0, 180);
  } else {
    delete notes[key];
  }

  return writeAllNotes(notes);
}
