const User = require("../models/userModel");

// Search for users by username
module.exports.searchUsers = async (req, res, next) => {
  try {
    const { username } = req.query;
    const currentUserId = req.params.id;
    
    // Find users whose usernames contain the search string (case-insensitive)
    // Exclude the current user from results
    const users = await User.find({
      username: { $regex: username, $options: "i" },
      _id: { $ne: currentUserId }
    }).select("username avatarImage _id");
    
    // Get current user to check relationships
    const currentUser = await User.findById(currentUserId);
    
    // Add relationship status to each user
    const usersWithStatus = users.map(user => {
      let status = "none";
      
      // Check if users are friends
      if (currentUser.friends.includes(user._id)) {
        status = "friend";
      } 
      // Check if current user sent a request to this user
      else if (currentUser.friendRequests.sent.includes(user._id)) {
        status = "requested";
      } 
      // Check if this user sent a request to current user
      else if (currentUser.friendRequests.received.includes(user._id)) {
        status = "pending";
      }
      
      return {
        _id: user._id,
        username: user.username,
        avatarImage: user.avatarImage,
        status
      };
    });
    
    return res.json(usersWithStatus);
  } catch (ex) {
    next(ex);
  }
};

// Send a friend request
module.exports.sendFriendRequest = async (req, res, next) => {
  try {
    const { userId } = req.body; // ID of user to send request to
    const senderId = req.params.id; // Current user ID
    
    // Check if users exist
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(userId)
    ]);
    
    if (!sender || !receiver) {
      return res.json({ status: false, msg: "User not found" });
    }
    
    // Check if they're already friends
    if (sender.friends.includes(userId)) {
      return res.json({ status: false, msg: "Already friends with this user" });
    }
    
    // Check if request already sent
    if (sender.friendRequests.sent.includes(userId)) {
      return res.json({ status: false, msg: "Friend request already sent" });
    }
    
    // Check if there's a pending request from the other user
    if (sender.friendRequests.received.includes(userId)) {
      return res.json({ status: false, msg: "User already sent you a request. Check your pending requests." });
    }
    
    // Add to sender's sent requests
    sender.friendRequests.sent.push(userId);
    await sender.save();
    
    // Add to receiver's received requests
    receiver.friendRequests.received.push(senderId);
    await receiver.save();
    
    return res.json({ status: true, msg: "Friend request sent successfully" });
  } catch (ex) {
    next(ex);
  }
};

// Accept a friend request
module.exports.acceptFriendRequest = async (req, res, next) => {
  try {
    const { userId } = req.body; // ID of user who sent the request
    const currentUserId = req.params.id; // Current user ID
    
    // Check if users exist
    const [currentUser, requester] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);
    
    if (!currentUser || !requester) {
      return res.json({ status: false, msg: "User not found" });
    }
    
    // Check if request exists
    if (!currentUser.friendRequests.received.includes(userId)) {
      return res.json({ status: false, msg: "No friend request from this user" });
    }
    
    // Add each user to the other's friends list
    currentUser.friends.push(userId);
    requester.friends.push(currentUserId);
    
    // Remove request from both users
    currentUser.friendRequests.received = currentUser.friendRequests.received
      .filter(id => id.toString() !== userId.toString());
      
    requester.friendRequests.sent = requester.friendRequests.sent
      .filter(id => id.toString() !== currentUserId.toString());
    
    // Save both users
    await Promise.all([currentUser.save(), requester.save()]);
    
    return res.json({ 
      status: true, 
      msg: "Friend request accepted", 
      user: {
        _id: requester._id,
        username: requester.username,
        avatarImage: requester.avatarImage
      }
    });
  } catch (ex) {
    next(ex);
  }
};

// Reject a friend request
module.exports.rejectFriendRequest = async (req, res, next) => {
  try {
    const { userId } = req.body; // ID of user who sent the request
    const currentUserId = req.params.id; // Current user ID
    
    // Check if users exist
    const [currentUser, requester] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);
    
    if (!currentUser || !requester) {
      return res.json({ status: false, msg: "User not found" });
    }
    
    // Remove request from both users
    currentUser.friendRequests.received = currentUser.friendRequests.received
      .filter(id => id.toString() !== userId.toString());
      
    requester.friendRequests.sent = requester.friendRequests.sent
      .filter(id => id.toString() !== currentUserId.toString());
    
    // Save both users
    await Promise.all([currentUser.save(), requester.save()]);
    
    return res.json({ status: true, msg: "Friend request rejected" });
  } catch (ex) {
    next(ex);
  }
};

// Cancel a sent friend request
module.exports.cancelFriendRequest = async (req, res, next) => {
  try {
    const { userId } = req.body; // ID of user the request was sent to
    const currentUserId = req.params.id; // Current user ID
    
    // Check if users exist
    const [currentUser, receiver] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);
    
    if (!currentUser || !receiver) {
      return res.json({ status: false, msg: "User not found" });
    }
    
    // Remove request from both users
    currentUser.friendRequests.sent = currentUser.friendRequests.sent
      .filter(id => id.toString() !== userId.toString());
      
    receiver.friendRequests.received = receiver.friendRequests.received
      .filter(id => id.toString() !== currentUserId.toString());
    
    // Save both users
    await Promise.all([currentUser.save(), receiver.save()]);
    
    return res.json({ status: true, msg: "Friend request canceled" });
  } catch (ex) {
    next(ex);
  }
};

// Remove a friend
module.exports.removeFriend = async (req, res, next) => {
  try {
    const { userId } = req.body; // ID of friend to remove
    const currentUserId = req.params.id; // Current user ID
    
    // Check if users exist
    const [currentUser, friend] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);
    
    if (!currentUser || !friend) {
      return res.json({ status: false, msg: "User not found" });
    }
    
    // Remove from each other's friends list
    currentUser.friends = currentUser.friends
      .filter(id => id.toString() !== userId.toString());
      
    friend.friends = friend.friends
      .filter(id => id.toString() !== currentUserId.toString());
    
    // Save both users
    await Promise.all([currentUser.save(), friend.save()]);
    
    return res.json({ status: true, msg: "Friend removed successfully" });
  } catch (ex) {
    next(ex);
  }
};

// Get all friend requests (received)
module.exports.getFriendRequests = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId)
      .populate("friendRequests.received", "username avatarImage _id");
    
    if (!user) {
      return res.json({ status: false, msg: "User not found" });
    }
    
    return res.json({ 
      status: true, 
      requests: user.friendRequests.received 
    });
  } catch (ex) {
    next(ex);
  }
};

// Get all friends
module.exports.getFriends = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId)
      .populate("friends", "email username avatarImage _id");
    
    if (!user) {
      return res.json({ status: false, msg: "User not found" });
    }
    
    return res.json(user.friends);
  } catch (ex) {
    next(ex);
  }
};