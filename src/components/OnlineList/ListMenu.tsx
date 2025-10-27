import { useMemo, useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react'
import { useI18n } from '@/lang'
import Menu, { type MenuType, type Position } from '@/components/common/Menu'
import { hasDislike } from '@/core/dislikeList'
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import Button from '@/components/common/Button'
import { scaleSizeH } from '@/utils/pixelRatio'
import UPnpCastModule from '@/utils/nativeModules/UPnpCastModule'
import { toast } from '@/utils/tools'

export interface SelectInfo {
  musicInfo: LX.Music.MusicInfoOnline
  selectedList: LX.Music.MusicInfoOnline[]
  index: number
  single: boolean
}
const initSelectInfo = {}

export interface ListMenuProps {
  onPlay: (selectInfo: SelectInfo) => void
  onPlayLater: (selectInfo: SelectInfo) => void
  onAdd: (selectInfo: SelectInfo) => void
  onCopyName: (selectInfo: SelectInfo) => void
  onMusicSourceDetail: (selectInfo: SelectInfo) => void
  onDislikeMusic: (selectInfo: SelectInfo) => void
  onCast: (selectInfo: SelectInfo) => void
}
export interface ListMenuType {
  show: (selectInfo: SelectInfo, position: Position) => void
}

export type {
  Position,
}

// 全局设备列表缓存
let globalDeviceList: Array<{id: string, name: string, address: string, isTV: boolean}> | null = null

// 投播设备选择弹窗组件
const CastDeviceModal = ({ 
  visible, 
  onClose, 
  devices, 
  onSelectDevice,
  onSearch,
  searching
}: {
  visible: boolean
  onClose: () => void
  devices: Array<{id: string, name: string, address: string, isTV: boolean}> | null
  onSelectDevice: (device: {id: string, name: string, address: string, isTV: boolean}) => void
  onSearch: () => void
  searching: boolean
}) => {
  const theme = useTheme()

  const handleRefresh = () => {
    globalDeviceList = null
    onSearch()
  }

  const renderItem = ({ item }: { item: {id: string, name: string, address: string, isTV: boolean} }) => (
    <TouchableOpacity 
      style={{ ...styles.deviceItem, backgroundColor: theme.primaryLight }} 
      onPress={() => onSelectDevice(item)}
    >
      <View style={styles.deviceInfo}>
        <Text style={{ ...styles.deviceName, color: theme.fontColor }}>{item.name}</Text>
        <Text style={{ ...styles.deviceAddress, color: theme.secondaryFontColor }}>{item.address}</Text>
      </View>
      {item.isTV && (
        <View style={styles.tvTag}>
          <Text style={styles.tvTagText}>TV</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={{ 
            ...StyleSheet.absoluteFillObject, 
            backgroundColor: theme.backgroundColor,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            zIndex: -1
          }} />
          <View style={{ 
            ...styles.modalContent, 
            backgroundColor: theme.backgroundColor 
          }}>
            <View style={styles.modalHeader}>
              <Text style={{ ...styles.modalTitle, color: theme.fontColor || '#000000' }}>选择投播设备</Text>
              <View style={styles.headerButtons}>
                <Button 
                  style={styles.refreshButton} 
                  onPress={handleRefresh} 
                  disabled={searching}
                >
                  <Text style={{ color: theme.fontColor || '#000000' }}>
                    {searching ? '搜索中...' : '刷新'}
                  </Text>
                </Button>
                <Button 
                  style={styles.closeButtonHeader} 
                  onPress={onClose}
                >
                  <Text style={{ color: theme.fontColor || '#000000' }}>×</Text>
                </Button>
              </View>
            </View>
            
            {searching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary || '#007AFF'} />
                <Text style={{ color: theme.secondaryFontColor || '#666666', marginTop: 10 }}>正在搜索设备...</Text>
              </View>
            ) : devices === null ? (
              <View style={styles.emptyContainer}>
                <Text style={{ color: theme.secondaryFontColor || '#666666' }}>点击刷新按钮搜索设备</Text>
              </View>
            ) : devices.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={{ color: theme.secondaryFontColor || '#666666' }}>未找到可用设备</Text>
              </View>
            ) : (
              <FlatList
                data={devices}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                style={styles.deviceList}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default forwardRef<ListMenuType, ListMenuProps>((props: ListMenuProps, ref) => {
  const t = useI18n()
  const [visible, setVisible] = useState(false)
  const menuRef = useRef<MenuType>(null)
  const selectInfoRef = useRef<SelectInfo>(initSelectInfo as SelectInfo)
  const [isDislikeMusic, setDislikeMusic] = useState(false)
  // 投播相关状态
  const [castModalVisible, setCastModalVisible] = useState(false)
  const [devices, setDevices] = useState<Array<{id: string, name: string, address: string, isTV: boolean}> | null>(null)
  const [searching, setSearching] = useState(false)

  useImperativeHandle(ref, () => ({
    show(selectInfo, position) {
      selectInfoRef.current = selectInfo
      setDislikeMusic(hasDislike(selectInfo.musicInfo))
      if (visible) menuRef.current?.show(position)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          menuRef.current?.show(position)
        })
      }
    },
  }))

  // 搜索DLNA设备
  const searchDevices = async () => {
    setSearching(true)
    try {
      // 如果全局设备列表为空，则进行搜索
      if (globalDeviceList === null) {
        const foundDevices = await UPnpCastModule.search(5000) // 5秒超时
        globalDeviceList = foundDevices
        setDevices(foundDevices)
      } else {
        // 使用缓存的设备列表
        setDevices(globalDeviceList)
      }
    } catch (error) {
      console.error('搜索设备失败:', error)
      toast('搜索设备失败')
      setDevices([])
      globalDeviceList = []
    } finally {
      setSearching(false)
    }
  }

  // 处理投播操作
  const handleCast = () => {
    // 先显示对话框
    setCastModalVisible(true)
    setDevices(null) // 重置设备列表
    setSearching(false) // 确保不在搜索状态
    
    // 然后开始搜索
    setTimeout(() => {
      void searchDevices()
    }, 100)
  }

  // 选择设备进行投播
  const handleSelectDevice = async (device: {id: string, name: string, address: string, isTV: boolean}) => {
    // 立即关闭设备选择对话框
    setCastModalVisible(false)

    UPnpCastModule.selectDevice(device.id)
    props.onCast(selectInfoRef.current)
  }

  const menus = useMemo(() => {
    return [
      { action: 'play', label: t('play') },
      { action: 'playLater', label: t('play_later') },
      // { action: 'download', label: '下载' },
      { action: 'add', label: t('add_to') },
      { action: 'copyName', label: t('copy_name') },
      { action: 'cast', label: '投播' }, // 添加投播选项
      { action: 'musicSourceDetail', label: t('music_source_detail') },
      { action: 'dislike', label: t('dislike'), disabled: isDislikeMusic },
    ] as const
  }, [t, isDislikeMusic])

  const handleMenuPress = ({ action }: typeof menus[number]) => {
    const selectInfo = selectInfoRef.current
    switch (action) {
      case 'play':
        props.onPlay(selectInfo)
        break
      case 'playLater':
        props.onPlayLater(selectInfo)
        break
      case 'add':
        props.onAdd(selectInfo)
        break
      case 'copyName':
        props.onCopyName(selectInfo)
        break
      case 'cast': // 处理投播操作
        handleCast()
        break
      case 'musicSourceDetail':
        props.onMusicSourceDetail(selectInfo)
        break
      case 'dislike':
        props.onDislikeMusic(selectInfo)
        break
      default:
        break
    }
  }

  return (
    <>
      {visible ? (
        <Menu ref={menuRef} menus={menus} onPress={handleMenuPress} />
      ) : null}
      
      {/* 投播设备选择弹窗 */}
      <CastDeviceModal
        visible={castModalVisible}
        onClose={() => setCastModalVisible(false)}
        devices={devices}
        onSelectDevice={handleSelectDevice}
        onSearch={searchDevices}
        searching={searching}
      />
    </>
  )
})

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  modalContainer: {
    maxHeight: scaleSizeH(300),
    minHeight: scaleSizeH(250),
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.58,
    shadowRadius: 16.00,
    elevation: 24,
    zIndex: 9999,
    opacity: 1,
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 10,
  },
  closeButtonHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    minWidth: 40,
    alignItems: 'center',
  },
  deviceList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f8f8f8',
  },
  deviceInfo: {
    flex: 1,
    marginRight: 10,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
  },
  deviceAddress: {
    fontSize: 12,
    marginTop: 3,
    color: '#666',
  },
  tvTag: {
    backgroundColor: '#ff6b35',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tvTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
})
