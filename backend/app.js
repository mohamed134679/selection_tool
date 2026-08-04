const express = require('express');
const mongoose = require('mongoose');
const app = express();
const User = require('./schemas/users_schema');
const bcrypt = require('bcrypt');


// Middleware
app.use(express.json());;

module.exports ={
    User: require('./schemas/users_schema'),
    Hardware: require('./schemas/hardware_schema'),
    Io: require('./schemas/IO_schema'),
    Project: require('./schemas/projects_schema'),
    Hmi: require('./schemas/Hmi_schema')
}


// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/selection_tool_DB')
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

app.get('/login', (req, res) => {
    res.send('Login page - frontend pending');
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if(typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: 'Invalid input' });
    }
    const user = await User.findOne({username});
    if (user && await bcrypt.compare(password, user.password_hash)) {
        res.status(200).json({ message: 'Login successful' });
    }
    else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if(typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: 'Invalid input' });
    }
    const existingUser = await User.findOne({username});
    if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password_hash });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
});


const ioRoutes = require('./routes/io');
const hmiRoutes = require('./routes/hmi');
const projectRoutes = require('./routes/project');
const hardwareRoutes = require('./routes/hardware');
// Register routes

app.use('/io', ioRoutes);
app.use('/hmi', hmiRoutes);
app.use('/projects', projectRoutes);
app.use('/hardware', hardwareRoutes);
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

