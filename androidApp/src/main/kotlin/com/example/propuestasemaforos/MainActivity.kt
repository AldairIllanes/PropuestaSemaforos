package com.example.propuestasemaforos

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.systemBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.viewinterop.AndroidView

/**
 * Pantalla principal: muestra la demo de semáforos alojada en
 * `androidApp/src/main/assets/semaforos/` (index.html + styles.css + app.js).
 *
 * Requiere INTERNET en el manifest porque la demo descarga MapLibre GL desde
 * unpkg y las teselas de OpenStreetMap.
 */
class MainActivity : ComponentActivity() {

    private lateinit var demoWebView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        // Permite inspeccionar la WebView desde chrome://inspect (solo debug)
        if (applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE != 0) {
            WebView.setWebContentsDebuggingEnabled(true)
        }
        // Fondo oscuro de la demo: barras del sistema transparentes con iconos claros
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
        )
        super.onCreate(savedInstanceState)

        var demoLoaded = false
        demoWebView = WebView(this).apply {
            webViewClient = WebViewClient()
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                // Necesario para abrir file:///android_asset/...
                allowFileAccess = true
                useWideViewPort = true
                // No hacer zoom-out automático: el viewport del meta se respeta
                loadWithOverviewMode = false
                textZoom = 100 // ignora el tamaño de fuente del sistema
                // El zoom (pinch / botones) lo maneja MapLibre dentro de la página
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
            }
            // Esperar a que el WebView tenga tamaño real: si la página se carga
            // con la vista en 0x0, el viewport queda mal y los heights en % / vh
            // resuelven a 0 (encabezado gigante y mapa corto).
            addOnLayoutChangeListener { v, _, _, _, _, _, _, _, _ ->
                if (!demoLoaded && v.width > 0 && v.height > 0) {
                    demoLoaded = true
                    this@apply.loadUrl("file:///android_asset/semaforos/index.html")
                }
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (demoWebView.canGoBack()) demoWebView.goBack() else finish()
            }
        })

        setContent {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF0F1419)) // fondo de la demo
                    .windowInsetsPadding(WindowInsets.systemBars),
            ) {
                // fillMaxSize es clave: sin él el WebView se colapsa a su contenido
                AndroidView(
                    modifier = Modifier.fillMaxSize(),
                    factory = { demoWebView },
                )
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        demoWebView.destroy()
    }
}
