const router = require("express").Router();
const { 
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriendRequests,
  getFriends
} = require("../controllers/friendController");

router.get("/search/:id", searchUsers);
router.post("/request/:id", sendFriendRequest);
router.post("/accept/:id", acceptFriendRequest);
router.post("/reject/:id", rejectFriendRequest);
router.post("/cancel/:id", cancelFriendRequest);
router.post("/remove/:id", removeFriend);
router.get("/requests/:id", getFriendRequests);
router.get("/all/:id", getFriends);

module.exports = router;