const express = require("express")
const { handle404 } = require("../lib/custom-errors")
const { requireToken } = require("../config/auth")
const Practice = require("../models/practice")
const Student = require("../models/student")
const router = express.Router()

const scrubPracticeForUser = (practices) => {
    const responsePractices = []
    practices.forEach(practice => {
        const updatedPractice = {
            name: practice.name,
            style: practice.style,
            description: practice.description,
            sequence: practice.sequence,
            _id: practice._id
            }
        responsePractices.push(updatedPractice)
    })
    return responsePractices
}

//Index
//GET /practices
router.get("/practices", (req, res, next) => {
    Practice.find()
        .populate("sequence")
        .then(practices => {
            return practices.map(practice => practice)
        })
        .then(practices => {
            const responsePractices = scrubPracticeForUser(practices)
            res.status(200).json({ practices: responsePractices })
        })
        .catch(next)
})

//Practice by Id
//GET /practices/:id
router.get("/practices/:id", requireToken, (req, res, next) => {
    Practice.findById(req.params.id)
    .populate(["author", "sequence"])
    .then(handle404)
    .then(practice => {
            res.status(200).json({ practice: practice})
        })
    .catch(next)
})

//Index student's built practices
//GET /known
router.get("/built", requireToken, (req, res, next) => {
    Practice.find({ author: {$eq: req.user._id} })
    .then(handle404)
    .then(practices => {
        return practices.map(practice => practice)
    })
    .then(practices => {
        const responsePractices = scrubPracticeForUser(practices)
        res.status(200).json({ practices: responsePractices })
    })
    .catch(next)
})

//Create
//POST /practices
router.post("/practices", requireToken, (req, res, next) => {

    const practiceHolder = req.body.practice
    //give theh practice an author and assign it the user id
    practiceHolder.author = req.user._id
    
    Practice.create(practiceHolder)
        .then(practice => {
            res.status(201).json({ practice: practice }) //201: something was created on the server successfully
        })
        .catch(next)
})

//UPDATE
//PATCH /practices/:id
router.patch("/practices/:id", requireToken, (req, res, next) => {
   Practice.findById(req.params.id)
        .then(handle404) 
        .then(practice => {
            if(practice.author.equals(req.user._id)) {
                console.log("Updated!")
                return practice.updateOne(req.body.practice)
            }
            else {
                console.log("That's not your practice to edit!")
            }
        })
        .then(() => res.sendStatus(204)) //success, no content returned
        .catch(next)
})

//DELETE
//DELETE /practices/:id
router.delete("/practices/:id", requireToken, (req, res, next) => {
	Practice.findById(req.params.id)
        .then(handle404) 
        .then((practice) => {
            if(practice.author.equals(req.user._id)) {
                console.log("Deleted!")
                practice.deleteOne()
            }
            else {
                console.log("That's not your practice to delete!")
            }

		})
		.then(() => res.sendStatus(204))
		.catch(next)
})

module.exports = router