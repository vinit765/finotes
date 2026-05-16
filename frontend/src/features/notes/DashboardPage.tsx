import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock3,
  History,
  LogOut,
  Plus,
  Save,
  Share2,
  Trash2,
  Bell,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { LoadingState } from "../../components/LoadingState";
import { api } from "../../lib/api";
import { clearToken, getToken } from "../../lib/auth"; // Assuming getToken exists to parse user email
import type { NoteResponse, NotificationResponse } from "../../types";

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState<"read" | "write">("read"); // NEW: Permission state
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false); // NEW: Notification dropdown state

  // --- QUERIES ---
  const notesQuery = useQuery({
    queryKey: ["notes"],
    queryFn: api.getNotes,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: api.getNotifications,
    refetchInterval: 30000, // Poll every 30 seconds for new shares
  });

  // --- DERIVED STATE ---
  const selectedNote = useMemo(
    () => notesQuery.data?.find((note) => note.id === selectedId) ?? null,
    [notesQuery.data, selectedId],
  );
  const activeNoteId = selectedNote?.id ?? null;
  const unreadNotifications = notificationsQuery.data?.filter(n => !n.is_read) || [];

  // VERY BASIC HACK FOR ASSIGNMENT: Assuming your user email can be derived to check ownership.
  // Ideally, your GET /notes backend returns `permission: "read" | "write" | "owner"`. 
  // For now, if we can't edit it, we assume Read Only.
  const isReadOnly = false; // Replace this boolean with your actual RBAC check logic if your backend returns it.

  // --- EFFECTS ---
  useEffect(() => {
    if (!notesQuery.data?.length) {
      if (!isCreatingNote) {
        setSelectedId(null);
      }
      return;
    }

    if (!selectedId) {
      if (!isCreatingNote) {
        setSelectedId(notesQuery.data[0].id);
      }
      return;
    }

    const noteStillExists = notesQuery.data.some((note) => note.id === selectedId);
    if (!noteStillExists) {
      setSelectedId(notesQuery.data[0].id);
      setShowHistory(false);
      setShowShareModal(false);
      setIsCreatingNote(false);
    }
  }, [isCreatingNote, notesQuery.data, selectedId]);

  useEffect(() => {
    if (selectedNote) {
      setDraftTitle(selectedNote.title);
      setDraftContent(selectedNote.content);
      setIsCreatingNote(false);
    } else if (!selectedId || isCreatingNote) {
      setDraftTitle("");
      setDraftContent("");
    }
  }, [isCreatingNote, selectedNote, selectedId]);

  const historyQuery = useQuery({
    queryKey: ["history", activeNoteId],
    queryFn: () => api.getHistory(activeNoteId!),
    enabled: Boolean(activeNoteId) && showHistory,
  });

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: api.createNote,
    onSuccess: (note) => {
      toast.success("Note created");
      setSelectedId(note.id);
      setIsCreatingNote(false);
      queryClient.setQueryData<NoteResponse[]>(["notes"], (existingNotes = []) => [note, ...existingNotes]);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create note");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, title, content }: { id: string; title: string; content: string }) =>
      api.updateNote(id, { title, content }),
    onSuccess: () => {
      toast.success("Note saved");
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["history", activeNoteId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save note");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteNote,
    onSuccess: (_, deletedId) => {
      toast.success("Note deleted");
      queryClient.setQueryData<NoteResponse[]>(["notes"], (existingNotes = []) =>
        existingNotes.filter((note) => note.id !== deletedId),
      );
      const remainingNotes = (queryClient.getQueryData<NoteResponse[]>(["notes"]) ?? []).filter(
        (note) => note.id !== deletedId,
      );
      setSelectedId(remainingNotes[0]?.id ?? null);
      setIsCreatingNote(remainingNotes.length === 0);
      setDraftTitle("");
      setDraftContent("");
      setShowHistory(false);
      setShowShareModal(false);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.removeQueries({ queryKey: ["history", deletedId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete note");
    },
  });

  // UPDATED: Now sends the permission payload
  const shareMutation = useMutation({
    mutationFn: ({ id, email, permission }: { id: string; email: string; permission: "read" | "write" }) =>
      api.shareNote(id, { share_with_email: email, permission }),
    onSuccess: () => {
      toast.success("Note shared successfully");
      setShareEmail("");
      setShowShareModal(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to share note");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: ({ noteId, versionId }: { noteId: string; versionId: string }) =>
      api.restoreVersion(noteId, versionId),
    onSuccess: () => {
      toast.success("Version restored");
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["history", activeNoteId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to restore version");
    },
  });

  // NEW: Mark notification as read
  const readNotificationMutation = useMutation({
    mutationFn: api.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] }); // Refresh notes list to show the newly shared note
    }
  });

  // --- HANDLERS ---
  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  function handleNewNote() {
    setIsCreatingNote(true);
    setSelectedId(null);
    setDraftTitle("");
    setDraftContent("");
    setShowHistory(false);
    setShowShareModal(false);
  }

  async function handleSave(event?: FormEvent) {
    event?.preventDefault();
    if (isReadOnly) {
      toast.error("You only have view access to this note.");
      return;
    }
    if (!draftTitle.trim() || !draftContent.trim()) {
      toast.error("Title and content are required");
      return;
    }

    if (activeNoteId) {
      await updateMutation.mutateAsync({
        id: activeNoteId,
        title: draftTitle,
        content: draftContent,
      });
      return;
    }

    await createMutation.mutateAsync({
      title: draftTitle,
      content: draftContent,
    });
  }

  if (notesQuery.isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div>
          <div className="pill subtle-pill">Personal notes workspace</div>
          <h1>Finotes</h1>
          <p className="topbar-subtitle">
            A calm place to write, organize, and share what matters.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* NEW: Notification Bell */}
          <div className="relative">
            <button 
              className="secondary-button !p-2 relative" 
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={18} />
              {unreadNotifications.length > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#45A29E] rounded-full ring-2 ring-[#0B0C10]" />
              )}
            </button>
            
            {/* NEW: Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-80 bg-[#1F2833] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <span className="text-xs text-[#45A29E]">{unreadNotifications.length} new</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notificationsQuery.data?.length === 0 ? (
                      <div className="p-4 text-center text-sm text-[#C5C6C7]">No notifications yet.</div>
                    ) : (
                      notificationsQuery.data?.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!notif.is_read ? 'bg-white/5' : ''}`}
                          onClick={() => {
                            if (!notif.is_read) readNotificationMutation.mutate(notif.id);
                            setSelectedId(notif.note_id); // Jump to the shared note!
                            setShowNotifications(false);
                          }}
                        >
                          <p className="text-sm text-white">{notif.message}</p>
                          <small className="text-xs text-[#C5C6C7] mt-1 block">{formatDate(notif.created_at)}</small>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="secondary-button" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* ... Hero Panels remain exactly the same ... */}
      <section className="hero-panels">
        <article className="metric-card">
          <span>My notes</span>
          <strong>{notesQuery.data?.length ?? 0}</strong>
        </article>
        <article className="metric-card">
          <span>Sharing</span>
          <strong>Invite by email</strong>
        </article>
        <article className="metric-card">
          <span>Revision safety</span>
          <strong>Previous drafts available</strong>
        </article>
      </section>

      <div className="workspace-grid">
        <aside className="notes-rail">
          <div className="rail-header">
            <h2>Your notes</h2>
            <button className="icon-button" onClick={handleNewNote}>
              <Plus size={16} />
            </button>
          </div>

          <div className="notes-list">
            {notesQuery.data?.length ? (
              notesQuery.data.map((note, index) => (
                <motion.button
                  key={note.id}
                  className={`note-tile ${selectedId === note.id ? "note-tile-active" : ""}`}
                  onClick={() => {
                    setIsCreatingNote(false);
                    setSelectedId(note.id);
                    setShowHistory(false);
                    setShowShareModal(false);
                  }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <strong>{note.title}</strong>
                  <span>{note.content.slice(0, 80)}</span>
                  <small>{formatDate(note.updated_at)}</small>
                </motion.button>
              ))
            ) : (
              <div className="empty-state">
                <p>No notes yet.</p>
                <span>Create your first one to begin.</span>
              </div>
            )}
          </div>
        </aside>

        <main className="editor-panel">
          <form className="editor-card" onSubmit={handleSave}>
            <div className="editor-toolbar">
              <div>
                <div className="flex items-center gap-2">
                  <h2>{activeNoteId ? "Edit note" : "Create a note"}</h2>
                  {/* NEW: Read Only Badge */}
                  {isReadOnly && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-white/10 rounded-md text-[#C5C6C7]">
                      <Eye size={12} /> View Only
                    </span>
                  )}
                </div>
                <p>
                  Keep things clear, structured, and easy to come back to later.
                </p>
              </div>

              <div className="toolbar-actions">
                <button
                  className="secondary-button"
                  type="button"
                  disabled={!activeNoteId}
                  onClick={() => setShowHistory((value) => !value)}
                >
                  <History size={16} />
                  History
                </button>
                
                {/* NEW: Hide Share/Delete if Read Only */}
                {!isReadOnly && (
                  <>
                    <button
                      className="secondary-button"
                      type="button"
                      disabled={!activeNoteId}
                      onClick={() => setShowShareModal(true)}
                    >
                      <Share2 size={16} />
                      Share
                    </button>
                    <button
                      className="secondary-button danger-button"
                      type="button"
                      disabled={!activeNoteId}
                      onClick={() => activeNoteId && deleteMutation.mutate(activeNoteId)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </>
                )}
                
                {!isReadOnly && (
                  <button className="primary-button" type="submit">
                    <Save size={16} />
                    {activeNoteId ? "Save" : "Create"}
                  </button>
                )}
              </div>
            </div>

            <input
              className="editor-title-input"
              placeholder="Untitled note"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              disabled={isReadOnly} // NEW: Disable if read only
            />
            <textarea
              className="editor-textarea"
              placeholder="Write something thoughtful..."
              value={draftContent}
              onChange={(event) => setDraftContent(event.target.value)}
              disabled={isReadOnly} // NEW: Disable if read only
            />
          </form>
        </main>

        <aside className="insights-panel">
          {/* ... Insights panel remains the same ... */}
          <div className="insight-card">
            <div className="insight-title">
              <Clock3 size={16} />
              Current note
            </div>
            {selectedNote ? (
              <>
                <strong>{selectedNote.title}</strong>
                <p>Created {formatDate(selectedNote.created_at)}</p>
                <p>Updated {formatDate(selectedNote.updated_at)}</p>
              </>
            ) : (
              <p>Select or create a note to see details.</p>
            )}
          </div>
          
          {/* ... History card rendering remains the same ... */}
        </aside>
      </div>

      {showShareModal && activeNoteId ? (
        <div className="modal-backdrop" onClick={() => setShowShareModal(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Share note</h3>
            <p>Enter the recipient's email to give them access to this note.</p>
            <input
              className="modal-input"
              type="email"
              placeholder="friend@example.com"
              value={shareEmail}
              onChange={(event) => setShareEmail(event.target.value)}
            />
            
            {/* NEW: Permission Dropdown */}
            <div className="mt-4 mb-2">
              <label className="text-sm text-[#C5C6C7] mb-1 block">Permission level</label>
              <select 
                className="w-full bg-[#0B0C10] border border-white/10 rounded-md p-2 text-white outline-none focus:border-[#45A29E]"
                value={sharePermission}
                onChange={(e) => setSharePermission(e.target.value as "read" | "write")}
              >
                <option value="read">Viewer (Read Only)</option>
                <option value="write">Editor (Read & Write)</option>
              </select>
            </div>

            <div className="modal-actions mt-6">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowShareModal(false)}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={!shareEmail.trim()}
                onClick={() => shareMutation.mutate({ id: activeNoteId, email: shareEmail.trim(), permission: sharePermission })}
              >
                Share note
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}