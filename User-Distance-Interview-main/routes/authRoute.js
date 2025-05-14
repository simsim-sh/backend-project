const express = require("express");
const {
  registerUser,
  changeUserSatatus,
  getDistance,
  getUserListing,
} = require("../controller/auth");
const { authMiddleware } = require("../middleware/protected");
const router = express.Router();

router.post("/register", registerUser);
router.patch("/change-user-status", authMiddleware, changeUserSatatus);
router.get("/get-distance", authMiddleware, getDistance);
router.get("/get-user-listing", authMiddleware, authMiddleware, getUserListing);

module.exports = router;
