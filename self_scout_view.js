const SelfScoutView = ({ phase }) => {
    return (
        <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                padding: '3rem',
                background: 'var(--bg-main)'
            }}>
                <Icon name="BarChart2" size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>{phase} Self-Scout</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    Comprehensive season-wide analytics for {phase.toLowerCase()} are coming soon.
                </p>
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <div style={{ padding: '1rem', background: 'var(--bg-panel)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Tendencies</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Down & Distance</div>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--bg-panel)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Hit Charts</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Field Zones</div>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--bg-panel)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Efficiency</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Success Rates</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
