export const QUICK_REFRESH_EVENT = "konhomelab:quick-refresh";

export function quickActionEvent(sectionId) {
  return new CustomEvent(QUICK_REFRESH_EVENT, {
    detail: { sectionId: sectionId || "dashboard" }
  });
}

export function jumpToDashboardSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (sectionId) {
    window.location.hash = sectionId;
  }
}

export function openExternalUrl(url) {
  if (!url) return false;
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.href = url;
  }
  return true;
}

export async function copyText(text) {
  if (!text) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy clipboard path.
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textArea);
    return copied;
  } catch {
    return false;
  }
}

export async function pingUrl(url) {
  if (!url) return false;

  try {
    await fetch(url, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store"
    });
    return true;
  } catch {
    return false;
  }
}
