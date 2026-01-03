<h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent)', margin: 0, letterSpacing: '-1px' }}>DoFO</h1>
                        )}
<button className="btn btn-ghost btn-icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
    <Icon name={sidebarCollapsed ? "ChevronRight" : "ChevronLeft"} size={20} />
</button>
                    </div >

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        
                         {/* MAIN */}
                         <button className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
                             <Icon name="LayoutDashboard" size={18} /> {!sidebarCollapsed && "Dashboard"}
                         </button>
                         <button className={`nav-item ${view === 'staff_meeting' ? 'active' : ''}`} onClick={() => setView('staff_meeting')}>
                             <Icon name="Users" size={18} /> {!sidebarCollapsed && "Staff Meeting"}
                         </button>

                         {/* GAME WEEK */}
                         {!sidebarCollapsed && <div className="nav-header">Game Week</div>}
                         <button className={`nav-item ${view === 'landing' ? 'active' : ''}`} onClick={() => setView('landing')}>
                             <Icon name="Calendar" size={18} /> {!sidebarCollapsed && "Overview"}
                         </button>
                         <button className={`nav-item ${view === 'practice' ? 'active' : ''}`} onClick={() => setView('practice')}>
                             <Icon name="ClipboardList" size={18} /> {!sidebarCollapsed && "Practice Planner"}
                         </button>
                         <button className={`nav-item ${view === 'callsheet' ? 'active' : ''}`} onClick={() => setView('callsheet')}>
                             <Icon name="FileText" size={18} /> {!sidebarCollapsed && "Smart Call Sheet"}
                         </button>
                         <button className={`nav-item ${view === 'gameday' ? 'active' : ''}`} onClick={() => setView('gameday')}>
                             <Icon name="Trophy" size={18} /> {!sidebarCollapsed && "Game Day"}
                         </button>

                         {/* OFFENSE */}
                         {!sidebarCollapsed && <div className="nav-header">Offense</div>}
                         <button className={`nav-item ${view === 'install' ? 'active' : ''}`} onClick={() => setView('install')}>
                             <Icon name="Layers" size={18} /> {!sidebarCollapsed && "Install Board"}
                         </button>
                         <button className={`nav-item ${view === 'gameplan' ? 'active' : ''}`} onClick={() => setView('gameplan')}>
                             <Icon name="Target" size={18} /> {!sidebarCollapsed && "Game Plan"}
                         </button>
                         <button className={`nav-item ${view === 'playbook' ? 'active' : ''}`} onClick={() => setView('playbook')}>
                             <Icon name="Book" size={18} /> {!sidebarCollapsed && "Playbook"}
                         </button>
                         <button className={`nav-item ${view === 'wristband' ? 'active' : ''}`} onClick={() => setView('wristband')}>
                             <Icon name="Watch" size={18} /> {!sidebarCollapsed && "Wristband"}
                         </button>
                         <button className={`nav-item ${view === 'self-scout' ? 'active' : ''}`} onClick={() => setView('self-scout')}>
                             <Icon name="Activity" size={18} /> {!sidebarCollapsed && "Self Scout"}
                         </button>

                         {/* OTHER */}
                         {!sidebarCollapsed && <div className="nav-header">Program</div>}
                         <button className={`nav-item ${view === 'roster' ? 'active' : ''}`} onClick={() => setView('roster')}>
                             <Icon name="Users" size={18} /> {!sidebarCollapsed && "Roster"}
                         </button>
                         <button className={`nav-item ${view === 'budget' ? 'active' : ''}`} onClick={() => setView('budget')}>
                             <Icon name="DollarSign" size={18} /> {!sidebarCollapsed && "Budget"}
                         </button>
                    </div>

                    <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }} onClick={() => { if (confirm("Log out?")) { auth.signOut(); window.location.reload(); } }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {authUser.email ? authUser.email[0].toUpperCase() : 'U'}
                            </div>
                            {!sidebarCollapsed && (
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{authUser.displayName || 'Coach'}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Sign Out</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div >
