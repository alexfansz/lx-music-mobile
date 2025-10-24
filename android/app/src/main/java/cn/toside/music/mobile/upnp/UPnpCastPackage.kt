package cn.toside.music.mobile.upnp

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import java.util.Collections

/**
 * 这是一个 React Package，负责将 KotlinBridgeModule 注册到 React Native 运行时。
 *
 * 必须在 RN 应用的 MainApplication.kt 中引用和注册这个 Package。
 */
class UPnpCastPackage : ReactPackage {

  /**
   * 注册原生模块 (Modules)
   */
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    // 返回您的桥接模块实例
    return listOf(UPnpCastModule(reactContext))
  }

  /**
   * 注册视图管理器 (View Managers) - 如果您的库有自定义 UI 组件才需要
   */
  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return Collections.emptyList()
  }
}
