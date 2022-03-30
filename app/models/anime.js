const mongoose = require('mongoose')

const animeSchema = new mongoose.Schema(
    {
        title:{
            type:String,
            required:true,
        },
        description:{
            type:String,
            required:true,
        },
        genre:{
            type:String,
            required:true,
        },
        onGoing:{
            type:Boolean,
            required:true,
        },
        yearOfRelease:{
            type:Number,
            required:true
        },
        imageOfAnime:{
            type:String,
            required:true
        },
        owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
        }
    },
    {
		timestamps: true,
	}
)

module.exports = mongoose.model('Anime', animeSchema)
