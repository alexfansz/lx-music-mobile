// src/store/dlna/hook.ts
import { useEffect, useState } from 'react'
import state from './state'

export const useDlnaDevice = () => {
  const [device, setDevice] = useState(state.currentDevice)

  useEffect(() => {
    const handleDeviceChange = (device: typeof state.currentDevice) => {
      setDevice(device)
    }
    
    global.state_event.on('dlnaDeviceChanged', handleDeviceChange)
    return () => {
      global.state_event.off('dlnaDeviceChanged', handleDeviceChange)
    }
  }, [])

  return device
}

export const useDlnaMusicInfo = () => {
  const [musicInfo, setMusicInfo] = useState(state.currentMusicInfo)

  useEffect(() => {
    const handleMusicInfoChange = (info: typeof state.currentMusicInfo) => {
      setMusicInfo(info)
    }
    
    global.state_event.on('dlnaMusicInfoChanged', handleMusicInfoChange)
    return () => {
      global.state_event.off('dlnaMusicInfoChanged', handleMusicInfoChange)
    }
  }, [])

  return musicInfo
}

export const useDlnaPlayState = () => {
  const [isPlaying, setIsPlaying] = useState(state.isPlaying)

  useEffect(() => {
    const handlePlayStateChange = (isPlaying: boolean) => {
      setIsPlaying(isPlaying)
    }
    
    global.state_event.on('dlnaPlayStateChanged', handlePlayStateChange)
    return () => {
      global.state_event.off('dlnaPlayStateChanged', handlePlayStateChange)
    }
  }, [])

  return { isPlaying }
}

export const useDlnaProgress = () => {
  const [progress, setProgress] = useState({
    currentTime: state.currentTime,
    totalTime: state.totalTime,
    progress: state.totalTime > 0 ? state.currentTime / state.totalTime : 0,
    currentTimeStr: formatTime(state.currentTime),
    totalTimeStr: formatTime(state.totalTime)
  })

  useEffect(() => {
    const handleProgressChange = (progress: any) => {
      setProgress(progress)
    }
    
    global.state_event.on('dlnaProgressChanged', handleProgressChange)
    return () => {
      global.state_event.off('dlnaProgressChanged', handleProgressChange)
    }
  }, [])

  return progress
}

// 工具函数
const formatTime = (time: number): string => {
  if (isNaN(time) || time <= 0) return '00:00'
  const m = Math.floor(time / 60)
  const s = Math.floor(time % 60)
  return m < 10 ? `0${m}:${s < 10 ? '0' : ''}${s}` : `${m}:${s < 10 ? '0' : ''}${s}`
}