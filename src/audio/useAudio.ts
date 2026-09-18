import { useSyncExternalStore } from 'react'
import { getAudioStatus, subscribeAudioStatus } from './engine'

export function useAudioStatus() {
  return useSyncExternalStore(subscribeAudioStatus, getAudioStatus)
}
