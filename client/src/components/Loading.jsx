import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const Loading = () => {

  const {nextUrl} = useParams()
  const navigate = useNavigate()
  const [time, setTime] = useState()

  useEffect(() => {
    if (nextUrl){
      setTime(8)
      const intervalId = setInterval(() => {
        setTime(prev => {
          if (prev === 1){
            clearInterval(intervalId)
            setTimeout(() => navigate("/" + nextUrl), 0)
          }
          return prev - 1})
      }, 1000)

      return () =>{
        clearInterval(intervalId)
      }
    }
  }, [nextUrl, navigate])

  return (
    <div className='flex justify-center items-center h-[80vh] flex-col'>
        <div className='animate-spin rounded-full h-14 w-14 border-2 border-t-primary'></div>
        {nextUrl && <div className='mt-2'>Wait for <span>{time}</span> seconds...</div>}
        {!nextUrl && <div className='mt-2'>Page is Loading...</div>}
    </div>
  )
}

export default Loading