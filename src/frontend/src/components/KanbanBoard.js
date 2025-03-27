import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/KanbanBoard.css';

const KanbanBoard = () => {
  const [board, setBoard] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [boardsRes, featuresRes] = await Promise.all([
          axios.get('http://localhost:5001/api/boards'),
          axios.get('http://localhost:5001/api/features')
        ]);
        
        // Use the first board (default board)
        setBoard(boardsRes.data[0]);
        setFeatures(featuresRes.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch Kanban board data. Please try again later.');
        setLoading(false);
        console.error('Kanban board fetch error:', err);
      }
    };

    fetchData();
  }, []);

  // Group features by status
  const getFeaturesByStatus = () => {
    const featuresByStatus = {};
    
    if (board && board.columns) {
      // Initialize columns
      board.columns.forEach(column => {
        featuresByStatus[column.id] = [];
      });
      
      // Add features to their respective columns
      features.forEach(feature => {
        if (featuresByStatus[feature.status]) {
          featuresByStatus[feature.status].push(feature);
        } else {
          // If status doesn't match any column, put in backlog
          featuresByStatus['backlog'] = featuresByStatus['backlog'] || [];
          featuresByStatus['backlog'].push(feature);
        }
      });
    }
    
    return featuresByStatus;
  };

  // Handle drag end
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    // If dropped outside a droppable area
    if (!destination) return;
    
    // If dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    // Find the feature that was dragged
    const featureId = parseInt(draggableId.split('-')[1]);
    const feature = features.find(f => f.id === featureId);
    
    if (!feature) return;
    
    try {
      // Update feature status
      await axios.patch(`http://localhost:5001/api/features/${featureId}/status`, {
        status: destination.droppableId
      });
      
      // Update local state
      setFeatures(features.map(f => 
        f.id === featureId ? { ...f, status: destination.droppableId } : f
      ));
    } catch (err) {
      console.error('Error updating feature status:', err);
      setError('Failed to update feature status. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading Kanban board data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!board) {
    return <div className="error-message">No board configuration found.</div>;
  }

  const featuresByStatus = getFeaturesByStatus();

  return (
    <div className="kanban-board">
      <h1 className="page-title">Kanban Board</h1>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board-columns">
          {board.columns.map(column => (
            <div key={column.id} className="board-column">
              <div className="column-header">
                <h2 className="column-title">{column.name}</h2>
                <span className="feature-count">{featuresByStatus[column.id].length}</span>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    className={`column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {featuresByStatus[column.id].map((feature, index) => (
                      <Draggable
                        key={`feature-${feature.id}`}
                        draggableId={`feature-${feature.id}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            className={`feature-card ${snapshot.isDragging ? 'dragging' : ''}`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <div className="feature-header">
                              <span className={`priority-indicator priority-${feature.priority}`}></span>
                              <Link to={`/features/edit/${feature.id}`} className="feature-title">
                                {feature.title}
                              </Link>
                            </div>
                            
                            {feature.description && (
                              <div className="feature-description">
                                {feature.description.length > 100
                                  ? `${feature.description.substring(0, 100)}...`
                                  : feature.description}
                              </div>
                            )}
                            
                            <div className="feature-meta">
                              {feature.start_date && feature.end_date && (
                                <div className="feature-dates">
                                  {new Date(feature.start_date).toLocaleDateString()} - {new Date(feature.end_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {featuresByStatus[column.id].length === 0 && (
                      <div className="empty-column">
                        <p>No features</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
              
              {column.id === 'backlog' && (
                <div className="column-footer">
                  <Link to="/features/new" className="add-feature-btn">
                    + Add Feature
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
