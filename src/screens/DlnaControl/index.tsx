// src/screens/DlnaControl/index.tsx
import { useEffect } from 'react'
import { useHorizontalMode } from '@/utils/hooks'
import { View } from 'react-native'

import Vertical from './Vertical'
import Horizontal from './Horizontal'
import PageContent from '@/components/PageContent'
import StatusBar from '@/components/common/StatusBar'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import UPnpCastModule from '@/utils/nativeModules/UPnpCastModule'
import { createStyle } from '@/utils/tools'
import { useStatusbarHeight } from '@/store/common/hook'

export default ({ componentId }: { componentId: string }) => {
  const isHorizontalMode = useHorizontalMode()
  const statusBarHeight = useStatusbarHeight()

  useEffect(() => {
    setComponentId(COMPONENT_IDS.dlnaControl, componentId)
  }, [])

  const handleExit = async () => {
    try {
      // 调用 stop 方法停止投屏
      await UPnpCastModule.stop()
    } catch (error) {
      console.error('Failed to stop DLNA casting:', error)
    }
    // 停止投屏的处理应该在其他地方完成
  }

  return (
    <PageContent>
      <StatusBar />
      <View style={{ ...styles.container, paddingTop: statusBarHeight }}>
        {
          isHorizontalMode
            ? <Horizontal componentId={componentId} handleExit={handleExit} />
            : <Vertical componentId={componentId} handleExit={handleExit} />
        }
      </View>
    </PageContent>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
})