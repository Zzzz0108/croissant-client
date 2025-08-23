<script setup lang="js">
import { ref, reactive } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { UserStore } from '@/stores/modules/user'

const emit = defineEmits(['success', 'switch-tab'])
const userStore = UserStore()

const loading = ref(false)

// 新增的状态
const agree = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isSending = ref(false)
const countdown = ref(0)
const isEmailValid = ref(false)
const registerSuccess = ref(false)
const message = ref('')
const confirmPassword = ref('')
let timer = null

const registerForm = reactive({
  email: '',
  username: '',
  password: '',
  verificationCode: '', 
})

// 错误信息
const errors = reactive({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
  agree: ''
})



// 验证邮箱
const validateEmail = () => {
  if (!registerForm.email) {
    errors.email = '请输入邮箱地址'
    isEmailValid.value = false
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(registerForm.email)) {
    errors.email = '请输入正确的邮箱格式'
    isEmailValid.value = false
    return
  }

  errors.email = ''
  isEmailValid.value = true
}

// 验证用户名
const validateUsername = () => {
  if (!registerForm.username) {
    errors.username = '请输入用户名'
    return
  }

  const usernameRegex = /^[a-zA-Z0-9_-]{4,16}$/
  if (!usernameRegex.test(registerForm.username)) {
    errors.username = '用户名格式：4-16位字符（字母、数字、下划线、连字符）'
    return
  }

  errors.username = ''
}

// 验证密码
const validatePassword = () => {
  if (!registerForm.password) {
    errors.password = '请输入密码'
    return
  }

  if (registerForm.password.length < 6) {
    errors.password = '密码至少6位字符'
    return
  }

  errors.password = ''
}

// 验证确认密码
const validateConfirmPassword = () => {
  if (!confirmPassword.value) {
    errors.confirmPassword = '请确认密码'
    return
  }

  if (confirmPassword.value !== registerForm.password) {
    errors.confirmPassword = '两次输入的密码不一致'
    return
  }

  errors.confirmPassword = ''
}

// 验证验证码
const validateCode = () => {
  if (!registerForm.verificationCode) {
    errors.verificationCode = '请输入验证码'
    return
  }

  // 添加调试信息
  console.log('验证码验证:', {
    value: registerForm.verificationCode,
    length: registerForm.verificationCode.length,
    type: typeof registerForm.verificationCode
  })

  // 验证码格式：6位字母+数字组合
  const codeRegex = /^[a-zA-Z0-9]{6}$/
  const isValid = codeRegex.test(registerForm.verificationCode)
  
  console.log('正则验证结果:', {
    regex: codeRegex.toString(),
    testResult: isValid,
    matchResult: registerForm.verificationCode.match(codeRegex)
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
    const response = await sendEmailCode(registerForm.email)
    
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

// 注册处理
const handleRegister = async () => {
  // 验证所有必填字段
  validateEmail()
  validateUsername()
  validatePassword()
  validateConfirmPassword()
  validateCode()
  
  if (!agree.value) {
    errors.agree = '请同意用户协议和隐私政策'
    return
  }
  
  // 检查是否有错误
  const hasErrors = Object.values(errors).some(error => error !== '')
  if (hasErrors) return

  loading.value = true
  try {
            const result = await userStore.userRegister({
          email: registerForm.email,
          username: registerForm.username,
          password: registerForm.password,
          verificationCode: registerForm.verificationCode
        })
    
    if (result.success) {
      ElNotification({
        title: '注册成功',
        message: result.message || '注册成功！',
        type: 'success',
        duration: 3000
      })
      emit('success')
    } else {
      ElNotification({
        title: '注册失败',
        message: result.message || '注册失败',
        type: 'error',
        duration: 4000
      })
    }
  } catch (error) {
    console.error('注册异常:', error)
    ElNotification({
      title: '注册异常',
      message: error.message || '注册失败',
      type: 'error',
      duration: 4000
    })
  } finally {
    loading.value = false
  }
}

function switchToLogin() {
  emit('switch-tab', 'login')
}

// 清理定时器
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="register-page">
    <div class="wrapper">


      <div class="card">
        <div class="main">
          <div class="tab">
            仅支持邮箱注册，一个账号即可访问所有服务。
          </div>

          <!-- 邮箱输入 -->
          <div class="input-box" :class="{ 'input-error': errors.email }">
            <span class="icon">📧</span>
            <input 
              type="email" 
              placeholder="邮箱地址" 
              v-model="registerForm.email" 
              @input="validateEmail"
            />
          </div>
          <span class="error-message" v-if="errors.email">{{ errors.email }}</span>

          <!-- 用户名输入 -->
          <div class="input-box" :class="{ 'input-error': errors.username }">
            <span class="icon">👤</span>
            <input 
              placeholder="用户名" 
              v-model="registerForm.username" 
              @input="validateUsername"
            />
          </div>
          <span class="error-message" v-if="errors.username">{{ errors.username }}</span>

          <!-- 密码输入 -->
          <div class="input-box" :class="{ 'input-error': errors.password }">
            <span class="icon">🔒</span>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="密码" 
              v-model="registerForm.password" 
              @input="validatePassword"
            />
            <span class="see" @click="showPassword = !showPassword">
              {{ showPassword ? '👁️' : '🙈' }}
            </span>
          </div>
          <span class="error-message" v-if="errors.password">{{ errors.password }}</span>

          <!-- 确认密码输入 -->
          <div class="input-box" :class="{ 'input-error': errors.confirmPassword }">
            <span class="icon">🔒</span>
            <input 
              :type="showConfirmPassword ? 'text' : 'password'" 
              placeholder="确认密码" 
              v-model="confirmPassword" 
              @input="validateConfirmPassword"
            />
            <span class="see" @click="showConfirmPassword = !showConfirmPassword">
              {{ showConfirmPassword ? '👁️' : '🙈' }}
            </span>
          </div>
          <span class="error-message" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</span>

          <!-- 验证码 + 发送按钮 -->
          <div class="input-group">
            <div class="input-box" style="flex: 1" :class="{ 'input-error': errors.code }">
              <span class="icon">📱</span>
              <input 
                placeholder="验证码" 
                v-model="registerForm.verificationCode" 
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

          <!-- 协议勾选 -->
          <div class="agreement">
            <input 
              type="checkbox" 
              id="agree" 
              v-model="agree" 
              @change="clearError('agree')"
            />
            <label for="agree">
              我已阅读并同意
              <a href="#">《用户协议》</a>
              和
              <a href="#">《隐私政策》</a>
            </label>
          </div>
          <span class="error-message" v-if="errors.agree">{{ errors.agree }}</span>

          <!-- 注册按钮 -->
          <button 
            class="submit" 
            @click="handleRegister" 
            :disabled="loading"
          >
            <span v-if="!loading">注册</span>
            <span v-else>注册中...</span>
          </button>

          <!-- 底部链接 -->
          <div class="footer-links">
            <span>已有账号？</span>
            <a href="#" @click.prevent="switchToLogin">立即登录</a>
          </div>


        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
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


.card {
  background: rgba(255, 255, 255, 0.1);
  padding: clamp(8px, 2vw, 12px);
  border-radius: clamp(12px, 3vw, 16px);
  display: flex;
  min-height: clamp(280px, 50vh, 300px);
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
  font-size: 12px;
  line-height: 140%;
  color: #a3a3a3;
  margin-bottom: 8px;
}

/* 输入框样式 */
.input-box {
  display: flex;
  align-items: center;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 0 12px;
  height: 40px;
  gap: 8px;
  transition: border-color 0.3s;
}

.input-box.input-error {
  border-color: #ff4d4f;
}

.input-box input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
  background-color: transparent;
}

.input-box:focus-within {
  border: 2px solid #08f;
}

/* 错误信息 */
.error-message {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: -8px;
  height: 16px;
}

/* 图标样式 */
.icon {
  font-size: 18px;
}

.see {
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 18px;
}

/* 验证码按钮 */
.input-group {
  display: flex;
  gap: 10px;
}

.code-button {
  background: #fff;
  border: 1px solid #ccc;
  color: #000;
  border-radius: 8px;
  padding: 0 16px;
  height: 40px;
  font-size: 14px;
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

/* 注册按钮 */
.submit {
  background-color: #08f;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.3s;
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
  font-size: 12px;
  color: #666;
  gap: 6px;
  line-height: 1.4;
  margin-top: 8px;
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
  justify-content: center;
  align-items: center;
  font-size: 14px;
  gap: 8px;
}

.footer-links span {
  color: #666;
}

.footer-links a {
  color: #08f;
  text-decoration: none;
  font-weight: 500;
}


</style>
