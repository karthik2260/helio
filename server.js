const express = require('express')
const app = express()
const port = 7000;
const path = require('path')
const nodemailer = require('nodemailer');
const connectDB = require('./server/connection/connection')
const dotenv = require('dotenv')
const session = require('express-session')
const { v4: uuidv4 } = require('uuid')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')

const nocache = require('nocache')


dotenv.config({ path: 'config.env' })

connectDB()

app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser())
app.use(nocache())


//session create    
app.use(session({
    secret: uuidv4(),
    cookie: { maxAge: 3600000 },
    resave: false,
    saveUninitialized: true
}))


app.use(express.static(path.join(__dirname, '/assests/video')));
app.use('/assests', express.static(path.join(__dirname, 'assests')));
app.use('/css', express.static(path.resolve(__dirname, ("assests/css"))))
app.use('/uploads', express.static(path.join(__dirname, "uploads")));
app.use('/js', express.static(path.resolve(__dirname, "/assests/js")))
app.use('/', require('./server/routes/admin'));
app.use('/', require('./server/routes/user'))






app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}  `);
})


