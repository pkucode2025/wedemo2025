import express from 'express';
import cors from 'cors';

// Import handlers
import loginHandler from './routes/auth/login.js';
import meHandler from './routes/auth/me.js';
import registerHandler from './routes/auth/register.js';
import resetPasswordHandler from './routes/auth/reset-password.js';
import chatsHandler from './routes/chats.js';
import chatsClearHandler from './routes/chats/clear.js';
import chatsMarkReadHandler from './routes/chats/mark-read.js';
import chatsSettingsHandler from './routes/chats/settings.js';
import friendsIndexHandler from './routes/friends/index.js';
import friendsAcceptHandler from './routes/friends/accept.js';
import friendsDeleteHandler from './routes/friends/delete.js';
import friendsRequestHandler from './routes/friends/request.js';
import friendsRequestsHandler from './routes/friends/requests.js';
import messagesHandler from './routes/messages.js';
import messagesRecallHandler from './routes/messages/recall.js';
import momentsIndexHandler from './routes/moments/index.js';
import momentsCommentHandler from './routes/moments/comment.js';
import momentsLikeHandler from './routes/moments/like.js';
import usersSearchHandler from './routes/users/search.js';
import usersIdHandler from './routes/users/[userId].js';
import setupHandler from './routes/setup.js';

const app = express();

app.use(cors());
app.use(express.json());

// Helper to wrap async handlers
const wrap = (handler) => (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
};

// Auth
app.all('/api/auth/login', wrap(loginHandler));
app.all('/api/auth/me', wrap(meHandler));
app.all('/api/auth/register', wrap(registerHandler));
app.all('/api/auth/reset-password', wrap(resetPasswordHandler));

// Chats
app.all('/api/chats', wrap(chatsHandler));
app.all('/api/chats/clear', wrap(chatsClearHandler));
app.all('/api/chats/mark-read', wrap(chatsMarkReadHandler));
app.all('/api/chats/settings', wrap(chatsSettingsHandler));

// Friends
app.all('/api/friends', wrap(friendsIndexHandler));
app.all('/api/friends/accept', wrap(friendsAcceptHandler));
app.all('/api/friends/delete', wrap(friendsDeleteHandler));
app.all('/api/friends/request', wrap(friendsRequestHandler));
app.all('/api/friends/requests', wrap(friendsRequestsHandler));

// Messages
app.all('/api/messages', wrap(messagesHandler));
app.all('/api/messages/recall', wrap(messagesRecallHandler));

// Moments
app.all('/api/moments', wrap(momentsIndexHandler));
app.all('/api/moments/comment', wrap(momentsCommentHandler));
app.all('/api/moments/like', wrap(momentsLikeHandler));

// Users
app.all('/api/users/search', wrap(usersSearchHandler));
app.all('/api/users/:userId', (req, res, next) => {
    req.query.userId = req.params.userId;
    return wrap(usersIdHandler)(req, res, next);
});

// Setup
app.all('/api/setup', wrap(setupHandler));

export default app;
