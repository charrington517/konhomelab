const WORKSPACE_KEY = "konhomelab:workspace:v1";

const DEFAULT_FILTERS = {
  query: "",
  status: "all",
  category: "all"
};

const DEFAULT_WORKSPACE = {
  version: 1,
  viewMode: "operations",
  filters: DEFAULT_FILTERS,
  lastSection: "overview",
  sections: {},
  updatedAt: ""
};

let writeTimer = null;
let pendingPatch = null;

function storage() {
  try {
    const testKey = "konhomelab:storage-test";
    window.localStorage?.setItem(testKey, "1");
    window.localStorage?.removeItem(testKey);
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeParse(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function sanitizeFilters(filters) {
  return {
    query: typeof filters?.query === "string" ? filters.query : "",
    status: typeof filters?.status === "string" ? filters.status : "all",
    category: typeof filters?.category === "string" ? filters.category : "all"
  };
}

function sanitizeWorkspace(workspace) {
  return {
    ...DEFAULT_WORKSPACE,
    ...(workspace || {}),
    filters: sanitizeFilters(workspace?.filters),
    sections: workspace?.sections && typeof workspace.sections === "object"
      ? workspace.sections
      : {},
    lastSection: typeof workspace?.lastSection === "string" ? workspace.lastSection : "overview",
    viewMode: typeof workspace?.viewMode === "string" ? workspace.viewMode : "operations"
  };
}

export function readWorkspaceState() {
  const local = storage();
  if (!local) {
    return {
      available: false,
      restored: false,
      corrupted: false,
      state: DEFAULT_WORKSPACE
    };
  }

  const raw = local.getItem(WORKSPACE_KEY);
  const parsed = safeParse(raw);
  const corrupted = Boolean(raw && !parsed);

  if (corrupted) {
    try {
      local.removeItem(WORKSPACE_KEY);
    } catch {
      // If removal is blocked, continue with the safe default state.
    }
  }

  return {
    available: true,
    restored: Boolean(parsed),
    corrupted,
    state: sanitizeWorkspace(parsed)
  };
}

export function getWorkspaceValue(key, fallback) {
  const workspace = readWorkspaceState();
  return workspace.state[key] ?? fallback;
}

export function getWorkspaceFilters(fallback = DEFAULT_FILTERS) {
  return sanitizeFilters(getWorkspaceValue("filters", fallback));
}

export function getWorkspaceMode(fallback = "operations") {
  return getWorkspaceValue("viewMode", fallback) || fallback;
}

export function getWorkspaceLastSection(fallback = "overview") {
  return getWorkspaceValue("lastSection", fallback) || fallback;
}

export function getWorkspaceSectionState(sectionKey) {
  const sections = getWorkspaceValue("sections", {});
  return sections?.[sectionKey];
}

export function saveWorkspacePatch(patch, immediate = false) {
  const local = storage();
  if (!local) return false;

  function mergePatch(basePatch, nextPatch) {
    return {
      ...(basePatch || {}),
      ...nextPatch,
      sections: {
        ...((basePatch || {}).sections || {}),
        ...(nextPatch.sections || {})
      }
    };
  }

  const write = (patchToWrite) => {
    const current = readWorkspaceState().state;
    const nextSections = patchToWrite.sections
      ? { ...current.sections, ...patchToWrite.sections }
      : current.sections;
    const next = sanitizeWorkspace({
      ...current,
      ...patchToWrite,
      sections: nextSections,
      updatedAt: new Date().toISOString()
    });

    try {
      local.setItem(WORKSPACE_KEY, JSON.stringify(next));
      return true;
    } catch {
      return false;
    }
  };

  if (immediate) {
    const patchToWrite = mergePatch(pendingPatch, patch);
    if (writeTimer) {
      window.clearTimeout(writeTimer);
      writeTimer = null;
    }
    pendingPatch = null;
    return write(patchToWrite);
  }

  pendingPatch = mergePatch(pendingPatch, patch);

  if (writeTimer) {
    window.clearTimeout(writeTimer);
  }

  writeTimer = window.setTimeout(() => {
    const patchToWrite = pendingPatch;
    pendingPatch = null;
    write(patchToWrite);
    writeTimer = null;
  }, 250);

  return true;
}

export function saveWorkspaceFilters(filters) {
  return saveWorkspacePatch({ filters: sanitizeFilters(filters) });
}

export function saveWorkspaceSectionState(sectionKey, state) {
  return saveWorkspacePatch({ sections: { [sectionKey]: state } }, true);
}

export function saveWorkspaceMode(modeId) {
  return saveWorkspacePatch({ viewMode: modeId }, true);
}

export function saveWorkspaceLastSection(sectionId) {
  return saveWorkspacePatch({ lastSection: sectionId });
}
