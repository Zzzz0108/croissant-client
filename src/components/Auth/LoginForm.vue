<script setup lang="js">
import { ref, reactive, onBeforeUnmount } from 'vue'
import { ElNotification } from 'element-plus'
import { UserStore } from '@/stores/modules/user'

const emit = defineEmits(['success', 'switch-tab'])
const userStore = UserStore()

const loading = ref(false)

// 新增的状态
const mode = ref('password')
const agree = ref(false)
const showPassword = ref(false)
const isSending = ref(false)
const countdown = ref(0)
const isEmailValid = ref(false)

let timer = null

const loginForm = reactive({
  email: '',
  password: '',
  verificationCode: '',
})

// 错误信息
const errors = reactive({
  email: '',
  password: '',
  verificationCode: '',
  agree: ''
})



// 切换登录模式
const switchMode = (newMode) => {
  console.log('🔄 切换登录模式:', mode.value, '->', newMode)
  
  mode.value = newMode
  
  // 清空相关字段和错误
  if (newMode === 'password') {
    console.log('🔐 切换到密码模式：清空验证码字段')
    loginForm.verificationCode = ''
    errors.verificationCode = ''
  } else {
    console.log('📱 切换到验证码模式：清空密码字段')
    loginForm.password = ''
    errors.password = ''
  }
  
  // 清空所有错误
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
  
  console.log('✅ 模式切换完成，当前表单状态:', {
    mode: mode.value,
    hasPassword: !!loginForm.password,
    hasVerificationCode: !!loginForm.verificationCode
  })
}

// 验证邮箱
const validateEmail = () => {
  if (!loginForm.email) {
    errors.email = '请输入邮箱地址'
    isEmailValid.value = false
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(loginForm.email)) {
    errors.email = '请输入正确的邮箱格式'
    isEmailValid.value = false
    return
  }

  errors.email = ''
  isEmailValid.value = true
}

// 验证密码
const validatePassword = () => {
  if (!loginForm.password) {
    errors.password = '请输入密码'
    return
  }

  if (loginForm.password.length < 6) {
    errors.password = '密码至少6位字符'
    return
  }

  errors.password = ''
}

// 验证验证码
const validateCode = () => {
  if (!loginForm.verificationCode) {
    errors.verificationCode = '请输入验证码'
    return
  }

  // 添加调试信息
  console.log('验证码验证:', {
    value: loginForm.verificationCode,
    length: loginForm.verificationCode.length,
    type: typeof loginForm.verificationCode
  })

  // 验证码格式：6位字母+数字组合
  const codeRegex = /^[a-zA-Z0-9]{6}$/
  const isValid = codeRegex.test(loginForm.verificationCode)
  
  console.log('正则验证结果:', {
    regex: codeRegex.toString(),
    testResult: isValid,
    matchResult: loginForm.verificationCode.match(codeRegex)
  })
  
  if (!isValid) {
    errors.verificationCode = '验证码格式错误，请输入6位字母或数字'
    return
  }

  errors.verificationCode = ''
}

// 清除错误
const clearError = (field) => {
  errors[field] = ''
}

// 发送验证码
const handleSendCode = async () => {
  validateEmail()
  if (!isEmailValid.value) return

  try {
    isSending.value = true
    countdown.value = 60
    
    // 调用发送验证码API
    const { sendEmailCode } = await import('@/api/system')
    const response = await sendEmailCode(loginForm.email)
    
    if (response.code === 0) {
      ElNotification({
        title: '验证码发送成功',
        message: '验证码已发送到您的邮箱',
        type: 'success',
        duration: 3000
      })
    } else {
      ElNotification({
        title: '验证码发送失败',
        message: response.message || '发送验证码失败',
        type: 'error',
        duration: 4000
      })
    }
    
    // 倒计时逻辑
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        isSending.value = false
      }
    }, 1000)
  } catch (error) {
    ElNotification({
      title: '发送验证码异常',
      message: error.message || '发送验证码失败',
      type: 'error',
      duration: 4000
    })
    isSending.value = false
  }
}

// 登录处理
const handleLogin = async () => {
  console.log('🎵 开始登录验证，当前模式:', mode.value)
  
  // 验证必填字段
  validateEmail()
  
  // 根据登录模式进行相应的验证
  if (mode.value === 'password') {
    console.log('🔐 密码登录模式：验证密码')
    validatePassword()
  } else {
    console.log('📱 验证码登录模式：验证验证码')
    validateCode()
  }
  
  if (!agree.value) {
    errors.agree = '请同意服务条款和隐私政策'
    return
  }
  
  // 检查是否有错误
  const hasErrors = Object.values(errors).some(error => error !== '')
  if (hasErrors) {
    console.log('❌ 验证失败，错误信息:', errors)
    return
  }

  // 根据登录模式准备数据
  const loginData = {
    email: loginForm.email
  }
  
  if (mode.value === 'password') {
    loginData.password = loginForm.password
    console.log('🔐 密码登录：发送密码字段')
  } else {
    loginData.verificationCode = loginForm.verificationCode
    console.log('📱 验证码登录：发送验证码字段，不包含密码')
  }

  console.log('📤 准备发送的登录数据:', loginData)
  loading.value = true
  
  try {
    const result = await userStore.userLogin(loginData)
    console.log('📥 登录结果:', result)
    
    if (result.success) {
      ElNotification({
        title: '登录成功',
        message: result.message || '登录成功！',
        type: 'success',
        duration: 3000
      })
      emit('success')
    } else {
      ElNotification({
        title: '登录失败',
        message: result.message || '登录失败',
        type: 'error',
        duration: 4000
      })
    }
  } catch (error) {
    console.error('❌ 登录异常:', error)
    ElNotification({
      title: '登录异常',
      message: error.message || '登录失败',
      type: 'error',
      duration: 4000
    })
  } finally {
    loading.value = false
  }
}

function switchToRegister() {
  emit('switch-tab', 'register')
}

function switchToReset() {
  emit('switch-tab', 'reset')
}

// 清理定时器
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="login-page">
    <div class="wrapper">


      <div class="card">
        <div class="main">
          <!-- 登录方式切换 -->
          <div class="tab">
            <span 
              :class="{ active: mode === 'password' }" 
              @click="switchMode('password')"
            >
              密码登录
            </span>
            <span 
              :class="{ active: mode === 'code' }" 
              @click="switchMode('code')"
            >
              验证码登录
            </span>
          </div>

          <div class="info">仅支持邮箱登录，请使用您的邮箱地址和密码进行登录。</div>

          <!-- 邮箱输入 -->
          <div class="input-box" :class="{ 'input-error': errors.email }">
            <span class="icon">📧</span>
            <input 
              placeholder="邮箱地址" 
              v-model="loginForm.email" 
              @input="validateEmail"
            />
          </div>
          <span class="error-message" v-if="errors.email">{{ errors.email }}</span>

          <!-- 密码登录模式 -->
          <template v-if="mode === 'password'">
            <div class="input-box" :class="{ 'input-error': errors.password }">
              <span class="icon">🔒</span>
              <input 
                :type="showPassword ? 'text' : 'password'" 
                placeholder="密码" 
                v-model="loginForm.password" 
                @input="validatePassword"
              />
              <span class="see" @click="showPassword = !showPassword">
                {{ showPassword ? '👁️' : '🙈' }}
              </span>
            </div>
            <span class="error-message" v-if="errors.password">{{ errors.password }}</span>
          </template>

          <!-- 验证码登录模式 -->
          <template v-else>
            <div class="input-group">
              <div class="input-box" style="flex: 1" :class="{ 'input-error': errors.verificationCode }">
                <span class="icon">📱</span>
                <input 
                  placeholder="验证码" 
                  v-model="loginForm.verificationCode" 
                  @input="validateCode"
                />
              </div>
              <button 
                class="code-button" 
                @click="handleSendCode" 
                :disabled="isSending || !isEmailValid"
              >
                {{ isSending ? `${countdown}s` : '发送验证码' }}
              </button>
            </div>
            <span class="error-message" v-if="errors.verificationCode">{{ errors.verificationCode }}</span>
          </template>

          <!-- 协议勾选 -->
          <div class="agreement">
            <input 
              type="checkbox" 
              id="agree" 
              v-model="agree" 
              @change="clearError('agree')"
            />
            <label for="agree">
              登录即表示您同意我们的
              <a href="#">服务条款</a>和
              <a href="#">隐私政策</a>
            </label>
          </div>
          <span class="error-message" v-if="errors.agree">{{ errors.agree }}</span>

          <!-- 登录按钮 -->
          <button 
            class="submit" 
            @click="handleLogin" 
            :disabled="loading"
          >
            <span v-if="!loading">登录</span>
            <span v-else>登录中...</span>
          </button>

          <!-- 底部链接 -->
          <div class="footer-links">
            <a href="#" @click.prevent="switchToReset">忘记密码？</a>
            <a href="#" @click.prevent="switchToRegister">注册账号</a>
          </div>


        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  height: 90vh;
  background: #f5f6fa;
}

.wrapper {
  width: 100%;
  max-width: 432px;
  min-width: 320px;
  padding: clamp(8px, 2vw, 12px) 0 0;
}

.head {
  margin-bottom: 32px;
  font-family: "Lobster Two", cursive;
  font-size: 48px;
  font-weight: 400;
  color: #08f;
  text-align: center;
  font-style: italic;
}

.info {
  font-size: clamp(10px, 2.5vw, 12px);
  line-height: 140%;
  color: #a3a3a3;
  margin-bottom: clamp(6px, 2vw, 8px);
}

.card {
  background: rgba(255, 255, 255, 0.1);
  padding: clamp(8px, 2vw, 12px);
  border-radius: clamp(12px, 3vw, 16px);
  display: flex;
  min-height: clamp(360px, 58vh, 400px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.2), 0 0 4px rgba(0, 0, 0, 0.02), 0 12px 36px rgba(0, 0, 0, 0.06);
}

.main {
  flex-direction: column;
  flex-grow: 1;
  width: min(408px, 100vw - clamp(16px, 4vw, 24px));
  min-width: 300px;
  padding: clamp(16px, 4vw, 24px) clamp(16px, 4vw, 24px) clamp(8px, 2vw, 12px);
  display: flex;
  gap: clamp(12px, 3vw, 16px);
}

.tab {
  display: flex;
  justify-content: space-around;
  font-size: clamp(12px, 3vw, 14px);
  color: #666;
  margin-bottom: clamp(6px, 2vw, 8px);
}

.tab span {
  cursor: pointer;
  padding: clamp(4px, 2vw, 6px) clamp(8px, 3vw, 12px);
  border-radius: clamp(12px, 3vw, 16px);
  transition: all 0.3s;
}

.tab .active {
  color: #08f;
  background-color: #e6f0ff;
  font-weight: 500;
}

/* 输入框样式 */
.input-box {
  display: flex;
  align-items: center;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: clamp(6px, 2vw, 8px);
  padding: 0 clamp(8px, 3vw, 12px);
  height: clamp(36px, 8vw, 40px);
  gap: clamp(6px, 2vw, 8px);
  transition: border-color 0.3s;
}

.input-box.input-error {
  border-color: #ff4d4f;
}

.input-box input {
  border: none;
  outline: none;
  flex: 1;
  font-size: clamp(12px, 3vw, 14px);
  background-color: transparent;
}

.input-box:focus-within {
  border: clamp(1px, 0.5vw, 2px) solid #08f;
}

/* 错误信息 */
.error-message {
  color: #ff4d4f;
  font-size: clamp(10px, 2.5vw, 12px);
  margin-top: clamp(-6px, -1.5vw, -8px);
  height: clamp(14px, 3vw, 16px);
}

/* 图标样式 */
.icon {
  font-size: clamp(16px, 4vw, 18px);
}

.see {
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: clamp(16px, 4vw, 18px);
}

/* 验证码按钮 */
.input-group {
  display: flex;
  gap: clamp(8px, 2vw, 10px);
}

.code-button {
  background: #fff;
  border: 1px solid #ccc;
  color: #000;
  border-radius: clamp(6px, 2vw, 8px);
  padding: 0 clamp(12px, 3vw, 16px);
  height: clamp(36px, 8vw, 40px);
  font-size: clamp(12px, 3vw, 14px);
  cursor: pointer;
  transition: all 0.3s;
}

.code-button:hover:not(:disabled) {
  background-color: #f0f0f0;
}

.code-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 登录按钮 */
.submit {
  background-color: #08f;
  color: white;
  border: none;
  border-radius: clamp(6px, 2vw, 8px);
  padding: clamp(10px, 2.5vw, 12px);
  font-size: clamp(12px, 3vw, 14px);
  cursor: pointer;
  transition: opacity 0.3s;
  margin-top: clamp(6px, 2vw, 8px);
}

.submit:hover:not(:disabled) {
  opacity: 0.9;
}

.submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 协议勾选 */
.agreement {
  display: flex;
  align-items: flex-start;
  font-size: clamp(10px, 2.5vw, 12px);
  color: #666;
  gap: clamp(4px, 1.5vw, 6px);
  line-height: 1.4;
  margin-top: clamp(6px, 2vw, 8px);
}

.agreement input[type="checkbox"] {
  accent-color: #08f;
  margin-top: 2px;
}

.agreement a {
  color: #08f;
  text-decoration: none;
}

/* 底部链接 */
.footer-links {
  display: flex;
  justify-content: space-between;
  font-size: clamp(12px, 3vw, 14px);
}

.footer-links a {
  color: #08f;
  text-decoration: none;
  font-weight: 500;
}





/* 响应式媒体查询 */
@media (max-width: 768px) {
  .wrapper {
    padding: 16px 16px 0;
  }
  
  .card {
    min-height: clamp(350px, 70vh, 400px);
  }
  
  .main {
    padding: 16px 16px 12px;
    gap: 12px;
  }
  
  .tab span {
    padding: 4px 8px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .wrapper {
    padding: 12px 12px 0;
  }
  
  .card {
    min-height: clamp(320px, 75vh, 380px);
  }
  
  .main {
    padding: 12px 12px 8px;
    gap: 10px;
  }
  
  .input-box {
    height: 36px;
  }
  
  .code-button {
    height: 36px;
    padding: 0 12px;
    font-size: 12px;
  }
  
  .submit {
    padding: 10px;
    font-size: 13px;
  }
}
</style>
