const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const componentRoutes = require('./routes/components');
const contentRoutes = require('./routes/content');
const notificationRoutes = require('./routes/notifications');
const leadRoutes = require('./routes/leads');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leads', leadRoutes); 