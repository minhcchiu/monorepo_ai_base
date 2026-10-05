🚀 AI_RULES_ANDROID_COMPOSE.md
(AUTHORITATIVE — FEATURE-FIRST + CLEAN + AI SAFE)
1️⃣ CORE ARCHITECTURE
1.1 Feature-First Structure (MANDATORY)

Every feature MUST be inside:

app/src/main/java/.../features/<feature_name>/

Structure:

feature_name/
├── data/
│   ├── api/
│   ├── repository/
│   └── model/
│
├── domain/ (optional but recommended)
│   └── usecase/
│
├── logic/
│   └── <Feature>ViewModel.kt
│
└── ui/
    ├── screen/
    └── component/
🚫 HARD RULES
❌ No feature code inside core/
❌ No cross-feature imports
❌ No shared ViewModel between features
❌ No direct dependency between features
✅ Each feature = independent module mindset
2️⃣ STRICT LAYER FLOW
Data flow (MANDATORY)
UI → ViewModel → UseCase (optional) → Repository → API

Return flow:

API → Repository → UseCase → ViewModel → UI
Layer responsibilities
🟢 UI (Compose)
Collect State (StateFlow)
Render UI
Trigger actions
❌ NO business logic
❌ NO repository calls
❌ NO API calls
🔵 ViewModel (ONLY LOGIC ENTRY)
Holds UI State (StateFlow / UiState)
Handles business logic
Calls UseCase / Repository
❌ NO Retrofit calls
❌ NO UI logic
🟡 UseCase (OPTIONAL BUT RECOMMENDED)

Use when:

Complex logic
Reusable business rules
Multiple repositories
🟠 Repository
Call API
Map DTO → Domain Model
Handle error mapping
❌ NO state
🔴 API (Retrofit)
ONLY network call
Return DTO / Response
❌ NO mapping
❌ NO business logic
3️⃣ VIEWMODEL RULE (CRITICAL)

Each feature MUST have:

ONE ViewModel ONLY

File:

logic/<Feature>ViewModel.kt
State pattern (MANDATORY)

Use single UiState:

data class UserUiState(
    val isLoading: Boolean = false,
    val data: List<User> = emptyList(),
    val error: String? = null
)
ViewModel example:
class UserViewModel(
    private val repository: UserRepository
) : ViewModel() {

    private val _state = MutableStateFlow(UserUiState())
    val state: StateFlow<UserUiState> = _state

    fun fetchUsers() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)

            try {
                val users = repository.fetchUsers()
                _state.value = UserUiState(data = users)
            } catch (e: Exception) {
                _state.value = UserUiState(error = e.message)
            }
        }
    }
}
4️⃣ SIMPLE API FEATURE (DEFAULT)

👉 Không over-engineer

Nếu chỉ fetch data:

Không cần UseCase
ViewModel → Repository trực tiếp
5️⃣ COMPLEX LOGIC PATTERN

Use UseCase khi có:

Pagination
Combine nhiều API
Business rule
Caching
6️⃣ REPOSITORY RULES

Repository MUST:

Catch Exception
Map DTO → Domain Model
Return domain model
suspend fun fetchUsers(): List<User> {
    try {
        val response = api.getUsers()
        return response.map { it.toDomain() }
    } catch (e: HttpException) {
        throw Exception("API error: ${e.message()}")
    }
}
7️⃣ MODEL RULES
DTO (API model)
data/model/UserDto.kt
Domain model
data/model/User.kt

Rules:

DTO ≠ Domain
Must have mapper:
fun UserDto.toDomain(): User
8️⃣ DEPENDENCY INJECTION (MANDATORY)

Use Hilt

Rules:
❌ No manual constructor in UI
❌ No Retrofit init inside feature
✅ Everything injected

Example:

@Module
@InstallIn(SingletonComponent::class)
object UserModule {

    @Provides
    fun provideUserApi(retrofit: Retrofit): UserApi {
        return retrofit.create(UserApi::class.java)
    }

    @Provides
    fun provideUserRepository(api: UserApi): UserRepository {
        return UserRepository(api)
    }
}
9️⃣ GLOBAL CORE RULE

Global things ONLY inside:

core/
├── network/
├── di/
├── theme/

Allowed global:

Retrofit
OkHttp
AuthManager
Theme
Logger

Feature can:

✅ use core
❌ use other features

🔟 UI RULES (JETPACK COMPOSE)
Screen:
Collect state via:
val state by viewModel.state.collectAsState()
MUST:
Stateless UI
No business logic
No API calls
Example:
if (state.isLoading) {
    CircularProgressIndicator()
} else if (state.error != null) {
    Text(state.error!!)
} else {
    LazyColumn {
        items(state.data) { user ->
            Text(user.name)
        }
    }
}
1️⃣1️⃣ ERROR HANDLING STANDARD

Flow:

API → throws Exception
Repository → map error → throw readable Exception
ViewModel → catch → update state.error
UI → render error

❌ NEVER:

Show raw exception
Catch error in UI
1️⃣2️⃣ STATE MANAGEMENT RULE

Use ONLY:

StateFlow
MutableStateFlow

❌ DO NOT USE:

LiveData
Multiple state sources
Shared mutable state
1️⃣3️⃣ SCALABILITY RULES (AI CRITICAL)

When AI creates new feature:

AI MUST:

Create full structure
Create:
API
Repository
DTO + Domain model
Mapper
ViewModel
Screen
Add TODO:
Endpoint
Mapping
UI
Do NOT modify other features
Keep feature isolated
1️⃣4️⃣ FORBIDDEN ACTIONS

❌ ViewModel calling Retrofit
❌ UI calling Repository
❌ Cross-feature imports
❌ Multiple ViewModel per feature
❌ DTO exposed to UI
❌ Business logic in UI
❌ Hardcoded colors
❌ Global mutable state

1️⃣5️⃣ FINAL AI CHECKLIST

Before generating code:

[ ] Feature is self-contained
[ ] Only ONE ViewModel
[ ] No cross-feature dependency
[ ] DTO → Domain mapping exists
[ ] Repository returns domain model
[ ] Error handling correct
[ ] UI only renders state
[ ] No business logic in UI
[ ] DI via Hilt
[ ] Compose Material3 used
🔥 BONUS (QUAN TRỌNG CHO AI)
Naming Convention (VERY IMPORTANT)
Layer	Naming
API	UserApi
DTO	UserDto
Domain	User
Repository	UserRepository
ViewModel	UserViewModel
UI State	UserUiState
Screen	UserScreen
🔒 THIS FILE IS AUTHORITATIVE

If conflict:

👉 Follow THIS file