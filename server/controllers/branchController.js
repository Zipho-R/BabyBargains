const Branch = require("../models/Branch");

const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ createdAt: -1 });
    res.status(200).json(branches);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch branches", error: error.message });
  }
};

const getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.status(200).json(branch);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch branch", error: error.message });
  }
};

const createBranch = async (req, res) => {
  try {
    const { branchName, location, managerName } = req.body;

    const branch = await Branch.create({
      branchName,
      location,
      managerName
    });

    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ message: "Failed to create branch", error: error.message });
  }
};

const updateBranch = async (req, res) => {
  try {
    const { branchName, location, managerName } = req.body;

    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    branch.branchName = branchName ?? branch.branchName;
    branch.location = location ?? branch.location;
    branch.managerName = managerName ?? branch.managerName;

    const updatedBranch = await branch.save();
    res.status(200).json(updatedBranch);
  } catch (error) {
    res.status(500).json({ message: "Failed to update branch", error: error.message });
  }
};

const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    await branch.deleteOne();
    res.status(200).json({ message: "Branch deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete branch", error: error.message });
  }
};

module.exports = {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch
};