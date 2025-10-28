// src/store/dlna/action.ts
import state from './state'
import { formatTime } from '@/utils/common'

export default {
  setDlnaDevice(device: typeof state.currentDevice) {
    state.currentDevice = device
    if (global.state_event.dlnaDeviceChanged) {
      global.state_event.dlnaDeviceChanged(device)
    }
  },
  
  setDlnaMusicInfo(info: typeof state.currentMusicInfo) {
    // 直接更新状态
    state.currentMusicInfo = info
    
    // 同步调用事件处理函数，而不是等待下一个事件循环
    if (global.state_event.dlnaMusicInfoChanged) {
      global.state_event.dlnaMusicInfoChanged(info)
    }
  },
  
  setDlnaPlayState(isPlaying: typeof state.isPlaying) {
    state.isPlaying = isPlaying
    if (global.state_event.dlnaPlayStateChanged) {
      global.state_event.dlnaPlayStateChanged(isPlaying)
    }
  },
  
  setDlnaProgress(currentTime: typeof state.currentTime, totalTime?: typeof state.totalTime) {
    state.currentTime = currentTime
    if (totalTime !== undefined) {
      state.totalTime = totalTime
    }
    
    const progressInfo = {
      currentTime: state.currentTime,
      totalTime: state.totalTime,
      progress: state.totalTime > 0 ? state.currentTime / state.totalTime : 0,
      currentTimeStr: formatTime(state.currentTime),
      totalTimeStr: formatTime(state.totalTime)
    }
    
    if (global.state_event.dlnaProgressChanged) {
      global.state_event.dlnaProgressChanged(progressInfo)
    }
  },
  
  setDlnaTotalTime(totalTime: typeof state.totalTime) {
    state.totalTime = totalTime
    
    const progressInfo = {
      currentTime: state.currentTime,
      totalTime: state.totalTime,
      progress: state.totalTime > 0 ? state.currentTime / state.totalTime : 0,
      currentTimeStr: formatTime(state.currentTime),
      totalTimeStr: formatTime(state.totalTime)
    }
    
    if (global.state_event.dlnaProgressChanged) {
      global.state_event.dlnaProgressChanged(progressInfo)
    }
  }
}