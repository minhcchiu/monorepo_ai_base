plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.dagger.hilt.android")
    id("org.jetbrains.kotlin.kapt")
}

android {
    namespace = "com.izisoft.pp09base.core"
    compileSdk = 35

    defaultConfig {
        minSdk = 24
        val apiBaseUrl = (project.findProperty("PP09BASE_API_BASE_URL") as String?)
            ?: "https://api.pp09base.example.com/"
        buildConfigField("String", "API_BASE_URL", "\"$apiBaseUrl\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    // api (không phải implementation): :app tham chiếu trực tiếp type từ các thư viện
    // này (Retrofit, Gson @SerializedName, RewardedAdManager, Compose UI...) nên phải
    // truyền transitive.
    api("androidx.core:core-ktx:1.10.1")
    api("androidx.activity:activity-ktx:1.7.0")
    api("androidx.lifecycle:lifecycle-runtime-ktx:2.6.1")
    api("androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.1")
    api(platform("androidx.compose:compose-bom:2023.08.00"))
    api("androidx.compose.ui:ui")
    api("androidx.compose.ui:ui-graphics")
    api("androidx.compose.material3:material3")
    api("androidx.compose.ui:ui-text-google-fonts")
    // Used internally by core.rating.RatingDialog (Icons.Outlined.StarBorder); not exposed
    // in any public :core API surface, so implementation is sufficient.
    implementation("androidx.compose.material:material-icons-extended")
    api("com.google.dagger:hilt-android:2.51.1")
    kapt("com.google.dagger:hilt-android-compiler:2.51.1")
    api("com.squareup.retrofit2:retrofit:2.11.0")
    api("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    api("io.coil-kt:coil-compose:2.6.0")
    api("com.google.android.gms:play-services-ads:23.1.0")
    api("com.android.billingclient:billing-ktx:6.2.1")
    api("com.google.android.play:review:2.0.1")
    api(platform("com.google.firebase:firebase-bom:33.7.0"))
    api("com.google.firebase:firebase-analytics-ktx")
    api("com.google.firebase:firebase-messaging-ktx")
    testImplementation("junit:junit:4.13.2")
}

kapt {
    correctErrorTypes = true
}
