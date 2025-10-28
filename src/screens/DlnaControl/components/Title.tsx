// src/screens/DlnaControl/components/Title.tsx
import { View } from 'react-native'
import { useDlnaMusicInfo } from '@/store/dlna/hook'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'

export default () => {
  const musicInfo = useDlnaMusicInfo()
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <Text style={{ ...styles.title, color: theme['c-font'] }} numberOfLines={1}>
        {musicInfo?.name || '未知歌曲'}
      </Text>
      <Text style={{ ...styles.artist, color: theme['c-font-label'] }} numberOfLines={1}>
        {musicInfo?.singer || '未知艺术家'}
      </Text>
      {musicInfo?.album && (
        <Text style={{ ...styles.album, color: theme['c-font-label'] }} numberOfLines={1}>
          {musicInfo.album}
        </Text>
      )}
    </View>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  artist: {
    fontSize: 16,
    marginTop: 5,
    textAlign: 'center',
  },
  album: {
    fontSize: 14,
    marginTop: 3,
    textAlign: 'center',
  },
})