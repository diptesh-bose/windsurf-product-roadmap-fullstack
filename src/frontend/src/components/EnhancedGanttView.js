import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format, addDays, differenceInDays, startOfWeek, addWeeks } from 'date-fns';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import '../styles/EnhancedGanttView.css';

const EnhancedGanttView = () => {
  const [features, setFeatures] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(startOfWeek(new Date()));
  const [endDate, setEndDate] = useState(addWeeks(startOfWeek(new Date()), 4));
  const [hoveredTask, setHoveredTask] = useState(null);
  const [useSampleDependencies, setUseSampleDependencies] = useState(false); // Default to false - only show real dependencies
  const ganttRef = useRef(null);

  // Color mapping for feature status
  const statusColors = {
    backlog: '#8c7ae6',
    in_progress: '#00b894',
    completed: '#4cd137',
    blocked: '#e84393',
    review: '#fdcb6e',
  };

  // Icon mapping for feature types
  const typeIcons = {
    bug: '🐛',
    feature: '✨',
    improvement: '⚡',
    documentation: '📝',
    security: '🔒'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch features and releases
        const [featuresRes, releasesRes] = await Promise.all([
          axios.get('/api/features'),
          axios.get('/api/releases')
        ]);

        const featuresData = featuresRes.data.map(feature => ({
          ...feature,
          startDate: feature.start_date ? new Date(feature.start_date) : null,
          endDate: feature.end_date ? new Date(feature.end_date) : null,
          color: statusColors[feature.status] || '#a5b1c2'
        }));
        
        let dependencyArray = [];
        
        // First try to get dependencies from the database
        featuresData.forEach(feature => {
          if (feature.dependencies && Array.isArray(feature.dependencies) && feature.dependencies.length > 0) {
            feature.dependencies.forEach(depId => {
              // Make sure both features exist before creating a dependency
              const dependsOnFeature = featuresData.find(f => f.id === depId);
              if (dependsOnFeature) {
                dependencyArray.push({
                  id: `${depId}-${feature.id}`,
                  predecessorId: depId,
                  successorId: feature.id
                });
              }
            });
          }
        });
        
        // If sample dependencies are enabled and no real dependencies exist, create sample ones
        if (dependencyArray.length === 0 && useSampleDependencies) {
          console.log('Creating sample dependencies for demonstration');
          
          // If we have at least 2 features, create sample dependencies
          if (featuresData.length >= 2) {
            // Find features that have start and end dates
            const validFeatures = featuresData.filter(f => f.startDate && f.endDate);
            
            if (validFeatures.length >= 2) {
              // Create dependencies between consecutive features
              for (let i = 0; i <validFeatures.length - 1; i++) {
                dependencyArray.push({
                  id: `${validFeatures[i].id}-${validFeatures[i+1].id}`,
                  predecessorId: validFeatures[i].id,
                  successorId: validFeatures[i+1].id
                });
              }
            }
          }
        }

        console.log(`Displaying ${dependencyArray.length} dependencies:`, dependencyArray);
        setFeatures(featuresData);
        setDependencies(dependencyArray);
        setReleases(releasesRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [useSampleDependencies]);

  // Separate useEffect for drawing dependency lines
  useEffect(() => {
    if (!loading && features.length > 0) {
      console.log('Drawing dependencies:', { 
        features: features.length,
        dependencies: dependencies.length 
      });
      
      // Only draw dependencies if we have any
      if (dependencies.length > 0) {
        requestAnimationFrame(() => {
          drawDependencyLines();
        });
      } else {
        console.log('No dependencies to draw');
        // Clear any existing dependency lines
        if (ganttRef.current) {
          const svg = ganttRef.current.querySelector('.gantt-dependency-lines');
          if (svg) {
            while (svg.firstChild) {
              svg.removeChild(svg.firstChild);
            }
          }
        }
      }
    }
  }, [loading, features, dependencies]);

  const drawDependencyLines = () => {
    if (!ganttRef.current) {
      console.log('No ganttRef.current');
      return;
    }

    const svg = ganttRef.current.querySelector('.gantt-dependency-lines');
    if (!svg) {
      console.log('No SVG element found');
      return;
    }

    console.log('Starting to draw dependency lines');

    // Clear existing lines
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Add marker definition for arrow
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#666');
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Log the number of dependencies we're trying to draw
    console.log(`Drawing ${dependencies.length} dependency lines`);

    dependencies.forEach((dep, index) => {
      console.log(`Processing dependency ${index + 1}:`, dep);
      
      const predecessor = features.find(f => f.id === dep.predecessorId);
      const successor = features.find(f => f.id === dep.successorId);

      if (!predecessor || !successor) {
        console.log('Missing feature for dependency:', { dep, predecessor, successor });
        return;
      }

      console.log('Found features for dependency:', { 
        predecessor: predecessor.title, 
        successor: successor.title 
      });

      // Use setTimeout to delay the DOM query to ensure elements are rendered
      setTimeout(() => {
        const predBar = document.querySelector(`[data-feature-id="${predecessor.id}"]`);
        const succBar = document.querySelector(`[data-feature-id="${successor.id}"]`);

        if (!predBar || !succBar) {
          console.log('Missing DOM elements for features:', { 
            predId: predecessor.id, 
            succId: successor.id,
            predBar: !!predBar,
            succBar: !!succBar
          });
          return;
        }

        console.log('Found DOM elements for features');

        const predRect = predBar.getBoundingClientRect();
        const succRect = succBar.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        // Calculate connection points
        const startX = predRect.right - svgRect.left;
        const startY = predRect.top + (predRect.height / 2) - svgRect.top;
        const endX = succRect.left - svgRect.left;
        const endY = succRect.top + (succRect.height / 2) - svgRect.top;

        console.log('Drawing line:', { 
          start: { x: startX, y: startY },
          end: { x: endX, y: endY }
        });

        // Calculate control points for a smoother curve
        const distance = endX - startX;
        const controlPoint1X = startX + distance * 0.4;
        const controlPoint2X = endX - distance * 0.4;

        // Create group for the dependency
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'dependency-group');

        // Create the curved path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${startX},${startY} C ${controlPoint1X},${startY} ${controlPoint2X},${endY} ${endX},${endY}`);
        path.setAttribute('class', 'dependency-line');
        path.setAttribute('marker-end', 'url(#arrowhead)');

        // Create start dot
        const startDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        startDot.setAttribute('cx', startX);
        startDot.setAttribute('cy', startY);
        startDot.setAttribute('r', '4');
        startDot.setAttribute('class', 'dependency-dot');

        // Create end dot
        const endDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        endDot.setAttribute('cx', endX);
        endDot.setAttribute('cy', endY);
        endDot.setAttribute('r', '4');
        endDot.setAttribute('class', 'dependency-dot');

        // Add tooltip title
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${predecessor.title} → ${successor.title}`;
        group.appendChild(title);

        // Append elements to group
        group.appendChild(path);
        group.appendChild(startDot);
        group.appendChild(endDot);
        
        // Append group to SVG
        svg.appendChild(group);
        
        console.log('Dependency line drawn successfully');
      }, 100 * index); // Stagger the drawing to avoid race conditions
    });
  };

  const generateDates = () => {
    const dates = [];
    let currentDate = startDate;
    while (currentDate <= endDate) {
      dates.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }
    return dates;
  };

  const renderHeader = () => {
    const dates = generateDates();
    const months = {};
    
    dates.forEach(date => {
      const monthKey = format(date, 'yyyy-MM');
      if (!months[monthKey]) {
        months[monthKey] = {
          name: format(date, 'MMMM yyyy'),
          days: 0
        };
      }
      months[monthKey].days++;
    });
    
    return (
      <div className="gantt-header">
        <div className="gantt-months">
          {Object.values(months).map(month => (
            <div
              key={month.name}
              className="gantt-month"
              style={{ width: `${month.days * 40}px` }}
            >
              {month.name}
            </div>
          ))}
        </div>
        <div className="gantt-days">
          {dates.map(date => (
            <div
              key={date.toISOString()}
              className={`gantt-day ${
                format(date, 'iii') === 'Sat' || format(date, 'iii') === 'Sun'
                  ? 'weekend'
                  : ''
              }`}
            >
              {format(date, 'd')}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGrid = () => {
    const dates = generateDates();
    return (
      <div className="gantt-grid">
        {dates.map(date => (
          <div
            key={date.toISOString()}
            className={`gantt-grid-column ${
              format(date, 'iii') === 'Sat' || format(date, 'iii') === 'Sun'
                ? 'weekend'
                : ''
            }`}
          />
        ))}
      </div>
    );
  };

  const renderTasks = () => {
    const firstDate = startDate;
    
    // Group features by release
    const featuresByRelease = {};
    features.forEach(feature => {
      const releaseId = feature.release_id || 'unassigned';
      if (!featuresByRelease[releaseId]) {
        featuresByRelease[releaseId] = [];
      }
      featuresByRelease[releaseId].push(feature);
    });
    
    return (
      <div className="gantt-tasks">
        {Object.entries(featuresByRelease).map(([releaseId, releaseFeatures]) => {
          const release = releases.find(r => r.id === Number(releaseId)) || { 
            name: 'Unassigned', 
            start_date: null, 
            end_date: null 
          };
          
          return (
            <div key={releaseId} className="gantt-swimlane">
              <div className="swimlane-header">
                <div className="swimlane-title">{release.name}</div>
                {release.start_date && release.end_date && (
                  <div className="swimlane-dates">
                    {format(new Date(release.start_date), 'MMM d')} - {format(new Date(release.end_date), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
              
              {releaseFeatures.map(feature => {
                const startDiff = feature.startDate ? differenceInDays(feature.startDate, firstDate) : 0;
                const duration = feature.startDate && feature.endDate ? 
                  differenceInDays(feature.endDate, feature.startDate) + 1 : 
                  1;
                
                return (
                  <div 
                    key={feature.id}
                    data-feature-id={feature.id}
                    className="gantt-task"
                    style={{
                      left: `${startDiff * 40}px`,
                      width: `${duration * 40}px`,
                      backgroundColor: feature.color
                    }}
                    onMouseEnter={() => setHoveredTask(feature)}
                    onMouseLeave={() => setHoveredTask(null)}
                  >
                    {feature.icon && (
                      <span className="task-icon">
                        {typeIcons[feature.type] || '📋'}
                      </span>
                    )}
                    {feature.avatar && (
                      <div className="task-avatar">
                        <img src={feature.avatar} alt={`${feature.title} assignee`} />
                      </div>
                    )}
                    <div className="task-title">{feature.title}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
        
        <svg className="gantt-dependency-lines">
        </svg>
        
        {hoveredTask && (
          <div 
            className="gantt-tooltip visible"
            style={{
              left: `${hoveredTask.left}px`,
              top: `${hoveredTask.top}px`
            }}
          >
            <div className="tooltip-title">{hoveredTask.title}</div>
            <div className="tooltip-dates">
              {hoveredTask.startDate && hoveredTask.endDate ? (
                <>
                  {format(hoveredTask.startDate, 'MMM d')} - {format(hoveredTask.endDate, 'MMM d, yyyy')}
                </>
              ) : (
                'No dates assigned'
              )}
            </div>
            <div 
              className="tooltip-status"
              style={{ backgroundColor: statusColors[hoveredTask.status] }}
            >
              {hoveredTask.status}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <Paper className="enhanced-gantt-view">
      <div className="gantt-controls">
        <FormControlLabel
          control={
            <Switch
              checked={useSampleDependencies}
              onChange={(e) => setUseSampleDependencies(e.target.checked)}
              color="primary"
            />
          }
          label="Show sample dependencies"
        />
      </div>
      <div className="gantt-container" ref={ganttRef}>
        {renderHeader()}
        <div className="gantt-body">
          {renderGrid()}
          {renderTasks()}
        </div>
      </div>
      
      <div className="gantt-legend">
        <h3>Legend</h3>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#e84393' }}></div>
          <span>Blocked</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#8c7ae6' }}></div>
          <span>Backlog</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#4cd137' }}></div>
          <span>Completed</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#fdcb6e' }}></div>
          <span>In Review</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#00b894' }}></div>
          <span>In Progress</span>
        </div>
      </div>
    </Paper>
  );
};

export default EnhancedGanttView;