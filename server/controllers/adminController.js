import Booking from "../models/Booking.js"
import Show from "../models/Show.js"
import User from "../models/User.js"


// api to check if user is admin
export const isAdmin = async (req, res) => {
    res.json({success: true, isAdmin: true})
}

//api to get dashboard data
export const getDashboardData = async (req, res) => {
    try {
        const bookings = await Booking.find({isPaid: true})
        const activeShows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie')
        const totalUsers = await User.countDocuments()

        const dashboardData = {
            totalBookings: bookings.length,
            totalRevenue: bookings.reduce((total, booking) => total + booking.amount, 0),
            activeShows,
            totalUsers
        }

        res.json({success: true, dashboardData})
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

//api to get all the shows
export const getAllShows = async (req, res) => {
    try {
        const shows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie').sort({showDateTime: 1})
        
        res.json({success: true, shows})
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

//api to get all the bookings
export const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({}).populate('user').populate({
            path: "show",
            populate: {path: "movie"}
        }).sort({createdAt: -1})

        res.json({success: true, bookings})
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}