const express = require("express");
const router = express.Router();

const {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch
} = require("../controllers/branchController");

router.route("/")
  .get(getBranches)
  .post(createBranch);

router.route("/:id")
  .get(getBranchById)
  .put(updateBranch)
  .delete(deleteBranch);

module.exports = router;