# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Keep runtime metadata required by Retrofit and Gson reflection.
-keepattributes Signature
-keepattributes RuntimeVisibleAnnotations,RuntimeVisibleParameterAnnotations,AnnotationDefault
-keepattributes Exceptions,InnerClasses,EnclosingMethod
-keepattributes *Annotation*

# Keep core network/auth classes intact for release builds.
-keep class com.izisoft.pp09base.core.network.** { *; }

# Retrofit interfaces: keep annotated HTTP methods and parameter annotations.
-keepclassmembers,allowshrinking,allowobfuscation interface * {
	@retrofit2.http.* <methods>;
}

# Gson mapped fields: never strip serialized fields.
-keepclassmembers class * {
	@com.google.gson.annotations.SerializedName <fields>;
}

# Keep all API and DTO models used for request/response serialization.
-keep class com.izisoft.pp09base.features.**.data.api.** { *; }
-keep class com.izisoft.pp09base.features.**.data.model.** { *; }
-keep class com.izisoft.pp09base.features.**.data.**Dto { *; }