import React from 'react';
import { NavLink } from 'react-router-dom-v6';

export function Sidebar(): JSX.Element {
  return (
    <aside className="sidebar">
      <div>
        <p className="eyebrow">agent-mux</p>
        <h1>Planning control room</h1>
      </div>
      <nav className="nav-stack">
        <NavLink to="/projects">Projects</NavLink>
        <NavLink to="/runs">Runs</NavLink>
        <NavLink to="/agents">Agents</NavLink>
        <NavLink to="/sessions">Sessions</NavLink>
        <NavLink to="/sessions/new">New session</NavLink>
        <NavLink to="/workspaces">Workspaces</NavLink>
        <NavLink to="/inbox">Hook inbox</NavLink>
        <NavLink to="/automations">Automations</NavLink>
        <NavLink to="/pair-device">Pair device</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
    </aside>
  );
}
