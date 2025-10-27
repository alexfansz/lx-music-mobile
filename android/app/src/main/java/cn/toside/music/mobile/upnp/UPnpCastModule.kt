package cn.toside.music.mobile.upnp

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.yinnho.upnpcast.DLNACast
import com.yinnho.upnpcast.DLNACast.Device
import com.yinnho.upnpcast.DLNACast.State
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class UPnpCastModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  // 使用 IO 调度器来执行耗时操作，例如网络调用 (UPnP/DLNA)
  private val moduleScope = CoroutineScope(Dispatchers.IO)
  private var selectedDevice: String = ""

  // 暴露给 JavaScript 的模块名称
  override fun getName() = "UPnpCastFunctions"

  // ----------------------------------------------------------------------
  // JS 辅助方法 (Kotlin Coroutine -> React Native Promise)
  // ----------------------------------------------------------------------

  /**
   * 运行一个 suspend 函数，并将结果通过 Promise 返回。
   */
  private fun <T> runAsync(promise: Promise, block: suspend () -> T) {
    moduleScope.launch {
      try {
        val result = block()
        promise.resolve(result)
      } catch (e: Exception) {
        promise.reject("UPNP_ERROR", e.message, e)
      }
    }
  }

  // ----------------------------------------------------------------------
  // 辅助方法：数据类型转换
  // ----------------------------------------------------------------------

  /**
   * 辅助方法：将 Device 数据类转换为 WritableMap
   */
  private fun mapDevice(device: Device): WritableNativeMap {
    val map = WritableNativeMap()
    map.putString("id", device.id)
    map.putString("name", device.name)
    map.putString("address", device.address)
    map.putBoolean("isTV", device.isTV)
    return map
  }

  /**
   * 辅助方法：将 State 数据类转换为 WritableMap
   */
  private fun mapState(state: State): WritableNativeMap {
    val map = WritableNativeMap()
    map.putBoolean("isConnected", state.isConnected)
    map.putString("playbackState", state.playbackState.name)
    map.putInt("volume", state.volume)
    map.putBoolean("isMuted", state.isMuted)

    // 解决 Smart Cast Impossible 错误：将公共 API属性保存到局部变量
    val currentDevice = state.currentDevice

    if (currentDevice != null) {
      map.putMap("currentDevice", mapDevice(currentDevice))
    } else {
      map.putNull("currentDevice")
    }
    return map
  }

  /**
   * 辅助方法：将 Pair<Long, Long> 转换为包含 {current, duration} 的 WritableMap
   */
  private fun mapProgress(progress: Pair<Long, Long>?): WritableNativeMap? {
    if (progress == null) return null
    val map = WritableNativeMap()
    map.putDouble("current", progress.first.toDouble())
    map.putDouble("duration", progress.second.toDouble())
    return map
  }

  /**
   * 辅助方法：将 Pair<Int?, Boolean?> 转换为包含 {volume, isMuted} 的 WritableMap
   */
  private fun mapVolume(volumeData: Pair<Int?, Boolean?>?): WritableNativeMap? {
    if (volumeData == null) return null
    val map = WritableNativeMap()
    if (volumeData.first != null) {
      map.putInt("volume", volumeData.first!!)
    } else {
      map.putNull("volume")
    }
    if (volumeData.second != null) {
      map.putBoolean("isMuted", volumeData.second!!)
    } else {
      map.putNull("isMuted")
    }
    return map
  }

  // ----------------------------------------------------------------------
  // DLNA 服务生命周期方法 (同步)
  // ----------------------------------------------------------------------

  @ReactMethod
  fun init() {
    // 修正：使用父类提供的属性 reactApplicationContext
    DLNACast.init(reactApplicationContext)
  }

  @ReactMethod
  fun getState(promise: Promise) {
    val state = DLNACast.getState()
    promise.resolve(mapState(state))
  }

  @ReactMethod
  fun cleanup() {
    DLNACast.cleanup()
  }

  // ----------------------------------------------------------------------
  // DLNACast 异步控制和查询方法
  // ----------------------------------------------------------------------

  // 1. 播放控制方法

  @ReactMethod
  fun play(promise: Promise) = runAsync(promise) {
    DLNACast.play()
  }

  @ReactMethod
  fun pause(promise: Promise) = runAsync(promise) {
    DLNACast.pause()
  }

  @ReactMethod
  fun stop(promise: Promise) = runAsync(promise) {
    DLNACast.stop()
  }

  @ReactMethod
  fun setVolume(volume: Int, promise: Promise) = runAsync(promise) {
    DLNACast.setVolume(volume)
  }

  @ReactMethod
  fun setMute(mute: Boolean, promise: Promise) = runAsync(promise) {
    DLNACast.setMute(mute)
  }

  @ReactMethod
  fun seek(positionMs: Double, promise: Promise) = runAsync(promise) {
    DLNACast.seek(positionMs.toLong())
  }

  // 2. 设备和投射方法

  @ReactMethod
  fun search(timeout: Double, promise: Promise) = runAsync(promise) {
    val devices = DLNACast.search(timeout.toLong())

    val array = WritableNativeArray()
    devices.forEach { array.pushMap(mapDevice(it)) }
    return@runAsync array
  }

  @ReactMethod
  fun selectDevice(id: String){
    selectedDevice = id
  }
  @ReactMethod
  fun castToDevice(/*deviceId: String,*/ url: String, title: String?, promise: Promise) = runAsync(promise) {
    DLNACast.findDevice(selectedDevice)?.let { DLNACast.castToDevice(it,url,title) }
  }

  // 3. 进度/音量获取方法

  @ReactMethod
  fun getProgress(promise: Promise) = runAsync(promise) {
    val progress = DLNACast.getProgress()
    return@runAsync mapProgress(progress)
  }

  @ReactMethod
  fun getProgressRealtime(promise: Promise) = runAsync(promise) {
    val progress = DLNACast.getProgressRealtime()
    return@runAsync mapProgress(progress)
  }

  @ReactMethod
  fun getVolume(promise: Promise) = runAsync(promise) {
    val volumeData = DLNACast.getVolume()
    return@runAsync mapVolume(volumeData)
  }

  // ----------------------------------------------------------------------
  // 原始方法：performKotlinTask (保留)
  // ----------------------------------------------------------------------

  @ReactMethod
  fun performKotlinTask(input: String, promise: Promise) {
    try {
      val result = "Kotlin processed: $input"
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("KOTLIN_ERROR", e.message)
    }
  }
}

