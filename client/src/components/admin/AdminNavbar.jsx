import { Link } from 'react-router-dom'
import React from 'react'
import { Videotape } from 'lucide-react'

const AdminNavbar = () => {
  return (
    <div className='flex items-center justify-between px-6 md:px-10 h-16 border-b border-gray-300/30'>
        <Link to="/" className='max-md:flex-1 flex items-center'>
            <Videotape className='text-primary h-10 w-10'/>
            <span className='ml-1 text-2xl'>MovieTicketBooking</span>
        </Link>
    </div>
  )
}

export default AdminNavbar