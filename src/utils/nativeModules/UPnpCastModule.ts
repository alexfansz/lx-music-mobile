// src/utils/nativeModules/UPnpCastModule.ts
import { NativeModules, Platform } from 'react-native'

const { UPnpCastFunctions } = NativeModules

export interface Device {
  id: string
  name: string
  address: string
  isTV: boolean
}

export interface State {
  isConnected: boolean
  playbackState: 'PLAYING' | 'PAUSED' | 'STOPPED' | 'TRANSITIONING' | 'UNKNOWN'
  volume: number
  isMuted: boolean
  currentDevice: Device | null
}

export interface Progress {
  current: number
  duration: number
}

export interface VolumeData {
  volume: number | null
  isMuted: boolean | null
}

interface UPnpCastModuleInterface {
  init: () => void
  getState: () => Promise<State>
  cleanup: () => void
  play: () => Promise<void>
  pause: () => Promise<void>
  stop: () => Promise<void>
  setVolume: (volume: number) => Promise<void>
  setMute: (mute: boolean) => Promise<void>
  seek: (positionMs: number) => Promise<void>
  search: (timeout: number) => Promise<Device[]>
  selectDevice: (deviceId: string) => void
  castToDevice: (url: string, title: string | null) => Promise<void>
  getProgress: () => Promise<Progress | null>
  getProgressRealtime: () => Promise<Progress | null>
  getVolume: () => Promise<VolumeData | null>
  performKotlinTask: (input: string) => Promise<string>
}

const defaultImpl: UPnpCastModuleInterface = {
  init: () => {},
  getState: () => Promise.resolve({
    isConnected: false,
    playbackState: 'UNKNOWN',
    volume: 0,
    isMuted: false,
    currentDevice: null
  }),
  cleanup: () => {},
  play: () => Promise.resolve(),
  pause: () => Promise.resolve(),
  stop: () => Promise.resolve(),
  setVolume: () => Promise.resolve(),
  setMute: () => Promise.resolve(),
  seek: () => Promise.resolve(),
  search: () => Promise.resolve([]),
  selectDevice: () => {},
  castToDevice: () => Promise.resolve(),
  getProgress: () => Promise.resolve(null),
  getProgressRealtime: () => Promise.resolve(null),
  getVolume: () => Promise.resolve(null),
  performKotlinTask: () => Promise.resolve('')
}

export default (Platform.OS === 'android' ? (UPnpCastFunctions || defaultImpl) : defaultImpl) as UPnpCastModuleInterface