// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for animes
const Anime = require('../models/anime')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { anime: { title: '', text: 'foo' } } -> { anime: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /animes
router.get('/animes', (req, res, next) => {
	Anime.find()
		.populate('owner')
		.then((animes) => {
			// `animes` will be an array of Mongoose documents
			// we want to convert each one to a POJO, so we use `.map` to
			// apply `.toObject` to each one
			return animes.map((anime) => anime.toObject())
		})
		// respond with status 200 and JSON of the examples
		.then((animes) => res.status(200).json({ animes: animes }))
		// if an error occurs, pass it to the handler
		.catch(next)
})	

//SHOW
//GET /animes/6244858502aa548fd4fa911e
router.get('/animes/:id', (req,res,next) => {
    //we'll get the id from the req.params.d -> :id
	Anime.findById(req.params.id)
	.populate('owner')
		.then(handle404)
        //if successful, respond with an object as json
		.then(anime => res.status(200).json({ anime: anime.toObject() }))
		//error handler
		.catch(next)
})

// CREATE
// POST /animes
router.post('/animes', requireToken, (req, res, next) => {
	// set owner of new example to be current user
	req.body.anime.owner = req.user.id

	Anime.create(req.body.anime)
		// respond to succesful `create` with status 201 and JSON of new "example"
		.then((anime) => {
			res.status(201).json({ anime: anime.toObject() })
		})
		// if an error occurs, pass it off to our error handler
		// the error handler needs the error message and the `res` object so that it
		// can send an error message back to the client
		.catch(next)
})


//UPDATE
//PATCH /animes/6244858502aa548fd4fa911e
router.patch('/animes/:id', requireToken, removeBlanks, (req,res,next) => {
    //if the client attempts to change owner of the anime, we can disallow that
	delete req.body.owner
	//find anime by Id
	Anime.findById(req.params.id)
		.then(handle404)
    //require ownership and update the anime
		.then(anime => {
			requireOwnership(req, anime)
			return anime.updateOne(req.body.anime)
		})
		// if that succeeded, return 204 and no JSON
		.then(() => res.sendStatus(204))
		//error handler
		.catch(next)
})

//REMOVE
//Delete /animes/6244858502aa548fd4fa911e
router.delete('/animes/:id', requireToken, (req,res,next)=> {
	//find anime by id
	Anime.findById(req.params.id)
	//handle 404 if any
		.then(handle404)
	//need require ownership so only owner/user of it can delete the anime
		.then(anime=> {
			// requireOwnership needs two arguments
            // these are the req, and the document itself
			requireOwnership(req, anime)
            // delete if the middleware doesnt throw an error
			anime.deleteOne()
		})
    // send back a 204 no content status
		.then(()=> res.sendStatus(204))
		.catch(next)
})

module.exports = router