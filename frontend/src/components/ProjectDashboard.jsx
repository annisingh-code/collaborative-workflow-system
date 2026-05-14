import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import api from '../utils/api';

const ProjectDashboard = () => {
  const [projects, setProjects] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [creatingProject, setCreatingProject] =
    useState(false);

  const [joiningProject, setJoiningProject] =
    useState(false);

  const [newProjectName, setNewProjectName] =
    useState('');

  const [
    inviteTokenInput,
    setInviteTokenInput
  ] = useState('');

  const navigate = useNavigate();

  // Fetch all accessible projects
  const fetchProjects = async () => {
    try {
      const { data } = await api.get(
        '/projects'
      );

      setProjects(data);
    } catch (error) {
      if (
        error.response?.status === 401
      ) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Create new project
  const handleCreateProject =
    async (e) => {
      e.preventDefault();

      if (!newProjectName.trim()) {
        return;
      }

      setCreatingProject(true);

      try {
        await api.post('/projects', {
          name: newProjectName
        });

        setNewProjectName('');

        fetchProjects();
      } catch (error) {
        alert(
          'Failed to create project'
        );
      } finally {
        setCreatingProject(false);
      }
    };

  // Join project using invite token
  const handleJoinProject =
    async (e) => {
      e.preventDefault();

      if (!inviteTokenInput.trim()) {
        return;
      }

      setJoiningProject(true);

      try {
        await api.post(
          '/projects/join',
          {
            inviteToken:
              inviteTokenInput
          }
        );

        setInviteTokenInput('');

        fetchProjects();

        alert(
          'Successfully joined project!'
        );
      } catch (error) {
        alert(
          error.response?.data
            ?.message ||
            'Invalid or expired token.'
        );
      } finally {
        setJoiningProject(false);
      }
    };

  // Generate invite token
  const handleGenerateInvite =
    async (e, projectId) => {
      e.stopPropagation();

      try {
        const { data } =
          await api.post(
            `/projects/${projectId}/invite`
          );

        await navigator.clipboard.writeText(
          data.inviteToken
        );

        alert(
          `Invite token copied to clipboard!\n\nToken expires in 30 minutes.\n\n${data.inviteToken}`
        );
      } catch (error) {
        alert(
          'Failed to generate invite. Only the owner can do this.'
        );
      }
    };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem(
      'token'
    );

    localStorage.removeItem(
      'user'
    );

    navigate('/');
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        Loading workspace...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '900px',
        margin: '0 auto',
        fontFamily: 'sans-serif'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center'
        }}
      >
        <h2>My Projects</h2>

        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <hr
        style={{
          marginBottom: '20px'
        }}
      />

      {/* Forms */}
      <div
        style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '20px'
        }}
      >
        {/* Create Project */}
        <div
          style={{
            flex: 1,
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            border:
              '1px solid #e0e0e0'
          }}
        >
          <h4
            style={{
              margin:
                '0 0 10px 0'
            }}
          >
            Create Project
          </h4>

          <form
            onSubmit={
              handleCreateProject
            }
            style={{
              display: 'flex',
              gap: '5px'
            }}
          >
            <input
              type="text"
              placeholder="Project Name"
              value={newProjectName}
              onChange={(e) =>
                setNewProjectName(
                  e.target.value
                )
              }
              style={{
                flex: 1,
                padding: '8px'
              }}
              required
            />

            <button
              type="submit"
              disabled={
                creatingProject
              }
              style={{
                padding: '8px 12px',
                background:
                  '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {creatingProject
                ? 'Creating...'
                : 'Create'}
            </button>
          </form>
        </div>

        {/* Join Project */}
        <div
          style={{
            flex: 1,
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            border:
              '1px solid #e0e0e0'
          }}
        >
          <h4
            style={{
              margin:
                '0 0 10px 0'
            }}
          >
            Join Project
          </h4>

          <form
            onSubmit={
              handleJoinProject
            }
            style={{
              display: 'flex',
              gap: '5px'
            }}
          >
            <input
              type="text"
              placeholder="Paste Invite Token"
              value={
                inviteTokenInput
              }
              onChange={(e) =>
                setInviteTokenInput(
                  e.target.value
                )
              }
              style={{
                flex: 1,
                padding: '8px'
              }}
              required
            />

            <button
              type="submit"
              disabled={
                joiningProject
              }
              style={{
                padding: '8px 12px',
                background:
                  '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {joiningProject
                ? 'Joining...'
                : 'Join'}
            </button>
          </form>
        </div>
      </div>

      {/* Project List */}
      <div
        style={{
          display: 'grid',
          gap: '15px'
        }}
      >
        {projects.length === 0 ? (
          <p>No projects found.</p>
        ) : (
          projects.map((project) => (
            <div
              key={project._id}
              onClick={() =>
                navigate(
                  `/projects/${project._id}`
                )
              }
              style={{
                border:
                  '1px solid #e0e0e0',
                padding: '20px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: '#fff',
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                transition:
                  '0.2s ease'
              }}
            >
              <div>
                <h3
                  style={{
                    margin:
                      '0 0 5px 0'
                  }}
                >
                  {project.name}
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: '#666',
                    fontSize: '14px'
                  }}
                >
                  Click to open
                  orchestration board
                  →
                </p>
              </div>

              {/* Invite Button */}
              <button
                onClick={(e) =>
                  handleGenerateInvite(
                    e,
                    project._id
                  )
                }
                style={{
                  padding:
                    '8px 12px',
                  background:
                    '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Generate Invite
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectDashboard;