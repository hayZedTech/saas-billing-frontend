import { useEffect, useState } from "react";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  const fetchProjects = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      setProjects(data);
    } catch {
      setError("Failed to fetch projects");
    }
  };

  const addProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      setProjects([data, ...projects]);
      setName("");
      setDescription("");
    } catch {
      setError("Failed to add project");
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Delete project?")) return;
    try {
      await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(projects.filter((p) => p.id !== id));
    } catch {
      setError("Failed to delete project");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Projects</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={addProject}>
        <input
          type="text"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Add Project</button>
      </form>

      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            <strong>{p.name}</strong> - {p.description}{" "}
            <button onClick={() => deleteProject(p.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
