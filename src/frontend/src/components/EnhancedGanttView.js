import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const [startDate] = useState(startOfWeek(new Date()));
  const [endDate] = useState(addWeeks(startOfWeek(new Date()), 4));
  const [hoveredTask, setHoveredTask] = useState(null);
  const [useSampleDependencies, setUseSampleDependencies] = useState(false);
  const ganttRef = useRef(null);

  const statusColors = useMemo(() => ({
    backlog: '#8c7ae6',
    in_progress: '#00b894',
    completed: '#4cd137',
    blocked: '#e84393',
    review: '#fdcb6e',
  }), []);

  const typeIcons = useMemo(() => ({
    bug: '🐛',
    feature: '✨',
    improvement: '⚡',
    documentation: '📝',
    security: '🔒'
  }), []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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
        
        // Create sample dependencies if enabled
        let dependencyArray = [];
        if (useSampleDependencies) {
          // Create sample dependencies between consecutive features
          for (let i = 0; i < featuresData.length - 1; i++) {
            if (featuresData[i].startDate && featuresData[i].endDate && 
                featuresData[i + 1].startDate && featuresData[i + 1].endDate) {
              dependencyArray.push({
                id: `${featuresData[i].id}-${featuresData[i + 1].id}`,
                predecessorId: featuresData[i].id,
                successorId: featuresData[i + 1].id
              });
            }
          }
        } else {
          // Use real dependencies from the features data
          featuresData.forEach(feature => {
            if (feature.dependencies && Array.isArray(feature.dependencies)) {
              feature.dependencies.forEach(depId => {
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
        }

        console.log('Dependencies:', dependencyArray); // Debug log
        
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
  }, [useSampleDependencies, statusColors]);

  const drawDependencyLines = () => {
    if (!ganttRef.current) return;

    const svg = ganttRef.current.querySelector('.gantt-dependency-lines');
    if (!svg) return;

    // Clear existing lines
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    dependencies.forEach((dep) => {
      const predecessor = features.find(f => f.id === dep.predecessorId);
      const successor = features.find(f => f.id === dep.successorId);

      if (!predecessor || !successor) return;

      const predBar = document.querySelector(`[data-feature-id="${predecessor.id}"]`);
      const succBar = document.querySelector(`[data-feature-id="${successor.id}"]`);

      if (!predBar || !succBar) return;

      const predRect = predBar.getBoundingClientRect();
      const succRect = succBar.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();

      // Calculate connection points
      const startX = predRect.right - svgRect.left;
      const startY = predRect.top + (predRect.height / 2) - svgRect.top;
      const endX = succRect.left - svgRect.left;
      const endY = succRect.top + (succRect.height / 2) - svgRect.top;

      // Create group for the dependency
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'dependency-group');

      // Calculate the path with a gentle curve
      const horizontalDistance = endX - startX;
      const curveOffset = Math.min(Math.abs(horizontalDistance) * 0.2, 30);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      
      // Create a subtle curved path
      const pathD = `
        M ${startX},${startY}
        C ${startX + curveOffset},${startY}
          ${endX - curveOffset},${endY}
          ${endX},${endY}
      `;
      
      path.setAttribute('d', pathD);
      path.setAttribute('class', 'dependency-line');

      group.appendChild(path);
      svg.appendChild(group);
    });
  };

  useEffect(() => {
    if (!loading && features.length > 0) {
      console.log('Redrawing dependencies...'); // Debug log
      requestAnimationFrame(() => {
        drawDependencyLines();
      });
    }
  }, [loading, features, dependencies]);

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
          {/* Dependencies will be drawn here */}
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
    <Paper className="enhanced-gantt-view modern">
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