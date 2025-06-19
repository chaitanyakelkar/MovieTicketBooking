import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodemailer.js";
import fs from 'fs'
import path from "path";
import { fileURLToPath } from "url";
import handlebars from 'handlebars'

// create client to send and receive events 
export const inngest = new Inngest({ id: "movie-ticket-booking" })

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

// create an array where we export Inngest functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    releaseSeatsAndDeleteBooking,
    sendBookingConfirmationEmail
]