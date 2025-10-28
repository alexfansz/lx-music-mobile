// src/screens/DlnaControl/Vertical.tsx
import { View, TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Pic from './components/Pic'
import Title from './components/Title'
import Progress from './components/Progress'
import ControlBtn from './components/ControlBtn'
import DeviceInfo from './components/DeviceInfo'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT } from '@/config/constant'
import { pop } from '@/navigation'
import commonState from '@/store/common/state'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

export default ({ componentId, handleExit }: { componentId: string, handleExit: () => void }) => {
  const theme = useTheme()

  const back = () => {
    handleExit()
    void pop(commonState.componentIds.dlnaControl!)
  }

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}>
      <View style={{ ...styles.header, height: HEADER_HEIGHT }}>
        <TouchableOpacity onPress={back} style={styles.backButton}>
          <Icon name="chevron-left" color={theme['c-font']} size={18} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <View style={styles.deviceInfoContainer}>
          <DeviceInfo />
        </View>
        <View style={styles.mainContent}>
          <Pic />
          <Title />
          <Progress />
          <ControlBtn />
        </View>
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: HEADER_HEIGHT,
    width: HEADER_HEIGHT,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
  },
  deviceInfoContainer: {
    // 使用 paddingTop 调整设备信息的垂直位置
    paddingTop: (HEADER_HEIGHT - 36) / 2, // 36是DeviceInfo的大致高度
    // 添加 paddingLeft 使文字与返回按钮对齐
    paddingLeft: HEADER_HEIGHT - 10, // 减少10像素让文字更靠近返回按钮
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 10,
  },
})