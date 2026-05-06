import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const initialFormState = {
  branchName: "",
  location: "",
  managerName: ""
};

function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] =
    useState(initialFormState);

  const [editingId, setEditingId] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const fetchBranches = async () => {
    setLoading(true);

    try {
      const response = await api.get("/branches");

      setBranches(response.data || []);
    } catch (error) {
      console.error(
        "Failed to fetch branches:",
        error
      );

      alert("Failed to fetch branches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const filteredBranches = useMemo(() => {
    if (!searchTerm.trim()) return branches;

    const query = searchTerm.toLowerCase();

    return branches.filter((branch) => {
      return (
        branch.branchName
          ?.toLowerCase()
          .includes(query) ||
        branch.location
          ?.toLowerCase()
          .includes(query) ||
        branch.managerName
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [branches, searchTerm]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);

    try {
      if (editingId) {
        await api.put(
          `/branches/${editingId}`,
          formData
        );

        alert(
          "Branch updated successfully."
        );
      } else {
        await api.post(
          "/branches",
          formData
        );

        alert(
          "Branch added successfully."
        );
      }

      resetForm();

      await fetchBranches();
    } catch (error) {
      console.error(
        "Failed to save branch:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to save branch."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (branch) => {
    setFormData({
      branchName:
        branch.branchName || "",
      location:
        branch.location || "",
      managerName:
        branch.managerName || ""
    });

    setEditingId(branch._id);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this branch?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/branches/${id}`);

      if (editingId === id) {
        resetForm();
      }

      alert(
        "Branch deleted successfully."
      );

      await fetchBranches();
    } catch (error) {
      console.error(
        "Failed to delete branch:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to delete branch."
      );
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Master Data
          </p>

          <h1>Branch Management</h1>

          <p className="page-subtext">
            Maintain store locations,
            branch details, and manager
            information used across
            inventory, sales, and
            procurement.
          </p>
        </div>
      </div>

      <div className="form-card">
        <h2>
          {editingId
            ? "Edit Branch"
            : "Add Branch"}
        </h2>

        <form
          className="data-form"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            name="branchName"
            placeholder="Branch Name"
            value={formData.branchName}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="managerName"
            placeholder="Manager Name"
            value={formData.managerName}
            onChange={handleChange}
          />

          <div className="form-actions">
            <button
              type="submit"
              className="primary-btn"
              disabled={submitting}
            >
              {submitting
                ? editingId
                  ? "Updating..."
                  : "Adding..."
                : editingId
                ? "Update Branch"
                : "Add Branch"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-btn"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h2>Branch Directory</h2>

          <div className="table-filters">
            <input
              type="text"
              placeholder="Search branch, location, manager..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
            />

            {searchTerm && (
              <button
                type="button"
                className="secondary-btn"
                onClick={clearFilters}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loader-wrap">
            <div className="loader"></div>
          </div>
        ) : filteredBranches.length ===
          0 ? (
          <p className="empty-state">
            No branches match your current
            search.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Location</th>
                <th>Manager</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredBranches.map(
                (branch) => (
                  <tr key={branch._id}>
                    <td>
                      {branch.branchName}
                    </td>

                    <td>
                      {branch.location}
                    </td>

                    <td>
                      {branch.managerName ||
                        "Not assigned"}
                    </td>

                    <td>
                      {branch.createdAt
                        ? new Date(
                            branch.createdAt
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() =>
                            handleEdit(
                              branch
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() =>
                            handleDelete(
                              branch._id
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Branches;