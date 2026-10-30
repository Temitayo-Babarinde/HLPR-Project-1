'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

export default function ClassList({ classes }) {
  const [query, setQuery] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    function focusSearch(event) {
      const target = event.target;
      const isTyping = target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || target?.isContentEditable;

      if (event.key === '/' && !isTyping && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  function handleSearchKeyDown(event) {
    if (event.key === 'Escape' && query) {
      event.preventDefault();
      setQuery('');
    }
  }
  const filteredClasses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return classes;
    return classes.filter((course) => [
      course.courses.department,
      course.courses.number,
      course.courses.title,
      course.section_number,
      course.semester,
      course.professor_name,
    ].some((value) => value?.toLowerCase().includes(normalizedQuery)));
  }, [classes, query]);

  return (
    <section aria-labelledby="course-list-heading">
      <div className="dashboard-section-title">
        <div><p className="eyebrow">Current semester</p><h2 id="course-list-heading">Course spaces</h2></div>
        <span aria-live="polite">{filteredClasses.length} {filteredClasses.length === 1 ? 'class' : 'classes'}</span>
      </div>
      <div className="class-search-row">
        <label className="class-search">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">Search your classes</span>
          <input ref={searchInputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleSearchKeyDown} placeholder="Search classes, professors, or semesters" />
          <kbd aria-hidden="true">/</kbd>
        </label>
        {query ? <button type="button" onClick={() => setQuery('')}>Clear</button> : null}
      </div>
      {filteredClasses.length ? (
        <div className="course-grid">
          {filteredClasses.map((course) => (
            <Link key={course.id} href={`/class/${course.id}`} className="course-card">
              <div className="course-card-top"><span>{course.courses.department} {course.courses.number}</span><em>{course.semester}</em></div>
              <h3>{course.courses.title}</h3>
              <div className="course-card-meta"><span>Section {course.section_number}</span>{course.professor_name ? <span>{course.professor_name}</span> : null}</div>
              <div className="course-card-open">Open class <span aria-hidden="true">→</span></div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="class-search-empty">
          <div aria-hidden="true">⌕</div>
          <h3>No classes found</h3>
          <p>Try a course code, title, professor, section, or semester.</p>
          <button type="button" onClick={() => setQuery('')}>Show all classes</button>
        </div>
      )}
    </section>
  );
}
