// src/store/dlna/state.ts
export interface DlnaDevice {
  id: string
  name: string
  address: string
  isTV?: boolean
}

export interface DlnaMusicInfo {
  id?: string
  name?: string
  singer?: string
  album?: string
  pic?: string
  duration?: number
}

export interface DlnaState {
  currentDevice: DlnaDevice | null
  currentMusicInfo: DlnaMusicInfo | null
  isPlaying: boolean
  currentTime: number
  totalTime: number
}

const state: DlnaState = {
  currentDevice: null,
  currentMusicInfo: null,
  isPlaying: false,
  currentTime: 0,
  totalTime: 0,
}

export default state