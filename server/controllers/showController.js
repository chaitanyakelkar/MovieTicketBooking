import axios from "axios"
import Movie from "../models/Movie.js"
import Show from "../models/Show.js"
import { inngest } from "../inngest/index.js"

//API to get now playing movies from TMDB
export const getNowPlayingMovies = async (req, res) => {
    try {
        const { data } = await axios.get("https://api.themoviedb.org/3/movie/now_playing", {
            headers: {
                Authorization: `Bearer ${process.env.TMDB_API_KEY}`
            }
        })

        const movies = data.results
        res.json({success: true, movies: movies})
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

//API to add new Show to database
export const addShow = async (req, res) => {
    try {
        const {movieId, showsInput, showPrice} = req.body

        const movie = await Movie.findById(movieId)

        if (!movie){
            // fetch movie details and credits from tmdb api
            const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                headers: {
                    Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                    }
                }),
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
                headers: {
                    Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                    }
                })
            ])

            const movieApiData = movieDetailsResponse.data
            const movieCreditsData = movieCreditsResponse.data

            const movieDetails = {
                _id: movieId,
                title: movieApiData.title,
                overview: movieApiData.overview,
                poster_path: movieApiData.poster_path,
                backdrop_path: movieApiData.backdrop_path,
                genres: movieApiData.genres,
                casts: movieCreditsData.cast,
                release_date: movieApiData.release_date,
                orignal_language: movieApiData.orignal_language,
                tagline: movieApiData.tagline || "",
                vote_average: movieApiData.vote_average,
                runtime: movieApiData.runtime,
            }

            //add movie to database
            await Movie.create(movieDetails);

            //send new movie notification
            await inngest.send({
                name: 'app/movie.added',
                data: {movieId}
            })
        }

        const showsToCreate = [];
        showsInput.forEach( show => {
            const showDate = show.date
            show.time.forEach( time => {
                const dateTimeString = `${showDate}T${time}`
                showsToCreate.push({
                    movie: movieId,
                    showDateTime: new Date(dateTimeString),
                    showPrice,
                    occupiedSeats: {} 
                })
            })
        })

        if (showsToCreate.length > 0){
            const addedShows = await Show.insertMany(showsToCreate)
            const showIds = addedShows.map(show => show._id.toString())

            await Promise.all(
                showIds.map(id =>
                    inngest.send({   //send new show notification for each show
                        name: 'app/show.added',
                        data: { showId: id },
            })
        )
    );
        }

        res.json({success:true, message: 'Show Added Successfully!'})
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

//api to get all shows from the database
export const getShows = async (req, res) => {
    try {
        const shows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie').sort({showDateTime: 1})

        const uniqueShows = new Set(shows.map(show => show.movie))

        res.json({success: true, shows: Array.from(uniqueShows)})
    } catch (error) {
        console.log(error);
        res.json({success: true, message: error.message})
    }
}

//api to get individual shows from the database
export const getShow = async (req, res) => {
    try {
        const {movieId} = req.params
        // get all upcomming shows for the movie
        const shows = await Show.find({movie: movieId, showDateTime: {$gte: new Date()}})

        const movie = await Movie.findById(movieId);
        const dateTime = {};

        shows.forEach(show => {
            const data = show.showDateTime.toISOString().split("T")[0]
            if (!dateTime[data]){
                dateTime[data] = []
            }
            dateTime[data].push({time: show.showDateTime, showId: show._id})
        })

        res.json({success: true, movie, dateTime})
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}