<>
    {/* Tabs for Admin View */}
    <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border)' }}>
            <button
                className={`btn ${adminTab === 'content' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAdminTab('content')}
                style={{ borderRadius: '8px 8px 0 0', borderBottom: adminTab === 'content' ? '2px solid var(--accent)' : 'none' }}
            >
                Manage Content
            </button>
            <button
                className={`btn ${adminTab === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAdminTab('calendar')}
                style={{ borderRadius: '8px 8px 0 0', borderBottom: adminTab === 'calendar' ? '2px solid var(--accent)' : 'none' }}
            >
                Calendar Schedule
            </button>
        </div>
    </div>

    {adminTab === 'content' ? (
        <>
            {/* Response Dashboard */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Response Dashboard</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Responses</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>{responses.length}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Avg Current Culture</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f97316' }}>{avgCurrent}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Avg Desired Culture</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{avgDesired}</div>
                    </div>
                </div>
            </div>

            {/* Daily Quotes */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Daily Quotes</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <input className="form-input" placeholder="Quote text..." value={quoteText} onChange={e => setQuoteText(e.target.value)} />
                    <input className="form-input" placeholder="Author (optional)" value={quoteAuthor} onChange={e => setQuoteAuthor(e.target.value)} />
                    <button className="btn btn-primary" onClick={addQuote} disabled={!quoteText.trim()}>Add Quote</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(culturalCalibration.quotes || []).map(quote => (
                        <div key={quote.id} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontStyle: 'italic', marginBottom: '0.5rem' }}>"{quote.text}"</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>— {quote.author}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setScheduleModal({ type: 'quote', item: quote })}
                                    >
                                        <Icon name="Calendar" size={14} /> Schedule
                                    </button>
                                    <button className="btn btn-sm btn-danger" onClick={() => deleteQuote(quote.id)}>Delete</button>
                                </div>
                            </div>
                            {quote.scheduledDate && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.5rem' }}>
                                    📅 {quote.recurring?.enabled ? (
                                        <>Recurring: {
                                            quote.recurring.pattern === 'weekly' ? `Every ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][quote.recurring.dayOfWeek]}` :
                                                quote.recurring.pattern === 'monthly' ? `${['1st', '2nd', '3rd', '4th', 'Last'][quote.recurring.weekOfMonth === 'last' ? 4 : quote.recurring.weekOfMonth - 1]} ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][quote.recurring.dayOfWeek]} of month` :
                                                    quote.recurring.pattern === 'yearly' ? `${['1st', '2nd', '3rd', '4th', 'Last'][quote.recurring.weekOfMonth === 'last' ? 4 : quote.recurring.weekOfMonth - 1]} ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][quote.recurring.dayOfWeek]} of ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][quote.recurring.month - 1]}` : ''
                                        }</>
                                    ) : (
                                        new Date(quote.scheduledDate).toLocaleDateString()
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Daily Challenges */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Daily Challenges</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <textarea className="form-input" rows={3} placeholder="Challenge text..." value={challengeText} onChange={e => setChallengeText(e.target.value)} />
                    <button className="btn btn-primary" onClick={addChallenge} disabled={!challengeText.trim()}>Add Challenge</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(culturalCalibration.challenges || []).map(challenge => (
                        <div key={challenge.id} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                <div style={{ flex: 1 }}>{challenge.text}</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setScheduleModal({ type: 'challenge', item: challenge })}
                                    >
                                        <Icon name="Calendar" size={14} /> Schedule
                                    </button>
                                    <button className="btn btn-sm btn-danger" onClick={() => deleteChallenge(challenge.id)}>Delete</button>
                                </div>
                            </div>
                            {challenge.scheduledDate && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.5rem' }}>
                                    📅 {challenge.recurring?.enabled ? (
                                        <>Recurring: {
                                            challenge.recurring.pattern === 'weekly' ? `Every ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][challenge.recurring.dayOfWeek]}` :
                                                challenge.recurring.pattern === 'monthly' ? `${['1st', '2nd', '3rd', '4th', 'Last'][challenge.recurring.weekOfMonth === 'last' ? 4 : challenge.recurring.weekOfMonth - 1]} ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][challenge.recurring.dayOfWeek]} of month` :
                                                    challenge.recurring.pattern === 'yearly' ? `${['1st', '2nd', '3rd', '4th', 'Last'][challenge.recurring.weekOfMonth === 'last' ? 4 : challenge.recurring.weekOfMonth - 1]} ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][challenge.recurring.dayOfWeek]} of ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][challenge.recurring.month - 1]}` : ''
                                        }</>
                                    ) : (
                                        new Date(challenge.scheduledDate).toLocaleDateString()
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Submitted Responses */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Submitted Responses</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {responses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No responses yet</div>
                    ) : (
                        responses.map(response => (
                            <div key={response.id} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div style={{ fontWeight: 'bold' }}>{response.userName}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(response.date).toLocaleDateString()}</div>
                                </div>
                                <div style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>{response.reflection}</div>
                                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                                    <div>Current: <span style={{ fontWeight: 'bold', color: '#f97316' }}>{response.currentCultureScore}/10</span></div>
                                    <div>Desired: <span style={{ fontWeight: 'bold', color: '#10b981' }}>{response.desiredCultureScore}/10</span></div>
                                </div>
                                {response.feedback && (
                                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '4px', fontSize: '0.85rem' }}>
                                        <strong>Feedback:</strong> {response.feedback}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    ) : (
        <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Calendar Schedule</h3>
            {/* Calendar component will go here */}
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <Icon name="Calendar" size={48} />
                <p style={{ marginTop: '1rem' }}>Calendar view coming soon...</p>
                <p style={{ fontSize: '0.85rem' }}>Use the "Schedule" buttons in the Manage Content tab to assign quotes and challenges to dates.</p>
            </div>
        </div>
    )}

    {/* Schedule Modal */}
    {scheduleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setScheduleModal(null)}>
            <div className="card" style={{ width: '90%', maxWidth: '500px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 1.5rem 0' }}>Schedule {scheduleModal.type === 'quote' ? 'Quote' : 'Challenge'}</h3>

                {(() => {
                    const [tempDate, setTempDate] = useState(scheduleModal.item.scheduledDate || new Date().toISOString().split('T')[0]);
                    const [tempRecurring, setTempRecurring] = useState(scheduleModal.item.recurring?.enabled || false);
                    const [tempPattern, setTempPattern] = useState(scheduleModal.item.recurring?.pattern || 'weekly');
                    const [tempDayOfWeek, setTempDayOfWeek] = useState(scheduleModal.item.recurring?.dayOfWeek ?? new Date().getDay());
                    const [tempWeekOfMonth, setTempWeekOfMonth] = useState(scheduleModal.item.recurring?.weekOfMonth || 1);
                    const [tempMonth, setTempMonth] = useState(scheduleModal.item.recurring?.month || 1);

                    return (
                        <>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label">Start Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={tempDate}
                                    onChange={e => setTempDate(e.target.value)}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={tempRecurring}
                                        onChange={e => setTempRecurring(e.target.checked)}
                                    />
                                    <span className="form-label" style={{ margin: 0 }}>Recurring</span>
                                </label>
                            </div>

                            {tempRecurring && (
                                <>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label className="form-label">Pattern</label>
                                        <select className="form-input" value={tempPattern} onChange={e => setTempPattern(e.target.value)}>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>

                                    {tempPattern === 'weekly' && (
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label className="form-label">Day of Week</label>
                                            <select className="form-input" value={tempDayOfWeek} onChange={e => setTempDayOfWeek(parseInt(e.target.value))}>
                                                <option value={0}>Sunday</option>
                                                <option value={1}>Monday</option>
                                                <option value={2}>Tuesday</option>
                                                <option value={3}>Wednesday</option>
                                                <option value={4}>Thursday</option>
                                                <option value={5}>Friday</option>
                                                <option value={6}>Saturday</option>
                                            </select>
                                        </div>
                                    )}

                                    {(tempPattern === 'monthly' || tempPattern === 'yearly') && (
                                        <>
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <label className="form-label">Week of Month</label>
                                                <select className="form-input" value={tempWeekOfMonth} onChange={e => setTempWeekOfMonth(e.target.value === 'last' ? 'last' : parseInt(e.target.value))}>
                                                    <option value={1}>1st</option>
                                                    <option value={2}>2nd</option>
                                                    <option value={3}>3rd</option>
                                                    <option value={4}>4th</option>
                                                    <option value="last">Last</option>
                                                </select>
                                            </div>
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <label className="form-label">Day of Week</label>
                                                <select className="form-input" value={tempDayOfWeek} onChange={e => setTempDayOfWeek(parseInt(e.target.value))}>
                                                    <option value={0}>Sunday</option>
                                                    <option value={1}>Monday</option>
                                                    <option value={2}>Tuesday</option>
                                                    <option value={3}>Wednesday</option>
                                                    <option value={4}>Thursday</option>
                                                    <option value={5}>Friday</option>
                                                    <option value={6}>Saturday</option>
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {tempPattern === 'yearly' && (
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label className="form-label">Month</label>
                                            <select className="form-input" value={tempMonth} onChange={e => setTempMonth(parseInt(e.target.value))}>
                                                <option value={1}>January</option>
                                                <option value={2}>February</option>
                                                <option value={3}>March</option>
                                                <option value={4}>April</option>
                                                <option value={5}>May</option>
                                                <option value={6}>June</option>
                                                <option value={7}>July</option>
                                                <option value={8}>August</option>
                                                <option value={9}>September</option>
                                                <option value={10}>October</option>
                                                <option value={11}>November</option>
                                                <option value={12}>December</option>
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary" onClick={() => setScheduleModal(null)}>Cancel</button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        updateSchedule(scheduleModal.type, scheduleModal.item.id, {
                                            scheduledDate: tempDate,
                                            recurring: tempRecurring ? {
                                                enabled: true,
                                                pattern: tempPattern,
                                                dayOfWeek: tempDayOfWeek,
                                                weekOfMonth: (tempPattern === 'monthly' || tempPattern === 'yearly') ? tempWeekOfMonth : undefined,
                                                month: tempPattern === 'yearly' ? tempMonth : undefined
                                            } : null
                                        });
                                        setScheduleModal(null);
                                    }}
                                >
                                    Save Schedule
                                </button>
                            </div>
                        </>
                    );
                })()}
            </div>
        </div>
    )}
</>
