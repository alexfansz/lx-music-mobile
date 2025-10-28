// src/screens/DlnaControl/components/DeviceInfo.tsx
import { View, Text } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useDlnaDevice } from '@/store/dlna/hook'
import { createStyle } from '@/utils/tools'

export default () => {
  const theme = useTheme()
  const deviceInfo = useDlnaDevice()

  return (
    <View style={styles.container}>
      <Text style={{ ...styles.deviceName, color: theme['c-font'] }}>
        投屏设备: {deviceInfo?.name || '未知设备'}
      </Text>
      <Text style={{ ...styles.deviceAddress, color: theme['c-font-label'] }}>
        {deviceInfo?.address || ''}
      </Text>
    </View>
  )
}

const styles = createStyle({
  container: {
    paddingVertical: 10, // 减少上下内边距
    paddingLeft: 5, // 减少左侧内边距，让文字更靠近返回按钮
    // 删除 borderBottomWidth 属性以移除横线
    // borderBottomWidth: 0.5,
    // 不使用 alignItems: 'center' 以实现左对齐
    alignItems: 'flex-start', // 改为左对齐
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
  },
  deviceAddress: {
    fontSize: 12,
    marginTop: 2,
  },
})