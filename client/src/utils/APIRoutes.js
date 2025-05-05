// Example file for your APIRoutes.js
export const host = process.env.REACT_APP_API_URL

// Auth routes
export const registerRoute = `${host}/api/auth/register`
export const loginRoute = `${host}/api/auth/login`
export const setAvatarRoute = `${host}/api/auth/setAvatar`
export const allUsersRoute = `${host}/api/auth/allusers`
export const logoutRoute = `${host}/api/auth/logout`

// Message routes
export const sendMessageRoute = `${host}/api/messages/addmsg`
export const getMessagesRoute = `${host}/api/messages/getmsg`
export const markMessagesReadRoute = `${host}/api/messages/markread`
export const addReactionRoute = `${host}/api/messages/reaction`
export const replyToMessageRoute = `${host}/api/messages/reply`

// Friend routes
export const searchUsers = `${host}/api/friends/search`
export const sendFriendRequest = `${host}/api/friends/request`
export const acceptFriendRequest = `${host}/api/friends/accept`
export const rejectFriendRequest = `${host}/api/friends/reject`
export const cancelFriendRequest = `${host}/api/friends/cancel`
export const removeFriend = `${host}/api/friends/remove`
export const getFriendRequests = `${host}/api/friends/requests`
export const getFriends = `${host}/api/friends/all`

// Group routes
export const createGroupRoute = `${host}/api/groups/create`
export const getGroupsRoute = `${host}/api/groups/all`
export const getGroupMessagesRoute = `${host}/api/groups/messages`
export const sendGroupMessageRoute = `${host}/api/groups/message`
export const addGroupMemberRoute = `${host}/api/groups/add-member`
export const removeGroupMemberRoute = `${host}/api/groups/remove-member`
export const leaveGroupRoute = `${host}/api/groups/leave`
