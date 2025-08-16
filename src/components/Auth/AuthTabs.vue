<script setup lang="js">
import { ref, computed } from 'vue'
import LoginForm from './LoginForm.vue'
import RegisterForm from './RegisterForm.vue'
import ResetPasswordForm from './ResetPasswordForm.vue'

const props = defineProps({
  modelValue: {
    type: [String, Boolean],
    default: 'login'
  }
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const activeTab = ref('login')

const tabTitles = {
  login: '登录',
  register: '注册',
  reset: '重置密码',
}

const handleSuccess = () => {
  dialogVisible.value = false
}

const handleClose = () => {
  activeTab.value = 'login'
}

const handleSwitchTab = (tab) => {
  activeTab.value = tab
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="tabTitles[activeTab]"
    width="500px"
    :top="'5vh'"
    destroy-on-close
    @close="handleClose"
  >
    <div>
      <el-tabs v-model="activeTab" class="auth-tabs">
        <el-tab-pane name="login" :label="tabTitles.login">
          <LoginForm 
            @success="handleSuccess" 
            @switch-tab="handleSwitchTab"
          />
        </el-tab-pane>
        <el-tab-pane name="register" :label="tabTitles.register">
          <RegisterForm 
            @success="handleSuccess" 
            @switch-tab="handleSwitchTab"
          />
        </el-tab-pane>
        <el-tab-pane name="reset" :label="tabTitles.reset">
          <ResetPasswordForm 
            @success="handleSuccess" 
            @switch-tab="handleSwitchTab"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-dialog>
</template>

<style scoped>
.auth-tabs ::v-deep(.el-tabs__nav) {
  width: 100%;
  display: flex;
  justify-content: center; /* 确保导航居中 */
}

.auth-tabs ::v-deep(.el-tabs__item) {
  flex: 1;
  text-align: center;
}

/* 调整 dialog 高度和位置 */
:deep(.el-dialog) {
  margin-top: 5vh !important; /* 调整顶部距离，可以改为 10vh, 15vh 等 */
  max-height: 120vh; /* 限制最大高度 */
}

:deep(.el-dialog__body) {
  padding: 20px; /* 减少内边距 */
  max-height: 100vh; /* 限制内容区域高度 */
  overflow-y: auto; /* 如果内容过多，添加滚动条 */
}

:deep(.el-dialog__header) {
  padding: 15px 20px; /* 减少头部内边距 */
}

/* 调整 tabs 内容区域 */
.auth-tabs {
  min-height: 400px; /* 设置最小高度 */
  max-height: 620px; /* 设置最大高度 */
}
</style>
