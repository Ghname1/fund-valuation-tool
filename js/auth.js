// 认证模块
const AuthModule = {
  // 登录
  async login(email, password) {
    try {
      // 这里可以调用后端API，暂时使用模拟数据
      if (email && password) {
        const user = {
          id: '1',
          email: email,
          name: email.split('@')[0]
        };
        const token = 'mock-jwt-token-' + Date.now();
        
        // 存储用户信息和token
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        
        return { success: true, user, token };
      }
      return { success: false, message: '请输入邮箱和密码' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // 注册
  async register(email, password, name) {
    try {
      // 这里可以调用后端API，暂时使用模拟数据
      if (email && password && name) {
        const user = {
          id: '1',
          email: email,
          name: name
        };
        const token = 'mock-jwt-token-' + Date.now();
        
        // 存储用户信息和token
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        
        return { success: true, user, token };
      }
      return { success: false, message: '请填写完整信息' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // 登出
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  // 检查是否已登录
  isLoggedIn() {
    return !!localStorage.getItem('token');
  },

  // 获取当前用户
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // 获取token
  getToken() {
    return localStorage.getItem('token');
  }
};

// 密码强度检测
const PasswordValidator = {
  // 检测密码强度
  checkStrength(password) {
    let strength = 0;
    
    // 长度检查
    if (password.length >= 8) strength += 25;
    else if (password.length >= 6) strength += 10;
    
    // 包含小写字母
    if (/[a-z]/.test(password)) strength += 25;
    
    // 包含大写字母
    if (/[A-Z]/.test(password)) strength += 25;
    
    // 包含数字
    if (/[0-9]/.test(password)) strength += 15;
    
    // 包含特殊字符
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    
    return strength;
  },
  
  // 获取密码强度等级
  getStrengthLevel(strength) {
    if (strength < 30) return { level: '弱', class: 'text-danger', message: '密码强度弱，容易被破解' };
    if (strength < 60) return { level: '中', class: 'text-warning', message: '密码强度中等，建议增加复杂度' };
    if (strength < 80) return { level: '强', class: 'text-info', message: '密码强度强，安全性良好' };
    return { level: '极强', class: 'text-success', message: '密码强度极强，安全性很高' };
  },
  
  // 验证密码策略
  validatePolicy(password) {
    const errors = [];
    
    if (password.length < 6) {
      errors.push('密码长度至少6位');
    }
    
    if (password.length > 20) {
      errors.push('密码长度不能超过20位');
    }
    
    if (!/[a-z]/.test(password) && !/[A-Z]/.test(password)) {
      errors.push('密码至少包含一个字母');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('密码至少包含一个数字');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
};