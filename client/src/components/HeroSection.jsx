import React from 'react'
import { assets } from '../assets/assets'
import { ArrowRight, CalendarIcon, ClockIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const HeroSection = () => {

    const navigate = useNavigate()

  return (
    <div className='flex flex-col items-start justify-center gap-4 px-7 md:px-16 lg:px-36 bg-[url("/oppenheimer-portrait.jpg")] md:bg-[url("/oppenheimer.png")] bg-cover bg-center h-screen'> 
        {/* <img src={assets.warnerbrosLogo} alt="" className='max-h-25 lg:h-25 mt-20'/> */}
        <div className='flex flex-col items-start justify-center gap-4 backdrop-blur-sm bg-black/30 pl-3 pt-2 rounded-3xl overflow-hidden'>
            <h1 className='text-[40px] md:text-[70px] md:leading-18 font-semibold max-2-110'>Oppenheimer</h1>       
            <div className='flex items-center gap-4 text-gray-300'>
                <span>Biography | Drama | History</span>
                <div className='flex items-center gap-1'>
                    <CalendarIcon className='w-4.5 h-4.5'/> 2023
                </div>
                <div className='flex items-center gap-1'>
                    <ClockIcon className='w-4.5 h-4.5'/> 3h
                </div>
            </div>
            <p className='max-w-md text-gray-300 mb-4'>A dramatization of the life story of J. Robert Oppenheimer, the physicist who had a large hand in the development of the atomic bombs that brought an end to World War II.</p>
            <button onClick={() => {navigate("/movies")}} className='flex items-center gap-1 px-4 py-3 mb-3 md:mb-5 md:px-6 md:py-4 text-sm bg-primary hover:bg-primary:dull transition rounded-full font-medium cursor-pointer'>
                Explore Movies
                <ArrowRight className='w-5 h-5'/>
            </button>
        </div>
    </div>
  )
}

export default HeroSection