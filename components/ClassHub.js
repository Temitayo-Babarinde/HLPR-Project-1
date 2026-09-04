'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase/client';

const TABS = [
  { key: 'discussion', label: 'Discussion', icon: '◌' },
  { key: 'tasks', label: 'Tasks', icon: '✓' },
  { key: 'syllabus', label: 'Syllabus', icon: '▤' },
  { key: 'roster', label: 'People', icon: '◎' },
];

function initials(person) {
  const value = person?.full_name || person?.email || '?';
  return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function relativeTime(date) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ClassHub({ section }) {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState('discussion');
  const [roster, setRoster] = useState([]);
  const [syllabus, setSyllabus] = useState('');
  const [tasks, setTasks] = useState([]);
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadBody, setNewThreadBody] = useState('');
  const [threadQuery, setThreadQuery] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState('saved');
  const [userId, setUserId] = useState(null);
  const loadedSyllabus = useRef(false);

  const loadDiscussion = useCallback(async () => {
    const [{ data: threadRows, error: threadError }, { data: messageRows, error: messageError }] = await Promise.all([
      supabase.from('discussion_threads').select('*').eq('section_id', section.id).order('created_at', { ascending: false }),
      supabase.from('discussion_messages').select('*, discussion_threads!inner(section_id)').eq('discussion_threads.section_id', section.id).order('created_at', { ascending: true }),
    ]);
    if (threadError || messageError) setError('The discussion could not be refreshed.');
    const nextThreads = threadRows || [];
    setThreads(nextThreads);
    setMessages(messageRows || []);
    setSelectedThreadId((current) => current && nextThreads.some((item) => item.id === current) ? current : nextThreads[0]?.id || null);
  }, [section.id, supabase]);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      setUserId(user.id);
      const results = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').eq('id', user.id).single(),
        supabase.rpc('get_classmates', { p_section_id: section.id }),
        supabase.from('syllabi').select('content').eq('section_id', section.id).maybeSingle(),
        supabase.from('tasks').select('*').eq('section_id', section.id).order('created_at'),
      ]);
      if (!active) return;
      const [{ data: me, error: meError }, { data: classmates, error: rosterError }, { data: syllabusRow, error: syllabusError }, { data: taskRows, error: tasksError }] = results;
      if (meError || rosterError || syllabusError || tasksError) setError('Some class information could not be loaded.');
      setRoster(me ? [{ ...me, isMe: true }, ...(classmates || [])] : (classmates || []));
      setSyllabus(syllabusRow?.content || '');
      loadedSyllabus.current = true;
      setTasks(taskRows || []);
      await loadDiscussion();
      if (active) setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [loadDiscussion, section.id, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`class-discussion-${section.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discussion_threads', filter: `section_id=eq.${section.id}` }, loadDiscussion)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discussion_messages' }, loadDiscussion)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadDiscussion, section.id, supabase]);

  useEffect(() => {
    if (!loadedSyllabus.current || !userId) return;
    setSaveState('saving');
    const timer = setTimeout(async () => {
      const { error: saveError } = await supabase.from('syllabi').upsert({
        section_id: section.id, content: syllabus, updated_by: userId, updated_at: new Date().toISOString(),
      });
      setSaveState(saveError ? 'error' : 'saved');
    }, 650);
    return () => clearTimeout(timer);
  }, [section.id, syllabus, supabase, userId]);

  const people = useMemo(() => new Map(roster.map((person) => [person.id, person])), [roster]);
  const selectedThread = threads.find((thread) => thread.id === selectedThreadId);
  const selectedMessages = messages.filter((message) => message.thread_id === selectedThreadId);
  const roots = selectedMessages.filter((message) => !message.parent_message_id);
  const filteredThreads = useMemo(() => {
    const query = threadQuery.trim().toLowerCase();
    if (!query) return threads;
    const matchingThreadIds = new Set(
      messages
        .filter((message) => message.body.toLowerCase().includes(query))
        .map((message) => message.thread_id),
    );
    return threads.filter((thread) => thread.title.toLowerCase().includes(query) || matchingThreadIds.has(thread.id));
  }, [messages, threadQuery, threads]);

  async function createThread(event) {
    event.preventDefault();
    if (!newThreadTitle.trim() || !newThreadBody.trim() || !userId) return;
    setPosting(true);
    setError('');
    const { data: thread, error: threadError } = await supabase.from('discussion_threads').insert({
      section_id: section.id, title: newThreadTitle.trim(), created_by: userId,
    }).select().single();
    if (!threadError && thread) {
      const { error: messageError } = await supabase.from('discussion_messages').insert({
        thread_id: thread.id, body: newThreadBody.trim(), created_by: userId,
      });
      if (!messageError) {
        setNewThreadTitle('');
        setNewThreadBody('');
        setSelectedThreadId(thread.id);
        await loadDiscussion();
      } else setError('The topic was created, but its first message failed to post.');
    } else setError('Your discussion topic could not be created.');
    setPosting(false);
  }

  async function postReply(event) {
    event.preventDefault();
    if (!replyBody.trim() || !selectedThreadId || !userId) return;
    setPosting(true);
    const { error: replyError } = await supabase.from('discussion_messages').insert({
      thread_id: selectedThreadId,
      parent_message_id: replyTo,
      body: replyBody.trim(),
      created_by: userId,
    });
    if (replyError) setError('Your reply could not be posted.');
    else {
      setReplyBody('');
      setReplyTo(null);
      await loadDiscussion();
    }
    setPosting(false);
  }

  async function addTask() {
    if (!newTask.trim() || !userId) return;
    const { data, error: taskError } = await supabase.from('tasks').insert({
      section_id: section.id, title: newTask.trim(), created_by: userId,
    }).select().single();
    if (data) setTasks((previous) => [...previous, data]);
    if (taskError) setError('That task could not be added.');
    setNewTask('');
  }

  async function toggleTask(task) {
    setTasks((previous) => previous.map((item) => item.id === task.id ? { ...item, is_done: !item.is_done } : item));
    const { error: taskError } = await supabase.from('tasks').update({ is_done: !task.is_done }).eq('id', task.id);
    if (taskError) {
      setTasks((previous) => previous.map((item) => item.id === task.id ? task : item));
      setError('That task could not be updated.');
    }
  }

  if (loading) return <main className="app-loading"><span className="loading-mark">h</span><p>Opening your class…</p></main>;

  return (
    <main className="class-app">
      <header className="class-topbar">
        <Link href="/dashboard" className="topbar-brand">hlpr<span>.</span></Link>
        <Link href="/dashboard" className="back-link">← All classes</Link>
      </header>

      <section className="class-hero">
        <div className="class-hero-inner">
          <div className="course-code">{section.courses.department} {section.courses.number}</div>
          <h1>{section.courses.title}</h1>
          <p>Section {section.section_number} · {section.semester}{section.professor_name ? ` · ${section.professor_name}` : ''}</p>
          <div className="member-stack">
            {roster.slice(0, 5).map((person) => <span key={person.id} title={person.full_name || person.email}>{initials(person)}</span>)}
            <b>{roster.length} {roster.length === 1 ? 'member' : 'members'}</b>
          </div>
        </div>
      </section>

      <div className="class-layout">
        <nav className="class-tabs" aria-label="Class areas">
          {TABS.map((item) => (
            <button key={item.key} className={tab === item.key ? 'active' : ''} onClick={() => setTab(item.key)}>
              <span>{item.icon}</span>{item.label}
              {item.key === 'discussion' && threads.length > 0 ? <em>{threads.length}</em> : null}
            </button>
          ))}
        </nav>

        <section className="class-content">
          {error ? <div className="error banner">{error}<button onClick={() => setError('')}>×</button></div> : null}

          {tab === 'discussion' ? (
            <div className="discussion-grid">
              <aside className="thread-list">
                <div className="section-heading"><div><span>Class forum</span><h2>Discussion</h2></div><button onClick={() => setSelectedThreadId(null)}>+ New</button></div>
                <label className="thread-search">
                  <span className="sr-only">Search discussions</span>
                  <span aria-hidden="true">⌕</span>
                  <input value={threadQuery} onChange={(event) => setThreadQuery(event.target.value)} placeholder="Search discussions" type="search" />
                </label>
                {filteredThreads.map((thread) => {
                  const count = messages.filter((message) => message.thread_id === thread.id).length;
                  return (
                    <button key={thread.id} className={selectedThreadId === thread.id ? 'thread-card active' : 'thread-card'} onClick={() => setSelectedThreadId(thread.id)}>
                      <strong>{thread.title}</strong>
                      <span>{people.get(thread.created_by)?.full_name || 'Classmate'} · {relativeTime(thread.created_at)}</span>
                      <small>{count} {count === 1 ? 'message' : 'messages'}</small>
                    </button>
                  );
                })}
                {threads.length === 0 ? <div className="empty-mini">No conversations yet. Start the first one.</div> : null}
                {threads.length > 0 && filteredThreads.length === 0 ? <div className="empty-mini">No discussions match “{threadQuery.trim()}”.</div> : null}
              </aside>

              <div className="conversation-panel">
                {!selectedThread ? (
                  <form className="new-thread" onSubmit={createThread}>
                    <span className="eyebrow">Start a conversation</span>
                    <h2>What should the class discuss?</h2>
                    <input className="input" value={newThreadTitle} onChange={(event) => setNewThreadTitle(event.target.value)} placeholder="Topic title" maxLength={160} required />
                    <textarea className="input" value={newThreadBody} onChange={(event) => setNewThreadBody(event.target.value)} placeholder="Ask a question, share a resource, or start a study thread…" rows={6} maxLength={4000} required />
                    <button className="button" disabled={posting}>{posting ? 'Posting…' : 'Post topic'}</button>
                  </form>
                ) : (
                  <>
                    <div className="conversation-header"><span className="eyebrow">Thread</span><h2>{selectedThread.title}</h2></div>
                    <div className="message-stream">
                      {roots.map((message) => {
                        const author = people.get(message.created_by);
                        const replies = selectedMessages.filter((item) => item.parent_message_id === message.id);
                        return (
                          <article className="message-group" key={message.id}>
                            <div className="message-row">
                              <div className="avatar">{initials(author)}</div>
                              <div className="message-copy">
                                <div><strong>{author?.full_name || author?.email || 'Classmate'}</strong><time>{relativeTime(message.created_at)}</time></div>
                                <p>{message.body}</p>
                                <button onClick={() => setReplyTo(message.id)}>Reply</button>
                              </div>
                            </div>
                            {replies.map((reply) => {
                              const replyAuthor = people.get(reply.created_by);
                              return (
                                <div className="message-row reply" key={reply.id}>
                                  <div className="avatar small">{initials(replyAuthor)}</div>
                                  <div className="message-copy"><div><strong>{replyAuthor?.full_name || 'Classmate'}</strong><time>{relativeTime(reply.created_at)}</time></div><p>{reply.body}</p></div>
                                </div>
                              );
                            })}
                          </article>
                        );
                      })}
                    </div>
                    <form className="reply-box" onSubmit={postReply}>
                      {replyTo ? <div className="replying">Replying to a message <button type="button" onClick={() => setReplyTo(null)}>Cancel</button></div> : null}
                      <textarea value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder="Write a reply…" rows={3} maxLength={4000} required />
                      <button className="button" disabled={posting}>{posting ? 'Sending…' : 'Send reply'}</button>
                    </form>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {tab === 'tasks' ? (
            <div className="feature-card">
              <div className="section-heading"><div><span>Shared workspace</span><h2>Class tasks</h2></div><b>{tasks.filter((task) => !task.is_done).length} open</b></div>
              <div className="task-entry"><input value={newTask} onChange={(event) => setNewTask(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addTask()} placeholder="Add an assignment or reminder…" /><button onClick={addTask}>Add</button></div>
              <div className="task-list">
                {tasks.map((task) => <button key={task.id} className={task.is_done ? 'task done' : 'task'} onClick={() => toggleTask(task)}><span>{task.is_done ? '✓' : ''}</span><p>{task.title}</p></button>)}
                {tasks.length === 0 ? <div className="empty-state"><div>✓</div><h3>Nothing due yet</h3><p>Add the first task for your class.</p></div> : null}
              </div>
            </div>
          ) : null}

          {tab === 'syllabus' ? (
            <div className="feature-card">
              <div className="section-heading"><div><span>Living document</span><h2>Shared syllabus</h2></div><b className={saveState === 'error' ? 'save-error' : ''}>{saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed' : 'Saved'}</b></div>
              <textarea className="syllabus-editor" value={syllabus} onChange={(event) => setSyllabus(event.target.value)} rows={18} placeholder="Add grading details, weekly topics, office hours, and important dates…" />
            </div>
          ) : null}

          {tab === 'roster' ? (
            <div className="feature-card">
              <div className="section-heading"><div><span>Your community</span><h2>People</h2></div><b>{roster.length} total</b></div>
              <div className="roster-grid">
                {roster.map((person) => <div className="person-card" key={person.id}><div className="avatar large">{initials(person)}</div><div><strong>{person.full_name || 'Classmate'}</strong><span>{person.email}{person.isMe ? ' · You' : ''}</span></div></div>)}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
