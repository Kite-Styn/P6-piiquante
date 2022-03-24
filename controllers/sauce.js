const Sauce = require("../models/Sauce");
const fs = require("fs");

exports.getSauces = (req, res, next) => {
    Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({error}));
};

exports.getSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({error}));
};

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    const sauce = new Sauce ({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
    });
    sauce.save()
    .then(() => res.status(201).json({message: "Sauce created"}))
    .catch(error => res.status(400).json({error}));
};

//Ensures only the sauce creator can modify it and deletes old images being replaced
exports.modifySauce = (req, res, next) => {
    const sauceData = req.file ?
    {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
    } : {...req.body};
    Sauce.findOne({_id: req.params.id})
    .then((sauce) => {
        if (!sauce) {
            return res.status(404).json({error: new Error("Sauce not found")})
        }
        if (sauce.userId !== req.auth.userId) {
            return res.status(401).json({error: new Error("Request not authorized")})
        }
        if (req.file) {
            const filename = sauce.imageUrl.split("/images/")[1];
            fs.unlink(`images/${filename}`, () => {
                console.log("Old image deleted")
            })
        }
        Sauce.updateOne({_id: req.params.id}, {...sauceData, _id: req.params.id})
        .then(() => res.status(200).json({message: "Sauce modified"}))
        .catch(error => res.status(400).json({error}));
    })
    .catch(error => res.status(500).json({error}));
};

//Ensures only the sauce creator can delete it and deletes sauce and image
exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
    .then((sauce) => {
        if (!sauce) {
            return res.status(404).json({error: new Error("Sauce not found")})
        }
        if (sauce.userId !== req.auth.userId) {
            return res.status(401).json({error: new Error("Request not authorized")})
        }
        const filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
            Sauce.deleteOne({_id: req.params.id})
            .then(() => res.status(200).json({message: "Sauce deleted"}))
            .catch(error => res.status(400).json({error}));
        })
    })
    .catch(error => res.status(500).json({error}));
};

//Modifies the dis/likes depending on request data
exports.modifyLikes = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
    .then((sauce) => {
        if (req.body.like === 1) {
            sauce.usersLiked.push(req.body.userId);
            sauce.likes ++;
        } else if (req.body.like === -1) {
            sauce.usersDisliked.push(req.body.userId);
            sauce.dislikes ++;
        } else if (req.body.like === 0) {
            if (sauce.usersLiked.includes(req.body.userId)) {
                sauce.usersLiked.splice(sauce.usersLiked.findIndex(user => user === req.body.userId), 1);
                sauce.likes --;
            } else {
                sauce.usersDisliked.splice(sauce.usersDisliked.findIndex(user => user === req.body.userId), 1);
                sauce.dislikes --;
            }
        };
        Sauce.updateOne({_id: req.params.id}, sauce)
        .then(() => res.status(200).json({message: "Dis/Like updated"}))
        .catch(error => res.status(400).json({error}));
    })
    .catch(error => res.status(500).json({error}));
};