import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import { useI18n } from '@/lang'
import Menu, { type Menus, type MenuType, type Position } from '@/components/common/Menu'
import { hasDislike } from '@/core/dislikeList'
import { existsFile } from '@/utils/fs'
import { Modal } from 'react-native'
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import Button from '@/components/common/Button'
import UPnpCastModule from '@/utils/nativeModules/UPnpCastModule'
import { toast } from '@/utils/tools'

export interface SelectInfo {
  musicInfo: LX.Music.MusicInfo
  selectedList: LX.Music.MusicInfo[]
  index: number
  listId: string
  single: boolean
}
const initSelectInfo = {}

export interface ListMenuProps {
  onPlay: (selectInfo: SelectInfo) => void
  onPlayLater: (selectInfo: SelectInfo) => void
  onAdd: (selectInfo: SelectInfo) => void
  onMove: (selectInfo: SelectInfo) => void
  onEditMetadata: (selectInfo: SelectInfo) => void
  onCopyName: (selectInfo: SelectInfo) => void
  onChangePosition: (selectInfo: SelectInfo) => void
  onToggleSource: (selectInfo: SelectInfo) => void
  onMusicSourceDetail: (selectInfo: SelectInfo) => void
  onDislikeMusic: (selectInfo: SelectInfo) => void
  onRemove: (selectInfo: SelectInfo) => void
  onCast: (selectInfo: SelectInfo) => void // 添加投播处理函数
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

const hasEditMetadata = async(musicInfo: LX.Music.MusicInfo) => {
  if (musicInfo.source != 'local') return false
  return existsFile(musicInfo.meta.filePath)
}

export default forwardRef<ListMenuType, ListMenuProps>((props, ref) => {
  const t = useI18n()
  const [visible, setVisible] = useState(false)
  const menuRef = useRef<MenuType>(null)
  const selectInfoRef = useRef<SelectInfo>(initSelectInfo as SelectInfo)
  const [menus, setMenus] = useState<Menus>([])
  // 投播相关状态
  const [castModalVisible, setCastModalVisible] = useState(false)
  const [devices, setDevices] = useState<Array<{id: string, name: string, address: string, isTV: boolean}> | null>(null)
  const [searching, setSearching] = useState(false)

  useImperativeHandle(ref, () => ({
    show(selectInfo, position) {
      selectInfoRef.current = selectInfo
      handleSetMenu(selectInfo.musicInfo)
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
  const handleCast = (selectInfo: SelectInfo) => {
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
    try {
      const musicInfo = selectInfoRef.current.musicInfo
      // 获取音乐的实际URL
      const url = musicInfo.meta.filePath || musicInfo.url || ''
      const title = musicInfo.name
      
      if (!url) {
        toast('无法获取音乐链接')
        return
      }
      
      toast(`已选择设备: ${device.name}`)
      setCastModalVisible(false)
      
      // 实际的投播逻辑应该在这里实现
      // 例如：await UPnpCastModule.castToDevice(device.id, url, title)
    } catch (error) {
      console.error('投播到设备失败:', error)
      toast('投播失败')
    }
  }

  const handleSetMenu = (musicInfo: LX.Music.MusicInfo) => {
    let edit_metadata = false
    const menu = [
      { action: 'play', label: t('play') },
      { action: 'playLater', label: t('play_later') },
      // { action: 'download', label: '下载' },
      { action: 'add', label: t('add_to') },
      { action: 'move', label: t('move_to') },
      { action: 'changePosition', label: t('change_position') },
      { action: 'toggleSource', label: t('toggle_source') },
      { action: 'copyName', label: t('copy_name') },
      { action: 'cast', label: '投播' }, // 添加投播选项
      { action: 'musicSourceDetail', disabled: musicInfo.source == 'local', label: t('music_source_detail') },
      // { action: 'musicSearch', label: t('music_search') },
      { action: 'dislike', disabled: hasDislike(musicInfo), label: t('dislike') },
      { action: 'remove', label: t('delete') },
    ]
    if (musicInfo.source == 'local') menu.splice(5, 0, { action: 'editMetadata', disabled: !edit_metadata, label: t('edit_metadata') })
    setMenus(menu)
    void Promise.all([hasEditMetadata(musicInfo)]).then(([_edit_metadata]) => {
      // console.log(_edit_metadata)
      let isUpdated = false
      if (edit_metadata != _edit_metadata) {
        edit_metadata = _edit_metadata
        isUpdated ||= true
      }

      if (isUpdated) {
        menu[menu.findIndex(m => m.action == 'editMetadata')].disabled = !edit_metadata
        setMenus([...menu])
      }
    })
  }

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
      case 'move':
        props.onMove(selectInfo)
        break
      case 'editMetadata':
        props.onEditMetadata(selectInfo)
        break
      case 'copyName':
        props.onCopyName(selectInfo)
        break
      case 'changePosition':
        props.onChangePosition(selectInfo)
        break
      case 'toggleSource':
        props.onToggleSource(selectInfo)
        break
      case 'cast': // 处理投播操作
        //props.onCast(selectInfo)
        handleCast(selectInfo)
        break
      case 'musicSourceDetail':
        props.onMusicSourceDetail(selectInfo)
        break
      case 'dislike':
        props.onDislikeMusic(selectInfo)
        break
      case 'remove':
        props.onRemove(selectInfo)
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
    maxHeight: 250,
    minHeight: 200,
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
    //color: '#000000', // 默认黑色，会被 theme 覆盖
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
