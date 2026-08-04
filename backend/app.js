const express = require('express');
const mongoose = require('mongoose');
const app = express();


// Middleware
app.use(express.json());

module.exports ={
    User: require('./schemas/users_schema'),
    Hardware: require('./schemas/hardware_schema'),
    Io: require('./schemas/IO_schema'),
    Project: require('./schemas/projects_schema')
}
// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/selection_tool_DB')
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

