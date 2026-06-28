import { useState, useEffect } from 'react';
import { folderApi, mediaApi } from '../services/api';
import { PLATFORMS } from '../utils/constants';
import PlatformIcon from './PlatformIcon';
import toast from 'react-hot-toast';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Build a month calendar grid
function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = [];
  let day = 1 - firstDay;
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++, day++) {
      week.push(day >= 1 && day <= daysInMonth ? day : null);
    }
    grid.push(week);
    if (day > daysInMonth) break;
  }
  return grid;
}

export default function CalendarView({ onOpenFolder }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [allMedia, setAllMedia] = useState([]); // All scheduled media
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // { day, items }

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const folderRes = await folderApi.getAll();
        const folderList = folderRes.data.data;
        setFolders(folderList);

        // Fetch all media from all folders
        const allItems = [];
        await Promise.all(
          folderList.map(async (folder) => {
            try {
              const mediaRes = await mediaApi.getByFolder(folder._id, { limit: 200 });
              const items = mediaRes.data.data.filter((m) => m.scheduledDate);
              items.forEach((m) => allItems.push({ ...m, folder }));
            } catch {
              // Skip folders with errors
            }
          })
        );
        setAllMedia(allItems);
      } catch {
        toast.error('Failed to load calendar data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const grid = buildCalendarGrid(year, month);

  // Build a map: "YYYY-MM-DD" -> [media items]
  const dateMap = {};
  allMedia.forEach((item) => {
    if (!item.scheduledDate) return;
    const d = new Date(item.scheduledDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (!dateMap[key]) dateMap[key] = [];
    dateMap[key].push(item);
  });

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelected(null);
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const items = dateMap[key] || [];
    setSelected({ day, key, items });
  };

  const scheduledThisMonth = Object.entries(dateMap).filter(([k]) => {
    const [y, m] = k.split('-');
    return parseInt(y) === year && parseInt(m) - 1 === month;
  }).reduce((sum, [,items]) => sum + items.length, 0);

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
          📅 <span className="gradient-text">Content Calendar</span>
        </h2>
        <p style={{ margin: '0.4rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {scheduledThisMonth} item{scheduledThisMonth !== 1 ? 's' : ''} scheduled for {MONTHS[month]} {year}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 300px' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Calendar grid */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <button onClick={prevMonth} className="btn-ghost" style={{ padding: '0.4rem 0.75rem' }}>‹ Prev</button>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{MONTHS[month]} {year}</h3>
            <button onClick={nextMonth} className="btn-ghost" style={{ padding: '0.4rem 0.75rem' }}>Next ›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {DAYS.map((d) => (
              <div key={d} style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Loading */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading calendar…</div>
          ) : (
            /* Calendar days */
            grid.map((week, wi) => (
              <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: wi < grid.length - 1 ? '1px solid var(--border)' : 'none' }}>
                {week.map((day, di) => {
                  const key = day ? `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : null;
                  const dayItems = key ? (dateMap[key] || []) : [];
                  const isToday = day && year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
                  const isSelected = selected?.key === key;

                  return (
                    <div
                      key={di}
                      onClick={() => handleDayClick(day)}
                      style={{
                        padding: '0.5rem',
                        minHeight: 80,
                        borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                        cursor: day ? 'pointer' : 'default',
                        background: isSelected ? 'rgba(124,108,248,0.1)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { if (day && !isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {day && (
                        <>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.8rem', fontWeight: isToday ? 800 : 400,
                            background: isToday ? 'var(--accent)' : 'transparent',
                            color: isToday ? '#fff' : 'var(--text-secondary)',
                            marginBottom: '0.25rem',
                          }}>
                            {day}
                          </div>
                          {/* Preview dots / mini cards */}
                          {dayItems.slice(0, 3).map((item, idx) => {
                            const plat = PLATFORMS[item.folder?.platform] || PLATFORMS.other;
                            return (
                              <div key={idx} style={{
                                display: 'flex', alignItems: 'center', gap: 3,
                                fontSize: '0.65rem', padding: '2px 4px', borderRadius: 3, marginBottom: 2,
                                background: item.folder?.color ? item.folder.color + '22' : 'rgba(124,108,248,0.15)',
                                color: item.folder?.color || 'var(--accent-light)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                borderLeft: `2px solid ${item.folder?.color || 'var(--accent)'}`,
                              }}>
                                <span style={{ flexShrink: 0, lineHeight: 0 }}><PlatformIcon platform={item.folder?.platform} size={10} /></span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || item.fileName}</span>
                              </div>
                            );
                          })}
                          {dayItems.length > 3 && (
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', paddingLeft: 4 }}>+{dayItems.length - 3} more</div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Day detail panel */}
        {selected && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', animation: 'slideUp 0.2s ease' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                {MONTHS[month]} {selected.day}
              </h3>
              <button onClick={() => setSelected(null)} className="btn-ghost" style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem' }}>✕</button>
            </div>
            {selected.items.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                Nothing scheduled this day
              </div>
            ) : (
              <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 480, overflowY: 'auto' }}>
                {selected.items.map((item) => {
                  const plat = PLATFORMS[item.folder?.platform] || PLATFORMS.other;
                  return (
                    <div
                      key={item._id}
                      onClick={() => item.folder && onOpenFolder(item.folder)}
                      style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${item.folder?.color || 'var(--accent)'}`, cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                        <PlatformIcon platform={item.folder?.platform} size={16} />
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title || item.fileName}
                        </span>
                        <span className={`badge ${item.status === 'uploaded' ? 'badge-uploaded' : 'badge-pending'}`}>
                          {item.status}
                        </span>
                      </div>
                      {item.folder && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📁 {item.folder.name}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
