This is a Kotlin Multiplatform project targeting Android.

* [/shared](./shared/src) is for code that will be shared across your Compose Multiplatform applications.
  It contains several subfolders:
  - [commonMain](./shared/src/commonMain/kotlin) is for code that’s common for all targets.
  - Other folders are for Kotlin code that will be compiled for only the platform indicated in the folder name.
    For example, if you want to use Apple’s CoreCrypto for the iOS part of your Kotlin app,
    the [iosMain](./shared/src/iosMain/kotlin) folder would be the right place for such calls.
    Similarly, if you want to edit the Desktop (JVM) specific part, the [jvmMain](./shared/src/jvmMain/kotlin)
    folder is the appropriate location.

### Running the apps

Use the run configurations provided by the run widget in your IDE's toolbar. You can also use these commands and options:

- Android app: `./gradlew :androidApp:assembleDebug`

### Demo de semáforos (Arequipa)

La demo web `GOW-GO-26-005` vive en [`androidApp/src/main/assets/semaforos/`](./androidApp/src/main/assets/semaforos)
(`index.html`, `styles.css`, `app.js`, `README.md`) y se muestra en la pantalla principal
(`MainActivity`) mediante un `WebView` que carga `file:///android_asset/semaforos/index.html`.

- Requiere permiso `INTERNET` (ya agregado en el manifest): la demo descarga MapLibre GL
  desde unpkg y las teselas de OpenStreetMap.
- Editá cualquiera de esos archivos y volvé a correr la app para ver los cambios.
- La pantalla de plantilla de Compose (`shared/App.kt`) ya no se muestra; `MainActivity` carga la demo.

### Running tests

Use the run button in your IDE's editor gutter, or run tests using Gradle tasks:

- Android tests: `./gradlew :shared:testAndroidHostTest`

---

Learn more about [Kotlin Multiplatform](https://www.jetbrains.com/help/kotlin-multiplatform-dev/get-started.html)…