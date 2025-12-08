
// Utility for geometry
const getPoint = (e, svg) => {
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
};

const PlayDiagramEditor = ({ initialData, onSave, onCancel }) => {
    const [elements, setElements] = useState(initialData?.elements || []);
    const [selectedTool, setSelectedTool] = useState('line'); // line, curve, receiver, move, delete
    const [color, setColor] = useState('#000000');
    const [lineStyle, setLineStyle] = useState('solid'); // solid, dashed
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState(null);

    // Ref for SVG
    const svgRef = useRef(null);

    // Tools configuration
    const TOOLS = [
        { id: 'move', icon: 'Move', label: 'Move' },
        { id: 'line', icon: 'Minus', label: 'Line' },
        { id: 'curve', icon: 'CornerUpRight', label: 'Curve' }, // Simpler cubic bezier or just polyline? Let's do simple polyline first for "dashes" support easily
        { id: 'arrow', icon: 'ArrowRight', label: 'Arrow' },
        { id: 'delete', icon: 'Trash', label: 'Delete' }
    ];

    const COLORS = ['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

    const handleMouseDown = (e) => {
        if (selectedTool === 'move' || selectedTool === 'delete') return;

        const point = getPoint(e, svgRef.current);
        setIsDrawing(true);

        const newElement = {
            id: Date.now(),
            type: selectedTool,
            points: [point],
            color,
            style: lineStyle
        };

        setCurrentPath(newElement);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || !currentPath) return;

        const point = getPoint(e, svgRef.current);

        setCurrentPath(prev => ({
            ...prev,
            points: [...prev.points, point]
        }));
    };

    const handleMouseUp = () => {
        if (!isDrawing || !currentPath) return;

        setIsDrawing(false);
        // Simplify path? 
        setElements(prev => [...prev, currentPath]);
        setCurrentPath(null);
    };

    const handleClickElement = (elId) => {
        if (selectedTool === 'delete') {
            setElements(prev => prev.filter(el => el.id !== elId));
        }
    };

    // Render SVG contents
    const renderElement = (el) => {
        if (el.points.length < 2) return null;

        const pathData = `M ${el.points.map(p => `${p.x},${p.y}`).join(' L ')}`;

        return (
            <path
                key={el.id}
                d={pathData}
                stroke={el.color}
                strokeWidth="4"
                fill="none"
                strokeDasharray={el.style === 'dashed' ? "10,5" : "none"}
                markerEnd="url(#arrowhead)" // simplified for now
                onClick={() => handleClickElement(el.id)}
                style={{ cursor: selectedTool === 'delete' ? 'pointer' : 'default' }}
            />
        );
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '90%', height: '90%', background: 'white', borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Toolbar */}
                <div style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', gap: '1rem', alignItems: 'center', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {TOOLS.map(tool => (
                            <button
                                key={tool.id}
                                className={`btn ${selectedTool === tool.id ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setSelectedTool(tool.id)}
                                title={tool.label}
                            >
                                <Icon name={tool.icon} size={20} />
                            </button>
                        ))}
                    </div>

                    <div style={{ width: '1px', height: '30px', background: '#ccc' }}></div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {COLORS.map(c => (
                            <button
                                key={c}
                                style={{ width: '30px', height: '30px', borderRadius: '50%', background: c, border: color === c ? '3px solid #000' : '1px solid #ccc', cursor: 'pointer' }}
                                onClick={() => setColor(c)}
                            />
                        ))}
                    </div>

                    <div style={{ width: '1px', height: '30px', background: '#ccc' }}></div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className={`btn ${lineStyle === 'solid' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLineStyle('solid')}>Solid</button>
                        <button className={`btn ${lineStyle === 'dashed' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLineStyle('dashed')}>Dashed</button>
                    </div>

                    <div style={{ flex: 1 }}></div>

                    <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => onSave({ elements })}>Save Diagram</button>
                </div>

                {/* Canvas Area */}
                <div style={{ flex: 1, position: 'relative', background: '#fff', cursor: 'crosshair', overflow: 'hidden' }}>
                    {/* Background Guidelines - simplified field */}
                    <svg
                        ref={svgRef}
                        width="100%"
                        height="100%"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                            </marker>
                        </defs>

                        {/* Field Lines Background - Static for reference */}
                        <line x1="0" y1="20%" x2="100%" y2="20%" stroke="#e2e8f0" strokeWidth="2" />
                        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#000" strokeWidth="2" /> {/* LOS */}
                        <line x1="0" y1="80%" x2="100%" y2="80%" stroke="#e2e8f0" strokeWidth="2" />

                        {elements.map(renderElement)}
                        {currentPath && renderElement(currentPath)}
                    </svg>
                </div>
            </div>
        </div>
    );
};
