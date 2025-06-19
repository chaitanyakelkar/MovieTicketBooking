import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodemailer.js";
import fs from 'fs'
import path from "path";
import { fileURLToPath } from "url";
import handlebars from 'handlebars'
import Movie from "../models/Movie.js";

// create client to send and receive events 
export const inngest = new Inngest({ id: "movie-ticket-booking" })

const baseUrl = process.env.HOST_URL

//inngest function to save user data to database
export const syncUserCreation = inngest.createFunction(
    {id: 'sync-user-from-clerk'},
    {event: 'clerk/user.created'},
    async ({ event }) => {
        const {id, first_name, last_name, email_addresses, image_url} = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + " " + last_name,
            image: image_url
        }
        await User.create(userData);
    }
)

//inngest function to delete user from database
export const syncUserDeletion = inngest.createFunction(
    {id: 'delete-user-with-clerk'},
    {event: 'clerk/user.deleted'},
    async ({ event }) => {
        const {id} = event.data
        await User.findByIdAndDelete(id)
    }
)

//inngest function to update user in database
export const syncUserUpdation = inngest.createFunction(
    {id: 'update-user-from-clerk'},
    {event: 'clerk/user.updated'},
    async ({ event }) => {
        const {id, first_name, last_name, email_addresses, image_url} = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + " " + last_name,
            image: image_url
        }
        await User.findByIdAndUpdate(id, userData)
    }
)

// inngest function to cancel the booking and release the seats if payment not done within 10 minutes of booking
const releaseSeatsAndDeleteBooking = inngest.createFunction(
    {id: "release-seats-delete-booking"},
    {event: "app/checkpayment"},
    async ({event, step}) => {
        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000)
        await step.sleepUntil("wait-for-10-minutes", tenMinutesLater)

        await step.run('check-payment-status', async () => {
            const bookingId = event.data.bookingId
            const booking = await Booking.findById(bookingId)

            //if payment is not made release seats and delete booking
            if (!booking.isPaid){
                const show = await Show.findById(booking.show)
                booking.bookedSeats.forEach(seat => {delete show.occupiedSeats[seat]})
                show.markModified("occupiedSeats")
                await show.save()
                await Booking.findByIdAndDelete(booking._id)
            }
        })
    }
)

// inngest function to send the confirmation email
const sendBookingConfirmationEmail = inngest.createFunction(
    {id: 'send-booking-confirmation-email'},
    {event: 'app/show.booked'},
    async ({event, step}) => {
        const {bookingId} = event.data

        const booking = await Booking.findById(bookingId).populate({
            path: "show",
            populate: {path: "movie", model: "Movie"}
        }).populate("user")

        const dirname = path.dirname(fileURLToPath(import.meta.url))
        const templateHtml = fs.readFileSync(path.join(dirname, "../templates/ticketConfirmationTemplate.html"), "utf-8");
        const template = handlebars.compile(templateHtml);
        const optionsDate = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' };
        const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' };
        const dateObj = new Date(booking.show.showDateTime);
        const date = dateObj.toLocaleDateString('en-US', optionsDate)
        const time = dateObj.toLocaleTimeString('en-US', optionsTime)
        const htmlContent = template({
            movieTitle: booking.show.movie.title,
            date,
            time,
            seats: booking.bookedSeats.join(", "),
            bookingId: booking._id,
        });

        await sendEmail({
            to: booking.user.email,
            subject: `🎟️ Your Tickets for ${booking.show.movie.title} Are Confirmed!`,
            body: htmlContent
        })
    }
)

// inngest function to send reminders
const sendShowReminders = inngest.createFunction(
    {id: 'send-show-reminders'},
    {cron: "0 */8 * * *"}, //every 8 hours
    async ({step}) => {
        const now = new Date();
        const in8hours = new Date(now.getTime() + 8 * 60 * 60 * 1000)
        const windowStart = new Date(in8hours.getTime() - 10 * 60 * 1000)
        const optionsDate = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' };
        const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' };
        const dirname = path.dirname(fileURLToPath(import.meta.url))
        const templateHtml = fs.readFileSync(path.join(dirname, "../templates/reminderTemplate.html"), "utf-8");
        const template = handlebars.compile(templateHtml);

        //prepare reminder tasks
        const reminderTasks = await step.run("prepare-reminder-tasks", async () => {
            const shows = await Show.find({
                showDateTime: {$gte: windowStart, $lte: in8hours}
            }).populate('movie')

            const tasks = []

            for (const show of shows){
                if (!show.movie || !show.occupiedSeats) continue;

                const userIds = [...new Set(Object.values(show.occupiedSeats))]
                if (userIds.length === 0) continue

                const dateObj = new Date(show.showDateTime);
                const date = dateObj.toLocaleDateString('en-US', optionsDate)
                const time = dateObj.toLocaleTimeString('en-US', optionsTime)


                const users = await User.find({_id: {$in: userIds}}).select("name email")

                for (const user of users){
                    tasks.push({
                        userEmail: user.email,
                        movieTitle: show.movie.title,
                        date,
                        time,
                    })
                }
            }

            return tasks
        })

        if (reminderTasks.length === 0){
            return {sent: 0, message: "No reminders to send."}
        }

        //send reminder emails
        const results = await step.run('send-all-reminders', async () => {
            return await Promise.allSettled(
                reminderTasks.map(task => {
                    const htmlContent = template({
                        movieTitle: task.movieTitle,
                        date: task.date,
                        time: task.time
                    })
                    sendEmail({
                        to: task.userEmail,
                        subject: `🎬 Reminder: ${task.movieTitle} Starts Soon!`,
                        body: htmlContent
                    })
                })
            )
        })

        const sent = results.filter(r => r.status === "fulfilled").length
        const failed = results.length - sent

        return {
            sent,
            failed,
            message: `Sent ${sent} reminder(s), ${failed} failed.`
        }
    }
)

// inngest function to send notification of new movie
const sendNewMovieNotifications = inngest.createFunction(
    {id: "send-new-movie-notification"},
    {event: "app/movie.added"},
    async ({event}) => {
        const {movieId} = event.data
        const movie = await Movie.findById(movieId)
        const dirname = path.dirname(fileURLToPath(import.meta.url))
        const templateHtml = fs.readFileSync(path.join(dirname, "../templates/newMovieNotificationTemplate.html"), "utf-8")
        const template = handlebars.compile(templateHtml)
        const genre = movie.genres.map((genre) => genre.name).join(", ")
        const htmlContent = template({
            movieTitle: movie.title,
            genre,
            releaseDate: movie.release_date,
            overview: movie.overview,
            poster_url: `${process.env.TMDB_IMAGE_BASE_URL}${movie.poster_path}`,
            movie_url: `${baseUrl} + /movies/ + ${movieId}`
        })

        const users = await User.find({})

        for (const user of users){
            const userEmail = user.email
            const subject = `🎬 New Movie Added: ${movie.title} Is Now Available!`

            await sendEmail({
                to: userEmail,
                subject,
                body: htmlContent
            })
        }

        return {message: "Notifications sent."}
    }
)

// inngest function to send notification of new show of a movie
const sendNewShowNotifications = inngest.createFunction(
    {id: "send-new-show-notification"},
    {event: "app/show.added"},
    async ({event}) => {
        const {showId} = event.data
        const show = await Show.findById(showId).populate('movie')
        const dateObj = new Date(show.showDateTime);
        const optionsDate = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' };
        const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' };
        const date = dateObj.toLocaleDateString('en-US', optionsDate)
        const time = dateObj.toLocaleTimeString('en-US', optionsTime)
        const dirname = path.dirname(fileURLToPath(import.meta.url))
        const templateHtml = fs.readFileSync(path.join(dirname, "../templates/newShowNotificationTemplate.html"), "utf-8")
        const template = handlebars.compile(templateHtml)
        const genre = show.movie.genres.map((genre) => genre.name).join(", ")
        const htmlContent = template({
            movieTitle: show.movie.title,
            genre,
            overview: show.movie.overview,
            poster_url: `${process.env.TMDB_IMAGE_BASE_URL}${show.movie.poster_path}`,
            show_url: `${process.env.HOST_URL}/movies/${show.movie._id.toString()}/${dateObj.toISOString().slice(0, 10)}`,
            price: show.showPrice,
            date,
            time
        })

        const users = await User.find({})

        for (const user of users){
            const userEmail = user.email
            const subject = `🎬 New Show Added: ${show.movie.title} on ${date} at ${time}`

            await sendEmail({
                to: userEmail,
                subject,
                body: htmlContent
            })
        }

        return {message: "Notifications sent."}
    }
)

// create an array where we export Inngest functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    releaseSeatsAndDeleteBooking,
    sendBookingConfirmationEmail,
    sendShowReminders,
    sendNewMovieNotifications,
    sendNewShowNotifications
]