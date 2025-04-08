import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { format, addDays, differenceInDays, startOfWeek, addWeeks } from 'date-fns';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import * as d3 from 'd3';
import { colors } from '../styles/theme';
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
  const [showDependencies, setShowDependencies] = useState(false);
  const [dependencyTooltip, setDependencyTooltip] = useState(null);
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

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'not started':
        return colors.greyLight;
      case 'in progress':
        return colors.primary;
      case 'completed':
        return colors.secondary;
      case 'blocked':
        return colors.grey;
      default:
        return colors.greyLight;
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return { stroke: colors.primary, strokeWidth: 2 };
      case 'medium':
        return { stroke: colors.secondary, strokeWidth: 1.5 };
      case 'low':
        return { stroke: colors.grey, strokeWidth: 1 };
      default:
        return { stroke: colors.grey, strokeWidth: 1 };
    }
  };

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
          color: statusColors[feature.status] || '#a5b1c2',
          dependencies: Array.isArray(feature.dependencies) ? feature.dependencies : []
        }));
        
        let dependencyArray = [];
        
        if (showDependencies) {
          // Use real dependencies from the database
          featuresData.forEach(feature => {
            if (feature.dependencies && feature.dependencies.length > 0) {
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

        console.log('Dependencies:', dependencyArray);
        
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
  }, [showDependencies, statusColors]);

  const handleDependencyMouseEnter = (e, predecessor, successor) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    setDependencyTooltip({
      predecessor,
      successor,
      x: mouseX,
      y: mouseY - 40 // Position above the cursor
    });
  };

  const handleDependencyMouseLeave = () => {
    setDependencyTooltip(null);
  };

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
      group.addEventListener('mouseenter', (e) => handleDependencyMouseEnter(e, predecessor, successor));
      group.addEventListener('mouseleave', handleDependencyMouseLeave);

      // Create a path with right angles
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      
      // Calculate the path with right angles that avoids overlapping
      const dx = endX - startX;
      const dy = endY - startY;
      
      let pathD;
      
      if (dy === 0) {
        // If on same level, just draw a horizontal line with a small vertical offset
        const verticalOffset = predRect.height * 0.75;
        pathD = `
          M ${startX},${startY}
          h 10
          V ${startY + verticalOffset}
          H ${endX - 10}
          V ${endY}
          H ${endX}
        `;
      } else {
        // Calculate the midpoint for vertical movement
        const midX = startX + 20; // Fixed horizontal offset from predecessor
        
        // Determine if we need to route above or below the bars
        const routeAbove = endY < startY;
        const verticalOffset = routeAbove ? -15 : 15; // Offset from the bars
        
        pathD = `
          M ${startX},${startY}
          h 10
          V ${startY + verticalOffset}
          H ${endX - 10}
          V ${endY}
          H ${endX}
        `;
      }
      
      path.setAttribute('d', pathD);
      path.setAttribute('class', 'dependency-line');

      // Add endpoint circles
      const startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      startCircle.setAttribute('cx', startX);
      startCircle.setAttribute('cy', startY);

      const endCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      endCircle.setAttribute('cx', endX);
      endCircle.setAttribute('cy', endY);

      // Add elements to group
      group.appendChild(path);
      group.appendChild(startCircle);
      group.appendChild(endCircle);

      // Add title for tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${predecessor.title} → ${successor.title}`;
      group.appendChild(title);

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
              checked={showDependencies}
              onChange={(e) => setShowDependencies(e.target.checked)}
              color="primary"
            />
          }
          label="Show Dependencies"
        />
      </div>
      <div className="gantt-container" ref={ganttRef}>
        {renderHeader()}
        <div className="gantt-body">
          {renderGrid()}
          {renderTasks()}
        </div>
      </div>
      
      {dependencyTooltip && (
        <div 
          className="dependency-tooltip"
          style={{
            left: dependencyTooltip.x,
            top: dependencyTooltip.y
          }}
        >
          <span className="feature-name">{dependencyTooltip.predecessor.title}</span>
          <span className="arrow">→</span>
          <span className="feature-name">{dependencyTooltip.successor.title}</span>
        </div>
      )}

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
          <div className="legend-color" style={{ backgroundColor: '#00b894' }}></div>
          <span>In Progress</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#fdcb6e' }}></div>
          <span>In Review</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#4cd137' }}></div>
          <span>Completed</span>
        </div>
      </div>
    </Paper>
  );
};

export default EnhancedGanttView;