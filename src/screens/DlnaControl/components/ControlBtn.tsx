// src/screens/DlnaControl/components/ControlBtn.tsx
import { View, TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useDlnaPlayState } from '@/store/dlna/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import UPnpCastModule from '@/utils/nativeModules/UPnpCastModule'
import dlnaAction from '@/store/dlna/action' // 添加这一行
import { castNext, castPrev } from '@/core/player/player'

const BTN_SIZE = 32

export default () => {
  const { isPlaying } = useDlnaPlayState()
  const theme = useTheme()

// 更好的办法是：监听来自原生模块的状态变更事件
// 这部分通常在应用初始化时设置监听器
// UPnpCastModule.addEventListener('playStateChange', (isPlaying: boolean) => {
//   dlnaAction.setDlnaPlayState(isPlaying)
// })
  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        await UPnpCastModule.pause()
        // 主动更新状态以确保UI同步
        dlnaAction.setDlnaPlayState(false)
      } else {
        await UPnpCastModule.play()
        // 主动更新状态以确保UI同步
        dlnaAction.setDlnaPlayState(true)
      }
    } catch (error) {
      console.error('Play/Pause error:', error)
    }
  }

  const handlePrev = () => {
    castPrev()
  }

  const handleNext = () => {
    castNext()
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={handlePrev}>
        <Icon name="prevMusic" color={theme['c-font']} size={BTN_SIZE} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={handlePlayPause}>
        <Icon 
          name={isPlaying ? "pause" : "play"} 
          color={theme['c-font']} 
          size={BTN_SIZE + 8} 
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={handleNext}>
        <Icon name="nextMusic" color={theme['c-font']} size={BTN_SIZE} />
      </TouchableOpacity>
    </View>
  )
}

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  btn: {
    marginHorizontal: 20,
    padding: 10,
  },
})