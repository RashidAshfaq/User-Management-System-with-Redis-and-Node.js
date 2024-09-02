const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const redis = require('redis');

// Create a Redis Client
const client = redis.createClient({
    host: '127.0.0.1',
    port: 6379,
});

client.on('connect', function () {
    console.log('Connected to Redis!');
});

client.on('error', function (err) {
    console.error('Redis connection error:', err);
});

// Ensure Redis connection is established before continuing
(async () => {
    await client.connect();
})();

// Set port
const port = 3000;

// Init app
const app = express();

// View Engine 
app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// MethodOverride
app.use(methodOverride('_method'));

// Search for a user by ID
app.post('/user/search', async (req, res, next) => {
    let id = req.body.id;

    try {
        const obj = await client.hGetAll(id);
        if (!obj || Object.keys(obj).length === 0) {
            res.render('searchUsers', {
                error: 'User does not exist.'
            });
        } else {
            obj.id = id;
            res.render('details', {
                user: obj
            });
        }
    } catch (err) {
        console.error(err);
        res.render('searchUsers', {
            error: 'Error fetching user.'
        });
    }
});

// home page
app.get('/', function (req, res, next) {
    res.render('searchUsers');
});

// Add user page
app.get('/users/add', function (req, res, next) {
    res.render('adduser');
});

app.post('/users/add', async function (req, res, next) {
    let { id, firstName, lastName, email, phone } = req.body;

    try {
        await client.hSet(id, {
            'first_name': firstName,
            'last_name': lastName,
            'email': email,
            'phone': phone
        });
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.render('adduser', {
            error: 'Error adding user.'
        });
    }
});

// Delete a user by ID
app.delete('/user/delete/:id', async function (req, res, next) {
    let id = req.params.id;

    try {
        await client.del(id);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.render('details', {
            error: 'Error deleting user.'
        });
    }
});


// for update user 
app.get('/user/edit/:id', async function (req, res, next) {
    let id = req.params.id;

    try {
        const obj = await client.hGetAll(id);
        if (!obj || Object.keys(obj).length === 0) {
            res.render('searchUsers', {
                error: 'User does not exist.'
            });
        } else {
            obj.id = id;
            res.render('editUser', {
                user: obj
            });
        }
    } catch (err) {
        console.error(err);
        res.render('searchUsers', {
            error: 'Error fetching user data.'
        });
    }
});

app.post('/user/update/:id', async function (req, res, next) {
    let id = req.params.id;
    let { firstName, lastName, email, phone } = req.body;

    try {
        await client.hSet(id, {
            'first_name': firstName,
            'last_name': lastName,
            'email': email,
            'phone': phone
        });
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.render('editUser', {
            user: { id, first_name: firstName, last_name: lastName, email, phone },
            error: 'Error updating user.'
        });
    }
});


app.listen(port, () => {
    console.log('Server listening on port:', port);
});
