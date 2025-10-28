// src/screens/DlnaControl/components/Pic.tsx
import { View, Image } from 'react-native'
import { useDlnaMusicInfo } from '@/store/dlna/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'

export default () => {
  const musicInfo = useDlnaMusicInfo()
  const theme = useTheme()

  return (
    <View style={styles.container}>
      {musicInfo?.pic ? (
        <Image 
          source={{ uri: musicInfo.pic }} 
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={{ ...styles.placeholder, backgroundColor: theme['c-primary-light-300-alpha-700'] }}>
          <Text style={styles.placeholderText}>
            {musicInfo?.name?.substr(0, 1) || '?'}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = createStyle({
  container: {
    width: 250,
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    color: '#FFFFFF',
  },
})