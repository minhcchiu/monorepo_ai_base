Bạn đổi ở 2 dòng trong build.gradle.kts:25:

build.gradle.kts:25
versionCode = 121

build.gradle.kts:26
versionName = "1.2.1"

Lệnh build App Bundle để upload Store (chạy tại thư mục root project):

./gradlew bundleRelease

Nếu muốn sạch trước khi build:

./gradlew clean bundleRelease

File kết quả nằm ở:
app/build/output/bundle/release/app-release.aab