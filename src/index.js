require('dotenv').config();

const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const app = express();

app.use(cors())

app.use(express.json({limit: '300mb'}))

app.use(routes)

app.listen(process.env.PORT || 3003, () => {
    console.log(`Server On`)
}); 