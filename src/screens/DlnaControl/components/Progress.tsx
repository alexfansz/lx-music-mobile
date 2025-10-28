// src/screens/DlnaControl/components/Progress.tsx
import { View, Text } from 'react-native'
import { useDlnaProgress, useDlnaMusicInfo } from '@/store/dlna/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Slider from '@/components/common/Slider'
import UPnpCastModule from '@/utils/nativeModules/UPnpCastModule'
import { useEffect, useRef, useState } from 'react'
import dlnaAction from '@/store/dlna/action'
import { castNext, castPrev } from '@/core/player/player'

export default () => {
  const { currentTime, totalTime, progress, currentTimeStr, totalTimeStr } = useDlnaProgress()
  const musicInfo = useDlnaMusicInfo()
  const theme = useTheme()
  const setDlnaProgress = dlnaAction.setDlnaProgress
  const [isSeeking, setIsSeeking] = useState(false)
  
  // 使用 ref 记录是否已经触发过自动播放下一首
  const hasAutoPlayedNextRef = useRef(false)
  // 记录当前歌曲 ID
  const currentMusicIdRef = useRef<string | undefined>(musicInfo?.id)
  // 记录触发自动播放的时间
  const autoPlayTriggerTimeRef = useRef<number>(0)

  const handleSeek = async (value: number) => {
    if (isNaN(value) || value < 0 || (totalTime && value > totalTime)) {
      console.warn('Invalid seek value:', value)
      return
    }
    
    try {
      setIsSeeking(true)
      await UPnpCastModule.seek(value * 1000)
    } catch (error) {
      console.error('Failed to seek:', error)
    } finally {
      setIsSeeking(false)
    }
  }

  // 更新 currentMusicIdRef 当音乐信息变化时
  useEffect(() => {
    // 当音乐信息变化时，重置自动播放标志
    if (currentMusicIdRef.current !== musicInfo?.id) {
      currentMusicIdRef.current = musicInfo?.id
      hasAutoPlayedNextRef.current = false
    }
  }, [musicInfo?.id])

  // 添加实时进度更新逻辑
  useEffect(() => {
    let progressTimer: NodeJS.Timeout | null = null
    
    const updateProgress = async () => {
      try {
        const progress = await UPnpCastModule.getProgressRealtime()
        if (progress) {
          setDlnaProgress(progress.current / 1000, progress.duration / 1000)
          
          const currentTime = progress.current / 1000;
          const totalTime = progress.duration / 1000;
          
          // 检查是否接近播放完成（剩余时间少于2秒）
          if (totalTime > 0 && totalTime - currentTime < 2) {
            // 检查是否已经触发过自动播放
            if (!hasAutoPlayedNextRef.current) {
              // 检查冷却时间，避免频繁触发（至少间隔5秒）
              const now = Date.now()
              if (now - autoPlayTriggerTimeRef.current > 5000) {
                // 标记已触发自动播放
                hasAutoPlayedNextRef.current = true
                autoPlayTriggerTimeRef.current = now
                
                setTimeout(() => {
                  castNext();
                }, 2000);
              }
            }
          }
          
          // 如果播放进度回到开头附近，重置自动播放标志
          if (currentTime < 5 && hasAutoPlayedNextRef.current) {
            hasAutoPlayedNextRef.current = false
          }
        }
      } catch (error) {
        console.log('Failed to get DLNA progress:', error)
      }
    }
    
    updateProgress()
    progressTimer = setInterval(updateProgress, 1000)
    
    return () => {
      if (progressTimer) {
        clearInterval(progressTimer)
      }
    }
  }, [setDlnaProgress])

  return (
    <View style={styles.container}>
      <View style={styles.sliderWrapper}>
        <Slider
          minimumValue={0}
          maximumValue={totalTime || 100}
          value={currentTime}
          onSlidingComplete={handleSeek}
        />
      </View>
      <View style={styles.timeContainer}>
        <Text style={{ ...styles.timeText, color: theme['c-font-label'] }}>
          {currentTimeStr}
        </Text>
        <Text style={{ ...styles.timeText, color: theme['c-font-label'] }}>
          {totalTimeStr}
        </Text>
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
    marginVertical: 15,
  },
  sliderWrapper: {
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  timeText: {
    fontSize: 12,
  },
})